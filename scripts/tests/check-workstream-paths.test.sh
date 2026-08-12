#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="$ROOT/scripts/check-workstream-paths.sh"

make_repo() {
  local tmp
  tmp="$(mktemp -d)"
  cd "$tmp"
  git init -q
  git config user.name "Test User"
  git config user.email "test@example.com"
  git checkout -qb main
  mkdir -p .github/workflows
  printf '%s\n' '#!/usr/bin/env bash' > README.md
  git add README.md
  git commit -qm "init"
  git checkout -qb feature/tooling-devops-black-mypy-setup
  printf '%s\n' "$tmp"
}

assert_ok() {
  local label="$1"
  shift
  if "$@"; then
    echo "PASS: $label"
  else
    echo "FAIL: $label" >&2
    return 1
  fi
}

assert_fail() {
  local label="$1"
  shift
  if "$@"; then
    echo "FAIL: $label (expected failure)" >&2
    return 1
  else
    echo "PASS: $label"
  fi
}

repo="$(make_repo)"
cd "$repo"
mkdir -p .github/workflows
printf '%s\n' 'name: ci' > .github/workflows/ci.yml
git add .github/workflows/ci.yml
git commit -qm "allowed tooling change"
assert_ok "tooling allowed files pass" bash "$SCRIPT" feature/tooling-devops-black-mypy-setup main

cd "$repo"
mkdir -p backend/src
printf '%s\n' 'export function app() { return true; }' > backend/src/app.ts
git add backend/src/app.ts
git commit -qm "disallowed backend change"
assert_fail "tooling disallowed files fail" bash "$SCRIPT" feature/tooling-devops-black-mypy-setup main

cd "$repo"
printf '%s\n' '<<<<<<< HEAD' > scripts/merge-conflict-demo.txt
printf '%s\n' 'keep me' >> scripts/merge-conflict-demo.txt
printf '%s\n' '=======' >> scripts/merge-conflict-demo.txt
printf '%s\n' 'other side' >> scripts/merge-conflict-demo.txt
printf '%s\n' '>>>>>>> feature/tooling-devops-black-mypy-setup' >> scripts/merge-conflict-demo.txt
git add scripts/merge-conflict-demo.txt
git commit -qm "merge conflict marker"
assert_fail "tooling merge conflict markers are rejected" bash "$SCRIPT" feature/tooling-devops-black-mypy-setup main

backend_repo="$(mktemp -d)"
cd "$backend_repo"
git init -q
git config user.name "Test User"
git config user.email "test@example.com"
git checkout -qb main
mkdir -p README.md backend/src docs
printf '%s\n' '# backend auth repo' > README.md
git add README.md
git commit -qm "init backend repo"
git checkout -qb feature/backend-auth-and-sso
mkdir -p backend/src/auth
printf '%s\n' 'export const auth = true;' > backend/src/auth/index.ts
git add backend/src/auth/index.ts
git commit -qm "allowed backend auth change"
assert_ok "backend auth allowed files pass" bash "$SCRIPT" feature/backend-auth-and-sso main

cd "$backend_repo"
mkdir -p frontend/src
printf '%s\n' 'export const ui = true;' > frontend/src/app.ts

git add frontend/src/app.ts
git commit -qm "disallowed frontend change"
assert_fail "backend auth disallowed frontend files fail" bash "$SCRIPT" feature/backend-auth-and-sso main

cd "$backend_repo"
printf '%s\n' '<<<<<<< HEAD' > backend/src/auth/conflict.txt
printf '%s\n' 'keep me' >> backend/src/auth/conflict.txt
printf '%s\n' '=======' >> backend/src/auth/conflict.txt
printf '%s\n' 'other side' >> backend/src/auth/conflict.txt
printf '%s\n' '>>>>>>> feature/backend-auth-and-sso' >> backend/src/auth/conflict.txt
git add backend/src/auth/conflict.txt
git commit -qm "backend auth conflict marker"
assert_fail "backend auth merge conflict markers are rejected" bash "$SCRIPT" feature/backend-auth-and-sso main

echo "All workstream path guard tests passed."
