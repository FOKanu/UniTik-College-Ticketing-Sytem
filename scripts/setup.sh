#!/usr/bin/env bash
set -e

echo "Setting up University Support Ticketing System (FastAPI v2)..."

cp -n backend/.env.example backend/.env || true
cp -n frontend/.env.example frontend/.env || true

echo "Installing root dependencies (husky/lint-staged)..."
npm install

echo "Setting up Python backend..."
PYTHON_BIN="python3.12"
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  PYTHON_BIN="python3"
fi
if [ ! -d backend/.venv ]; then
  "$PYTHON_BIN" -m venv backend/.venv
fi
# shellcheck disable=SC1091
source backend/.venv/bin/activate
pip install -r requirements-dev.txt

echo "Installing frontend dependencies..."
(cd frontend && npm install)

echo "Done. Run 'docker compose up --build' or see docs/SETUP_INSTRUCTIONS.md."
