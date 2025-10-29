-- ===================================================================
-- ADD FOOTER SETTINGS TRANSLATIONS SUPPORT
-- ===================================================================
-- This migration creates a translation table for footer settings
-- to support multilingual content.
-- ===================================================================

CREATE TABLE IF NOT EXISTS footer_settings_translations (
  id SERIAL PRIMARY KEY,
  footer_settings_id INTEGER NOT NULL REFERENCES footer_settings(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,

  -- Brand section
  brand_name VARCHAR(255),
  brand_tagline TEXT,

  -- Footer columns (JSONB array)
  footer_columns JSONB,

  -- Contact info (JSONB object)
  contact_info JSONB,

  -- Newsletter section
  newsletter_title VARCHAR(255),
  newsletter_description TEXT,
  newsletter_placeholder VARCHAR(255),
  newsletter_button_text VARCHAR(100),

  -- Bottom section
  copyright_text TEXT,
  bottom_links JSONB,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(footer_settings_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_footer_translations_footer_id
  ON footer_settings_translations(footer_settings_id);

CREATE INDEX IF NOT EXISTS idx_footer_translations_language
  ON footer_settings_translations(language_code);

-- Add comments for documentation
COMMENT ON TABLE footer_settings_translations IS 'Stores translated versions of footer settings text content';
COMMENT ON COLUMN footer_settings_translations.footer_columns IS 'JSON array of {title, links: [{label, url, is_external}]}';
COMMENT ON COLUMN footer_settings_translations.contact_info IS 'JSON object with address: {label, street, city, country}';
COMMENT ON COLUMN footer_settings_translations.bottom_links IS 'JSON array of {label, url}';
