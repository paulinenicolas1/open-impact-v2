import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';

const summaryText =
  'Analyse comparative approfondie des tendances climatiques et des précipitations observées de 1900 à 2025. Données basées sur les relevés historiques de Météo-France.';

const cities = ['Paris', 'Lyon', 'Marseille', 'Bordeaux'] as const;
type CityName = (typeof cities)[number];

type MetricKey =
  | 'avgTemp'
  | 'avgTempChange'
  | 'maxTemp'
  | 'maxTempChange'
  | 'rainfall'
  | 'rainfallChange';

interface CityData {
  stationId: string;
  summary: string;
  metrics?: Partial<Record<MetricKey, string>>;
}

const cityData: Record<CityName, CityData> = {
  Paris: {
    stationId: 'Station ID · 71490',
    summary: summaryText,
    metrics: {},
  },
  Lyon: {
    stationId: 'Station ID · 29821',
    summary: summaryText,
    metrics: {},
  },
  Marseille: {
    stationId: 'Station ID · 55807',
    summary: summaryText,
    metrics: {},
  },
  Bordeaux: {
    stationId: 'Station ID · 66342',
    summary: summaryText,
    metrics: {},
  },
};

const cityKeyLookup: Record<CityName, string> = {
  Paris: 'paris',
  Lyon: 'lyon',
  Marseille: 'marseille',
  Bordeaux: 'bordeaux',
};

interface YearlyMetric {
  avgTemp: number | null;
  maxTemp: number | null;
  rainfall: number | null;
}

type YearlyMetricMap = Record<string, YearlyMetric>;

const lastFullYear = new Date().getFullYear() - 1;

const formatNumber = (value: number | null, options: Intl.NumberFormatOptions) => {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }
  return new Intl.NumberFormat('fr-FR', options).format(value);
};

const formatTemperature = (value: number | null) => {
  const formatted = formatNumber(value, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return formatted ? `${formatted}°C` : 'Donnée indisponible';
};

const formatRainfall = (value: number | null) => {
  const formatted = formatNumber(value, {
    maximumFractionDigits: 1,
  });
  return formatted ? `${formatted} mm` : 'Donnée indisponible';
};

const parseCsvLine = (line: string, delimiter: string) => {
  const values: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }
    if (char === delimiter && !insideQuotes) {
      values.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
};

const parseCsv = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return [] as Record<string, string>[];
  }
  const lines = trimmed.split(/\r?\n/);
  const headerLine = lines[0];
  const delimiter = headerLine.includes(';') && !headerLine.includes(',') ? ';' : ',';
  const headers = parseCsvLine(headerLine, delimiter).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });
};

const toNumber = (value: string | undefined) => {
  if (!value) {
    return null;
  }
  const numeric = Number(value.replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : null;
};

const metricCards = [
  {
    title: 'Température moyenne',
    key: 'avgTemp',
    changeKey: 'avgTempChange',
    accent: 'orange',
  },
  {
    title: 'Température max',
    key: 'maxTemp',
    changeKey: 'maxTempChange',
    accent: 'gray',
  },
  {
    title: 'Précipitation',
    key: 'rainfall',
    changeKey: 'rainfallChange',
    accent: 'blue',
  },
] as const;

export function ClimateDashboard() {
  const theme = useMantineTheme();
  const [activeCity, setActiveCity] = useState<CityName>('Paris');
  const [yearlyMetrics, setYearlyMetrics] = useState<YearlyMetricMap>({});

  useEffect(() => {
    const loadYearlyMetrics = async () => {
      try {
        const response = await fetch('/data/output/final_yearly.csv');
        if (!response.ok) {
          return;
        }
        const text = await response.text();
        const rows = parseCsv(text);
        const nextMetrics: YearlyMetricMap = {};
        rows.forEach((row) => {
          const year = Number.parseInt(String(row.AAAA ?? '').trim(), 10);
          if (year !== lastFullYear) {
            return;
          }
          const cityKey = String(row.ville ?? '').trim();
          if (!cityKey) {
            return;
          }
          nextMetrics[cityKey] = {
            avgTemp: toNumber(row.TMM),
            maxTemp: toNumber(row.TXAB),
            rainfall: toNumber(row.RR),
          };
        });
        setYearlyMetrics(nextMetrics);
      } catch (error) {
        console.warn('Impossible de charger les métriques annuelles.', error);
      }
    };

    void loadYearlyMetrics();
  }, []);

  const computedMetrics = useMemo(() => {
    const cityKey = cityKeyLookup[activeCity];
    const metrics = yearlyMetrics[cityKey];
    if (!metrics) {
      return {};
    }
    return {
      avgTemp: formatTemperature(metrics.avgTemp),
      maxTemp: formatTemperature(metrics.maxTemp),
      rainfall: formatRainfall(metrics.rainfall),
    };
  }, [activeCity, yearlyMetrics]);

  const data = cityData[activeCity];
  const baseMetrics: Record<MetricKey, string> = {
    avgTemp: 'Donnée indisponible',
    avgTempChange: 'Donnée indisponible',
    maxTemp: 'Donnée indisponible',
    maxTempChange: 'Donnée indisponible',
    rainfall: 'Donnée indisponible',
    rainfallChange: 'Donnée indisponible',
  };
  const metrics = {
    ...baseMetrics,
    ...data.metrics,
    ...computedMetrics,
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, #1a202c 0%, #0f1116 40%, #0c0f14 100%)',
      }}
      py={28}
    >
      <Container size={1160} px={24}>
        <Paper
          p="md"
          radius="lg"
          withBorder
          style={{
            backgroundColor: theme.colors.dark[8],
            boxShadow: '0 18px 30px rgba(0, 0, 0, 0.25)',
          }}
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="sm">
              <Box
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #4cc9f0, #4895ef)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 18,
                  color: '#09141f',
                }}
              >
                🌤️
              </Box>
              <Text fw={600}>Climate France</Text>
            </Group>

            <Group gap={10} wrap="wrap">
              {cities.map((city) => {
                const isActive = city === activeCity;
                return (
                  <Button
                    key={city}
                    radius="xl"
                    size="sm"
                    variant={isActive ? 'light' : 'subtle'}
                    color={isActive ? 'gray' : 'gray'}
                    aria-pressed={isActive}
                    onClick={() => setActiveCity(city)}
                    styles={{
                      root: {
                        backgroundColor: isActive ? theme.colors.dark[6] : 'transparent',
                        border: isActive
                          ? `1px solid ${theme.colors.dark[5]}`
                          : '1px solid transparent',
                        color: isActive ? theme.white : theme.colors.gray[5],
                      },
                    }}
                  >
                    {city}
                  </Button>
                );
              })}
            </Group>

            <Group gap="sm" wrap="wrap">
              <TextInput
                placeholder="Rechercher une ville..."
                leftSection="🔍"
                radius="xl"
                size="sm"
                styles={{
                  input: {
                    minWidth: 240,
                  },
                }}
              />
              <Button
                radius="md"
                size="sm"
                variant="gradient"
                gradient={{ from: 'cyan', to: 'blue', deg: 135 }}
                leftSection="⬇️"
              >
                Exporter
              </Button>
            </Group>
          </Group>
        </Paper>

        <Stack gap={10} mt={34} mb={24}>
          <Group gap="sm" wrap="wrap">
            <Title order={1} size={40} fw={600} style={{ letterSpacing: '-0.5px' }}>
              {activeCity}
            </Title>
            <Badge
              radius="xl"
              color="cyan"
              variant="light"
              styles={{
                root: {
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                },
              }}
            >
              {data.stationId}
            </Badge>
          </Group>
          <Text c="dimmed" maw={720} lh={1.6}>
            {data.summary}
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={20}>
          {metricCards.map((card) => {
            const accentColor =
              card.accent === 'orange'
                ? '#fbbf24'
                : card.accent === 'blue'
                  ? '#38bdf8'
                  : '#5eead4';
            return (
              <Paper
                key={card.key}
                p="md"
                radius="lg"
                withBorder
                style={{
                  backgroundColor: theme.colors.dark[7],
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <Stack gap={8}>
                  <Text size="xs" tt="uppercase" c="dimmed" style={{ letterSpacing: '0.1em' }}>
                    {card.title} en {lastFullYear}
                  </Text>
                  <Text size="xl" fw={600}>
                    {metrics[card.key]}
                  </Text>
                  <Text size="xs" c={accentColor}>
                    {metrics[card.changeKey]}
                  </Text>
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>

        <Divider
          my={28}
          label="Analyse des températures"
          labelPosition="left"
          styles={{
            label: {
              fontSize: theme.fontSizes.md,
              fontWeight: 600,
            },
          }}
        />
      </Container>
    </Box>
  );
}
