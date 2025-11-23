/// <reference lib="dom" />
import { beforeAll, afterAll, vi } from 'vitest';
import { setProjectAnnotations } from '@storybook/react-vite';
import * as projectAnnotations from './preview';
import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';

// Cast annotations to the correct type using inference
type ProjectAnnotations = Parameters<typeof setProjectAnnotations>[0];
const annotations = projectAnnotations as unknown as ProjectAnnotations;
setProjectAnnotations(annotations);

// Store original globals to restore them after tests
let originalWebSocket: typeof WebSocket;
let originalFetch: typeof fetch;

beforeAll(() => {
  // Save original globals
  originalWebSocket = window.WebSocket;
  originalFetch = window.fetch;

  // Mock WebSocket
  window.WebSocket = class MockWebSocket {
    public onmessage: ((this: WebSocket, ev: MessageEvent) => unknown) | null = null;
    public close() {
      /* no-op */
    }
    constructor(url: string) {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage.call(
            this as unknown as WebSocket,
            {
              data: JSON.stringify({
                type: 'message',
                data: `Connected to ${url}`,
              }),
            } as MessageEvent,
          );
        }
      }, 100);
    }
  } as unknown as typeof WebSocket;

  // Mock fetch
  window.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (url === '/api/items' && init?.method === 'POST') {
      const body = (init.body ? JSON.parse(init.body as string) : {}) as { title: string };
      return Promise.resolve({
        json: () =>
          Promise.resolve({ id: Date.now(), title: body.title, description: 'Added via mock' }),
      } as Response);
    }
    return Promise.resolve({
      json: () => Promise.resolve([]),
    } as Response);
  });
});

afterAll(() => {
  // Restore original globals
  window.WebSocket = originalWebSocket;
  window.fetch = originalFetch;
});

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
