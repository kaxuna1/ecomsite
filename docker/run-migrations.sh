#!/bin/bash
set -e

echo "Running database migrations..."

# Wait for PostgreSQL to be fully ready
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
    echo "Waiting for PostgreSQL to be ready..."
    sleep 2
done

echo "PostgreSQL is ready. Running migrations..."

# Change to backend directory
cd /app/backend

# Run main migrations
echo "Running main database migrations..."
npx tsx src/scripts/migrate.ts

# Run admin users setup (creates table and initial admin)
echo "Setting up admin users..."
npx tsx src/scripts/create-admin-users.ts

echo "All migrations completed successfully!"
