import { pool } from '../db/client';

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
`;

async function migrate() {
  try {
    console.log('Running database migrations...');
    await pool.query(migrations);
    console.log('Database migrated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
