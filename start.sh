#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
PORT="${PORT:-8080}"
export PORT

docker compose up -d --build
echo "CSC3058 Architecture Notes running at http://localhost:${PORT}"
