#!/usr/bin/env bash
# Production smoke test: builds (if needed), starts prod on an ephemeral
# port, curls every route + API, kills the server. Exit non-zero on any
# failure. Usage: npm run smoke
set -euo pipefail

PORT="${SMOKE_PORT:-3299}"
BASE="http://localhost:${PORT}"

cd "$(dirname "$0")/.."

if [ ! -f .next/BUILD_ID ]; then
  echo "no .next build; running npm run build first"
  npm run build >/dev/null
fi

npm run start -- --port "$PORT" >/tmp/ace-smoke-run.log 2>&1 &
SERVER_PID=$!
# npm wraps next-server whose argv carries no port, so locate the listener
# by port via ss and kill that exact PID (no pattern matching at all).
kill_server() {
  kill "$SERVER_PID" 2>/dev/null || true
  local pid
  pid=$(ss -ltnp 2>/dev/null | grep ":${PORT} " | grep -o 'pid=[0-9]*' | head -n 1 | cut -d= -f2)
  if [ -n "${pid:-}" ]; then kill "$pid" 2>/dev/null || true; fi
}
trap 'kill_server' EXIT

fail=0
check() { # $1 description, $2 expected status, rest: curl args
  local desc="$1" want="$2"; shift 2
  local got
  got=$(curl -s -o /dev/null -w '%{http_code}' "$@") || got="curl-error"
  if [ "$got" = "$want" ]; then
    echo "ok   $desc -> $got"
  else
    echo "FAIL $desc -> $got (want $want)"
    fail=1
  fi
}

for i in $(seq 1 30); do
  curl -s -o /dev/null "http://localhost:${PORT}/" && break
  sleep 1
done

check "GET /" 200 "$BASE/"
check "GET /topic/quadratic-functions" 200 "$BASE/topic/quadratic-functions"
check "GET /topic/nope (404 page)" 404 "$BASE/topic/nope"
check "GET /graph" 200 "$BASE/graph"
check "GET /playground" 200 "$BASE/playground"
check "POST /api/render" 200 -X POST -H 'content-type: application/json' \
  -d '{"body":"# Hi $x^2$"}' "$BASE/api/render"
BIGBODY=$(mktemp)
trap 'rm -f "$BIGBODY"; kill_server' EXIT
{ printf '{"body":"'; head -c 200001 /dev/zero | tr '\0' 'x'; printf '"}'; } > "$BIGBODY"
check "POST /api/render oversized" 400 -X POST -H 'content-type: application/json' \
  -d @"$BIGBODY" "$BASE/api/render"
check "POST /api/harness/lesson (mock)" 200 -X POST -H 'content-type: application/json' \
  -d '{"prompt":"teach me fractions"}' "$BASE/api/harness/lesson"
check "POST /api/harness/lesson empty" 400 -X POST -H 'content-type: application/json' \
  -d '{"prompt":""}' "$BASE/api/harness/lesson"

# h1 + slot markers on the lesson page
BODY=$(curl -s "$BASE/topic/quadratic-functions")
H1=$(printf '%s' "$BODY" | grep -o '<h1' | wc -l)
[ "$H1" -eq 1 ] && echo "ok   single <h1> on topic page" || { echo "FAIL h1 count=$H1"; fail=1; }
printf '%s' "$BODY" | grep -q 'data-block="mermaid"' && echo "ok   mermaid slot present" || { echo "FAIL no mermaid slot"; fail=1; }
printf '%s' "$BODY" | grep -q 'katex.min.css' && echo "ok   katex css linked" || { echo "FAIL no katex css"; fail=1; }

kill_server
trap - EXIT
# Next shuts down gracefully; wait for the port to actually close.
for i in $(seq 1 10); do
  curl -s -o /dev/null -m 2 "$BASE/" 2>/dev/null || break
  sleep 1
done
if curl -s -o /dev/null -m 3 "$BASE/" 2>/dev/null; then
  echo "FAIL server still up"; fail=1
else
  echo "ok   server stopped"
fi

exit "$fail"
