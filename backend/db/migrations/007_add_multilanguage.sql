-- ===================================================================
-- MULTILANGUAGE SUPPORT MIGRATION
-- ===================================================================
-- This migration adds full multilanguage support to the platform:
-- - Languages configuration table
-- - Product translations
-- - CMS page translations
-- - CMS block translations
-- - User language preferences
-- ===================================================================

-- Create languages table
CREATE TABLE IF NOT EXISTS languages (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  native_name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ensure only one default language
CREATE UNIQUE INDEX IF NOT EXISTS idx_languages_default ON languages(is_default) WHERE is_default = true;

-- Insert initial languages (English and Georgian)
INSERT INTO languages (code, name, native_name, is_default, display_order)
VALUES
  ('en', 'English', 'English', true, 1),
  ('ka', 'Georgian', 'ქართული', false, 2)
ON CONFLICT (code) DO NOTHING;

-- ===================================================================
-- PRODUCT TRANSLATIONS
-- ===================================================================

CREATE TABLE IF NOT EXISTS product_translations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES languages(code),
  name VARCHAR(255) NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  highlights JSONB,
  usage TEXT,
  meta_title VARCHAR(255),
  meta_description TEXT,
  slug VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_product_translations_product ON product_translations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_translations_lang ON product_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_product_translations_slug ON product_translations(language_code, slug);

-- ===================================================================
-- CMS PAGE TRANSLATIONS
-- ===================================================================

CREATE TABLE IF NOT EXISTS cms_page_translations (
  id SERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES languages(code),
  title VARCHAR(255) NOT NULL,
  meta_description TEXT,
  meta_keywords TEXT,
  slug VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(page_id, language_code),
  UNIQUE(language_code, slug)
);

CREATE INDEX IF NOT EXISTS idx_cms_page_translations_page ON cms_page_translations(page_id);
CREATE INDEX IF NOT EXISTS idx_cms_page_translations_lang ON cms_page_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_cms_page_translations_slug ON cms_page_translations(language_code, slug);

-- ===================================================================
-- CMS BLOCK TRANSLATIONS
-- ===================================================================

CREATE TABLE IF NOT EXISTS cms_block_translations (
  id SERIAL PRIMARY KEY,
  block_id INTEGER NOT NULL REFERENCES cms_blocks(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES languages(code),
  content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(block_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_cms_block_translations_block ON cms_block_translations(block_id);
CREATE INDEX IF NOT EXISTS idx_cms_block_translations_lang ON cms_block_translations(language_code);

-- ===================================================================
-- USER LANGUAGE PREFERENCES
-- ===================================================================

-- Add preferred_language column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE users ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en';
    ALTER TABLE users ADD CONSTRAINT fk_users_language
      FOREIGN KEY (preferred_language) REFERENCES languages(code);
  END IF;
END $$;

-- ===================================================================
-- DATA MIGRATION: Move existing content to English translations
-- ===================================================================

-- Migrate existing products to English translations
INSERT INTO product_translations (
  product_id, language_code, name, short_description, description,
  highlights, usage, slug, meta_title, meta_description
)
SELECT
  id,
  'en' as language_code,
  name,
  short_description,
  description,
  highlights,
  usage,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) as slug,
  name as meta_title,
  short_description as meta_description
FROM products
WHERE NOT EXISTS (
  SELECT 1 FROM product_translations pt
  WHERE pt.product_id = products.id AND pt.language_code = 'en'
);

-- Migrate existing CMS pages to English translations
INSERT INTO cms_page_translations (
  page_id, language_code, title, meta_description, meta_keywords, slug
)
SELECT
  id,
  'en' as language_code,
  title,
  meta_description,
  meta_keywords,
  slug
FROM cms_pages
WHERE NOT EXISTS (
  SELECT 1 FROM cms_page_translations cpt
  WHERE cpt.page_id = cms_pages.id AND cpt.language_code = 'en'
);

-- Migrate existing CMS blocks to English translations
INSERT INTO cms_block_translations (
  block_id, language_code, content
)
SELECT
  id,
  'en' as language_code,
  content
FROM cms_blocks
WHERE NOT EXISTS (
  SELECT 1 FROM cms_block_translations cbt
  WHERE cbt.block_id = cms_blocks.id AND cbt.language_code = 'en'
);

-- ===================================================================
-- MIGRATION COMPLETE
-- ===================================================================
