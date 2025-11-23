# Accessibility Testing Workflow

We use [vitest-axe](https://github.com/chaance/vitest-axe) to run accessibility tests directly from the CLI as part of our test suite. This ensures that we catch common accessibility issues early in the development process.

## Running Accessibility Tests

Accessibility tests are included in the standard test suite. To run them:

```bash
just test
```

Or specifically for the frontend:

```bash
cd frontend && npm run test
```

## Writing Accessibility Tests

To add an accessibility test for a component, use the `axe` matcher in your test file:

```tsx
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { MyComponent } from './MyComponent';

it('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Configuration

The setup is configured in:
- `frontend/vitest.setup.ts`: Extends Vitest's `expect` with `axe` matchers.
- `frontend/vitest.d.ts`: Provides TypeScript definitions for the matchers.
