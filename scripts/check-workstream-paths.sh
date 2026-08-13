#!/usr/bin/env bash
# Enforce that commits on a workstream branch only touch paths for that workstream.
# Used by .github/workflows/workstream-path-guard.yml and runnable locally:
#   scripts/check-workstream-paths.sh <branch-name> [base-ref]
set -euo pipefail

BRANCH="${1:-${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-}}}"
BASE_REF="${2:-}"

if [[ -z "$BRANCH" ]]; then
  echo "Usage: $0 <branch-name> [base-ref]"
  exit 2
fi

# Integration / release gates may receive any paths.
case "$BRANCH" in
  main|debugging|project-manager|develop)
    echo "Branch '$BRANCH' is a gate/integration branch — path guard skipped."
    exit 0
    ;;
esac

# Shared docs are allowed on every workstream so ownership docs can land with work.
COMMON_ALLOWED=(
  '^docs/'
  '^CONTRIBUTING\.md$'
  '^README\.md$'
  '^CLAUDE\.md$'
  '^\.gitignore$'
)

resolve_area() {
  local b="$1"
  if [[ "$b" =~ ^feature/(frontend|backend|database|ai-rag|tooling-devops|testing)- ]]; then
    echo "${BASH_REMATCH[1]}"
    return
  fi
  case "$b" in
    frontend|backend|database|ai-rag|tooling-devops|testing) echo "$b" ;;
    *) echo "" ;;
  esac
}

AREA="$(resolve_area "$BRANCH")"
if [[ -z "$AREA" ]]; then
  echo "Branch '$BRANCH' is not a known workstream or feature/<area>-* branch."
  echo "Use: frontend|backend|database|ai-rag|tooling-devops|testing"
  echo "  or: feature/<area>-<short-description>"
  exit 1
fi

ALLOWED=("${COMMON_ALLOWED[@]}")
case "$AREA" in
  frontend)
    ALLOWED+=('^frontend/')
    ALLOWED+=('^shared/')
    ;;
  backend)
    ALLOWED+=('^backend/app/')
    ALLOWED+=('^backend/tests/')
    ALLOWED+=('^backend/pyproject\.toml$')
    ALLOWED+=('^backend/\.env\.example$')
    ;;
  database)
    ALLOWED+=('^backend/alembic/')
    ALLOWED+=('^backend/alembic\.ini$')
    ALLOWED+=('^backend/app/models/')
    # SQLAlchemy declarative Base and the schema-level enums (Role, TicketStatus,
    # FaqVisibility, …) live here. They are schema, not API, so the database
    # workstream owns them.
    ALLOWED+=('^backend/app/db/')
    ALLOWED+=('^backend/scripts/')
    ;;
  ai-rag)
    ALLOWED+=('^backend/app/ai/')
    ALLOWED+=('^backend/app/api/v1/chat\.py$')
    ALLOWED+=('^backend/app/api/v1/kb\.py$')
    ALLOWED+=('^backend/app/services/chat\.py$')
    ALLOWED+=('^backend/app/services/kb\.py$')
    ALLOWED+=('^backend/app/services/kb_')
    ALLOWED+=('^backend/app/schemas/chat\.py$')
    ALLOWED+=('^backend/app/schemas/kb\.py$')
    ALLOWED+=('^backend/app/models/')
    ALLOWED+=('^backend/alembic/')
    ALLOWED+=('^backend/scripts/ingest_kb\.py$')
    ALLOWED+=('^backend/tests/test_kb')
    ALLOWED+=('^backend/\.env\.example$')
    ALLOWED+=('^scripts/check-workstream-paths\.sh$')
    ALLOWED+=('^frontend/src/modules/chat/')
    ALLOWED+=('^frontend/src/modules/faq/')
    ;;
  tooling-devops)
    ALLOWED+=('^\.github/')
    ALLOWED+=('^docker/')
    ALLOWED+=('^docker-compose\.yml$')
    ALLOWED+=('^scripts/')
    ALLOWED+=('^package\.json$')
    ALLOWED+=('^\.husky/')
    ALLOWED+=('^\.editorconfig$')
    ALLOWED+=('^\.prettier')
    ALLOWED+=('^\.prettierignore$')
    ALLOWED+=('^archive/')
    ALLOWED+=('^backend/')
    ALLOWED+=('^frontend/')
    ;;
  testing)
    ALLOWED+=('\.test\.ts$')
    ALLOWED+=('\.test\.tsx$')
    ALLOWED+=('\.test\.py$')
    ALLOWED+=('/tests/')
    ALLOWED+=('^backend/tests/')
    ALLOWED+=('^frontend/src/test-setup\.ts$')
    ALLOWED+=('^frontend/.*vitest')
    ;;
  *)
    echo "Unknown area: $AREA"
    exit 1
    ;;
esac

if [[ -n "${BASE_REF}" ]]; then
  RANGE="${BASE_REF}...HEAD"
elif [[ -n "${GITHUB_EVENT_NAME:-}" && "${GITHUB_EVENT_NAME}" == "pull_request" ]]; then
  RANGE="origin/${GITHUB_BASE_REF}...HEAD"
elif [[ -n "${GITHUB_EVENT_BEFORE:-}" && "${GITHUB_EVENT_BEFORE}" != "0000000000000000000000000000000000000000" ]]; then
  RANGE="${GITHUB_EVENT_BEFORE}...HEAD"
else
  git fetch origin main --depth=50 2>/dev/null || true
  RANGE="origin/main...HEAD"
fi

FILES=()
while IFS= read -r line; do
  FILES+=("$line")
done < <(git diff --name-only "$RANGE")
if [[ ${#FILES[@]} -eq 0 || -z "${FILES[0]:-}" ]]; then
  echo "No changed files in range $RANGE — OK."
  exit 0
fi

for f in "${FILES[@]}"; do
  [[ -z "$f" ]] && continue
  if [[ -f "$f" ]] && grep -nE '^(<<<<<<<|=======|>>>>>>>)' "$f" >/dev/null; then
    echo ""
    echo "Merge conflict markers detected in '$f'."
    echo "Resolve all conflict markers before pushing this branch."
    exit 1
  fi
done

echo "Checking ${#FILES[@]} file(s) on branch '$BRANCH' (area: $AREA) against allowlist…"
VIOLATIONS=()
for f in "${FILES[@]}"; do
  [[ -z "$f" ]] && continue
  if [[ "$f" =~ ^archive/ ]]; then
    if [[ "$AREA" != "tooling-devops" ]]; then
      VIOLATIONS+=("$f")
    fi
    continue
  fi
  ok=0
  for pat in "${ALLOWED[@]}"; do
    if [[ "$f" =~ $pat ]]; then
      ok=1
      break
    fi
  done
  if [[ $ok -eq 0 ]]; then
    VIOLATIONS+=("$f")
  fi
done

if [[ ${#VIOLATIONS[@]} -gt 0 ]]; then
  echo ""
  echo "Path guard FAILED for workstream '$AREA' (branch '$BRANCH')."
  echo "These files are outside the allowed paths for this branch:"
  for v in "${VIOLATIONS[@]}"; do
    echo "  - $v"
  done
  echo ""
  echo "Push only files that belong to this workstream, or use the correct branch"
  echo "(see docs/BRANCHING_STRATEGY.md § Workstream path allowlists)."
  exit 1
fi

echo "Path guard passed for '$BRANCH'."
