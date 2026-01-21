# Python + React Template

A minimal, batteries-included template for building a FastAPI backend with a React + Vite frontend. Use this repo as a starting point, then customize the domain, data model, and UI to fit your project.

## Goals
- Provide a clean, modern full-stack scaffold with sensible defaults.
- Encourage type safety, composability, and testability across backend and frontend.
- Keep setup and dev workflow simple via `just`, `uv`, and Vite.

## Template Structure
- `src/app/`: FastAPI backend. API routes live in `api/`, config in `core/`, DB helpers in `db/`, and business logic in `services/`. Entry point: `src/app/main.py`.
- `tests/`: Backend tests using pytest.
- `frontend/`: React + Vite app.
  - `frontend/src/components/`: reusable UI building blocks
  - `frontend/src/features/`: feature-focused slices
  - `frontend/src/stories/`: Storybook stories
  - `frontend/src/assets/` and `frontend/src/mocks/`: static assets and mocks
- `docs/`: language-specific conventions for Python and Web development.
- `Justfile`: standard dev commands.

## Quick Start
```bash
just install
just dev
```
- Backend runs at `http://localhost:8000`
- Frontend runs at `http://localhost:5173`

## Common Commands
- `just install`: install Python + frontend dependencies
- `just dev`: run backend and frontend together
- `just test`: run pytest and vitest (includes accessibility tests)
- `just format`: format Python and frontend code
- `just lint`: lint and type-check
- `just check`: format, lint, test, and build

## Conventions
This template favors strict typing, composable design, and readable code. See `docs/python_guidelines.md` and `docs/web_guidelines.md` for the full philosophy and detailed rules.

## When You Customize
- Replace example API routes and models with your domain.
- Update the frontend feature folders to match your product.
- Add database migrations, auth, and deployment configuration as needed.

