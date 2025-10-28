-- Migration: Create Footer Settings Table
-- Description: Stores editable footer content with support for multiple column sections,
-- social links, legal links, and newsletter signup

CREATE TABLE IF NOT EXISTS footer_settings (
  id BIGSERIAL PRIMARY KEY,

  -- Brand Section
  brand_name VARCHAR(255) NOT NULL DEFAULT 'LUXIA',
  brand_tagline TEXT,
  brand_logo_url VARCHAR(500),

  -- Footer Columns (stored as JSONB for flexibility)
  -- Structure: [{ title: string, links: [{ label: string, url: string, is_external: boolean }] }]
  footer_columns JSONB DEFAULT '[]'::jsonb,

  -- Contact Information
  contact_info JSONB DEFAULT '{}'::jsonb,
  -- Structure: { address: { label: string, street: string, city: string, country: string },
  --             email: string, phone: string }

  -- Social Media Links
  social_links JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ platform: string, url: string, icon: string, is_enabled: boolean }]

  -- Newsletter Section
  newsletter_enabled BOOLEAN DEFAULT true,
  newsletter_title VARCHAR(255) DEFAULT 'Stay Connected',
  newsletter_description TEXT DEFAULT 'Subscribe to receive exclusive offers and updates',
  newsletter_placeholder VARCHAR(255) DEFAULT 'Enter your email',
  newsletter_button_text VARCHAR(100) DEFAULT 'Subscribe',

  -- Legal & Bottom Section
  copyright_text TEXT,
  bottom_links JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ label: string, url: string }]

  -- Style Settings
  background_color VARCHAR(20) DEFAULT '#1a1d24',
  text_color VARCHAR(20) DEFAULT '#e8c7c8',
  accent_color VARCHAR(20) DEFAULT '#8bba9c',

  -- Layout Settings
  layout_type VARCHAR(50) DEFAULT 'multi-column',
  -- Options: 'minimal', 'multi-column', 'centered', 'mega'

  columns_count INTEGER DEFAULT 3,
  show_dividers BOOLEAN DEFAULT false,

  -- Metadata
  is_published BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_footer_settings_published ON footer_settings(is_published);

-- Insert default footer settings
INSERT INTO footer_settings (
  brand_name,
  brand_tagline,
  footer_columns,
  contact_info,
  social_links,
  copyright_text,
  bottom_links
) VALUES (
  'LUXIA',
  'Luxury scalp care crafted with precision',
  '[
    {
      "title": "Shop",
      "links": [
        {"label": "All Products", "url": "/products", "is_external": false},
        {"label": "Best Sellers", "url": "/products?filter=bestsellers", "is_external": false},
        {"label": "New Arrivals", "url": "/products?filter=new", "is_external": false},
        {"label": "Gift Sets", "url": "/products?category=gifts", "is_external": false}
      ]
    },
    {
      "title": "About",
      "links": [
        {"label": "Our Story", "url": "/about", "is_external": false},
        {"label": "Ingredients", "url": "/ingredients", "is_external": false},
        {"label": "Sustainability", "url": "/sustainability", "is_external": false},
        {"label": "Reviews", "url": "/reviews", "is_external": false}
      ]
    },
    {
      "title": "Help",
      "links": [
        {"label": "Contact Us", "url": "/contact", "is_external": false},
        {"label": "Shipping & Returns", "url": "/shipping", "is_external": false},
        {"label": "FAQ", "url": "/faq", "is_external": false},
        {"label": "Track Order", "url": "/track", "is_external": false}
      ]
    }
  ]'::jsonb,
  '{
    "address": {
      "label": "Visit Us",
      "street": "88 Crown Street",
      "city": "New York, NY 10013",
      "country": "United States"
    },
    "email": "hello@luxiaproducts.com",
    "phone": "(212) 555-0199"
  }'::jsonb,
  '[
    {"platform": "instagram", "url": "https://instagram.com/luxia", "icon": "instagram", "is_enabled": true},
    {"platform": "facebook", "url": "https://facebook.com/luxia", "icon": "facebook", "is_enabled": true},
    {"platform": "twitter", "url": "https://twitter.com/luxia", "icon": "twitter", "is_enabled": false},
    {"platform": "youtube", "url": "https://youtube.com/luxia", "icon": "youtube", "is_enabled": false}
  ]'::jsonb,
  'Crafted with care',
  '[
    {"label": "Privacy Policy", "url": "/privacy"},
    {"label": "Terms of Service", "url": "/terms"},
    {"label": "Accessibility", "url": "/accessibility"}
  ]'::jsonb
) ON CONFLICT DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_footer_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER footer_settings_update_timestamp
  BEFORE UPDATE ON footer_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_footer_settings_timestamp();

-- Add comment for documentation
COMMENT ON TABLE footer_settings IS 'Stores editable footer content and styling for the e-commerce site';
