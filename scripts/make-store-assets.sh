#!/usr/bin/env bash
# Generates App Store Connect / Google Play Console assets into ./store
#   screenshots (FR + EN) at the exact store sizes, app icons, Play feature graphic.
# Usage: npm run store
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=5199

rm -rf store && mkdir -p store

npx vite --port $PORT --strictPort > /dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
for _ in $(seq 1 30); do curl -sf "http://localhost:$PORT" > /dev/null && break; sleep 0.5; done

APP_URL="http://localhost:$PORT" node scripts/store-shots.mjs

node scripts/make-store-graphics.mjs
echo "Done → ./store"
