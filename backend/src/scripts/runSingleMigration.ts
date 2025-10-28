import { pool } from '../db/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../../db/migrations/003_add_address_id_to_orders.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Running migration 003_add_address_id_to_orders.sql...');
    await pool.query(sql);
    console.log('Migration completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
