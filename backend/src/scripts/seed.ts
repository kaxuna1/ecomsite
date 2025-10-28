import { pool } from '../db/client';

const ensureSampleProduct = async () => {
  const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM products');
  const count = Number(rows[0]?.count ?? '0');
  if (count > 0) {
    console.log('Products already exist, skipping seed');
    return;
  }

  await pool.query(
    `INSERT INTO products
      (name, short_description, description, price, image_url, image_key, inventory, categories, highlights, usage)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10)`,
    [
      'Luminescent Scalp Renewal Elixir',
      'Revitalize the scalp with a cold-pressed botanical concentrate.',
      `Our signature elixir delivers a weekly reset ritual infused with neroli blossom, rare tea seed oil, and marine minerals.
Designed to soothe micro-inflammation while restoring the scalp's natural barrier for lustrous, resilient hair.`,
      128,
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
      'seed/luminescent-scalp-renewal-elixir.jpg',
      50,
      JSON.stringify(['rituals', 'treatments']),
      JSON.stringify([
        'Clinically balanced for sensitive scalps',
        'Infused with adaptogenic botanicals and cold-pressed oils',
        'Glass vessel with refill program compatibility'
      ]),
      'Warm 3-5 drops between palms and press into the scalp before evening repose. Follow with a silk wrap overnight.'
    ]
  );

  console.log('Inserted sample product');
};

const seed = async () => {
  try {
    await ensureSampleProduct();
  } finally {
    await pool.end();
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch((error) => {
    console.error('Failed to seed database', error);
    process.exitCode = 1;
  });
}
