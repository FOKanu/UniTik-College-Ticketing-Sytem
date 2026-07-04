#!/usr/bin/env bash
set -e

echo "Setting up University Support Ticketing System..."

cp -n backend/.env.example backend/.env || true
cp -n frontend/.env.example frontend/.env || true

echo "Installing root dependencies (husky/lint-staged)..."
npm install

echo "Installing backend dependencies..."
(cd backend && npm install && npx prisma generate)

echo "Installing frontend dependencies..."
(cd frontend && npm install)

echo "Done. Run 'docker compose up --build' or see docs/SETUP_INSTRUCTIONS.md for local setup."
