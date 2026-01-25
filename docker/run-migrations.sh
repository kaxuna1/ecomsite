#!/bin/bash
set -euo pipefail

MIGRATION_MARKER="/var/run/luxia/migrations.done"
rm -f "$MIGRATION_MARKER"

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
node dist/scripts/migrate.js

# Run admin users setup (creates table and initial admin)
echo "Setting up admin users..."
node dist/scripts/create-admin-users.js

# Seed initial data (only when tables are empty)
if [ "${RUN_SEEDS:-true}" = "true" ]; then
    echo "Checking seed data state..."

    get_count() {
        local query="$1"
        PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -A -c "$query" 2>/dev/null | tr -d '[:space:]'
    }

    product_count=$(get_count "SELECT COUNT(*) FROM products")
    if [ "${product_count:-0}" -eq 0 ]; then
        echo "Seeding sample products..."
        node dist/scripts/seed.js
    else
        echo "Products already exist (${product_count}), skipping product seed"
    fi

    cms_count=$(get_count "SELECT COUNT(*) FROM cms_blocks WHERE page_id = (SELECT id FROM cms_pages WHERE slug = 'home')")
    if [ "${cms_count:-0}" -eq 0 ]; then
        echo "Seeding CMS homepage content..."
        node dist/scripts/seedCmsContent.js
    else
        echo "CMS blocks already exist (${cms_count}), skipping CMS seed"
    fi

    translations_count=$(get_count "SELECT COUNT(*) FROM static_translations")
    if [ "${translations_count:-0}" -eq 0 ]; then
        echo "Seeding static translations..."
        node dist/scripts/seedStaticTranslations.js
    else
        echo "Static translations already exist (${translations_count}), skipping translation seed"
    fi
else
    echo "RUN_SEEDS is false - skipping seed scripts"
fi

touch "$MIGRATION_MARKER"

echo "All migrations completed successfully!"
