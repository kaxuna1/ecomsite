import { fileURLToPath } from 'url';
import { pool } from '../db/client';

export const runMigrations = async () => {
  const statements = [
    `CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      short_description TEXT NOT NULL,
      description TEXT NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      image_url TEXT NOT NULL,
      image_key TEXT NOT NULL,
      inventory INTEGER NOT NULL DEFAULT 0,
      categories JSONB NOT NULL,
      highlights JSONB,
      usage TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      customer_notes TEXT,
      customer_address TEXT NOT NULL,
      total NUMERIC(10, 2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      name TEXT NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      quantity INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`
  ];

  for (const statement of statements) {
    await pool.query(statement);
  }
};

const scriptPath = fileURLToPath(import.meta.url);

if (process.argv[1]?.endsWith(scriptPath)) {
  runMigrations()
    .then(() => {
      console.log('Database migrated');
    })
    .catch((error) => {
      console.error('Migration failed', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await pool.end();
    });
}
