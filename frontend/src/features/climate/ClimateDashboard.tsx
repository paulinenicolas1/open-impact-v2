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
import { MonthlySeriesChart, type MonthlySeriesPoint } from '../../components/charts/MonthlySeriesChart';
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
type MonthlySeriesMap = Record<string, MonthlySeriesPoint[]>;
interface HotDaysPoint {
  year: number;
  value: number | null;
}
type HotDaysSeriesMap = Record<string, HotDaysPoint[]>;

const lastFullYear = new Date().getFullYear() - 1;
const hotDaysWindowYears = 30;
const monthLabels = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

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

const resolveRows = (payload: AnnualDataResponse): AnnualDataRow[] => {
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

const normalizeMonth = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace('é', 'e')
    .replace('è', 'e')
    .replace('ê', 'e')
    .replace('ë', 'e')
    .replace('à', 'a')
    .replace('â', 'a')
    .replace('î', 'i')
    .replace('ï', 'i')
    .replace('ô', 'o')
    .replace('ö', 'o')
    .replace('û', 'u')
    .replace('ü', 'u');

const monthIndexFromRow = (row: Record<string, string>) => {
  const rawMonthNumber = String(row.MM ?? '').trim();
  if (rawMonthNumber) {
    const parsed = Number.parseInt(rawMonthNumber, 10);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 12) {
      return parsed;
    }
  }

  const rawMonthLabel = normalizeMonth(String(row.MOIS ?? ''));
  const monthLookup = monthLabels.map((label) => normalizeMonth(label));
  const index = monthLookup.findIndex((label) => label === rawMonthLabel);
  if (index >= 0) {
    return index + 1;
  }

  return null;
};

export function ClimateDashboard() {
  const theme = useMantineTheme();
  const [activeCity, setActiveCity] = useState<CityName>('Paris');
  const [yearlyMetrics, setYearlyMetrics] = useState<YearlyMetricMap>({});
  const [annualSeries, setAnnualSeries] = useState<AnnualSeriesMap>({});
  const [monthlySeries, setMonthlySeries] = useState<MonthlySeriesMap>({});
  const [hotDaysSeries, setHotDaysSeries] = useState<HotDaysSeriesMap>({});
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [hoveredHotDays, setHoveredHotDays] = useState<HotDaysPoint | null>(null);

  useEffect(() => {
    const loadYearlyMetrics = async () => {
      setIsLoadingMetrics(true);
      try {
        const [annualResponse, monthlyResponse] = await Promise.all([
          apiClient.get<AnnualDataResponse>('/annual_data'),
          apiClient.get<AnnualDataResponse>('/monthly_data'),
        ]);
        const annualRows = resolveRows(annualResponse.data);
        const monthlyRows = resolveRows(monthlyResponse.data);
        const nextMetrics: YearlyMetricMap = {};
        const nextSeries: AnnualSeriesMap = {};
        const nextHotDays: Record<string, Map<number, number | null>> = {};
        annualRows.forEach((row) => {
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

          if (!nextHotDays[cityKey]) {
            nextHotDays[cityKey] = new Map();
          }
          nextHotDays[cityKey].set(year, toNumber(nestedData.NBJTX25 ?? row.NBJTX25));

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
        const nextHotDaysSeries: HotDaysSeriesMap = {};
        Object.entries(nextHotDays).forEach(([cityKey, yearMap]) => {
          nextHotDaysSeries[cityKey] = Array.from(yearMap.entries())
            .map(([year, value]) => ({ year, value }))
            .sort((a, b) => a.year - b.year);
        });
        setHotDaysSeries(nextHotDaysSeries);

        const monthlyMap: Record<string, Record<number, Array<number | null>>> = {};
        monthlyRows.forEach((row) => {
          const year = Number.parseInt(String(row.AAAA ?? '').trim(), 10);
          if (!Number.isFinite(year)) {
            return;
          }
          const cityKey = String(row.ville ?? '').trim().toLowerCase();
          if (!cityKey) {
            return;
          }
          const monthIndex = monthIndexFromRow(row);
          if (!monthIndex) {
            return;
          }
          const nestedData = row.data ?? {};
          const avgTemp = toNumber(nestedData.TMM ?? row.TMM);

          if (!monthlyMap[cityKey]) {
            monthlyMap[cityKey] = {};
          }
          if (!monthlyMap[cityKey][year]) {
            monthlyMap[cityKey][year] = Array.from({ length: 12 }, () => null);
          }
          monthlyMap[cityKey][year][monthIndex - 1] = avgTemp;
        });

        const nextMonthlySeries: MonthlySeriesMap = {};
        Object.entries(monthlyMap).forEach(([cityKey, yearMap]) => {
          const series = Object.entries(yearMap)
            .map(([year, values]) => ({
              year: Number(year),
              values,
            }))
            .sort((a, b) => a.year - b.year);
          nextMonthlySeries[cityKey] = series;
        });
        setMonthlySeries(nextMonthlySeries);
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
  const activeMonthlySeries = monthlySeries[cityKeyLookup[activeCity]] ?? [];
  const activeHotDaysSeries = hotDaysSeries[cityKeyLookup[activeCity]] ?? [];
  const hotDaysWindowedSeries = useMemo(() => {
    if (activeHotDaysSeries.length === 0) {
      return [];
    }
    const latestYear = activeHotDaysSeries[activeHotDaysSeries.length - 1]?.year;
    if (!latestYear) {
      return activeHotDaysSeries;
    }
    const minYear = latestYear - (hotDaysWindowYears - 1);
    return activeHotDaysSeries.filter((point) => point.year >= minYear);
  }, [activeHotDaysSeries]);
  const hotDaysLabelStep = useMemo(() => {
    const count = hotDaysWindowedSeries.length;
    if (count >= 32) {
      return 3;
    }
    if (count >= 20) {
      return 2;
    }
    return 1;
  }, [hotDaysWindowedSeries.length]);
  const hotDaysMax = hotDaysWindowedSeries.reduce((maxValue, point) => {
    if (point.value === null) {
      return maxValue;
    }
    return Math.max(maxValue, point.value);
  }, 0);

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

        <Box mt={24}>
          <MonthlySeriesChart
            title="Cycle saisonnier des températures moyennes mensuelles"
            subtitle="Chaque courbe représente une année, du mois de janvier à décembre."
            series={activeMonthlySeries}
            xLabels={monthLabels}
            accentColor="#f4a261"
            unitSuffix="°C"
            isLoading={isLoadingMetrics}
            defaultYears={[2025, 1985]}
          />
        </Box>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={20} mt={24}>
          <Paper
            p="lg"
            radius="lg"
            withBorder
            style={{
              backgroundColor: theme.colors.dark[7],
              borderColor: theme.colors.dark[5],
            }}
          >
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start">
                <Stack gap={4}>
                  <Text fw={600}>Jours &gt; 25°C</Text>
                  <Text size="sm" c="dimmed">
                    Nombre de jours avec une température maximale supérieure à 25°C.
                  </Text>
                </Stack>
              </Group>
              {isLoadingMetrics ? (
                <Text size="sm" c="dimmed">
                  Chargement des données annuelles…
                </Text>
              ) : hotDaysWindowedSeries.length === 0 ? (
                <Text size="sm" c="dimmed">
                  Aucune donnée disponible pour cette ville.
                </Text>
              ) : (
                <Box
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 4,
                    minHeight: 190,
                    width: '100%',
                  }}
                >
                  {hotDaysWindowedSeries.map((point, index) => {
                    const showLabel = index % hotDaysLabelStep === 0;
                    const height =
                      point.value === null || hotDaysMax === 0
                        ? 4
                        : Math.max(4, (point.value / hotDaysMax) * 170);
                    const isHovered = hoveredHotDays?.year === point.year;
                    return (
                      <Box
                        key={point.year}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          flex: '1 1 0',
                          minWidth: 0,
                          position: 'relative',
                        }}
                        onMouseEnter={() => setHoveredHotDays(point)}
                        onMouseLeave={() => setHoveredHotDays(null)}
                      >
                        {isHovered && point.value !== null ? (
                          <Box
                            style={{
                              position: 'absolute',
                              top: -56,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              backgroundColor: theme.colors.dark[9],
                              color: theme.white,
                              padding: '8px 10px',
                              borderRadius: 10,
                              fontSize: theme.fontSizes.xs,
                              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.35)',
                              border: `1px solid ${theme.colors.dark[5]}`,
                              whiteSpace: 'nowrap',
                              zIndex: 5,
                            }}
                          >
                            {`Année ${point.year} : ${point.value} jours avec Tmax > 25°C`}
                          </Box>
                        ) : null}
                        <Box
                          style={{
                            width: '100%',
                            maxWidth: 12,
                            height,
                            borderRadius: 6,
                            background:
                              'linear-gradient(180deg, rgba(255, 180, 82, 0.95) 0%, rgba(255, 112, 67, 0.8) 100%)',
                            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.25)',
                            opacity: isHovered ? 1 : 0.75,
                            transform: isHovered ? 'translateY(-4px)' : 'none',
                            transition: 'transform 160ms ease, opacity 160ms ease',
                          }}
                        />
                        <Text
                          size="xs"
                          c="dimmed"
                          style={{
                            letterSpacing: 0.2,
                            height: 26,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            transform: showLabel ? 'rotate(-35deg)' : 'none',
                            transformOrigin: 'top center',
                            opacity: showLabel ? 1 : 0,
                          }}
                        >
                          {showLabel ? point.year : ''}
                        </Text>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Stack>
          </Paper>

          <Paper
            p="lg"
            radius="lg"
            withBorder
            style={{
              backgroundColor: theme.colors.dark[7],
              borderColor: theme.colors.dark[5],
            }}
          >
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start">
                <Stack gap={4}>
                  <Text fw={600}>Deuxième graphique</Text>
                  <Text size="sm" c="dimmed">
                    Emplacement pour un indicateur complémentaire.
                  </Text>
                </Stack>
                <Badge radius="xl" color="gray" variant="light">
                  À définir
                </Badge>
              </Group>
              <Box
                style={{
                  minHeight: 190,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  border: `1px dashed ${theme.colors.dark[4]}`,
                  color: theme.colors.dark[2],
                  fontSize: theme.fontSizes.sm,
                }}
              >
                Sélectionner une métrique pour compléter cette section.
              </Box>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
