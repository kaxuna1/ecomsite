import { pool } from '../db/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedTranslations() {
  try {
    console.log('Seeding static translations...');

    // Read the SQL seed file
    const sqlPath = path.join(__dirname, 'translationsSeed.sql');

    if (!fs.existsSync(sqlPath)) {
      console.error(`SQL seed file not found: ${sqlPath}`);
      console.log('Run "npm run export-translations" first to generate the seed file.');
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Remove comments and split by semicolon
    const statements = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} INSERT statements to execute`);

    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (const statement of statements) {
      try {
        const result = await pool.query(statement);

        // Check if it was an insert or update (based on ON CONFLICT)
        if (result.rowCount && result.rowCount > 0) {
          insertedCount++;
        } else {
          updatedCount++;
        }
      } catch (error: any) {
        errorCount++;
        console.error(`Error executing statement: ${error.message}`);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
      }
    }

    console.log('\nSeeding complete!');
    console.log(`  Inserted/Updated: ${insertedCount} translations`);
    console.log(`  Errors: ${errorCount}`);

    // Verify counts
    const countResult = await pool.query(`
      SELECT
        namespace,
        COUNT(*) as count,
        COUNT(DISTINCT translation_key) as unique_keys,
        COUNT(DISTINCT language_code) as languages
      FROM static_translations
      GROUP BY namespace
      ORDER BY namespace
    `);

    console.log('\nTranslation counts by namespace:');
    countResult.rows.forEach(row => {
      console.log(`  ${row.namespace}: ${row.count} entries (${row.unique_keys} keys × ${row.languages} languages)`);
    });

    const totalResult = await pool.query(`SELECT COUNT(*) as total FROM static_translations`);
    console.log(`\nTotal translations in database: ${totalResult.rows[0].total}`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedTranslations();
