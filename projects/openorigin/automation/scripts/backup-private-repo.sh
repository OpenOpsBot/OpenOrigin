#!/bin/zsh
set -euo pipefail

WORKSPACE="/Users/ze/.openclaw/workspace"
LOG_DIR="$WORKSPACE/projects/openorigin/automation/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/backup-private-repo.log"
LOCK_ROOT="$WORKSPACE/.locks"
LOCK_DIR="$LOCK_ROOT/backup-private-repo.lock"
LOCK_PID_FILE="$LOCK_DIR/pid"
LOCK_TIME_FILE="$LOCK_DIR/started_at"
LOCK_TTL_SECONDS=$((6 * 60 * 60))
MAX_RETRIES=3
TEST_MODE="${BACKUP_TEST_MODE:-0}"

mkdir -p "$LOCK_ROOT"
exec >>"$LOG_FILE" 2>&1

log() {
  echo "[$(date '+%F %T')] $*"
}

cleanup_lock() {
  rm -f "$LOCK_PID_FILE" "$LOCK_TIME_FILE" 2>/dev/null || true
  rmdir "$LOCK_DIR" 2>/dev/null || true
}

acquire_lock() {
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    print -r -- "$$" > "$LOCK_PID_FILE"
    date +%s > "$LOCK_TIME_FILE"
    return 0
  fi

  local existing_pid=""
  local started_at="0"
  local now age

  [[ -f "$LOCK_PID_FILE" ]] && existing_pid="$(tr -dc '0-9' < "$LOCK_PID_FILE" 2>/dev/null || true)"
  [[ -f "$LOCK_TIME_FILE" ]] && started_at="$(tr -dc '0-9' < "$LOCK_TIME_FILE" 2>/dev/null || true)"
  [[ -z "$started_at" ]] && started_at="0"

  now=$(date +%s)
  age=$(( now - started_at ))

  if [[ -n "$existing_pid" ]] && kill -0 "$existing_pid" 2>/dev/null && (( age < LOCK_TTL_SECONDS )); then
    log "lock exists, active pid=$existing_pid age=${age}s, skipping"
    return 1
  fi

  log "stale lock detected, removing (pid=${existing_pid:-unknown} age=${age}s)"
  rm -rf "$LOCK_DIR"

  if mkdir "$LOCK_DIR" 2>/dev/null; then
    print -r -- "$$" > "$LOCK_PID_FILE"
    date +%s > "$LOCK_TIME_FILE"
    return 0
  fi

  log "lock exists, reacquire failed, skipping"
  return 1
}

log "start backup-private-repo"

if ! acquire_lock; then
  exit 0
fi
trap 'cleanup_lock' EXIT

cd "$WORKSPACE"

if [[ "$TEST_MODE" == "1" ]]; then
  log "test mode enabled, lock acquired successfully"
  exit 0
fi

if [[ -z "$(git status --porcelain 2>/dev/null)" ]]; then
  log "no changes, nothing to back up"
  exit 0
fi

git add -A
changed_lines=(${(@f)$(git status --short)})
changed_files=()
for line in "${changed_lines[@]}"; do
  changed_files+=("${line#?? }")
  (( ${#changed_files[@]} >= 20 )) && break
done
CHANGED_FILES="${(j:,:)changed_files}"
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
    log "push succeeded on attempt $attempt"
    exit 0
  fi
  log "push failed on attempt $attempt"
  sleep $((attempt * 10))
  attempt=$((attempt + 1))
done

log "ALERT: backup-private-repo failed after $MAX_RETRIES attempts"
exit 1
