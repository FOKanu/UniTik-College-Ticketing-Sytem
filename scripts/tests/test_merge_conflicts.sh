#!/usr/bin/env bash
# Automated dry-run merge conflict and path overlap detector for workstream branches
set -euo pipefail

FEATURE_BRANCH="${1:-origin/feature/frontend-mdh-ui}"
TARGET_BRANCH="${2:-debugging}"

echo "=== Checking merge safety: $FEATURE_BRANCH into $TARGET_BRANCH ==="

BASE_COMMIT="$(git merge-base "$TARGET_BRANCH" "$FEATURE_BRANCH")"
echo "Merge base commit: $BASE_COMMIT"

MERGE_OUTPUT="$(git merge-tree "$BASE_COMMIT" "$TARGET_BRANCH" "$FEATURE_BRANCH")"

if echo "$MERGE_OUTPUT" | grep -E '^(<<<<<<<|=======|>>>>>>>)' >/dev/null; then
  echo "FAIL: Merge conflict markers detected between $FEATURE_BRANCH and $TARGET_BRANCH"
  exit 1
else
  echo "PASS: Zero text merge conflict markers found."
fi

echo "=== Overlapping Files Modified in Both Branches ==="
TMP_FEATURE="$(mktemp)"
TMP_TARGET="$(mktemp)"

git diff --name-only "$BASE_COMMIT".."$FEATURE_BRANCH" | sort > "$TMP_FEATURE"
git diff --name-only "$BASE_COMMIT".."$TARGET_BRANCH" | sort > "$TMP_TARGET"

OVERLAPS="$(comm -12 "$TMP_FEATURE" "$TMP_TARGET")"
if [[ -n "$OVERLAPS" ]]; then
  echo "Notice: The following files were modified in both $FEATURE_BRANCH and $TARGET_BRANCH:"
  echo "$OVERLAPS"
else
  echo "No overlapping modified files found."
fi

rm -f "$TMP_FEATURE" "$TMP_TARGET"

echo "=== Merge Safety Check Passed ==="
