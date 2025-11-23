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
    
    # Function to cleanup on exit
    cleanup() {
        echo "Stopping dev servers..."
        # Kill all child processes of this script
        pkill -P $$ || true
        exit 0
    }
    
    # Register cleanup on signals
    trap cleanup SIGINT SIGTERM EXIT
    
    # Start both servers in background
    uv run uvicorn app.main:app --reload &
    cd frontend && npm run dev &
    
    # Wait for all background jobs
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
