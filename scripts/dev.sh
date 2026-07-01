#!/usr/bin/env sh
# Kill anything on our dev ports, then start backend + mobile + admin.
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_PORT=8080
MOBILE_PORT=3000
ADMIN_PORT=3001
LOG_DIR="$ROOT_DIR/.dev-logs"
mkdir -p "$LOG_DIR"

kill_port() {
	port="$1"
	pids=$(lsof -ti "tcp:$port" 2>/dev/null || true)
	if [ -n "$pids" ]; then
		echo "killing pids on :$port -> $pids"
		echo "$pids" | xargs -r kill -9
	fi
}

for port in "$BACKEND_PORT" "$MOBILE_PORT" "$ADMIN_PORT"; do
	kill_port "$port"
done

echo "starting backend on :$BACKEND_PORT"
(cd "$ROOT_DIR/backend" && go run ./cmd/server) >"$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

echo "starting mobile on :$MOBILE_PORT"
(cd "$ROOT_DIR/apps/mobile" && npx nuxi dev --host 127.0.0.1 --port "$MOBILE_PORT") >"$LOG_DIR/mobile.log" 2>&1 &
MOBILE_PID=$!

echo "starting admin on :$ADMIN_PORT"
(cd "$ROOT_DIR/apps/admin" && npx nuxi dev --host 127.0.0.1 --port "$ADMIN_PORT") >"$LOG_DIR/admin.log" 2>&1 &
ADMIN_PID=$!

echo "backend pid=$BACKEND_PID mobile pid=$MOBILE_PID admin pid=$ADMIN_PID"
echo "logs: $LOG_DIR/{backend,mobile,admin}.log"

trap 'kill "$BACKEND_PID" "$MOBILE_PID" "$ADMIN_PID" 2>/dev/null' INT TERM
wait
