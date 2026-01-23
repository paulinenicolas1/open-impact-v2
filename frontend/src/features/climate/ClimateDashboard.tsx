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
  Title,
  useMantineTheme,
} from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/layout/Header';

import { MetricCard } from '../../components/layout/MetricCard';
import { apiClient } from '../../lib/apiClient';
import { MetricBandChart } from '../../components/charts/MetricBandChart';

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

interface AnnualSeriesPoint {
  year: number;
  avgTemp: number | null;
  minTemp: number | null;
  maxTemp: number | null;
}

type AnnualSeriesMap = Record<string, AnnualSeriesPoint[]>;

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

type AnnualDataRow = Record<string, string> & {
  data?: Record<string, string>;
};
type AnnualDataResponse =
  | AnnualDataRow[]
  | {
      data?: AnnualDataRow[];
      items?: AnnualDataRow[];
      rows?: AnnualDataRow[];
    };

const resolveAnnualRows = (payload: AnnualDataResponse): AnnualDataRow[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.data ?? payload.items ?? payload.rows ?? [];
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
    title: '🌡️Température moyenne',
    key: 'avgTemp',
    changeKey: 'avgTempChange',
    accent: 'orange',
  },
  {
    title: '🔥 Température max',
    key: 'maxTemp',
    changeKey: 'maxTempChange',
    accent: 'gray',
  },
  {
    title: '☔ Précipitation',
    key: 'rainfall',
    changeKey: 'rainfallChange',
    accent: 'blue',
  },
] as const;

export function ClimateDashboard() {
  const theme = useMantineTheme();
  const [activeCity, setActiveCity] = useState<CityName>('Paris');
  const [yearlyMetrics, setYearlyMetrics] = useState<YearlyMetricMap>({});
  const [annualSeries, setAnnualSeries] = useState<AnnualSeriesMap>({});
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  useEffect(() => {
    const loadYearlyMetrics = async () => {
      setIsLoadingMetrics(true);
      try {
        const response = await apiClient.get<AnnualDataResponse>('/annual_data');
        const payload = response.data;
        const rows = resolveAnnualRows(payload);
        const nextMetrics: YearlyMetricMap = {};
        const nextSeries: AnnualSeriesMap = {};
        rows.forEach((row) => {
          const year = Number.parseInt(String(row.AAAA ?? '').trim(), 10);
          if (!Number.isFinite(year)) {
            return;
          }
          const cityKey = String(row.ville ?? '').trim().toLowerCase();
          if (!cityKey) {
            return;
          }
          const nestedData = row.data ?? {};
          const avgTemp = toNumber(nestedData.TMM ?? row.TMM);
          const maxTemp = toNumber(nestedData.TXAB ?? row.TXAB);
          const minTemp = toNumber(nestedData.TXMIN ?? row.TXMIN);
          const rainfall = toNumber(nestedData.RR ?? row.RR);

          if (!nextSeries[cityKey]) {
            nextSeries[cityKey] = [];
          }
          nextSeries[cityKey].push({
            year,
            avgTemp,
            minTemp,
            maxTemp,
          });

          if (year === lastFullYear) {
            nextMetrics[cityKey] = {
              avgTemp,
              maxTemp,
              rainfall,
            };
          }
        });
        Object.values(nextSeries).forEach((series) => {
          series.sort((a, b) => a.year - b.year);
        });
        setYearlyMetrics(nextMetrics);
        setAnnualSeries(nextSeries);
      } catch (error) {
        console.warn('Impossible de charger les métriques annuelles.', error);
      } finally {
        setIsLoadingMetrics(false);
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
  const activeSeries = annualSeries[cityKeyLookup[activeCity]] ?? [];

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
          <Header cities={cities} activeCity={activeCity} onCityChange={setActiveCity} />
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
          {metricCards.map((card) => (
            <MetricCard
              key={card.key}
              title={card.title}
              value={metrics[card.key]}
              change={metrics[card.changeKey]}
              accent={card.accent}
              year={lastFullYear}
              isLoading={isLoadingMetrics}
            />
          ))}
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

        <MetricBandChart
          title="Température annuelle moyenne"
          subtitle="Courbe annuelle avec intervalle min / max pour chaque ville."
          points={activeSeries}
          metricKey="avgTemp"
          upperKey="maxTemp"
          lowerKey="minTemp"
          metricLabel="Moyenne"
          bandLabel="Min / Max"
          upperLabel="Température maximale"
          lowerLabel="Température minimale"
          accentColor="#4cc9f0"
          unitSuffix="°C"
          isLoading={isLoadingMetrics}
        />
      </Container>
    </Box>
  );
}
