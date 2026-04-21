#!/bin/zsh
set -euo pipefail

WORKSPACE="/Users/ze/.openclaw/workspace"
LOG_DIR="$WORKSPACE/projects/openorigin/automation/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/backup-private-repo.log"
LOCK_DIR="$WORKSPACE/.locks/backup-private-repo.lock"
MAX_RETRIES=3

exec >>"$LOG_FILE" 2>&1

echo "[$(date '+%F %T')] start backup-private-repo"

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "lock exists, skipping"
  exit 0
fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT

cd "$WORKSPACE"

if [[ -z "$(git status --porcelain 2>/dev/null)" ]]; then
  echo "no changes, nothing to back up"
  exit 0
fi

git add -A
CHANGED_FILES=$(git status --short | awk '{print $2}' | head -20 | tr '\n' ',' | sed 's/,$//')
COMMIT_MSG="chore(backup): workspace snapshot $(date '+%F %R')"
if [[ -n "$CHANGED_FILES" ]]; then
  COMMIT_MSG="$COMMIT_MSG | ${CHANGED_FILES}"
fi

if ! git diff --cached --quiet; then
  git commit -m "$COMMIT_MSG" || true
fi

attempt=1
while (( attempt <= MAX_RETRIES )); do
  if git push; then
    echo "push succeeded on attempt $attempt"
    exit 0
  fi
  echo "push failed on attempt $attempt"
  sleep $((attempt * 10))
  attempt=$((attempt + 1))
done

echo "ALERT: backup-private-repo failed after $MAX_RETRIES attempts"
exit 1
