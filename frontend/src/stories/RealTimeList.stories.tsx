import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, userEvent, expect } from '@storybook/test';
import { RealTimeList } from '../components/RealTimeList';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';

const meta = {
  title: 'Components/RealTimeList',
  component: RealTimeList,
  decorators: [
    (Story) => (
      <MantineProvider>
        <Story />
      </MantineProvider>
    ),
  ],
} satisfies Meta<typeof RealTimeList>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic story without interaction
export const Default: Story = {};

// Story with interaction test
export const WithInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the component renders
    await expect(canvas.getByText('Real-Time Item List')).toBeInTheDocument();

    // Find the input and button
    const input = canvas.getByPlaceholderText('New item title');
    const button = canvas.getByRole('button', { name: /add item/i });

    // Simulate user interaction
    await userEvent.type(input, 'Test Item from Storybook');
    await userEvent.click(button);

    // Verify the input still has the value (component doesn't auto-clear)
    await expect(input).toHaveValue('Test Item from Storybook');
  },
};
