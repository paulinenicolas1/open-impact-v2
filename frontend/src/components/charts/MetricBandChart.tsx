import { Box, Group, Paper, Text, Title, useMantineTheme } from '@mantine/core';
import { useRef, useState } from 'react';

export type MetricBandDatum = Record<string, number | null> & {
  year: number;
};

interface MetricBandChartProps<T extends MetricBandDatum> {
  title: string;
  subtitle?: string;
  points: T[];
  metricKey: keyof T;
  upperKey: keyof T;
  lowerKey: keyof T;
  metricLabel?: string;
  bandLabel?: string;
  upperLabel?: string;
  lowerLabel?: string;
  accentColor?: string;
  unitSuffix?: string;
  isLoading?: boolean;
}

const buildSvgPath = (points: Array<{ x: number; y: number }>) => {
  if (points.length === 0) {
    return '';
  }
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');
};

const formatNumber = (value: number | null, options: Intl.NumberFormatOptions) => {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }
  return new Intl.NumberFormat('fr-FR', options).format(value);
};

export function MetricBandChart<T extends MetricBandDatum>({
  title,
  subtitle,
  points,
  metricKey,
  upperKey,
  lowerKey,
  metricLabel = 'Moyenne',
  bandLabel = 'Min / Max',
  upperLabel,
  lowerLabel,
  accentColor = '#4cc9f0',
  unitSuffix = '°C',
  isLoading,
}: MetricBandChartProps<T>) {
  const theme = useMantineTheme();
  const [tooltip, setTooltip] = useState<{
    xPct: number;
    yPct: number;
    year: number;
    label: string;
    value: number;
  } | null>(null);
  const [showMetric, setShowMetric] = useState(true);
  const [showBand, setShowBand] = useState(true);
  const [zoomDomain, setZoomDomain] = useState<{ min: number; max: number } | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const width = 840;
  const height = 320;
  const padding = { top: 28, right: 36, bottom: 40, left: 52 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const availablePoints = points.filter((point) => Number.isFinite(point.year));
  const areaPoints = availablePoints
    .filter(
      (point) =>
        point[lowerKey] !== null &&
        point[upperKey] !== null &&
        Number.isFinite(point[lowerKey]) &&
        Number.isFinite(point[upperKey]),
    )
    .map((point) => ({
      year: point.year,
      min: point[lowerKey] as number,
      max: point[upperKey] as number,
    }));

  const metricPoints = availablePoints
    .filter((point) => point[metricKey] !== null && Number.isFinite(point[metricKey]))
    .map((point) => ({
      year: point.year,
      value: point[metricKey] as number,
    }));

  const visibleYears = [
    ...(showBand ? areaPoints.map((point) => point.year) : []),
    ...(showMetric ? metricPoints.map((point) => point.year) : []),
  ];
  const baseMinYear = visibleYears.length ? Math.min(...visibleYears) : 0;
  const baseMaxYear = visibleYears.length ? Math.max(...visibleYears) : 0;
  let minYear = baseMinYear;
  let maxYear = baseMaxYear;
  if (zoomDomain) {
    minYear = Math.max(baseMinYear, Math.min(zoomDomain.min, baseMaxYear));
    maxYear = Math.min(baseMaxYear, Math.max(zoomDomain.max, baseMinYear));
    if (maxYear - minYear < 1) {
      minYear = baseMinYear;
      maxYear = baseMaxYear;
    }
  }

  const values = availablePoints.flatMap((point) => {
    const parts: Array<number | null> = [];
    if (showBand) {
      parts.push(point[lowerKey], point[upperKey]);
    }
    if (showMetric) {
      parts.push(point[metricKey]);
    }
    return parts.filter((value): value is number => value !== null && Number.isFinite(value));
  });
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 0;
  const baseMin = Math.min(minValue, 0);
  const baseMax = Math.max(maxValue, 0);
  const spread = Math.max(baseMax - baseMin, 1);
  const paddedMin = baseMin - spread * 0.1;
  const paddedMax = baseMax + spread * 0.1;
  let yMin = Math.floor(paddedMin);
  let yMax = Math.ceil(paddedMax);
  yMin = Math.min(yMin, 0);
  yMax = Math.max(yMax, 0);
  const yTicks = 4;
  const span = Math.max(1, yMax - yMin);
  const step = Math.max(1, Math.ceil(span / yTicks));
  yMax = yMin + step * yTicks;

  const scaleX = (year: number) => {
    if (minYear === maxYear) {
      return padding.left + chartWidth / 2;
    }
    return (
      padding.left + ((year - minYear) / (maxYear - minYear)) * chartWidth
    );
  };

  const scaleY = (value: number) =>
    padding.top + (1 - (value - yMin) / (yMax - yMin)) * chartHeight;

  const topLine = areaPoints.map((point) => ({
    x: scaleX(point.year),
    y: scaleY(point.max),
  }));
  const bottomLine = areaPoints
    .slice()
    .reverse()
    .map((point) => ({
      x: scaleX(point.year),
      y: scaleY(point.min),
    }));
  const areaPath =
    showBand && topLine.length && bottomLine.length
      ? `${buildSvgPath(topLine)} L${bottomLine.map((point) => `${point.x} ${point.y}`).join(' L')} Z`
      : '';

  const metricPath = buildSvgPath(
    metricPoints.map((point) => ({
      x: scaleX(point.year),
      y: scaleY(point.value),
    })),
  );

  const upperPoints = areaPoints.map((point) => ({
    year: point.year,
    value: point.max,
    x: scaleX(point.year),
    y: scaleY(point.max),
  }));

  const lowerPoints = areaPoints.map((point) => ({
    year: point.year,
    value: point.min,
    x: scaleX(point.year),
    y: scaleY(point.min),
  }));

  const yLabels = Array.from({ length: yTicks + 1 }, (_, index) => {
    const value = yMax - step * index;
    return {
      value,
      y: scaleY(value),
    };
  });

  const xLabels = (() => {
    if (!visibleYears.length || minYear === maxYear) {
      return [];
    }
    const span = Math.max(1, Math.round(maxYear - minYear));
    const stepCount = Math.min(4, span);
    const step = (maxYear - minYear) / stepCount;
    return Array.from({ length: stepCount + 1 }, (_, index) => {
      const raw = minYear + step * index;
      const year = Math.round(raw);
      return {
        year,
        x: scaleX(year),
      };
    });
  })();

  const hasData =
    (showMetric && metricPoints.length > 1) || (showBand && areaPoints.length > 1);
  const tooltipValue =
    tooltip && formatNumber(tooltip.value, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const selectionBox =
    selection && Math.abs(selection.end - selection.start) > 1
      ? {
          x: Math.min(selection.start, selection.end),
          width: Math.abs(selection.end - selection.start),
        }
      : null;

  const getSvgX = (event: React.MouseEvent<SVGElement, MouseEvent>) => {
    const svg = svgRef.current;
    if (!svg) {
      return null;
    }
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    const clamped = Math.min(Math.max(x, padding.left), padding.left + chartWidth);
    return clamped;
  };

  const handleZoomStart = (event: React.MouseEvent<SVGElement, MouseEvent>) => {
    if (!hasData) {
      return;
    }
    const x = getSvgX(event);
    if (x === null) {
      return;
    }
    setIsDragging(true);
    setSelection({ start: x, end: x });
    setTooltip(null);
  };

  const handleZoomMove = (event: React.MouseEvent<SVGElement, MouseEvent>) => {
    if (!isDragging || !selection) {
      return;
    }
    const x = getSvgX(event);
    if (x === null) {
      return;
    }
    setSelection({ start: selection.start, end: x });
  };

  const handleZoomEnd = () => {
    if (!isDragging || !selection) {
      return;
    }
    setIsDragging(false);
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    setSelection(null);
    if (end - start < 8) {
      return;
    }
    const yearStart =
      minYear + ((start - padding.left) / chartWidth) * (maxYear - minYear);
    const yearEnd = minYear + ((end - padding.left) / chartWidth) * (maxYear - minYear);
    const nextMin = Math.round(Math.min(yearStart, yearEnd));
    const nextMax = Math.round(Math.max(yearStart, yearEnd));
    if (nextMax - nextMin < 1) {
      return;
    }
    setZoomDomain({ min: nextMin, max: nextMax });
  };

  return (
    <Paper
      p="lg"
      radius="lg"
      withBorder
      style={{
        background: theme.colors.dark[7],
        borderColor: theme.colors.dark[5],
      }}
    >
      <Group justify="space-between" align="center" mb="md" wrap="wrap">
        <Box>
          <Title order={3} size={20} fw={600} mb={4}>
            {title}
          </Title>
          {subtitle ? (
            <Text c="dimmed" size="sm">
              {subtitle}
            </Text>
          ) : null}
        </Box>
        <Group gap="xs">
          <Box
            role="button"
            tabIndex={0}
            onClick={() => setShowMetric((prev) => !prev)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setShowMetric((prev) => !prev);
              }
            }}
            aria-pressed={showMetric}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 8px',
              borderRadius: 999,
              cursor: 'pointer',
              border: `1px solid ${showMetric ? accentColor : theme.colors.dark[5]}`,
              backgroundColor: showMetric ? 'rgba(76, 201, 240, 0.12)' : 'transparent',
            }}
          >
            <Box
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: accentColor,
                opacity: showMetric ? 1 : 0.35,
              }}
            />
            <Text size="sm" c={showMetric ? 'white' : 'dimmed'}>
              {metricLabel}
            </Text>
          </Box>
          <Box
            role="button"
            tabIndex={0}
            onClick={() => setShowBand((prev) => !prev)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setShowBand((prev) => !prev);
              }
            }}
            aria-pressed={showBand}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 8px',
              borderRadius: 999,
              cursor: 'pointer',
              border: `1px solid ${showBand ? accentColor : theme.colors.dark[5]}`,
              backgroundColor: showBand ? 'rgba(76, 201, 240, 0.12)' : 'transparent',
            }}
          >
            <Box
              style={{
                width: 18,
                height: 10,
                borderRadius: 6,
                backgroundColor: `${accentColor}33`,
                border: `1px solid ${accentColor}66`,
                opacity: showBand ? 1 : 0.35,
              }}
            />
            <Text size="sm" c={showBand ? 'white' : 'dimmed'}>
              {bandLabel}
            </Text>
          </Box>
        </Group>
      </Group>

      <Box
        style={{
          borderRadius: 16,
          padding: 12,
          position: 'relative',
          background:
            'linear-gradient(160deg, rgba(22, 28, 42, 0.9) 0%, rgba(15, 17, 22, 0.9) 65%)',
          border: `1px solid ${theme.colors.dark[5]}`,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={title}
          ref={svgRef}
          onMouseDown={handleZoomStart}
          onMouseMove={handleZoomMove}
          onMouseLeave={handleZoomEnd}
          onMouseUp={handleZoomEnd}
          onDoubleClick={() => {
            setZoomDomain(null);
            setSelection(null);
            setIsDragging(false);
          }}
        >
          <defs>
            <linearGradient id="metric-band" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.04" />
            </linearGradient>
          </defs>

          <rect
            x={padding.left}
            y={padding.top}
            width={chartWidth}
            height={chartHeight}
            fill="transparent"
            stroke={theme.colors.dark[5]}
            strokeDasharray="2 6"
          />

          {yLabels.map((tick) => (
            <g key={`y-${tick.value}`}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={padding.left + chartWidth}
                y2={tick.y}
                stroke="rgba(255,255,255,0.08)"
              />
              <text
                x={padding.left - 10}
                y={tick.y + 4}
                fill="rgba(255,255,255,0.5)"
                fontSize="12"
                textAnchor="end"
              >
                {formatNumber(tick.value, { maximumFractionDigits: 0 }) ?? '--'}
                {unitSuffix ? ` ${unitSuffix}` : ''}
              </text>
            </g>
          ))}

          {xLabels.map((tick) => (
            <g key={`x-${tick.year}`}>
              <line
                x1={tick.x}
                y1={padding.top + chartHeight}
                x2={tick.x}
                y2={padding.top + chartHeight + 6}
                stroke="rgba(255,255,255,0.15)"
              />
              <text
                x={tick.x}
                y={padding.top + chartHeight + 24}
                fill="rgba(255,255,255,0.5)"
                fontSize="12"
                textAnchor="middle"
              >
                {tick.year}
              </text>
            </g>
          ))}

          {areaPath ? (
            <path d={areaPath} fill="url(#metric-band)" stroke={`${accentColor}66`} />
          ) : null}

          {showMetric && metricPath ? (
            <path
              d={metricPath}
              fill="none"
              stroke={accentColor}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          ) : null}

          {showMetric
            ? metricPoints.map((point) => (
                <g key={`dot-${point.year}`}>
                  <circle
                    cx={scaleX(point.year)}
                    cy={scaleY(point.value)}
                    r={1}
                    fill={accentColor}
                    fillOpacity={0.25}
                  />
                  <circle
                    cx={scaleX(point.year)}
                    cy={scaleY(point.value)}
                    r={10}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() =>
                      setTooltip({
                        xPct: (scaleX(point.year) / width) * 100,
                        yPct: (scaleY(point.value) / height) * 100,
                        year: point.year,
                        label: metricLabel,
                        value: point.value,
                      })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                </g>
              ))
            : null}

          {showBand
            ? upperPoints.map((point) => (
                <circle
                  key={`upper-${point.year}`}
                  cx={point.x}
                  cy={point.y}
                  r={10}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() =>
                    setTooltip({
                      xPct: (point.x / width) * 100,
                      yPct: (point.y / height) * 100,
                      year: point.year,
                      label: upperLabel ?? `${bandLabel} (max)`,
                      value: point.value,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
              ))
            : null}

          {showBand
            ? lowerPoints.map((point) => (
                <circle
                  key={`lower-${point.year}`}
                  cx={point.x}
                  cy={point.y}
                  r={10}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() =>
                    setTooltip({
                      xPct: (point.x / width) * 100,
                      yPct: (point.y / height) * 100,
                      year: point.year,
                      label: lowerLabel ?? `${bandLabel} (min)`,
                      value: point.value,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
              ))
            : null}

          <rect
            x={padding.left}
            y={padding.top}
            width={chartWidth}
            height={chartHeight}
            fill="transparent"
            style={{ cursor: isDragging ? 'ew-resize' : 'default' }}
            pointerEvents="none"
          />

          {selectionBox ? (
            <rect
              x={selectionBox.x}
              y={padding.top}
              width={selectionBox.width}
              height={chartHeight}
              fill={`${accentColor}22`}
              stroke={`${accentColor}99`}
              strokeDasharray="4 4"
            />
          ) : null}
        </svg>

        {tooltip && tooltipValue ? (
          <Box
            style={{
              position: 'absolute',
              left: `${tooltip.xPct}%`,
              top: `${tooltip.yPct}%`,
              transform: 'translate(-50%, -110%)',
              padding: '8px 12px',
              borderRadius: 10,
              backgroundColor: 'rgba(10, 12, 18, 0.95)',
              border: `1px solid ${theme.colors.dark[4]}`,
              color: theme.white,
              fontSize: 12,
              pointerEvents: 'none',
              boxShadow: '0 12px 24px rgba(0,0,0,0.35)',
              minWidth: 140,
            }}
          >
            <Text size="xs" c="dimmed">
              {tooltip.label}
            </Text>
            <Text fw={600} size="sm">
              {tooltipValue} {unitSuffix}
            </Text>
            <Text size="xs" c="dimmed">
              Année {tooltip.year}
            </Text>
          </Box>
        ) : null}

        {!isLoading && !hasData ? (
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              color: theme.colors.gray[4],
              backgroundColor: 'rgba(10, 12, 18, 0.55)',
              borderRadius: 14,
            }}
          >
            <Text size="sm">Données insuffisantes pour cette ville.</Text>
          </Box>
        ) : null}
      </Box>
    </Paper>
  );
}
