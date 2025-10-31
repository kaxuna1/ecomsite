import { pool } from '../db/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportTranslations() {
  try {
    console.log('Exporting translations from database...');

    const result = await pool.query(`
      SELECT translation_key, language_code, translation_value, namespace
      FROM static_translations
      ORDER BY namespace, translation_key, language_code
    `);

    console.log(`Found ${result.rows.length} translation entries`);

    // Group by namespace
    const groupedByNamespace: Record<string, any[]> = {};

    result.rows.forEach(row => {
      const namespace = row.namespace || 'common';
      if (!groupedByNamespace[namespace]) {
        groupedByNamespace[namespace] = [];
      }
      groupedByNamespace[namespace].push({
        translationKey: row.translation_key,
        languageCode: row.language_code,
        translationValue: row.translation_value,
        namespace
      });
    });

    // Write to JSON file
    const outputPath = path.join(__dirname, 'translationsSeed.json');
    fs.writeFileSync(outputPath, JSON.stringify(groupedByNamespace, null, 2));

    console.log(`Translations exported to: ${outputPath}`);
    console.log('\nSummary by namespace:');
    Object.keys(groupedByNamespace).forEach(namespace => {
      console.log(`  ${namespace}: ${groupedByNamespace[namespace].length} entries`);
    });

    // Also create a SQL INSERT file
    const sqlPath = path.join(__dirname, 'translationsSeed.sql');
    let sqlContent = '-- Static translations seed data\n';
    sqlContent += '-- Generated on: ' + new Date().toISOString() + '\n\n';

    Object.keys(groupedByNamespace).sort().forEach(namespace => {
      sqlContent += `\n-- ${namespace.toUpperCase()} namespace\n`;
      groupedByNamespace[namespace].forEach(t => {
        const key = t.translationKey.replace(/'/g, "''");
        const value = t.translationValue.replace(/'/g, "''");
        const ns = t.namespace.replace(/'/g, "''");
        const lang = t.languageCode;

        sqlContent += `INSERT INTO static_translations (translation_key, language_code, translation_value, namespace) VALUES ('${key}', '${lang}', '${value}', '${ns}') ON CONFLICT (translation_key, language_code, namespace) DO UPDATE SET translation_value = EXCLUDED.translation_value;\n`;
      });
    });

    fs.writeFileSync(sqlPath, sqlContent);
    console.log(`SQL seed file created: ${sqlPath}`);

    process.exit(0);
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

exportTranslations();
