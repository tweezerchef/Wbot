#!/usr/bin/env bash

# Install all dependencies for the monorepo:
# - JavaScript/TypeScript (pnpm workspace)
# - Python (uv in apps/ai)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AI_DIR="${ROOT_DIR}/apps/ai"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: '$1' is required but not found in PATH." >&2
    exit 1
  fi
}

require_cmd pnpm
require_cmd uv

echo "==> Installing JS/TS dependencies with pnpm (workspace root)..."
cd "${ROOT_DIR}"
pnpm install --frozen-lockfile

echo "==> Installing Python dependencies with uv (apps/ai)..."
cd "${AI_DIR}"
uv sync

echo "✅ All dependencies installed."
