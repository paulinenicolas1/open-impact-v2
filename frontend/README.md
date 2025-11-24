# Frontend Documentation

This project uses a **Feature-Based Architecture** to ensure scalability and maintainability.

## Directory Structure

```
frontend/src/
├── features/             # Feature-specific code (Domain Driven Design)
│   ├── items/            # Example feature: Items management
│   │   ├── components/   # Feature-specific components
│   │   ├── hooks/        # Feature-specific hooks
│   │   └── api/          # Feature-specific API calls
├── components/           # Shared/Generic UI components
│   ├── layout/           # Application layout components (Sidebar, Header)
│   └── ui/               # Reusable UI elements (Buttons, Inputs, etc.)
├── lib/                  # 3rd party library configuration
│   └── apiClient.ts      # Centralized Axios instance
├── stories/              # Storybook stories
└── App.tsx               # Main application component
```

## Key Concepts

### Feature-Based Architecture
Code is organized by **feature** rather than by type. This means all components, hooks, and API calls related to a specific feature (e.g., "Items") are co-located in `src/features/items`. This makes it easier to delete, refactor, or scale features independently.

### Shared Components
Generic UI components that are used across multiple features are located in `src/components`.

### Layout
The application layout is managed by `src/components/layout`, which includes:
- `Layout.tsx`: The main wrapper using Mantine AppShell.
- `Sidebar.tsx`: The navigation sidebar.
- `Header.tsx`: The top header.

## Available Scripts

- `npm run dev`: Start the development server.
- `npm run test`: Run unit tests using Vitest.
- `npm run lint`: Run ESLint to check for code quality issues.
- `npm run storybook`: Start the Storybook development server.
