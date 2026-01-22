import { Box, Button, Burger, Group, Text, TextInput, Title, useMantineTheme } from '@mantine/core';

interface HeaderProps<T extends string = string> {
  opened?: boolean;
  toggle?: () => void;
  cities?: readonly T[];
  activeCity?: T;
  onCityChange?: (city: T) => void;
}

export default function Header<T extends string = string>({
  opened,
  toggle,
  cities,
  activeCity,
  onCityChange,
}: HeaderProps<T>) {
  const theme = useMantineTheme();
  const hasClimateHeader = Boolean(cities && activeCity && onCityChange);

  if (hasClimateHeader && cities && activeCity && onCityChange) {
    return (
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
                onClick={() => onCityChange(city)}
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
    );
  }

  return (
    <Group h="100%" px="md">
      {opened !== undefined && toggle ? (
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
      ) : null}
      <Title order={3}>My App</Title>
    </Group>
  );
}
