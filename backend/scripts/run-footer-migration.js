// Script to run the footer settings migration
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: 'localhost',
  database: 'luxia',
  user: 'postgres',
  password: 'postgres',
  port: 5432
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('Running footer_settings migration...');

    const migrationPath = path.join(__dirname, '../db/migrations/005_create_footer_settings.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('The footer_settings table has been created with default data.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n🎉 You can now use the footer editor in the admin panel!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to run migration');
    process.exit(1);
  });
