import { pool } from '../db/client';

async function addPromoCodesTables() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Creating promo_codes table...');

    // Create promo_codes table
    await client.query(`
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
        valid_from TIMESTAMP NOT NULL,
        valid_until TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Creating promo_code_usage table...');

    // Create promo_code_usage tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS promo_code_usage (
        id SERIAL PRIMARY KEY,
        promo_code_id INTEGER NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        discount_applied DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
      CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
      CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_dates ON promo_codes(valid_from, valid_until);
      CREATE INDEX IF NOT EXISTS idx_promo_code_usage_promo_id ON promo_code_usage(promo_code_id);
      CREATE INDEX IF NOT EXISTS idx_promo_code_usage_user_id ON promo_code_usage(user_id);
    `);

    // Add promo_code_id column to orders table
    console.log('Adding promo_code_id to orders table...');
    await client.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS promo_code_id INTEGER REFERENCES promo_codes(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;
    `);

    // Insert sample promo codes for testing
    console.log('Inserting sample promo codes...');
    await client.query(`
      INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, valid_from, valid_until, is_active)
      VALUES
        ('WELCOME20', 'Welcome discount for new customers', 'PERCENTAGE', 20, 50, NULL, 100, NOW(), NOW() + INTERVAL '30 days', true),
        ('SAVE10', 'Save $10 on orders over $30', 'FIXED_AMOUNT', 10, 30, NULL, NULL, NOW(), NOW() + INTERVAL '60 days', true),
        ('FREESHIP', 'Free shipping on all orders', 'FREE_SHIPPING', 0, 25, NULL, 50, NOW(), NOW() + INTERVAL '90 days', true),
        ('SUMMER25', '25% off summer sale', 'PERCENTAGE', 25, 100, 50, NULL, NOW(), NOW() + INTERVAL '45 days', true),
        ('EXPIRED10', 'Expired promo code', 'PERCENTAGE', 10, 0, NULL, NULL, NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', false)
      ON CONFLICT (code) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ Promo codes tables created and sample data inserted successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating promo codes tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

addPromoCodesTables()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
