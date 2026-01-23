import { Paper, Skeleton, Stack, Text, useMantineTheme } from '@mantine/core';
import type { CSSProperties } from 'react';
import styles from './MetricCard.module.css';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  accent: 'orange' | 'blue' | 'gray';
  year: number;
  isLoading?: boolean;
}

const accentColors: Record<MetricCardProps['accent'], string> = {
  orange: '#fbbf24',
  blue: '#38bdf8',
  gray: '#5eead4',
};

export function MetricCard({
  title,
  value,
  change,
  accent,
  year,
  isLoading = false,
}: MetricCardProps) {
  const theme = useMantineTheme();
  const accentColor = accentColors[accent];

  return (
    <Paper
      p="md"
      radius="lg"
      withBorder
      className={styles.card}
      style={
        {
          backgroundColor: theme.colors.dark[7],
          '--accent-color': accentColor,
        } as CSSProperties
      }
    >
      <Stack gap={8}>
        <Text size="xs" tt="uppercase" c="dimmed" style={{ letterSpacing: '0.1em' }}>
          {title} en {year}
        </Text>
        {isLoading ? (
          <Skeleton height={26} width="60%" radius="sm" />
        ) : (
          <Text size="xl" fw={600}>
            {value}
          </Text>
        )}
        {isLoading ? (
          <Skeleton height={14} width="40%" radius="sm" />
        ) : (
          <Text size="xs" c={accentColor}>
            {change}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
