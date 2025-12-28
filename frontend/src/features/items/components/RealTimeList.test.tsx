import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { axe } from 'vitest-axe';
import { MantineProvider } from '@mantine/core';
import { RealTimeList } from './RealTimeList';
import { apiClient } from '../../../lib/apiClient';

vi.mock('../../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock global fetch
vi.stubGlobal('fetch', vi.fn());

// Mock WebSocket
class MockWebSocket {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  send = vi.fn();
  close = vi.fn();

  constructor(url: string) {
    this.url = url;
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);

const renderWithMantine = (component: React.ReactNode) => {
  return render(<MantineProvider>{component}</MantineProvider>);
};

type MockFn = ReturnType<typeof vi.fn>;
const mockApiClient = apiClient as unknown as { get: MockFn; post: MockFn };

describe('RealTimeList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiClient.get.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the title', () => {
    renderWithMantine(<RealTimeList />);
    expect(screen.getByText('Items (SQLite)')).toBeDefined();
    expect(screen.getByText('Live Updates (WebSocket)')).toBeDefined();
  });

  it('should have no accessibility violations', async () => {
    const { container } = renderWithMantine(<RealTimeList />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('fetches items on mount', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      data: [{ id: 1, title: 'Item 1', description: 'Desc 1' }],
    });

    renderWithMantine(<RealTimeList />);

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith('/items');
      expect(screen.getByText('Item 1')).toBeDefined();
      expect(screen.getByText('Desc 1')).toBeDefined();
    });
  });

  it('adds a new item', async () => {
    renderWithMantine(<RealTimeList />);

    const input = screen.getByPlaceholderText('New item title');
    const button = screen.getByText('Add Item');

    fireEvent.change(input, { target: { value: 'New Item' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/items',
        expect.objectContaining({
          title: 'New Item',
          description: 'Added via frontend',
        }),
      );
    });
  });
});
