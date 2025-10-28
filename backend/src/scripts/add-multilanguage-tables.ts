import { pool } from '../db/client';

async function addMultilanguageTables() {
  try {
    console.log('Creating multilanguage tables...');

    // Create languages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS languages (
        code VARCHAR(10) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        native_name VARCHAR(100) NOT NULL,
        is_enabled BOOLEAN DEFAULT true,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created languages table');

    // Insert default languages
    await pool.query(`
      INSERT INTO languages (code, name, native_name, is_enabled, is_default)
      VALUES
        ('en', 'English', 'English', true, true),
        ('ka', 'Georgian', 'ქართული', true, false)
      ON CONFLICT (code) DO NOTHING;
    `);
    console.log('✓ Inserted default languages (EN, KA)');

    // Create product_translations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_translations (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        language_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        short_description TEXT NOT NULL,
        description TEXT NOT NULL,
        highlights JSONB,
        usage TEXT,
        slug VARCHAR(255),
        meta_title VARCHAR(255),
        meta_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, language_code)
      );
    `);
    console.log('✓ Created product_translations table');

    // Create indexes for product_translations
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_product_translations_product_id
      ON product_translations(product_id);

      CREATE INDEX IF NOT EXISTS idx_product_translations_language_code
      ON product_translations(language_code);
    `);
    console.log('✓ Created indexes for product_translations');

    // Create cms_page_translations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cms_page_translations (
        id SERIAL PRIMARY KEY,
        page_id INTEGER NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
        language_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        meta_title VARCHAR(255),
        meta_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(page_id, language_code),
        UNIQUE(slug, language_code)
      );
    `);
    console.log('✓ Created cms_page_translations table');

    // Create indexes for cms_page_translations
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cms_page_translations_page_id
      ON cms_page_translations(page_id);

      CREATE INDEX IF NOT EXISTS idx_cms_page_translations_language_code
      ON cms_page_translations(language_code);

      CREATE INDEX IF NOT EXISTS idx_cms_page_translations_slug
      ON cms_page_translations(slug);
    `);
    console.log('✓ Created indexes for cms_page_translations');

    // Create cms_block_translations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cms_block_translations (
        id SERIAL PRIMARY KEY,
        block_id INTEGER NOT NULL REFERENCES cms_blocks(id) ON DELETE CASCADE,
        language_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
        content JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(block_id, language_code)
      );
    `);
    console.log('✓ Created cms_block_translations table');

    // Create indexes for cms_block_translations
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cms_block_translations_block_id
      ON cms_block_translations(block_id);

      CREATE INDEX IF NOT EXISTS idx_cms_block_translations_language_code
      ON cms_block_translations(language_code);
    `);
    console.log('✓ Created indexes for cms_block_translations');

    console.log('\n✅ Multilanguage tables migration completed successfully!');
    console.log('\nTables created:');
    console.log('  - languages (with EN and KA)');
    console.log('  - product_translations');
    console.log('  - cms_page_translations');
    console.log('  - cms_block_translations');

  } catch (error) {
    console.error('❌ Error creating multilanguage tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addMultilanguageTables();
