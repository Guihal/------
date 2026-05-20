#!/usr/bin/env bash
# /usr/projects/Диплом/.agent-state/check-state.sh
# State guard for diploma polish cron — checks if a task is already running
# and verifies git/GitHub state before allowing new work.

set -euo pipefail

STATE_DIR="/usr/projects/Диплом/.agent-state"
REPO="/usr/projects/Диплом"
CURRENT_TASK="$STATE_DIR/current-task.json"
QUEUE="$STATE_DIR/task-queue.json"
LOG="$STATE_DIR/run.log"

log() {
  echo "[$(date -Iseconds)] $1" >> "$LOG"
}

# 1. Check if task already running
if [ -f "$CURRENT_TASK" ]; then
  CURRENT=$(cat "$CURRENT_TASK" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('current') or 'null')" 2>/dev/null || echo "null")
  if [ "$CURRENT" != "null" ] && [ "$CURRENT" != "" ]; then
    log "SKIP: task already running: $CURRENT"
    echo '{"skip":true,"reason":"task_in_progress","current":'$CURRENT'}'
    exit 0
  fi
fi

# 2. Check git state — uncommitted changes?
cd "$REPO"
if ! git diff --quiet || ! git diff --cached --quiet; then
  log "WARN: uncommitted changes detected"
  # Auto-commit any lingering changes
  git add -A
  git commit -m "auto: checkpoint before new task ($(date +%H:%M))" || true
fi

# 3. Check GitHub state — push any unpushed commits
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
  AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
  if [ "$AHEAD" -gt 0 ]; then
    log "INFO: pushing $AHEAD commits to GitHub"
    git push origin "$BRANCH" || log "WARN: push failed"
  fi
fi

# 4. Find next pending task
NEXT=$(cat "$QUEUE" | python3 -c "
import sys, json
q = json.load(sys.stdin)
for t in q.get('queue', []):
  if t.get('status') == 'pending':
    print(json.dumps(t))
    break
" 2>/dev/null || echo "null")

if [ "$NEXT" = "null" ] || [ -z "$NEXT" ]; then
  log "SKIP: no pending tasks"
  echo '{"skip":true,"reason":"no_pending_tasks"}'
  exit 0
fi

# 5. Mark task as in-progress
echo "$NEXT" | python3 -c "
import sys, json
t = json.load(sys.stdin)
t['started_at'] = json.dumps(None)  # will be set by cron agent
print(json.dumps(t))
" > /dev/null

TASK_ID=$(echo "$NEXT" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

# Write current task
cat > "$CURRENT_TASK" <<EOF
{
  "current": $(echo "$NEXT"),
  "started_at": "$(date -Iseconds)"
}
EOF

log "START: task $TASK_ID"
echo '{"skip":false,"task":'$NEXT'}'
