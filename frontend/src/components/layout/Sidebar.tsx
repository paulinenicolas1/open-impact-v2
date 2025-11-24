import { NavLink, Stack } from '@mantine/core';

export default function Sidebar() {
  return (
    <Stack gap="xs">
      <NavLink label="Dashboard" description="Overview of your activity" active variant="light" />
      <NavLink label="Items" description="Manage your inventory" />
      <NavLink label="Settings" description="Application configuration" />
    </Stack>
  );
}
