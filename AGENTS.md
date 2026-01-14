# Repository Guidelines

This is a template repository intended as a starting point for new projects.

## Project Structure & Module Organization
- `src/app/` contains the FastAPI backend. Key areas include `api/` for routes, `core/` for configuration, `db/` for database utilities, and `services/` for business logic. Entry point: `src/app/main.py`.
- `tests/` holds backend tests (pytest). Test files follow `test_*.py` and mirror API behavior (e.g., `tests/test_main.py`).
- `frontend/` is the React + Vite app. Source lives in `frontend/src/` with `components/`, `features/`, `stories/`, `assets/`, and `mocks/`.
- `docs/` includes detailed web and Python guidelines; prefer these for deeper conventions.

## Build, Test, and Development Commands
- `just install`: Install Python deps via `uv sync` and frontend deps via `npm install`.
- `just dev`: Run backend + frontend together (FastAPI + Vite). Use `just dev-backend` or `just dev-frontend` for one side.
- `just test`: Run `pytest` and `vitest` (includes accessibility tests).
- `just format`: `ruff format` for Python and `prettier` for frontend.
- `just lint`: `ruff check`, `ty check`, and `eslint`.
- `just check`: Full pass (format, lint, test, and `npm run build`).

## Coding Style & Naming Conventions
- Philosophy: prioritize type safety, composable components/services, and readable, modern code. This is a template, so favor clarity over cleverness.
- For detailed rules, see `docs/python_guidelines.md` and `docs/web_guidelines.md`. These documents define the authoritative style and patterns for Python and React + TypeScript.
- Naming: keep backend modules domain-focused under `src/app/`; for frontend, use feature-based folders and name files after components (`UserCard.tsx`) with colocated tests/stories.
- Formatting/Linting: `ruff`, `ty`, `eslint`, and `prettier` are the sources of truth; run `just format` and `just lint` before PRs.

## Testing Guidelines
- Backend: `pytest` in `tests/`, with `pytest-asyncio` enabled. Run via `uv run pytest` or `just test`.
- Frontend: `vitest` + Testing Library; accessibility checks run via `vitest-axe`. Tests live next to components in `frontend/src/`.
- Storybook is used for visual testing (`just storybook`).

## Commit & Pull Request Guidelines
- Commits follow conventional types like `fix:`, `refactor(scope):`, or `misc` (see `git log`). Keep subjects short and imperative.
- PRs should include a focused summary, test commands run, and a linked issue if available. Include UI screenshots or Storybook links when frontend behavior changes.

## Configuration Tips
- Python target is 3.13 (`pyproject.toml`). Use `uv` for dependency management and execution.
- Frontend is Vite + React in `frontend/`; use `npm run preview` to validate production builds locally.
