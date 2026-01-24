import { pool } from '../db/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrations = `
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  image_url TEXT NOT NULL,
  inventory INTEGER NOT NULL DEFAULT 0,
  categories JSONB NOT NULL,
  highlights JSONB,
  usage TEXT,
  is_new BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  sales_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_notes TEXT,
  customer_address TEXT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Multilanguage support tables
CREATE TABLE IF NOT EXISTS languages (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  native_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one default language
CREATE UNIQUE INDEX IF NOT EXISTS idx_languages_default ON languages(is_default) WHERE is_default = true;

INSERT INTO languages (code, name, native_name, is_enabled, is_default, display_order)
VALUES
  ('en', 'English', 'English', TRUE, TRUE, 1),
  ('ka', 'Georgian', 'ქართული', TRUE, FALSE, 2)
ON CONFLICT (code) DO NOTHING;

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

CREATE INDEX IF NOT EXISTS idx_product_translations_product_id ON product_translations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_translations_language_code ON product_translations(language_code);

-- Admin users table (required for CMS tables)
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- CMS Pages table
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

CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);

-- CMS Blocks table
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

CREATE INDEX IF NOT EXISTS idx_cms_blocks_page_id ON cms_blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_cms_blocks_display_order ON cms_blocks(page_id, display_order);
CREATE INDEX IF NOT EXISTS idx_cms_blocks_type ON cms_blocks(block_type);

-- CMS Block Versions table (for content versioning)
CREATE TABLE IF NOT EXISTS cms_block_versions (
  id SERIAL PRIMARY KEY,
  block_id INTEGER NOT NULL REFERENCES cms_blocks(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  settings JSONB,
  version_number INTEGER NOT NULL,
  created_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cms_block_versions_block_id ON cms_block_versions(block_id);

-- Add unique constraint for block versions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_block_version'
  ) THEN
    ALTER TABLE cms_block_versions
    ADD CONSTRAINT unique_block_version UNIQUE (block_id, version_number);
  END IF;
END $$;

-- Add check constraint for positive version numbers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'positive_version'
  ) THEN
    ALTER TABLE cms_block_versions
    ADD CONSTRAINT positive_version CHECK (version_number >= 1);
  END IF;
END $$;

-- CMS Media table (for image management)
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
  url VARCHAR(500),
  uploaded_by INTEGER REFERENCES admin_users(id),
  admin_user_id INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cms_media_uploaded_by ON cms_media(uploaded_by);

-- Users table (for customers)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- User addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) DEFAULT 'USA',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_is_default ON user_addresses(user_id, is_default);

-- Favorites (wishlist) table
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);

-- Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2),
  max_discount_amount DECIMAL(10, 2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_user_limit INTEGER,
  valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_dates ON promo_codes(valid_from, valid_until);

-- Promo code usage tracking table
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id SERIAL PRIMARY KEY,
  promo_code_id INTEGER NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  discount_applied DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promo_code_usage_promo_id ON promo_code_usage(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_user_id ON promo_code_usage(user_id);

-- Add user_id and promo_code columns to orders table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_id') THEN
    ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'address_id') THEN
    ALTER TABLE orders ADD COLUMN address_id INTEGER REFERENCES user_addresses(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'promo_code_id') THEN
    ALTER TABLE orders ADD COLUMN promo_code_id INTEGER REFERENCES promo_codes(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
    ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_address_id ON orders(address_id);
CREATE INDEX IF NOT EXISTS idx_orders_promo_code_id ON orders(promo_code_id);

-- Insert sample promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_amount, valid_from, valid_until, is_active)
VALUES
  ('WELCOME20', 'Welcome discount for new customers', 'PERCENTAGE', 20, 50, NOW(), NOW() + INTERVAL '90 days', true),
  ('SAVE10', 'Save $10 on orders over $30', 'FIXED_AMOUNT', 10, 30, NOW(), NOW() + INTERVAL '90 days', true),
  ('FREESHIP', 'Free shipping on all orders', 'FREE_SHIPPING', 0, 25, NOW(), NOW() + INTERVAL '90 days', true)
ON CONFLICT (code) DO NOTHING;

-- Insert default homepage
INSERT INTO cms_pages (slug, title, meta_description, is_published)
VALUES ('home', 'Luxia Premium Scalp Care Products', 'Discover luxury scalp care with scientifically-backed formulas.', true)
ON CONFLICT (slug) DO NOTHING;

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

CREATE INDEX IF NOT EXISTS idx_cms_page_translations_page_id ON cms_page_translations(page_id);
CREATE INDEX IF NOT EXISTS idx_cms_page_translations_language_code ON cms_page_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_cms_page_translations_slug ON cms_page_translations(slug);

CREATE TABLE IF NOT EXISTS cms_block_translations (
  id SERIAL PRIMARY KEY,
  block_id INTEGER NOT NULL REFERENCES cms_blocks(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(block_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_cms_block_translations_block_id ON cms_block_translations(block_id);
CREATE INDEX IF NOT EXISTS idx_cms_block_translations_language_code ON cms_block_translations(language_code);

-- Navigation Menu System
CREATE TABLE IF NOT EXISTS menu_locations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO menu_locations (code, name, description)
VALUES
  ('header', 'Header Menu', 'Main navigation menu in the header'),
  ('footer', 'Footer Menu', 'Links in the footer section'),
  ('mobile', 'Mobile Menu', 'Mobile-specific navigation menu')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES menu_locations(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  link_type VARCHAR(20) NOT NULL CHECK (link_type IN ('internal', 'external', 'cms_page', 'none')),
  link_url VARCHAR(500),
  cms_page_id INTEGER REFERENCES cms_pages(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN DEFAULT TRUE,
  open_in_new_tab BOOLEAN DEFAULT FALSE,
  css_class VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_link_type_url CHECK (
    (link_type = 'internal' AND link_url IS NOT NULL) OR
    (link_type = 'external' AND link_url IS NOT NULL) OR
    (link_type = 'cms_page' AND cms_page_id IS NOT NULL) OR
    (link_type = 'none')
  )
);

CREATE TABLE IF NOT EXISTS menu_item_translations (
  id SERIAL PRIMARY KEY,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(menu_item_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_menu_items_location_id ON menu_items(location_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_parent_id ON menu_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_display_order ON menu_items(display_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_location_parent ON menu_items(location_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_translations_menu_item_id ON menu_item_translations(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_translations_language_code ON menu_item_translations(language_code);

-- Function to prevent circular menu item references
CREATE OR REPLACE FUNCTION check_menu_item_circular_reference()
RETURNS TRIGGER AS $$
DECLARE
  current_parent_id INTEGER;
  depth INTEGER := 0;
  max_depth INTEGER := 10;
BEGIN
  current_parent_id := NEW.parent_id;

  WHILE current_parent_id IS NOT NULL AND depth < max_depth LOOP
    IF current_parent_id = NEW.id THEN
      RAISE EXCEPTION 'Circular reference detected in menu items';
    END IF;

    SELECT parent_id INTO current_parent_id
    FROM menu_items
    WHERE id = current_parent_id;

    depth := depth + 1;
  END LOOP;

  IF depth >= max_depth THEN
    RAISE EXCEPTION 'Menu nesting depth exceeds maximum allowed (%))', max_depth;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_circular_menu_reference ON menu_items;

CREATE TRIGGER prevent_circular_menu_reference
BEFORE INSERT OR UPDATE ON menu_items
FOR EACH ROW
EXECUTE FUNCTION check_menu_item_circular_reference();

-- Site Settings
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default site settings
INSERT INTO site_settings (setting_key, setting_value)
VALUES
  ('logo_type', 'text'),
  ('logo_text', 'LUXIA'),
  ('logo_image_url', NULL),
  ('ai_provider', 'openai'),
  ('openai_model', 'gpt-4o'),
  ('anthropic_model', 'claude-haiku-4-5-20251001'),
  ('gemini_model', 'gemini-3-flash-preview')
ON CONFLICT (setting_key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

-- Footer Settings (main table)
CREATE TABLE IF NOT EXISTS footer_settings (
  id SERIAL PRIMARY KEY,
  brand_name VARCHAR(255) NOT NULL DEFAULT 'LUXIA',
  brand_tagline TEXT,
  brand_logo_url VARCHAR(500),
  footer_columns JSONB DEFAULT '[]'::jsonb,
  contact_info JSONB DEFAULT '{}'::jsonb,
  social_links JSONB DEFAULT '[]'::jsonb,
  newsletter_enabled BOOLEAN DEFAULT true,
  newsletter_title VARCHAR(255) DEFAULT 'Stay Connected',
  newsletter_description TEXT DEFAULT 'Subscribe to receive exclusive offers and updates',
  newsletter_placeholder VARCHAR(255) DEFAULT 'Enter your email',
  newsletter_button_text VARCHAR(100) DEFAULT 'Subscribe',
  copyright_text TEXT,
  bottom_links JSONB DEFAULT '[]'::jsonb,
  background_color VARCHAR(20) DEFAULT '#1a1d24',
  text_color VARCHAR(20) DEFAULT '#e8c7c8',
  accent_color VARCHAR(20) DEFAULT '#8bba9c',
  layout_type VARCHAR(50) DEFAULT 'multi-column',
  columns_count INTEGER DEFAULT 3,
  show_dividers BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO footer_settings (brand_name, brand_tagline, copyright_text)
VALUES ('LUXIA', 'Luxury scalp care crafted with precision', 'Crafted with care')
ON CONFLICT DO NOTHING;

-- Footer Settings Translations
CREATE TABLE IF NOT EXISTS footer_settings_translations (
  id SERIAL PRIMARY KEY,
  footer_settings_id INTEGER NOT NULL REFERENCES footer_settings(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  brand_name VARCHAR(255),
  brand_tagline TEXT,
  footer_columns JSONB,
  contact_info JSONB,
  newsletter_title VARCHAR(255),
  newsletter_description TEXT,
  newsletter_placeholder VARCHAR(255),
  newsletter_button_text VARCHAR(100),
  copyright_text TEXT,
  bottom_links JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(footer_settings_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_footer_translations_footer_id ON footer_settings_translations(footer_settings_id);
CREATE INDEX IF NOT EXISTS idx_footer_translations_language ON footer_settings_translations(language_code);

-- ============================================================================
-- ADMIN USERS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- ============================================================================
-- API KEYS MANAGEMENT SYSTEM
-- ============================================================================

-- Stores encrypted API keys and secrets for third-party service integrations
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(255) NOT NULL UNIQUE,
  key_value TEXT NOT NULL, -- Encrypted value
  category VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_name ON api_keys(key_name);
CREATE INDEX IF NOT EXISTS idx_api_keys_category ON api_keys(category);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- Trigger to update updated_at timestamp for api_keys
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_api_keys_updated_at ON api_keys;

CREATE TRIGGER trigger_update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();

-- ============================================================================
-- API KEYS AUDIT LOG
-- ============================================================================

-- Track all access and modifications to API keys for security auditing
CREATE TABLE IF NOT EXISTS api_keys_audit_log (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'deactivated', 'accessed', 'decrypted'
  admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_user_email VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  old_value TEXT, -- For updates, store masked old value
  new_value TEXT, -- For updates, store masked new value
  metadata JSONB, -- Additional context (e.g., which fields changed)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_audit_key_name ON api_keys_audit_log(key_name);
CREATE INDEX IF NOT EXISTS idx_api_keys_audit_action ON api_keys_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_api_keys_audit_admin_user ON api_keys_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_audit_created_at ON api_keys_audit_log(created_at DESC);

-- ============================================================================
-- MEDIA MANAGEMENT SYSTEM
-- ============================================================================

-- Enhance cms_media table with new columns for media management
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS category_id INTEGER;

-- Product-Media junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS product_media (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL REFERENCES cms_media(id) ON DELETE RESTRICT,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, media_id)
);

CREATE INDEX IF NOT EXISTS idx_product_media_product ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_media ON product_media(media_id);
CREATE INDEX IF NOT EXISTS idx_product_media_featured ON product_media(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_media_order ON product_media(product_id, display_order);

-- Media categories for organizing media files
CREATE TABLE IF NOT EXISTS media_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  parent_id INTEGER REFERENCES media_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_categories_parent ON media_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_categories_slug ON media_categories(slug);

-- Insert default media categories
INSERT INTO media_categories (name, slug)
VALUES
  ('Products', 'products'),
  ('Banners', 'banners'),
  ('Logos', 'logos'),
  ('General', 'general')
ON CONFLICT (slug) DO NOTHING;

-- Media tags for flexible categorization
CREATE TABLE IF NOT EXISTS media_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_tags_slug ON media_tags(slug);

-- Media-Tag pivot table (many-to-many)
CREATE TABLE IF NOT EXISTS media_tag_pivot (
  media_id INTEGER NOT NULL REFERENCES cms_media(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES media_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (media_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_media_tag_pivot_media ON media_tag_pivot(media_id);
CREATE INDEX IF NOT EXISTS idx_media_tag_pivot_tag ON media_tag_pivot(tag_id);

-- Add foreign key for category_id after table creation (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cms_media_category'
  ) THEN
    ALTER TABLE cms_media
    ADD CONSTRAINT fk_cms_media_category
    FOREIGN KEY (category_id) REFERENCES media_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cms_media_category ON cms_media(category_id);
CREATE INDEX IF NOT EXISTS idx_cms_media_deleted ON cms_media(is_deleted);
CREATE INDEX IF NOT EXISTS idx_cms_media_usage ON cms_media(usage_count);

-- AI Usage Log table for tracking AI operations
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  feature VARCHAR(100),
  admin_user_id INTEGER,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  model_id VARCHAR(100),
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_provider ON ai_usage_log(provider);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_feature ON ai_usage_log(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_admin_user ON ai_usage_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created_at ON ai_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_success ON ai_usage_log(success);

-- Newsletter Subscriptions table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  source VARCHAR(100) DEFAULT 'website',
  status VARCHAR(50) DEFAULT 'active',
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint on email to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON newsletter_subscriptions(LOWER(email));

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_status ON newsletter_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_created_at ON newsletter_subscriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_source ON newsletter_subscriptions(source);

-- Product views tracking for "Recently Viewed" and analytics
CREATE TABLE IF NOT EXISTS product_views (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_views_user ON product_views(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_session ON product_views(session_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id);

-- Product recommendations for related/similar products
CREATE TABLE IF NOT EXISTS product_recommendations (
  id BIGSERIAL PRIMARY KEY,
  source_product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  recommended_product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL, -- 'related', 'similar', 'frequently_bought', 'complete_look'
  score DECIMAL(5,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_product_id, recommended_product_id, recommendation_type)
);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_source
  ON product_recommendations(source_product_id, recommendation_type, score DESC);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_type
  ON product_recommendations(recommendation_type);

-- ==================================================================
-- PRODUCT REVIEWS & RATINGS SYSTEM
-- ==================================================================

-- Add rating fields to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_rating ON products(average_rating DESC);

-- Product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,

  -- Review Data
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  review_text TEXT,

  -- Verification
  is_verified_purchase BOOLEAN DEFAULT FALSE,

  -- Media Attachments
  images JSONB DEFAULT '[]',
  videos JSONB DEFAULT '[]',

  -- Moderation
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderated_by BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP,
  rejection_reason TEXT,

  -- Metadata (for anonymous reviews)
  reviewer_name VARCHAR(255),
  reviewer_email VARCHAR(255),

  -- Helpfulness
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- One review per user per product
  CONSTRAINT unique_user_product_review UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id, status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created ON product_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);

-- Admin responses to reviews
CREATE TABLE IF NOT EXISTS review_responses (
  id BIGSERIAL PRIMARY KEY,
  review_id BIGINT NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  admin_user_id BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_review_response UNIQUE(review_id)
);

CREATE INDEX IF NOT EXISTS idx_review_responses_review ON review_responses(review_id);

-- Review helpfulness tracking
CREATE TABLE IF NOT EXISTS review_helpfulness (
  id BIGSERIAL PRIMARY KEY,
  review_id BIGINT NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_review_helpfulness UNIQUE (review_id, user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_review_helpfulness_review ON review_helpfulness(review_id);

-- Product rating aggregates (for performance)
CREATE TABLE IF NOT EXISTS product_rating_aggregates (
  product_id BIGINT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,

  -- Aggregate Data
  average_rating NUMERIC(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,

  -- Rating Distribution
  rating_1_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_5_count INTEGER DEFAULT 0,

  -- Verified Purchase Stats
  verified_average_rating NUMERIC(3,2) DEFAULT 0.00,
  verified_review_count INTEGER DEFAULT 0,

  -- Timestamps
  last_review_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================================================================
-- TRIGGERS & FUNCTIONS FOR RATING AGGREGATION
-- ==================================================================

-- Function to update product rating aggregates
CREATE OR REPLACE FUNCTION update_product_rating_aggregate()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id BIGINT;
BEGIN
  -- Get product_id from NEW or OLD record
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);

  -- Update aggregate table
  INSERT INTO product_rating_aggregates (
    product_id,
    average_rating,
    total_reviews,
    total_ratings,
    rating_1_count,
    rating_2_count,
    rating_3_count,
    rating_4_count,
    rating_5_count,
    verified_average_rating,
    verified_review_count,
    last_review_at,
    updated_at
  )
  SELECT
    product_id,
    ROUND(AVG(rating)::numeric, 2) as average_rating,
    COUNT(*) as total_reviews,
    COUNT(*) as total_ratings,
    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1_count,
    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2_count,
    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3_count,
    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4_count,
    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5_count,
    ROUND(AVG(CASE WHEN is_verified_purchase THEN rating ELSE NULL END)::numeric, 2) as verified_average_rating,
    SUM(CASE WHEN is_verified_purchase THEN 1 ELSE 0 END) as verified_review_count,
    MAX(created_at) as last_review_at,
    NOW() as updated_at
  FROM product_reviews
  WHERE product_id = v_product_id
    AND status = 'approved'
  GROUP BY product_id
  ON CONFLICT (product_id)
  DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    total_ratings = EXCLUDED.total_ratings,
    rating_1_count = EXCLUDED.rating_1_count,
    rating_2_count = EXCLUDED.rating_2_count,
    rating_3_count = EXCLUDED.rating_3_count,
    rating_4_count = EXCLUDED.rating_4_count,
    rating_5_count = EXCLUDED.rating_5_count,
    verified_average_rating = EXCLUDED.verified_average_rating,
    verified_review_count = EXCLUDED.verified_review_count,
    last_review_at = EXCLUDED.last_review_at,
    updated_at = EXCLUDED.updated_at;

  -- Update products table for quick access
  UPDATE products
  SET
    average_rating = COALESCE((SELECT average_rating FROM product_rating_aggregates WHERE product_id = v_product_id), 0.00),
    review_count = COALESCE((SELECT total_reviews FROM product_rating_aggregates WHERE product_id = v_product_id), 0)
  WHERE id = v_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS product_review_aggregate_insert ON product_reviews;
DROP TRIGGER IF EXISTS product_review_aggregate_update ON product_reviews;
DROP TRIGGER IF EXISTS product_review_aggregate_delete ON product_reviews;

-- Create triggers for rating aggregation
CREATE TRIGGER product_review_aggregate_insert
AFTER INSERT ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating_aggregate();

CREATE TRIGGER product_review_aggregate_update
AFTER UPDATE ON product_reviews
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.rating IS DISTINCT FROM NEW.rating OR OLD.is_verified_purchase IS DISTINCT FROM NEW.is_verified_purchase)
EXECUTE FUNCTION update_product_rating_aggregate();

CREATE TRIGGER product_review_aggregate_delete
AFTER DELETE ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating_aggregate();

-- Function to update review helpfulness counts
CREATE OR REPLACE FUNCTION update_review_helpfulness_count()
RETURNS TRIGGER AS $$
DECLARE
  v_review_id BIGINT;
BEGIN
  v_review_id := COALESCE(NEW.review_id, OLD.review_id);

  UPDATE product_reviews
  SET
    helpful_count = (SELECT COUNT(*) FROM review_helpfulness WHERE review_id = v_review_id AND is_helpful = TRUE),
    not_helpful_count = (SELECT COUNT(*) FROM review_helpfulness WHERE review_id = v_review_id AND is_helpful = FALSE)
  WHERE id = v_review_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS review_helpfulness_counter ON review_helpfulness;

-- Create trigger for helpfulness counter
CREATE TRIGGER review_helpfulness_counter
AFTER INSERT OR UPDATE OR DELETE ON review_helpfulness
FOR EACH ROW
EXECUTE FUNCTION update_review_helpfulness_count();

-- Static translations table for UI text translations
CREATE TABLE IF NOT EXISTS static_translations (
  id SERIAL PRIMARY KEY,
  translation_key VARCHAR(255) NOT NULL,
  language_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  translation_value TEXT NOT NULL,
  namespace VARCHAR(50) NOT NULL DEFAULT 'common',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(translation_key, language_code, namespace)
);

CREATE INDEX IF NOT EXISTS idx_static_translations_key ON static_translations(translation_key);
CREATE INDEX IF NOT EXISTS idx_static_translations_language ON static_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_static_translations_namespace ON static_translations(namespace);
CREATE INDEX IF NOT EXISTS idx_static_translations_lookup ON static_translations(translation_key, language_code, namespace);

-- ============================================================================
-- GLOBAL THEME SYSTEM
-- ============================================================================

-- Themes: Core theme storage with JSONB tokens and versioning
CREATE TABLE IF NOT EXISTS themes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Theme configuration (JSON design tokens)
  tokens JSONB NOT NULL,

  -- Metadata
  is_active BOOLEAN DEFAULT false,
  is_system_theme BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Version control
  version INTEGER DEFAULT 1,
  parent_theme_id INTEGER REFERENCES themes(id) ON DELETE SET NULL,

  -- Preview
  thumbnail_url VARCHAR(500)
);

-- Indexes for themes
CREATE INDEX IF NOT EXISTS idx_themes_active ON themes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_themes_system ON themes(is_system_theme);
CREATE INDEX IF NOT EXISTS idx_themes_tokens ON themes USING GIN(tokens);
CREATE INDEX IF NOT EXISTS idx_themes_created_at ON themes(created_at DESC);

-- Trigger to update themes updated_at timestamp
CREATE OR REPLACE FUNCTION update_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS themes_updated_at_trigger ON themes;

CREATE TRIGGER themes_updated_at_trigger
BEFORE UPDATE ON themes
FOR EACH ROW
EXECUTE FUNCTION update_themes_updated_at();

-- Theme Presets: Pre-built theme templates
CREATE TABLE IF NOT EXISTS theme_presets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'light', 'dark', 'seasonal', 'industry'

  -- Preset configuration
  tokens JSONB NOT NULL,

  -- Preview assets
  thumbnail_url VARCHAR(500),
  preview_url VARCHAR(500),

  -- Metadata
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  tags TEXT[],

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_theme_presets_category ON theme_presets(category);
CREATE INDEX IF NOT EXISTS idx_theme_presets_featured ON theme_presets(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_theme_presets_display_order ON theme_presets(display_order);

-- Theme History: Audit log for theme changes
CREATE TABLE IF NOT EXISTS theme_history (
  id SERIAL PRIMARY KEY,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,

  -- Change details
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'activated', 'deactivated'
  previous_tokens JSONB,
  new_tokens JSONB,

  -- User tracking
  admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_user_email VARCHAR(255),
  ip_address INET,
  user_agent TEXT,

  -- Metadata
  change_summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_theme_history_theme ON theme_history(theme_id);
CREATE INDEX IF NOT EXISTS idx_theme_history_action ON theme_history(action);
CREATE INDEX IF NOT EXISTS idx_theme_history_date ON theme_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_theme_history_admin_user ON theme_history(admin_user_id);

-- Font Library: Available font families
CREATE TABLE IF NOT EXISTS font_library (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,

  -- Font source
  source VARCHAR(50) NOT NULL, -- 'google', 'adobe', 'custom', 'system'
  font_url VARCHAR(500),

  -- Font properties
  category VARCHAR(50), -- 'serif', 'sans-serif', 'display', 'handwriting', 'monospace'
  weights INTEGER[], -- [300, 400, 500, 600, 700]
  styles VARCHAR[], -- ['normal', 'italic']

  -- Metadata
  is_system_font BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  preview_text TEXT DEFAULT 'The quick brown fox jumps over the lazy dog',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_font_library_category ON font_library(category);
CREATE INDEX IF NOT EXISTS idx_font_library_source ON font_library(source);
CREATE INDEX IF NOT EXISTS idx_font_library_system ON font_library(is_system_font);

-- Insert default system fonts
INSERT INTO font_library (name, display_name, source, category, weights, styles, is_system_font) VALUES
  ('system-ui', 'System UI', 'system', 'sans-serif', ARRAY[400, 500, 600, 700], ARRAY['normal'], true),
  ('inter', 'Inter', 'google', 'sans-serif', ARRAY[300, 400, 500, 600, 700, 800], ARRAY['normal'], true),
  ('playfair-display', 'Playfair Display', 'google', 'serif', ARRAY[400, 500, 600, 700, 800], ARRAY['normal', 'italic'], true),
  ('roboto', 'Roboto', 'google', 'sans-serif', ARRAY[300, 400, 500, 700], ARRAY['normal', 'italic'], true),
  ('montserrat', 'Montserrat', 'google', 'sans-serif', ARRAY[300, 400, 500, 600, 700, 800], ARRAY['normal'], true),
  ('open-sans', 'Open Sans', 'google', 'sans-serif', ARRAY[300, 400, 600, 700], ARRAY['normal', 'italic'], true),
  ('lora', 'Lora', 'google', 'serif', ARRAY[400, 500, 600, 700], ARRAY['normal', 'italic'], true),
  ('poppins', 'Poppins', 'google', 'sans-serif', ARRAY[300, 400, 500, 600, 700], ARRAY['normal'], true),
  ('fira-code', 'Fira Code', 'google', 'monospace', ARRAY[300, 400, 500, 600, 700], ARRAY['normal'], true),
  ('source-code-pro', 'Source Code Pro', 'google', 'monospace', ARRAY[400, 500, 600, 700], ARRAY['normal'], true)
ON CONFLICT (name) DO NOTHING;

-- Insert default Luxia theme
INSERT INTO themes (
  name,
  display_name,
  description,
  tokens,
  is_active,
  is_system_theme,
  version
) VALUES (
  'luxia-default',
  'Luxia Default',
  'Default Luxia brand theme with jade and blush colors',
  '{"version":"1.0.0","metadata":{"displayName":"Luxia Default","description":"Default Luxia brand theme","author":"Luxia Team","category":"light"},"color":{"brand":{"primary":"#2f6d5f","secondary":"#e8c7c8","accent":"#0f172a"},"semantic":{"background":{"primary":"#ffffff","secondary":"#f9fafb","elevated":"#ffffff"},"text":{"primary":"#111827","secondary":"#4b5563","tertiary":"#6b7280","inverse":"#ffffff","onPrimary":"#ffffff","onSecondary":"#111827","onAccent":"#ffffff","onInteractive":"#ffffff","onSuccess":"#111827","onWarning":"#111827","onError":"#111827","onInfo":"#111827"},"border":{"default":"#e5e7eb","strong":"#d1d5db"},"interactive":{"default":"#2f6d5f","hover":"#275a4f","active":"#214940","disabled":"#d1d5db"},"feedback":{"success":"#10b981","warning":"#f59e0b","error":"#ef4444","info":"#3b82f6"}}},"typography":{"fontFamily":{"display":"Playfair Display, serif","body":"Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif","mono":"Fira Code, Courier New, monospace"},"fontSize":{"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem"},"fontWeight":{"light":"300","normal":"400","medium":"500","semibold":"600","bold":"700"},"lineHeight":{"tight":"1.25","normal":"1.5","relaxed":"1.75"},"letterSpacing":{"tight":"-0.05em","normal":"0","wide":"0.025em","wider":"0.05em"}},"spacing":{"preset":"normal","xs":"0.25rem","sm":"0.5rem","md":"1rem","lg":"1.5rem","xl":"2rem","2xl":"3rem","3xl":"4rem"},"border":{"width":{"thin":"1px","medium":"2px","thick":"4px"},"radius":{"sm":"0.25rem","md":"0.5rem","lg":"0.75rem","xl":"1rem","2xl":"1.5rem","full":"9999px"}},"shadow":{"sm":"0 1px 2px 0 rgba(0, 0, 0, 0.05)","md":"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)","lg":"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)","xl":"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"}}',
  true,
  true,
  1
) ON CONFLICT (name) DO UPDATE
SET display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    tokens = EXCLUDED.tokens;

-- Insert theme presets (pre-built themes)
INSERT INTO theme_presets (
  name,
  display_name,
  description,
  category,
  tokens,
  is_featured,
  display_order
) VALUES
  -- 1. Minimalist Light
  (
    'minimalist-light',
    'Minimalist Light',
    'Clean and modern light theme with subtle grays and minimal styling',
    'light',
    '{"version":"1.0.0","metadata":{"displayName":"Minimalist Light","description":"Clean minimal design","author":"Luxia Team","category":"light"},"color":{"brand":{"primary":"#111111","secondary":"#f5f5f5","accent":"#666666"},"semantic":{"background":{"primary":"#ffffff","secondary":"#fafafa","elevated":"#ffffff"},"text":{"primary":"#000000","secondary":"#666666","tertiary":"#707070","inverse":"#ffffff","onPrimary":"#ffffff","onSecondary":"#111111","onAccent":"#ffffff","onInteractive":"#ffffff","onSuccess":"#111111","onWarning":"#111111","onError":"#111111","onInfo":"#111111"},"border":{"default":"#e0e0e0","strong":"#cccccc"},"interactive":{"default":"#111111","hover":"#333333","active":"#000000","disabled":"#cccccc"},"feedback":{"success":"#4caf50","warning":"#ff9800","error":"#f44336","info":"#2196f3"}}},"typography":{"fontFamily":{"display":"Inter, sans-serif","body":"Inter, sans-serif","mono":"Fira Code, monospace"},"fontSize":{"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem"},"fontWeight":{"light":"300","normal":"400","medium":"500","semibold":"600","bold":"700"},"lineHeight":{"tight":"1.25","normal":"1.5","relaxed":"1.75"},"letterSpacing":{"tight":"-0.05em","normal":"0","wide":"0.025em","wider":"0.05em"}},"spacing":{"preset":"compact","xs":"0.125rem","sm":"0.25rem","md":"0.5rem","lg":"0.75rem","xl":"1rem","2xl":"1.5rem","3xl":"2rem"},"border":{"width":{"thin":"1px","medium":"2px","thick":"4px"},"radius":{"sm":"0.125rem","md":"0.25rem","lg":"0.375rem","xl":"0.5rem","2xl":"0.75rem","full":"9999px"}},"shadow":{"sm":"0 1px 2px 0 rgba(0, 0, 0, 0.03)","md":"0 2px 4px -1px rgba(0, 0, 0, 0.06)","lg":"0 4px 8px -2px rgba(0, 0, 0, 0.08)","xl":"0 8px 16px -4px rgba(0, 0, 0, 0.1)"}}',
    true,
    1
  ),
  -- 2. Bold & Bright
  (
    'bold-bright',
    'Bold & Bright',
    'Vibrant and energetic theme with bold colors and playful accents',
    'light',
    '{"version":"1.0.0","metadata":{"displayName":"Bold & Bright","description":"Vibrant and playful","author":"Luxia Team","category":"light"},"color":{"brand":{"primary":"#d63c3c","secondary":"#0b7c7c","accent":"#ffe66d"},"semantic":{"background":{"primary":"#ffffff","secondary":"#fff9f0","elevated":"#ffffff"},"text":{"primary":"#2d3436","secondary":"#636e72","tertiary":"#70777c","inverse":"#ffffff","onPrimary":"#ffffff","onSecondary":"#ffffff","onAccent":"#2d3436","onInteractive":"#ffffff","onSuccess":"#2d3436","onWarning":"#2d3436","onError":"#ffffff","onInfo":"#2d3436"},"border":{"default":"#dfe6e9","strong":"#b2bec3"},"interactive":{"default":"#d63c3c","hover":"#c93434","active":"#b62d2d","disabled":"#dfe6e9"},"feedback":{"success":"#00d2d3","warning":"#fdcb6e","error":"#d63031","info":"#74b9ff"}}},"typography":{"fontFamily":{"display":"Poppins, sans-serif","body":"Open Sans, sans-serif","mono":"Source Code Pro, monospace"},"fontSize":{"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem"},"fontWeight":{"light":"300","normal":"400","medium":"500","semibold":"600","bold":"700"},"lineHeight":{"tight":"1.25","normal":"1.5","relaxed":"1.75"},"letterSpacing":{"tight":"-0.05em","normal":"0","wide":"0.025em","wider":"0.05em"}},"spacing":{"preset":"spacious","xs":"0.5rem","sm":"1rem","md":"1.5rem","lg":"2.5rem","xl":"4rem","2xl":"6rem","3xl":"8rem"},"border":{"width":{"thin":"1px","medium":"2px","thick":"4px"},"radius":{"sm":"0.5rem","md":"0.75rem","lg":"1rem","xl":"1.5rem","2xl":"2rem","full":"9999px"}},"shadow":{"sm":"0 2px 4px 0 rgba(0, 0, 0, 0.1)","md":"0 4px 8px -1px rgba(0, 0, 0, 0.15)","lg":"0 10px 20px -3px rgba(0, 0, 0, 0.2)","xl":"0 20px 30px -5px rgba(0, 0, 0, 0.25)"}}',
    true,
    2
  ),
  -- 3. Elegant Dark
  (
    'elegant-dark',
    'Elegant Dark',
    'Sophisticated dark theme with rich purples and elegant typography',
    'dark',
    '{"version":"1.0.0","metadata":{"displayName":"Elegant Dark","description":"Sophisticated dark mode","author":"Luxia Team","category":"dark"},"color":{"brand":{"primary":"#9d4edd","secondary":"#7b2cbf","accent":"#c77dff"},"semantic":{"background":{"primary":"#0f0e17","secondary":"#1a1825","elevated":"#252233"},"text":{"primary":"#fffffe","secondary":"#a7a9be","tertiary":"#7f84a5","inverse":"#0f0e17","onPrimary":"#ffffff","onSecondary":"#ffffff","onAccent":"#0f0e17","onInteractive":"#ffffff","onSuccess":"#0f0e17","onWarning":"#0f0e17","onError":"#0f0e17","onInfo":"#0f0e17"},"border":{"default":"#2e2c3e","strong":"#3f3d56"},"interactive":{"default":"#9d4edd","hover":"#8a3bd6","active":"#7b2cbf","disabled":"#3f3d56"},"feedback":{"success":"#06ffa5","warning":"#ffbe0b","error":"#ff006e","info":"#0096c7"}}},"typography":{"fontFamily":{"display":"Playfair Display, serif","body":"Inter, sans-serif","mono":"Fira Code, monospace"},"fontSize":{"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem"},"fontWeight":{"light":"300","normal":"400","medium":"500","semibold":"600","bold":"700"},"lineHeight":{"tight":"1.25","normal":"1.5","relaxed":"1.75"},"letterSpacing":{"tight":"-0.05em","normal":"0","wide":"0.025em","wider":"0.05em"}},"spacing":{"preset":"normal","xs":"0.25rem","sm":"0.5rem","md":"1rem","lg":"1.5rem","xl":"2rem","2xl":"3rem","3xl":"4rem"},"border":{"width":{"thin":"1px","medium":"2px","thick":"4px"},"radius":{"sm":"0.25rem","md":"0.5rem","lg":"0.75rem","xl":"1rem","2xl":"1.5rem","full":"9999px"}},"shadow":{"sm":"0 2px 4px 0 rgba(0, 0, 0, 0.3)","md":"0 4px 8px -1px rgba(0, 0, 0, 0.4)","lg":"0 10px 20px -3px rgba(0, 0, 0, 0.5)","xl":"0 20px 30px -5px rgba(0, 0, 0, 0.6)"}}',
    true,
    3
  ),
  -- 4. Ocean Breeze
  (
    'ocean-breeze',
    'Ocean Breeze',
    'Refreshing blue and teal theme inspired by coastal waters',
    'light',
    '{"version":"1.0.0","metadata":{"displayName":"Ocean Breeze","description":"Coastal blues and teals","author":"Luxia Team","category":"light"},"color":{"brand":{"primary":"#0e7490","secondary":"#0f766e","accent":"#164e63"},"semantic":{"background":{"primary":"#ffffff","secondary":"#f0fdfa","elevated":"#ffffff"},"text":{"primary":"#083344","secondary":"#155e75","tertiary":"#4b6f7a","inverse":"#ffffff","onPrimary":"#ffffff","onSecondary":"#ffffff","onAccent":"#ffffff","onInteractive":"#ffffff","onSuccess":"#083344","onWarning":"#083344","onError":"#ffffff","onInfo":"#083344"},"border":{"default":"#cffafe","strong":"#a5f3fc"},"interactive":{"default":"#0e7490","hover":"#0c6a82","active":"#0b5c73","disabled":"#cffafe"},"feedback":{"success":"#14b8a6","warning":"#f59e0b","error":"#b91c1c","info":"#60a5fa"}}},"typography":{"fontFamily":{"display":"Lora, serif","body":"Open Sans, sans-serif","mono":"Fira Code, monospace"},"fontSize":{"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem"},"fontWeight":{"light":"300","normal":"400","medium":"500","semibold":"600","bold":"700"},"lineHeight":{"tight":"1.25","normal":"1.5","relaxed":"1.75"},"letterSpacing":{"tight":"-0.05em","normal":"0","wide":"0.025em","wider":"0.05em"}},"spacing":{"preset":"normal","xs":"0.25rem","sm":"0.5rem","md":"1rem","lg":"1.5rem","xl":"2rem","2xl":"3rem","3xl":"4rem"},"border":{"width":{"thin":"1px","medium":"2px","thick":"4px"},"radius":{"sm":"0.5rem","md":"0.75rem","lg":"1rem","xl":"1.5rem","2xl":"2rem","full":"9999px"}},"shadow":{"sm":"0 1px 2px 0 rgba(6, 182, 212, 0.1)","md":"0 4px 6px -1px rgba(6, 182, 212, 0.15)","lg":"0 10px 15px -3px rgba(6, 182, 212, 0.2)","xl":"0 20px 25px -5px rgba(6, 182, 212, 0.25)"}}',
    true,
    4
  ),
  -- 5. Warm Autumn
  (
    'warm-autumn',
    'Warm Autumn',
    'Cozy earth tones with warm oranges, browns, and rustic charm',
    'light',
    '{"version":"1.0.0","metadata":{"displayName":"Warm Autumn","description":"Cozy earth tones","author":"Luxia Team","category":"light"},"color":{"brand":{"primary":"#b45309","secondary":"#92400e","accent":"#f59e0b"},"semantic":{"background":{"primary":"#fffbeb","secondary":"#fef3c7","elevated":"#ffffff"},"text":{"primary":"#78350f","secondary":"#92400e","tertiary":"#a35a12","inverse":"#fffbeb","onPrimary":"#fffbeb","onSecondary":"#fffbeb","onAccent":"#5a2a0a","onInteractive":"#fffbeb","onSuccess":"#5a2a0a","onWarning":"#5a2a0a","onError":"#fffbeb","onInfo":"#5a2a0a"},"border":{"default":"#fed7aa","strong":"#fdba74"},"interactive":{"default":"#b45309","hover":"#9a3412","active":"#7c2d12","disabled":"#fed7aa"},"feedback":{"success":"#16a34a","warning":"#ca8a04","error":"#dc2626","info":"#5fa8d3"}}},"typography":{"fontFamily":{"display":"Playfair Display, serif","body":"Lora, serif","mono":"Source Code Pro, monospace"},"fontSize":{"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem"},"fontWeight":{"light":"300","normal":"400","medium":"500","semibold":"600","bold":"700"},"lineHeight":{"tight":"1.25","normal":"1.5","relaxed":"1.75"},"letterSpacing":{"tight":"-0.05em","normal":"0","wide":"0.025em","wider":"0.05em"}},"spacing":{"preset":"normal","xs":"0.25rem","sm":"0.5rem","md":"1rem","lg":"1.5rem","xl":"2rem","2xl":"3rem","3xl":"4rem"},"border":{"width":{"thin":"1px","medium":"2px","thick":"4px"},"radius":{"sm":"0.375rem","md":"0.5rem","lg":"0.75rem","xl":"1rem","2xl":"1.5rem","full":"9999px"}},"shadow":{"sm":"0 1px 2px 0 rgba(217, 119, 6, 0.1)","md":"0 4px 6px -1px rgba(217, 119, 6, 0.15)","lg":"0 10px 15px -3px rgba(217, 119, 6, 0.2)","xl":"0 20px 25px -5px rgba(217, 119, 6, 0.25)"}}',
    true,
    5
  )
ON CONFLICT (name) DO UPDATE
SET display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    tokens = EXCLUDED.tokens,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

-- ============================================================================
-- CUSTOM PRODUCT ATTRIBUTES SYSTEM
-- ============================================================================

-- Product attribute definitions (custom product attributes schema)
CREATE TABLE IF NOT EXISTS product_attribute_definitions (
  id SERIAL PRIMARY KEY,
  attribute_key VARCHAR(100) UNIQUE NOT NULL,
  attribute_label VARCHAR(255) NOT NULL,
  data_type VARCHAR(50) NOT NULL, -- text, number, boolean, select, multiselect, date
  is_searchable BOOLEAN DEFAULT FALSE,
  is_filterable BOOLEAN DEFAULT FALSE,
  is_required BOOLEAN DEFAULT FALSE,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  options JSONB, -- For select/multiselect: [{"value": "50ml", "label": "50ml"}]
  category_ids INTEGER[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_attributes_filterable
ON product_attribute_definitions(is_filterable) WHERE is_filterable = TRUE;

CREATE INDEX IF NOT EXISTS idx_cms_block_versions_block_version
  ON cms_block_versions(block_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_cms_block_versions_created
  ON cms_block_versions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_attr_defs_category
  ON product_attribute_definitions USING GIN(category_ids);

-- Add custom_attributes JSONB column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for querying custom attributes
CREATE INDEX IF NOT EXISTS idx_products_custom_attributes ON products USING gin (custom_attributes);

-- Function to validate custom attributes against definitions
CREATE OR REPLACE FUNCTION validate_custom_attributes()
RETURNS TRIGGER AS $$
DECLARE
  attr_key TEXT;
  attr_value JSONB;
  definition RECORD;
BEGIN
  -- Skip validation if custom_attributes is null or empty
  IF NEW.custom_attributes IS NULL OR NEW.custom_attributes = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  -- Iterate through custom attributes
  FOR attr_key, attr_value IN SELECT * FROM jsonb_each(NEW.custom_attributes)
  LOOP
    -- Check if attribute definition exists
    SELECT * INTO definition
    FROM product_attribute_definitions
    WHERE attribute_key = attr_key;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Unknown attribute: %', attr_key;
    END IF;

    -- Validate data type
    CASE definition.data_type
      WHEN 'number' THEN
        IF jsonb_typeof(attr_value) != 'number' THEN
          RAISE EXCEPTION 'Attribute % must be a number', attr_key;
        END IF;
      WHEN 'boolean' THEN
        IF jsonb_typeof(attr_value) != 'boolean' THEN
          RAISE EXCEPTION 'Attribute % must be a boolean', attr_key;
        END IF;
      WHEN 'text' THEN
        IF jsonb_typeof(attr_value) != 'string' THEN
          RAISE EXCEPTION 'Attribute % must be a string', attr_key;
        END IF;
      WHEN 'date' THEN
        IF jsonb_typeof(attr_value) != 'string' THEN
          RAISE EXCEPTION 'Attribute "%" must be a date string', attr_key;
        END IF;
        -- Validate ISO 8601 format
        BEGIN
          PERFORM attr_value::text::date;
        EXCEPTION WHEN OTHERS THEN
          RAISE EXCEPTION 'Attribute "%" must be a valid date (YYYY-MM-DD)', attr_key;
        END;
      WHEN 'select' THEN
        -- Validate against options
        IF definition.options IS NOT NULL THEN
          IF NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(definition.options) AS opt
            WHERE opt->>'value' = attr_value#>>'{}'
          ) THEN
            RAISE EXCEPTION 'Invalid option for attribute %: %', attr_key, attr_value;
          END IF;
        END IF;
      WHEN 'multiselect' THEN
        IF jsonb_typeof(attr_value) != 'array' THEN
          RAISE EXCEPTION 'Attribute "%" must be an array', attr_key;
        END IF;
        -- Use array containment for O(n) performance
        IF NOT (
          SELECT ARRAY(SELECT jsonb_array_elements_text(attr_value))
          <@ ARRAY(SELECT opt->>'value' FROM jsonb_array_elements(definition.options) AS opt)
        ) THEN
          RAISE EXCEPTION 'Attribute "%" contains invalid values', attr_key;
        END IF;
    END CASE;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attribute validation
DROP TRIGGER IF EXISTS validate_product_attributes_trigger ON products;
CREATE TRIGGER validate_product_attributes_trigger
BEFORE INSERT OR UPDATE OF custom_attributes ON products
FOR EACH ROW
EXECUTE FUNCTION validate_custom_attributes();

-- Function to get filterable attributes for a category
CREATE OR REPLACE FUNCTION get_filterable_attributes(category_filter TEXT DEFAULT NULL)
RETURNS TABLE(
  id INTEGER,
  attribute_key VARCHAR(100),
  attribute_label VARCHAR(255),
  data_type VARCHAR(50),
  options JSONB,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pad.id,
    pad.attribute_key,
    pad.attribute_label,
    pad.data_type,
    pad.options,
    pad.display_order
  FROM product_attribute_definitions pad
  WHERE pad.is_filterable = TRUE
    AND (
      category_filter IS NULL
      OR array_length(pad.category_ids, 1) IS NULL
      OR category_filter::integer = ANY(pad.category_ids)
    )
  ORDER BY pad.display_order, pad.attribute_label;
END;
$$ LANGUAGE plpgsql STABLE;

-- Insert default attribute definitions for hair/scalp care products
INSERT INTO product_attribute_definitions
  (attribute_key, attribute_label, data_type, is_searchable, is_filterable, display_order, options)
VALUES
  ('volume', 'Volume', 'select', FALSE, TRUE, 1,
   '[{"value": "50ml", "label": "50ml"}, {"value": "100ml", "label": "100ml"}, {"value": "200ml", "label": "200ml"}, {"value": "250ml", "label": "250ml"}]'::jsonb),

  ('hair_type', 'Hair Type', 'multiselect', TRUE, TRUE, 2,
   '[{"value": "dry", "label": "Dry"}, {"value": "oily", "label": "Oily"}, {"value": "normal", "label": "Normal"}, {"value": "damaged", "label": "Damaged"}, {"value": "color-treated", "label": "Color-Treated"}]'::jsonb),

  ('scalp_type', 'Scalp Type', 'multiselect', TRUE, TRUE, 3,
   '[{"value": "sensitive", "label": "Sensitive"}, {"value": "itchy", "label": "Itchy"}, {"value": "flaky", "label": "Flaky"}, {"value": "oily", "label": "Oily"}]'::jsonb),

  ('scent', 'Scent', 'select', TRUE, TRUE, 4,
   '[{"value": "lavender", "label": "Lavender"}, {"value": "rose", "label": "Rose"}, {"value": "mint", "label": "Mint"}, {"value": "citrus", "label": "Citrus"}, {"value": "unscented", "label": "Unscented"}]'::jsonb),

  ('ingredients', 'Key Ingredients', 'multiselect', TRUE, FALSE, 5,
   '[{"value": "argan-oil", "label": "Argan Oil"}, {"value": "keratin", "label": "Keratin"}, {"value": "biotin", "label": "Biotin"}, {"value": "collagen", "label": "Collagen"}, {"value": "tea-tree", "label": "Tea Tree"}]'::jsonb),

  ('organic', 'Organic', 'boolean', TRUE, TRUE, 6, NULL),
  ('vegan', 'Vegan', 'boolean', TRUE, TRUE, 7, NULL),
  ('paraben_free', 'Paraben Free', 'boolean', TRUE, TRUE, 8, NULL),
  ('sulfate_free', 'Sulfate Free', 'boolean', TRUE, TRUE, 9, NULL),
  ('cruelty_free', 'Cruelty Free', 'boolean', TRUE, TRUE, 10, NULL),

  ('application_method', 'Application Method', 'select', FALSE, TRUE, 11,
   '[{"value": "spray", "label": "Spray"}, {"value": "pump", "label": "Pump"}, {"value": "dropper", "label": "Dropper"}, {"value": "direct", "label": "Direct Application"}]'::jsonb),

  ('texture', 'Texture', 'select', TRUE, FALSE, 12,
   '[{"value": "liquid", "label": "Liquid"}, {"value": "cream", "label": "Cream"}, {"value": "gel", "label": "Gel"}, {"value": "serum", "label": "Serum"}, {"value": "oil", "label": "Oil"}]'::jsonb)

ON CONFLICT (attribute_key) DO NOTHING;

-- ============================================================================
-- PRODUCT VARIANTS SYSTEM
-- ============================================================================

-- Variant option types (e.g., Size, Color, Material)
CREATE TABLE IF NOT EXISTS variant_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Variant option values (e.g., Small, Medium, Large for Size)
CREATE TABLE IF NOT EXISTS variant_option_values (
  id SERIAL PRIMARY KEY,
  option_id INTEGER NOT NULL REFERENCES variant_options(id) ON DELETE CASCADE,
  value VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(option_id, value)
);

CREATE INDEX IF NOT EXISTS idx_variant_option_values_option_id ON variant_option_values(option_id);

-- Product variants (specific combinations of options for a product)
CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL UNIQUE,
  price DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  inventory INTEGER NOT NULL DEFAULT 0,
  weight DECIMAL(10,3),
  dimensions_length DECIMAL(10,2),
  dimensions_width DECIMAL(10,2),
  dimensions_height DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  sales_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON product_variants(is_active);

-- Junction table linking variants to their option values
CREATE TABLE IF NOT EXISTS product_variant_options (
  id SERIAL PRIMARY KEY,
  variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  option_value_id INTEGER NOT NULL REFERENCES variant_option_values(id) ON DELETE RESTRICT,
  UNIQUE(variant_id, option_value_id)
);

CREATE INDEX IF NOT EXISTS idx_product_variant_options_variant_id ON product_variant_options(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_options_value_id ON product_variant_options(option_value_id);

-- Function to get product variants with their options
CREATE OR REPLACE FUNCTION get_product_variants(p_product_id INTEGER)
RETURNS TABLE (
  variant_id INTEGER,
  product_id INTEGER,
  sku VARCHAR(100),
  price DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  inventory INTEGER,
  weight DECIMAL(10,3),
  dimensions_length DECIMAL(10,2),
  dimensions_width DECIMAL(10,2),
  dimensions_height DECIMAL(10,2),
  is_active BOOLEAN,
  is_default BOOLEAN,
  image_url TEXT,
  sales_count INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  options JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.id as variant_id,
    pv.product_id,
    pv.sku,
    pv.price,
    pv.sale_price,
    pv.inventory,
    pv.weight,
    pv.dimensions_length,
    pv.dimensions_width,
    pv.dimensions_height,
    pv.is_active,
    pv.is_default,
    pv.image_url,
    pv.sales_count,
    pv.created_at,
    pv.updated_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'optionId', vo.id,
          'optionName', vo.name,
          'valueId', vov.id,
          'value', vov.value
        ) ORDER BY vo.display_order
      ) FILTER (WHERE vo.id IS NOT NULL),
      '[]'::jsonb
    ) as options
  FROM product_variants pv
  LEFT JOIN product_variant_options pvo ON pv.id = pvo.variant_id
  LEFT JOIN variant_option_values vov ON pvo.option_value_id = vov.id
  LEFT JOIN variant_options vo ON vov.option_id = vo.id
  WHERE pv.product_id = p_product_id
  GROUP BY pv.id
  ORDER BY pv.is_default DESC, pv.created_at;
END;
$$ LANGUAGE plpgsql;

-- Add S3 storage columns to cms_media table
DO $$
BEGIN
    -- Add s3_key column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cms_media' AND column_name = 's3_key') THEN
        ALTER TABLE cms_media ADD COLUMN s3_key TEXT;
    END IF;
    
    -- Add s3_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cms_media' AND column_name = 's3_url') THEN
        ALTER TABLE cms_media ADD COLUMN s3_url TEXT;
    END IF;
    
    -- Add is_deleted column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cms_media' AND column_name = 'is_deleted') THEN
        ALTER TABLE cms_media ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add deleted_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cms_media' AND column_name = 'deleted_at') THEN
        ALTER TABLE cms_media ADD COLUMN deleted_at TIMESTAMP;
    END IF;
    
    -- Add usage_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cms_media' AND column_name = 'usage_count') THEN
        ALTER TABLE cms_media ADD COLUMN usage_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add category_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cms_media' AND column_name = 'category_id') THEN
        ALTER TABLE cms_media ADD COLUMN category_id INTEGER;
    END IF;
END $$;

-- Create index on s3_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_cms_media_s3_key ON cms_media(s3_key);
CREATE INDEX IF NOT EXISTS idx_cms_media_is_deleted ON cms_media(is_deleted);
`;

async function seedTranslations() {
  try {
    const sqlPath = path.join(__dirname, 'translationsSeed.sql');

    if (!fs.existsSync(sqlPath)) {
      console.log('⚠️  Translation seed file not found. Skipping translation seeding.');
      console.log('   Run "npm run export:translations" to generate the seed file.');
      return;
    }

    console.log('Seeding static translations...');

    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Remove comments and split by semicolon
    const statements = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`  Processing ${statements.length} translation entries...`);

    // Execute each statement
    for (const statement of statements) {
      await pool.query(statement);
    }

    // Verify counts
    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM static_translations
    `);

    console.log(`✅ Translations seeded successfully: ${countResult.rows[0].total} entries`);
  } catch (error: any) {
    console.error('❌ Translation seeding failed:', error.message);
    throw error;
  }
}

async function migrate() {
  try {
    console.log('🔄 Running database migrations...');
    await pool.query(migrations);
    console.log('✅ Database schema migrated successfully');

    // Automatically seed translations after migrations
    await seedTranslations();

    console.log('\n🎉 Migration and seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
