# Justfile

# Install dependencies
install:
    uv sync
    cd frontend && npm install

# Run backend in dev mode
dev-backend:
    uv run uvicorn app.main:app --reload

# Run frontend in dev mode
dev-frontend:
    cd frontend && npm run dev

# Run Storybook
storybook:
    cd frontend && npm run storybook

# Start development servers (backend + frontend)
dev:
    #!/usr/bin/env bash
    set -e
    
    # Trap SIGINT (Ctrl+C) and kill background processes
    trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit' INT TERM
    
    # Start both servers in background
    uv run uvicorn app.main:app --reload &
    BACKEND_PID=$!
    cd frontend && npm run dev &
    FRONTEND_PID=$!
    
    # Wait for both processes (will be interrupted by trap on Ctrl+C)
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true

# Format code
format:
    uv run ruff format .
    cd frontend && npx prettier --write .

# Lint code
lint:
    uv run ruff check --fix .
    uv run ty check
    cd frontend && npm run lint -- --fix

# Run tests
test:
    uv run pytest
    cd frontend && npm run test

# Default: format, lint, test
default: format lint test

# Full check: format, lint, test, build
check: format lint test
    cd frontend && npm run build
