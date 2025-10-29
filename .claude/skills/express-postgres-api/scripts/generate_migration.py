#!/usr/bin/env python3
"""
Generate a timestamped database migration file for PostgreSQL.

Usage:
    python generate_migration.py <migration_name> [--output <directory>]

Example:
    python generate_migration.py add_status_to_users
    python generate_migration.py create_products_table
"""

import os
import sys
import argparse
from datetime import datetime
from pathlib import Path


def to_snake_case(text):
    """Convert text to snake_case"""
    import re
    text = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', text)
    text = re.sub('([a-z0-9])([A-Z])', r'\1_\2', text).lower()
    return text.replace('-', '_').replace(' ', '_')


def generate_migration(name, output_dir):
    """Generate a timestamped migration file"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    snake_name = to_snake_case(name)
    filename = f"{timestamp}_{snake_name}.sql"

    content = f"""-- Migration: {snake_name}
-- Created: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

-- Add your SQL migration here
-- Example:
-- CREATE TABLE example (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Indexes
-- CREATE INDEX idx_example_name ON example(name);

-- Rollback (optional, add your rollback SQL in a comment):
-- DROP TABLE IF EXISTS example;
"""

    file_path = output_dir / filename
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content)

    print(f"✅ Created migration: {file_path}")
    print(f"\n📝 Next steps:")
    print(f"1. Edit {filename} and add your SQL")
    print(f"2. Run: npm run migrate:up")
    print(f"3. To rollback: npm run migrate:down")


def main():
    parser = argparse.ArgumentParser(description='Generate PostgreSQL migration file')
    parser.add_argument('name', help='Migration name (e.g., add_status_to_users)')
    parser.add_argument('--output', default='migrations', help='Output directory (defaults to migrations/)')

    args = parser.parse_args()

    output_dir = Path(args.output)

    try:
        generate_migration(args.name, output_dir)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
