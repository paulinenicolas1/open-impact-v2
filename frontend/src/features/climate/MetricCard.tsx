import { Paper, Stack, Text, useMantineTheme } from '@mantine/core';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  accent: 'orange' | 'blue' | 'gray';
  year: number;
}

const accentColors: Record<MetricCardProps['accent'], string> = {
  orange: '#fbbf24',
  blue: '#38bdf8',
  gray: '#5eead4',
};

export function MetricCard({ title, value, change, accent, year }: MetricCardProps) {
  const theme = useMantineTheme();
  const accentColor = accentColors[accent];

  return (
    <Paper
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
          {title} en {year}
        </Text>
        <Text size="xl" fw={600}>
          {value}
        </Text>
        <Text size="xs" c={accentColor}>
          {change}
        </Text>
      </Stack>
    </Paper>
  );
}
