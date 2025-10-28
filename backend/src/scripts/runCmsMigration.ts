// Script to run CMS migration 004
import { pool } from '../db/client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runCmsMigration() {
  try {
    console.log('Running CMS migration 004...');

    const migrationPath = path.resolve(__dirname, '../../db/migrations/004_create_cms_tables.sql');
    const sql = await fs.readFile(migrationPath, 'utf-8');

    await pool.query(sql);

    console.log('✓ CMS migration 004 completed successfully');
    console.log('✓ Created tables: cms_pages, cms_blocks, cms_media, cms_block_versions');
    console.log('✓ Created indexes and triggers');
    console.log('✓ Inserted default homepage');

    process.exit(0);
  } catch (error) {
    console.error('Error running CMS migration:', error);
    process.exit(1);
  }
}

runCmsMigration();
