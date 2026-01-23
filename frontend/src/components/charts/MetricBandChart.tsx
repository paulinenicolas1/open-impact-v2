import { Box, Group, Paper, Text, Title, useMantineTheme } from '@mantine/core';

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
  accentColor = '#4cc9f0',
  unitSuffix = '°C',
  isLoading,
}: MetricBandChartProps<T>) {
  const theme = useMantineTheme();
  const width = 840;
  const height = 320;
  const padding = { top: 28, right: 36, bottom: 40, left: 52 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const availablePoints = points.filter((point) => Number.isFinite(point.year));
  const years = availablePoints.map((point) => point.year);
  const minYear = years.length ? Math.min(...years) : 0;
  const maxYear = years.length ? Math.max(...years) : 0;

  const values = availablePoints.flatMap((point) =>
    [point[lowerKey], point[metricKey], point[upperKey]].filter(
      (value): value is number => value !== null && Number.isFinite(value),
    ),
  );
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 0;
  const spread = Math.max(maxValue - minValue, 1);
  const paddedMin = minValue - spread * 0.1;
  const paddedMax = maxValue + spread * 0.1;

  const scaleX = (year: number) => {
    if (minYear === maxYear) {
      return padding.left + chartWidth / 2;
    }
    return (
      padding.left + ((year - minYear) / (maxYear - minYear)) * chartWidth
    );
  };

  const scaleY = (value: number) =>
    padding.top + (1 - (value - paddedMin) / (paddedMax - paddedMin)) * chartHeight;

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
    topLine.length && bottomLine.length
      ? `${buildSvgPath(topLine)} L${bottomLine.map((point) => `${point.x} ${point.y}`).join(' L')} Z`
      : '';

  const metricPath = buildSvgPath(
    metricPoints.map((point) => ({
      x: scaleX(point.year),
      y: scaleY(point.value),
    })),
  );

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, index) => {
    const t = index / yTicks;
    const value = paddedMax - t * (paddedMax - paddedMin);
    return {
      value,
      y: scaleY(value),
    };
  });

  const xLabels = (() => {
    if (!years.length) {
      return [];
    }
    const stepCount = Math.min(4, Math.max(1, years.length - 1));
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

  const hasData = metricPoints.length > 1 && areaPoints.length > 1;

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
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: accentColor,
            }}
          />
          <Text size="sm" c="dimmed">
            {metricLabel}
          </Text>
          <Box
            style={{
              width: 18,
              height: 10,
              borderRadius: 6,
              backgroundColor: `${accentColor}33`,
              border: `1px solid ${accentColor}66`,
            }}
          />
          <Text size="sm" c="dimmed">
            {bandLabel}
          </Text>
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
                {formatNumber(tick.value, { maximumFractionDigits: 1 }) ?? '--'}
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

          {metricPath ? (
            <path
              d={metricPath}
              fill="none"
              stroke={accentColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : null}

          {metricPoints.map((point) => (
            <circle
              key={`dot-${point.year}`}
              cx={scaleX(point.year)}
              cy={scaleY(point.value)}
              r={3}
              fill={accentColor}
              stroke="#0f1116"
              strokeWidth={1.5}
            />
          ))}
        </svg>

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
