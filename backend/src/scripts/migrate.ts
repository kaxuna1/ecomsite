import { db } from '../db/client';

const migrations = `
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL,
  image_url TEXT NOT NULL,
  inventory INTEGER NOT NULL DEFAULT 0,
  categories TEXT NOT NULL,
  highlights TEXT,
  usage TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_notes TEXT,
  customer_address TEXT NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);
`;

db.exec(migrations);

console.log('Database migrated');
