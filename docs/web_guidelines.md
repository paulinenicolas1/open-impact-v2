# Web Development Guidelines

This document outlines the coding standards and best practices for Frontend development (React + TypeScript) in this project. We prioritize type safety, component composition, and modern React features.

## Core Principles

- **Strict Typing**: No `any`. All props and state must be typed.
- **Functional Components**: Use functional components and Hooks exclusively.
- **Composition**: Build complex UIs from small, reusable components.
- **Design System**: Use Mantine components and styles. Avoid raw CSS.

## 1. TypeScript & Type Safety

### Strict Mode
We use strict TypeScript configuration. Ensure no implicit `any` types exist.

### Rules
- **Always** define interfaces for component props.
- **Avoid** `any`. Use `unknown` if the type is truly uncertain, then narrow it.
- **Use** `type` for unions/intersections and `interface` for object shapes (props/state).

### Example

```tsx
// DO
interface UserProps {
  id: string;
  name: string;
  role: 'admin' | 'user';
  onUpdate: (user: User) => void;
}

export function UserCard({ name, role, onUpdate }: UserProps) {
  return <div>{name} ({role})</div>;
}

// DON'T
export function UserCard(props: any) {
  return <div>{props.name}</div>;
}
```

## 2. React Components

### Functional Components & Hooks
**Always** use functional components. **Never** use class components.

```tsx
// DO
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Component Structure
- One component per file (mostly).
- Name the file exactly as the component (e.g., `UserCard.tsx`).
- Place tests alongside components (`UserCard.test.tsx`).
- Place stories alongside components (`UserCard.stories.tsx`).

## 3. State Management

### Hierarchy of State
1.  **URL State**: If it can be in the URL (filters, pagination, tabs), put it there.
2.  **Server State**: Use `react-query` or `swr` (or simple `fetch` in small apps) for data.
3.  **Local State**: `useState` / `useReducer` for UI interactions (modals, form inputs).
4.  **Global State**: Use `Zustand` or `Context` only when absolutely necessary (auth, theme).

## 4. Styling (Mantine)

### Use Mantine Components
Prefer Mantine components over HTML elements for layout and standard UI.

```tsx
import { Button, Group, Stack, Text } from '@mantine/core';

// DO
export function Welcome() {
  return (
    <Stack>
      <Text size="xl">Welcome</Text>
      <Group>
        <Button>Login</Button>
        <Button variant="outline">Register</Button>
      </Group>
    </Stack>
  );
}

// DON'T
export function Welcome() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h1>Welcome</h1>
      <div style={{ display: 'flex' }}>
        <button>Login</button>
      </div>
    </div>
  );
}
```

## 5. Testing

### Vitest vs. Storybook
- **Vitest**: For unit testing logic, interactions, and edge cases. Use `@testing-library/react`.
- **Storybook**: For visual testing, component states, and documentation.

### Writing Tests
- Test behavior, not implementation details.
- Use `screen` to query elements by accessible roles/text.

```tsx
// DO
test('calls onUpdate when clicked', async () => {
  const handleUpdate = vi.fn();
  render(<UserCard onUpdate={handleUpdate} />);
  
  await userEvent.click(screen.getByRole('button', { name: /update/i }));
  
  expect(handleUpdate).toHaveBeenCalled();
});
```

## 6. Imports

- Use absolute imports where configured.
- Group imports: React/Libs, Components, Utils/Types, Styles.

```tsx
// DO
import { useState } from 'react';
import { Button } from '@mantine/core';

import { User } from '../../types';
import { formatDate } from '../../utils';

// DON'T
import { useState } from 'react';
import { formatDate } from '../../utils';
import { Button } from '@mantine/core';
```
