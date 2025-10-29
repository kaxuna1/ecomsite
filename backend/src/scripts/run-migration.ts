import { pool } from '../db/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: npm run migrate:run <migration-file>');
  console.error('Example: npm run migrate:run 001_add_seo_fields.sql');
  process.exit(1);
}

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../migrations', migrationFile);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log(`Running migration: ${migrationFile}...`);
    await pool.query(sql);
    console.log(`✓ Migration ${migrationFile} completed successfully!`);

    process.exit(0);
  } catch (error) {
    console.error(`✗ Migration failed:`, error);
    process.exit(1);
  }
}

runMigration();
