#!/usr/bin/env bash
# Local dev spin-up — starts FastAPI backend + Vite frontend in parallel.
#
# Prerequisites:
#   Redis running on localhost:6379
#     brew services start redis          (macOS)
#     docker run -d -p 6379:6379 redis:7-alpine  (Docker)
#
#   Python deps installed:  pip install -r requirements.txt
#   Node deps installed:    cd frontend && npm install
#
# Usage:
#   chmod +x dev.sh && ./dev.sh
#   Open http://localhost:5174?room=zen-garden-1 in two tabs to test multiplayer.

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "▶ Starting FastAPI on :8000"
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

echo "▶ Starting Vite on :5174"
cd "$ROOT/frontend" && npm run dev -- --port 5174 &
FRONTEND_PID=$!

echo ""
echo "  Backend : http://localhost:8000"
echo "  Frontend: http://localhost:5174?room=zen-garden-1"
echo ""
echo "  Open two browser tabs at the frontend URL to test multiplayer."
echo "  Press Ctrl+C to stop both processes."
echo ""

trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
