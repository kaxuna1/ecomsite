import { pool } from '../db/client.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../../db/migrations/002_create_user_addresses.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: 002_create_user_addresses.sql');
    await pool.query(sql);
    console.log('Migration completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
