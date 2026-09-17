#!/usr/bin/env bash
#
# Build the app, serve it, walk the seller funnel in a real browser, stop.
# See scripts/funnel-e2e.mjs for what is asserted.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PORT="${PORT:-3100}"

cleanup() {
  if [ -n "${SERVER_PID:-}" ]; then kill "$SERVER_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT

echo "==> Building"
npx next build > /tmp/hsh-e2e-build.log 2>&1 || { tail -30 /tmp/hsh-e2e-build.log; exit 1; }

echo "==> Serving on :$PORT"
PORT="$PORT" npx next start > /tmp/hsh-e2e-server.log 2>&1 &
SERVER_PID=$!

# Wait for the server rather than sleeping a fixed amount.
for _ in $(seq 1 40); do
  if curl -sf -o /dev/null "http://localhost:$PORT/"; then break; fi
  sleep 0.5
done

echo "==> Walking the funnel"
E2E_BASE_URL="http://localhost:$PORT" node scripts/funnel-e2e.mjs
