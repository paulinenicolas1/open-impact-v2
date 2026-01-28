import { Box, Group, Paper, Stack, Text, Title, useMantineTheme } from '@mantine/core';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface MonthlySeriesPoint {
  year: number;
  values: Array<number | null>;
}

interface MonthlySeriesChartProps {
  title: string;
  subtitle?: string;
  series: MonthlySeriesPoint[];
  xLabels: string[];
  accentColor?: string;
  unitSuffix?: string;
  isLoading?: boolean;
  defaultYears?: number[];
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

export function MonthlySeriesChart({
  title,
  subtitle,
  series,
  xLabels,
  accentColor = '#f4a261',
  unitSuffix = '°C',
  isLoading,
  defaultYears,
}: MonthlySeriesChartProps) {
  const theme = useMantineTheme();
  const [tooltip, setTooltip] = useState<{
    xPct: number;
    yPct: number;
    year: number;
    month: string;
    value: number;
  } | null>(null);
  const width = 840;
  const height = 320;
  const padding = { top: 28, right: 36, bottom: 40, left: 52 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const normalizedSeries = series
    .map((entry) => ({
      ...entry,
      values: entry.values.slice(0, xLabels.length),
    }))
    .filter((entry) => entry.values.length);
  const availableYears = useMemo(
    () =>
      normalizedSeries
        .map((entry) => entry.year)
        .filter((year) => year >= 1980)
        .sort((a, b) => b - a),
    [normalizedSeries],
  );
  const [activeYears, setActiveYears] = useState<Set<number>>(() => new Set());
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current || availableYears.length === 0) {
      return;
    }
    hasInitialized.current = true;
    if (defaultYears && defaultYears.length) {
      const next = new Set(
        defaultYears.filter((year) => availableYears.includes(year)),
      );
      if (next.size > 0) {
        setActiveYears(next);
        return;
      }
    }
    setActiveYears(new Set(availableYears));
  }, [availableYears, defaultYears]);

  const values = normalizedSeries.flatMap((entry) =>
    entry.values.filter((value): value is number => value !== null && Number.isFinite(value)),
  );
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

  const scaleX = (index: number) => {
    if (xLabels.length <= 1) {
      return padding.left + chartWidth / 2;
    }
    return padding.left + (index / (xLabels.length - 1)) * chartWidth;
  };
  const scaleY = (value: number) =>
    padding.top + (1 - (value - yMin) / (yMax - yMin)) * chartHeight;

  const years = normalizedSeries.map((entry) => entry.year);
  const minYear = 1980;
  const maxYear = years.length ? Math.max(...years) : minYear;
  const opacityForYear = (year: number) => {
    if (minYear === maxYear) {
      return 1;
    }
    const ratio = (year - minYear) / (maxYear - minYear);
    return 0.05 + ratio * 0.95;
  };

  const yLabels = Array.from({ length: yTicks + 1 }, (_, index) => {
    const value = yMax - step * index;
    return {
      value,
      y: scaleY(value),
    };
  });

  const hasData = normalizedSeries.some((entry) =>
    entry.values.some((value) => value !== null && Number.isFinite(value)),
  );
  const visibleSeries = normalizedSeries.filter((entry) => activeYears.has(entry.year));
  const tooltipValue =
    tooltip && formatNumber(tooltip.value, { maximumFractionDigits: 1, minimumFractionDigits: 1 });

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
            onClick={() => setActiveYears(new Set(availableYears))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setActiveYears(new Set(availableYears));
              }
            }}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: `1px solid ${theme.colors.dark[5]}`,
              cursor: 'pointer',
              color: theme.white,
              fontSize: 12,
              backgroundColor: theme.colors.dark[6],
            }}
          >
            Tout sélectionner
          </Box>
          <Box
            role="button"
            tabIndex={0}
            onClick={() => setActiveYears(new Set())}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setActiveYears(new Set());
              }
            }}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: `1px solid ${theme.colors.dark[5]}`,
              cursor: 'pointer',
              color: theme.white,
              fontSize: 12,
              backgroundColor: theme.colors.dark[6],
            }}
          >
            Tout enlever
          </Box>
        </Group>
      </Group>

      <Group align="flex-start" gap="lg" wrap="nowrap">
        <Box
          style={{
            flex: 1,
            borderRadius: 16,
            padding: 12,
            position: 'relative',
            background:
              'linear-gradient(160deg, rgba(22, 28, 42, 0.9) 0%, rgba(15, 17, 22, 0.9) 65%)',
            border: `1px solid ${theme.colors.dark[5]}`,
          }}
        >
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} role="img">
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

            {xLabels.map((label, index) => (
              <g key={`x-${label}`}>
                <line
                  x1={scaleX(index)}
                  y1={padding.top + chartHeight}
                  x2={scaleX(index)}
                  y2={padding.top + chartHeight + 6}
                  stroke="rgba(255,255,255,0.15)"
                />
                <text
                  x={scaleX(index)}
                  y={padding.top + chartHeight + 24}
                  fill="rgba(255,255,255,0.5)"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {label}
                </text>
              </g>
            ))}

            {visibleSeries.map((entry) => {
              const points = entry.values
                .map((value, index) => {
                  if (value === null || !Number.isFinite(value)) {
                    return null;
                  }
                  return { x: scaleX(index), y: scaleY(value) };
                })
                .filter((point): point is { x: number; y: number } => point !== null);

              const path = buildSvgPath(points);
              if (!path) {
                return null;
              }

              return (
                <g key={`series-${entry.year}`}>
                  <path
                    d={path}
                    fill="none"
                    stroke={accentColor}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeOpacity={opacityForYear(entry.year)}
                  />
                  {entry.values.map((value, index) => {
                    if (value === null || !Number.isFinite(value)) {
                      return null;
                    }
                    const x = scaleX(index);
                    const y = scaleY(value);
                    return (
                      <circle
                        key={`point-${entry.year}-${index}`}
                        cx={x}
                        cy={y}
                        r={9}
                        fill="transparent"
                        onMouseEnter={() =>
                          setTooltip({
                            xPct: (x / width) * 100,
                            yPct: (y / height) * 100,
                            year: entry.year,
                            month: xLabels[index] ?? '',
                            value,
                          })
                        }
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </g>
              );
            })}
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
                minWidth: 160,
              }}
            >
              <Text size="xs" c="dimmed">
                {tooltip.month} · {tooltip.year}
              </Text>
              <Text fw={600} size="sm">
                {tooltipValue} {unitSuffix}
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

        <Box
          style={{
            width: 160,
            maxHeight: height,
            overflowY: 'auto',
            padding: '4px 2px 4px 6px',
            borderLeft: `1px solid ${theme.colors.dark[6]}`,
          }}
        >
          <Stack gap="xs">
            {availableYears.map((year) => {
              const isActive = activeYears.has(year);
              return (
                <Box
                  key={year}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setActiveYears((prev) => {
                      const next = new Set(prev);
                      if (next.has(year)) {
                        next.delete(year);
                      } else {
                        next.add(year);
                      }
                      return next;
                    })
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActiveYears((prev) => {
                        const next = new Set(prev);
                        if (next.has(year)) {
                          next.delete(year);
                        } else {
                          next.add(year);
                        }
                        return next;
                      });
                    }
                  }}
                  aria-pressed={isActive}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    border: `1px solid ${isActive ? accentColor : theme.colors.dark[5]}`,
                    backgroundColor: isActive ? `${accentColor}22` : 'transparent',
                  }}
                >
                  <Box
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      backgroundColor: accentColor,
                      opacity: isActive ? opacityForYear(year) : 0.35,
                    }}
                  />
                  <Text size="sm" c={isActive ? 'white' : 'dimmed'}>
                    {year}
                  </Text>
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Group>

    </Paper>
  );
}
