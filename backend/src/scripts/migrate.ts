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
  ('anthropic_model', 'claude-haiku-4-5-20251001')
ON CONFLICT (setting_key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

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

  CONSTRAINT unique_review_helpfulness UNIQUE NULLS NOT DISTINCT(review_id, user_id, session_id)
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
  '{"version":"1.0.0","metadata":{"displayName":"Luxia Default","description":"Default Luxia brand theme","author":"Luxia Team","category":"light"},"color":{"brand":{"primary":"#8bba9c","secondary":"#e8c7c8","accent":"#0f172a"},"semantic":{"background":{"primary":"#ffffff","secondary":"#f9fafb","elevated":"#ffffff"},"text":{"primary":"#111827","secondary":"#4b5563","tertiary":"#9ca3af","inverse":"#ffffff"},"border":{"default":"#e5e7eb","strong":"#d1d5db"},"interactive":{"default":"#8bba9c","hover":"#7aa88a","active":"#6a967a","disabled":"#d1d5db"},"feedback":{"success":"#10b981","warning":"#f59e0b","error":"#ef4444","info":"#3b82f6"}}},"typography":{"fontFamily":{"display":"Playfair Display, serif","body":"Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif","mono":"Fira Code, Courier New, monospace"},"fontSize":{"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem"},"fontWeight":{"light":"300","normal":"400","medium":"500","semibold":"600","bold":"700"},"lineHeight":{"tight":"1.25","normal":"1.5","relaxed":"1.75"},"letterSpacing":{"tight":"-0.05em","normal":"0","wide":"0.025em","wider":"0.05em"}},"spacing":{"preset":"normal","xs":"0.25rem","sm":"0.5rem","md":"1rem","lg":"1.5rem","xl":"2rem","2xl":"3rem","3xl":"4rem"},"border":{"width":{"thin":"1px","medium":"2px","thick":"4px"},"radius":{"sm":"0.25rem","md":"0.5rem","lg":"0.75rem","xl":"1rem","2xl":"1.5rem","full":"9999px"}},"shadow":{"sm":"0 1px 2px 0 rgba(0, 0, 0, 0.05)","md":"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)","lg":"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)","xl":"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"}}',
  true,
  true,
  1
) ON CONFLICT (name) DO NOTHING;

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
    '{"version":"1.0.0","metadata":{"displayName":"Minimalist Light","description":"Clean minimal design","author":"Luxia Team","category":"light"},"color":{"brand":{"primary":"#000000","secondary":"#f5f5f5","accent":"#666666"},"semantic":{"background":{"primary":"#ffffff","secondary":"#fafafa","elevated":"#ffffff"},"text":{"primary":"#000000","secondary":"#666666","tertiary":"#999999","inverse":"#ffffff"},"border":{"default":"#e0e0e0","strong":"#cccccc"},"interactive":{"default":"#000000","hover":"#333333","active":"#666666","disabled":"#cccccc"},"feedback":{"success":"#4caf50","warning":"#ff9800","error":"#f44336","info":"#2196f3"}}},"typography":{"fontFamily":{"display":"Inter, sans-serif","body":"Inter, sans-serif","mono":"Fira Code, monospace"},"fontSize":{"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem"},"fontWeight":{"light":"300","normal":"400","medium":"500","semibold":"600","bold":"700"},"lineHeight":{"tight":"1.25","normal":"1.5","relaxed":"1.75"},"letterSpacing":{"tight":"-0.05em","normal":"0","wide":"0.025em","wider":"0.05em"}},"spacing":{"preset":"compact","xs":"0.125rem","sm":"0.25rem","md":"0.5rem","lg":"0.75rem","xl":"1rem","2xl":"1.5rem","3xl":"2rem"},"border":{"width":{"thin":"1px","medium":"2px","thick":"4px"},"radius":{"sm":"0.125rem","md":"0.25rem","lg":"0.375rem","xl":"0.5rem","2xl":"0.75rem","full":"9999px"}},"shadow":{"sm":"0 1px 2px 0 rgba(0, 0, 0, 0.03)","md":"0 2px 4px -1px rgba(0, 0, 0, 0.06)","lg":"0 4px 8px -2px rgba(0, 0, 0, 0.08)","xl":"0 8px 16px -4px rgba(0, 0, 0, 0.1)"}}',
    true,
    1
  ),
  -- 2. Bold & Bright
  (
    'bold-bright',
    'Bold & Bright',
    'Vibrant and energetic theme with bold colors and playful accents',
    'light',
    '{"version":"1.0.0","metadata":{"displayName":"Bold & Bright","description":"Vibrant and playful","author":"Luxia Team","category":"light"},"color":{"brand":{"primary":"#ff6b6b","secondary":"#4ecdc4","accent":"#ffe66d"},"semantic":{"background":{"primary":"#ffffff","secondary":"#fff9f0","elevated":"#ffffff"},"text":{"primary":"#2d3436","secondary":"#636e72","tertiary":"#b2bec3","inverse":"#ffffff"},"border":{"default":"#dfe6e9","strong":"#b2bec3"},"interactive":{"default":"#ff6b6b","hover":"#ff5252","active":"#e63946","disabled":"#dfe6e9"},"feedback":{"success":"#00d2d3","warning":"#fdcb6e","error":"#d63031","info":"#74b9ff"}}},"typography":{"fontFamily":{"display":"Poppins, sans-serif","body":"Open Sans, sans-serif","mono":"Source Code Pro, monospace"},"fontSize":{"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem"},"fontWeight":{"light":"300","normal":"400","medium":"500","semibold":"600","bold":"700"},"lineHeight":{"tight":"1.25","normal":"1.5","relaxed":"1.75"},"letterSpacing":{"tight":"-0.05em","normal":"0","wide":"0.025em","wider":"0.05em"}},"spacing":{"preset":"spacious","xs":"0.5rem","sm":"1rem","md":"1.5rem","lg":"2.5rem","xl":"4rem","2xl":"6rem","3xl":"8rem"},"border":{"width":{"thin":"1px","medium":"2px","thick":"4px"},"radius":{"sm":"0.5rem","md":"0.75rem","lg":"1rem","xl":"1.5rem","2xl":"2rem","full":"9999px"}},"shadow":{"sm":"0 2px 4px 0 rgba(0, 0, 0, 0.1)","md":"0 4px 8px -1px rgba(0, 0, 0, 0.15)","lg":"0 10px 20px -3px rgba(0, 0, 0, 0.2)","xl":"0 20px 30px -5px rgba(0, 0, 0, 0.25)"}}',
    true,
    2
  ),
  -- 3. Elegant Dark
  (
    'elegant-dark',
    'Elegant Dark',
    'Sophisticated dark theme with rich purples and elegant typography',
    'dark',
    '{"version":"1.0.0","metadata":{"displayName":"Elegant Dark","description":"Sophisticated dark mode","author":"Luxia Team","category":"dark"},"color":{"brand":{"primary":"#9d4edd","secondary":"#7b2cbf","accent":"#c77dff"},"semantic":{"background":{"primary":"#0f0e17","secondary":"#1a1825","elevated":"#252233"},"text":{"primary":"#fffffe","secondary":"#a7a9be","tertiary":"#6e7191","inverse":"#0f0e17"},"border":{"default":"#2e2c3e","strong":"#3f3d56"},"interactive":{"default":"#9d4edd","hover":"#b565ff","active":"#7b2cbf","disabled":"#3f3d56"},"feedback":{"success":"#06ffa5","warning":"#ffbe0b","error":"#ff006e","info":"#0096c7"}}},"typography":{"fontFamily":{"display":"Playfair Display, serif","body":"Inter, sans-serif","mono":"Fira Code, monospace"},"fontSize":{"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem"},"fontWeight":{"light":"300","normal":"400","medium":"500","semibold":"600","bold":"700"},"lineHeight":{"tight":"1.25","normal":"1.5","relaxed":"1.75"},"letterSpacing":{"tight":"-0.05em","normal":"0","wide":"0.025em","wider":"0.05em"}},"spacing":{"preset":"normal","xs":"0.25rem","sm":"0.5rem","md":"1rem","lg":"1.5rem","xl":"2rem","2xl":"3rem","3xl":"4rem"},"border":{"width":{"thin":"1px","medium":"2px","thick":"4px"},"radius":{"sm":"0.25rem","md":"0.5rem","lg":"0.75rem","xl":"1rem","2xl":"1.5rem","full":"9999px"}},"shadow":{"sm":"0 2px 4px 0 rgba(0, 0, 0, 0.3)","md":"0 4px 8px -1px rgba(0, 0, 0, 0.4)","lg":"0 10px 20px -3px rgba(0, 0, 0, 0.5)","xl":"0 20px 30px -5px rgba(0, 0, 0, 0.6)"}}',
    true,
    3
  ),
  -- 4. Ocean Breeze
  (
    'ocean-breeze',
    'Ocean Breeze',
    'Refreshing blue and teal theme inspired by coastal waters',
    'light',
    '{"version":"1.0.0","metadata":{"displayName":"Ocean Breeze","description":"Coastal blues and teals","author":"Luxia Team","category":"light"},"color":{"brand":{"primary":"#06b6d4","secondary":"#0891b2","accent":"#164e63"},"semantic":{"background":{"primary":"#ffffff","secondary":"#f0fdfa","elevated":"#ffffff"},"text":{"primary":"#083344","secondary":"#155e75","tertiary":"#67e8f9","inverse":"#ffffff"},"border":{"default":"#cffafe","strong":"#a5f3fc"},"interactive":{"default":"#06b6d4","hover":"#0891b2","active":"#0e7490","disabled":"#cffafe"},"feedback":{"success":"#14b8a6","warning":"#f59e0b","error":"#ef4444","info":"#3b82f6"}}},"typography":{"fontFamily":{"display":"Lora, serif","body":"Open Sans, sans-serif","mono":"Fira Code, monospace"},"fontSize":{"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem"},"fontWeight":{"light":"300","normal":"400","medium":"500","semibold":"600","bold":"700"},"lineHeight":{"tight":"1.25","normal":"1.5","relaxed":"1.75"},"letterSpacing":{"tight":"-0.05em","normal":"0","wide":"0.025em","wider":"0.05em"}},"spacing":{"preset":"normal","xs":"0.25rem","sm":"0.5rem","md":"1rem","lg":"1.5rem","xl":"2rem","2xl":"3rem","3xl":"4rem"},"border":{"width":{"thin":"1px","medium":"2px","thick":"4px"},"radius":{"sm":"0.5rem","md":"0.75rem","lg":"1rem","xl":"1.5rem","2xl":"2rem","full":"9999px"}},"shadow":{"sm":"0 1px 2px 0 rgba(6, 182, 212, 0.1)","md":"0 4px 6px -1px rgba(6, 182, 212, 0.15)","lg":"0 10px 15px -3px rgba(6, 182, 212, 0.2)","xl":"0 20px 25px -5px rgba(6, 182, 212, 0.25)"}}',
    true,
    4
  ),
  -- 5. Warm Autumn
  (
    'warm-autumn',
    'Warm Autumn',
    'Cozy earth tones with warm oranges, browns, and rustic charm',
    'light',
    '{"version":"1.0.0","metadata":{"displayName":"Warm Autumn","description":"Cozy earth tones","author":"Luxia Team","category":"light"},"color":{"brand":{"primary":"#d97706","secondary":"#92400e","accent":"#f59e0b"},"semantic":{"background":{"primary":"#fffbeb","secondary":"#fef3c7","elevated":"#ffffff"},"text":{"primary":"#78350f","secondary":"#92400e","tertiary":"#d97706","inverse":"#fffbeb"},"border":{"default":"#fed7aa","strong":"#fdba74"},"interactive":{"default":"#d97706","hover":"#ea580c","active":"#c2410c","disabled":"#fed7aa"},"feedback":{"success":"#16a34a","warning":"#ca8a04","error":"#dc2626","info":"#0284c7"}}},"typography":{"fontFamily":{"display":"Playfair Display, serif","body":"Lora, serif","mono":"Source Code Pro, monospace"},"fontSize":{"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem"},"fontWeight":{"light":"300","normal":"400","medium":"500","semibold":"600","bold":"700"},"lineHeight":{"tight":"1.25","normal":"1.5","relaxed":"1.75"},"letterSpacing":{"tight":"-0.05em","normal":"0","wide":"0.025em","wider":"0.05em"}},"spacing":{"preset":"normal","xs":"0.25rem","sm":"0.5rem","md":"1rem","lg":"1.5rem","xl":"2rem","2xl":"3rem","3xl":"4rem"},"border":{"width":{"thin":"1px","medium":"2px","thick":"4px"},"radius":{"sm":"0.375rem","md":"0.5rem","lg":"0.75rem","xl":"1rem","2xl":"1.5rem","full":"9999px"}},"shadow":{"sm":"0 1px 2px 0 rgba(217, 119, 6, 0.1)","md":"0 4px 6px -1px rgba(217, 119, 6, 0.15)","lg":"0 10px 15px -3px rgba(217, 119, 6, 0.2)","xl":"0 20px 25px -5px rgba(217, 119, 6, 0.25)"}}',
    true,
    5
  )
ON CONFLICT (name) DO NOTHING;
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
