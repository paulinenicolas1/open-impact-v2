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
    set -euo pipefail
    echo "Starting dev servers..."
    
    # Start backend in background and save PID
    uv run uvicorn app.main:app --reload &
    BACKEND_PID=$!
    
    # Start frontend in background and save PID
    cd frontend && npm run dev &
    FRONTEND_PID=$!
    
    # Function to cleanup on exit
    cleanup() {
        echo "Stopping dev servers..."
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
        wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
        exit 0
    }
    
    # Register cleanup on signals
    trap cleanup SIGINT SIGTERM EXIT
    
    # Wait for both processes
    wait

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
