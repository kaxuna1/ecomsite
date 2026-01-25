#!/bin/bash
set -euo pipefail

MIGRATION_MARKER="/var/run/luxia/migrations.done"

echo "Waiting for migrations to complete..."
until [ -f "$MIGRATION_MARKER" ]; do
  sleep 2
done

echo "Migrations complete. Starting backend..."
exec node /app/backend/dist/server.js
