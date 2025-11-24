import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Title,
  TextInput,
  Button,
  List,
  Paper,
  Group,
  Text,
  Stack,
} from '@mantine/core';

interface Item {
  id: number;
  title: string;
  description?: string;
}

export function RealTimeList() {
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Fetch initial items
    void fetch('/api/items')
      .then((res) => res.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setItems(data as Item[]);
        }
      })
      .catch((err: unknown) => {
        console.error(err);
      });

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Direct connection to backend for development reliability
    const wsUrl = import.meta.env.DEV
      ? `${protocol}//127.0.0.1:8000/ws`
      : `${protocol}//${window.location.host}/ws`;

    ws.current = new WebSocket(wsUrl);

    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        const data = event.data;
        setMessages((prev) => [...prev, data]);
        if (data.startsWith('New item added')) {
          void fetch('/api/items')
            .then((res) => res.json())
            .then((data: unknown) => {
              if (Array.isArray(data)) {
                setItems(data as Item[]);
              }
            });
        }
      }
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const addItem = async () => {
    if (!newItem) return;
    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newItem, description: 'Added via frontend' }),
    });
    setNewItem('');
  };

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Title order={2}>Real-Time Item List</Title>

        <Paper withBorder p="md">
          <Group>
            <TextInput
              placeholder="New item title"
              aria-label="New item title"
              value={newItem}
              onChange={(e) => {
                setNewItem(e.currentTarget.value);
              }}
              style={{ flex: 1 }}
            />
            <Button
              variant="filled"
              color="blue.8"
              onClick={() => {
                void addItem();
              }}
            >
              Add Item
            </Button>
          </Group>
        </Paper>

        <Paper withBorder p="md">
          <Title order={3} mb="md">
            Items (SQLite)
          </Title>
          <List>
            {items.map((item) => (
              <List.Item key={item.id}>
                <Text fw={500}>{item.title}</Text>
                <Text size="sm" c="dimmed">
                  {item.description}
                </Text>
              </List.Item>
            ))}
          </List>
        </Paper>

        <Paper withBorder p="md">
          <Title order={3} mb="md">
            Live Updates (WebSocket)
          </Title>
          <List>
            {messages.map((msg, i) => (
              <List.Item key={i}>{msg}</List.Item>
            ))}
          </List>
        </Paper>
      </Stack>
    </Container>
  );
}

export default RealTimeList;
