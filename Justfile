# Justfile

# Install dependencies
install:
    uv sync
    cd frontend && npm install

# Run backend in dev mode
dev-backend:
    uv run uvicorn src.app.main:app --reload

# Run frontend in dev mode
dev-frontend:
    cd frontend && npm run dev

# Run both backend and frontend in development mode
dev:
    (trap 'kill 0' SIGINT; just dev-backend & just dev-frontend & wait)

# Run tests
test:
    uv run pytest

# Run linters and type checkers
lint:
    uv run ruff check .
    uv run ty check
    cd frontend && npm run lint

# Format code
format:
    uv run ruff format .

# Run all checks (lint, test, build frontend)
check: lint test
    cd frontend && npm run build
