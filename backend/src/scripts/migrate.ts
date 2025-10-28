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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO languages (code, name, native_name, is_enabled, is_default)
VALUES
  ('en', 'English', 'English', TRUE, TRUE),
  ('ka', 'Georgian', 'ქართული', TRUE, FALSE)
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
