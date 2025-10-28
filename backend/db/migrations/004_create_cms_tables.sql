-- CMS Tables for Landing Page Management
-- Migration: 004_create_cms_tables

-- 1. Pages table (for future multi-page support)
CREATE TABLE IF NOT EXISTS cms_pages (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  meta_description TEXT,
  meta_keywords TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  created_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Content blocks table (core of the CMS)
CREATE TABLE IF NOT EXISTS cms_blocks (
  id SERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  block_type VARCHAR(50) NOT NULL,
  block_key VARCHAR(100) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  content JSONB NOT NULL,
  settings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_id, block_key)
);

-- 3. Media library table (for image management)
CREATE TABLE IF NOT EXISTS cms_media (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  caption TEXT,
  file_path TEXT NOT NULL,
  uploaded_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Block version history (for content versioning)
CREATE TABLE IF NOT EXISTS cms_block_versions (
  id SERIAL PRIMARY KEY,
  block_id INTEGER NOT NULL REFERENCES cms_blocks(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  settings JSONB,
  version_number INTEGER NOT NULL,
  created_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cms_blocks_page_id ON cms_blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_cms_blocks_display_order ON cms_blocks(page_id, display_order);
CREATE INDEX IF NOT EXISTS idx_cms_blocks_type ON cms_blocks(block_type);
CREATE INDEX IF NOT EXISTS idx_cms_blocks_enabled ON cms_blocks(is_enabled);
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_media_uploaded_by ON cms_media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_cms_block_versions_block_id ON cms_block_versions(block_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cms_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cms_pages_updated_at
  BEFORE UPDATE ON cms_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at_column();

CREATE TRIGGER update_cms_blocks_updated_at
  BEFORE UPDATE ON cms_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at_column();

-- Insert default homepage
INSERT INTO cms_pages (slug, title, meta_description, is_published)
VALUES ('home', 'Luxia  Premium Scalp Care Products', 'Discover luxury scalp care with scientifically-backed formulas. Transform your hair health with our premium products.', true)
ON CONFLICT (slug) DO NOTHING;
