import { pool } from '../db/client';

const sampleProducts = [
  {
    name: 'Luminescent Scalp Renewal Elixir',
    shortDescription: 'Revitalize the scalp with a cold-pressed botanical concentrate.',
    description: `Our signature elixir delivers a weekly reset treatment infused with neroli blossom, rare tea seed oil, and marine minerals. Designed to soothe micro-inflammation while restoring the scalp's natural barrier for lustrous, resilient hair.`,
    price: 128,
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
    inventory: 50,
    categories: ['products', 'treatments'],
    highlights: [
      'Clinically balanced for sensitive scalps',
      'Infused with adaptogenic botanicals and cold-pressed oils',
      'Glass vessel with refill program compatibility'
    ],
    usage: 'Warm 3-5 drops between palms and press into the scalp before evening repose. Follow with a silk wrap overnight.',
    customAttributes: {
      volume: '50ml',
      hair_type: ['normal'],
      scalp_type: ['sensitive'],
      scent: 'unscented',
      ingredients: ['argan-oil', 'tea-tree'],
      organic: true,
      vegan: true,
      paraben_free: true,
      sulfate_free: true,
      cruelty_free: true,
      application_method: 'dropper',
      texture: 'oil'
    }
  },
  {
    name: 'Silk Protein Hair Mask',
    shortDescription: 'Deep conditioning treatment with hydrolyzed silk proteins.',
    description: `This luxurious hair mask combines hydrolyzed silk proteins with argan oil and keratin to deeply nourish and repair damaged hair. Perfect for weekly intensive care treatments.`,
    price: 98,
    imageUrl: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?auto=format&fit=crop&w=1200&q=80',
    inventory: 75,
    categories: ['treatments', 'masks'],
    highlights: [
      'Restores shine and elasticity',
      'Repairs split ends and breakage',
      'Sulfate-free and paraben-free formula'
    ],
    usage: 'Apply generously to damp hair after shampooing. Leave for 10-15 minutes, then rinse thoroughly.',
    customAttributes: {
      volume: '200ml',
      hair_type: ['damaged'],
      scalp_type: ['sensitive'],
      scent: 'lavender',
      ingredients: ['argan-oil', 'keratin'],
      organic: false,
      vegan: false,
      paraben_free: true,
      sulfate_free: true,
      cruelty_free: true,
      application_method: 'direct',
      texture: 'cream'
    }
  },
  {
    name: 'Botanical Scalp Scrub',
    shortDescription: 'Gentle exfoliating treatment with sea salt and essential oils.',
    description: `A purifying scalp treatment that removes buildup and dead skin cells while promoting circulation. Enriched with tea tree oil, peppermint, and mineral-rich sea salt for a refreshing cleanse.`,
    price: 72,
    imageUrl: 'https://images.unsplash.com/photo-1556228852-80ec0a6b5895?auto=format&fit=crop&w=1200&q=80',
    inventory: 60,
    categories: ['treatments', 'cleansers'],
    highlights: [
      'Deep cleanses without stripping natural oils',
      'Promotes healthy hair growth',
      'Cooling sensation for refreshed scalp'
    ],
    usage: 'Apply to wet scalp and massage gently in circular motions for 2-3 minutes. Rinse thoroughly and follow with shampoo.',
    customAttributes: {
      volume: '100ml',
      hair_type: ['oily'],
      scalp_type: ['flaky'],
      scent: 'mint',
      ingredients: ['tea-tree'],
      organic: true,
      vegan: true,
      paraben_free: true,
      sulfate_free: true,
      cruelty_free: true,
      application_method: 'direct',
      texture: 'gel'
    }
  },
  {
    name: 'Rose Gold Hair Oil',
    shortDescription: 'Lightweight finishing oil with 24k gold flakes and rose essence.',
    description: `An ultra-luxe finishing oil that adds instant shine and tames frizz without weighing hair down. Infused with precious rose otto oil and suspended 24k gold flakes for a luminous finish.`,
    price: 145,
    imageUrl: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=80',
    inventory: 40,
    categories: ['styling', 'oils'],
    highlights: [
      'Non-greasy, fast-absorbing formula',
      'Protects against heat styling damage',
      'Signature rose and sandalwood fragrance'
    ],
    usage: 'Apply 1-2 drops to palms and distribute through mid-lengths to ends on damp or dry hair.',
    customAttributes: {
      volume: '50ml',
      hair_type: ['dry'],
      scalp_type: ['sensitive'],
      scent: 'rose',
      ingredients: ['argan-oil'],
      organic: false,
      vegan: true,
      paraben_free: true,
      sulfate_free: true,
      cruelty_free: true,
      application_method: 'dropper',
      texture: 'oil'
    }
  },
  {
    name: 'Volumizing Root Spray',
    shortDescription: 'Lightweight lift with bamboo extract and biotin.',
    description: `Create lasting volume from roots to tips with this innovative spray formula. Bamboo extract provides natural lift while biotin strengthens hair from within.`,
    price: 56,
    imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=1200&q=80',
    inventory: 100,
    categories: ['styling', 'volume'],
    highlights: [
      'Weightless, buildable volume',
      'Heat protectant properties',
      'Humidity-resistant formula'
    ],
    usage: 'Spray onto roots of damp hair, section by section. Blow dry with a round brush for maximum lift.',
    customAttributes: {
      volume: '100ml',
      hair_type: ['normal'],
      scalp_type: ['sensitive'],
      scent: 'citrus',
      ingredients: ['biotin'],
      organic: false,
      vegan: true,
      paraben_free: true,
      sulfate_free: true,
      cruelty_free: true,
      application_method: 'spray',
      texture: 'liquid'
    }
  },
  {
    name: 'Midnight Recovery Hair Serum',
    shortDescription: 'Overnight repair treatment with ceramides and peptides.',
    description: `Transform your hair while you sleep with this intensive repair serum. Packed with ceramides, peptides, and hyaluronic acid to rebuild the hair structure overnight.`,
    price: 112,
    imageUrl: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?auto=format&fit=crop&w=1200&q=80',
    inventory: 55,
    categories: ['treatments', 'serums'],
    highlights: [
      'Repairs damage at molecular level',
      'Reduces breakage by up to 80%',
      'Wake up to softer, stronger hair'
    ],
    usage: 'Apply to dry hair before bed, focusing on ends. Leave in overnight, no rinse required.',
    customAttributes: {
      volume: '50ml',
      hair_type: ['damaged'],
      scalp_type: ['sensitive'],
      scent: 'lavender',
      ingredients: ['keratin', 'collagen'],
      organic: false,
      vegan: false,
      paraben_free: true,
      sulfate_free: true,
      cruelty_free: true,
      application_method: 'pump',
      texture: 'serum'
    }
  },
  {
    name: 'Clarifying Charcoal Shampoo',
    shortDescription: 'Detoxifying cleanser with activated charcoal and mint.',
    description: `Reset your scalp with this deep-cleansing shampoo featuring activated charcoal to draw out impurities and peppermint oil for an invigorating cleanse. Ideal for weekly detox.`,
    price: 48,
    imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=1200&q=80',
    inventory: 85,
    categories: ['cleansers', 'shampoo'],
    highlights: [
      'Removes product buildup and pollution',
      'Balances oil production',
      'Vegan and cruelty-free'
    ],
    usage: 'Use once weekly in place of regular shampoo. Massage into wet scalp, lather, and rinse thoroughly.',
    customAttributes: {
      volume: '250ml',
      hair_type: ['oily'],
      scalp_type: ['oily'],
      scent: 'mint',
      ingredients: ['tea-tree'],
      organic: false,
      vegan: true,
      paraben_free: true,
      sulfate_free: false,
      cruelty_free: true,
      application_method: 'direct',
      texture: 'liquid'
    }
  },
  {
    name: 'Hydrating Cream Conditioner',
    shortDescription: 'Daily moisture with shea butter and coconut milk.',
    description: `Quench thirsty hair with this rich, creamy conditioner. Shea butter and coconut milk provide deep hydration while detangling and softening every strand.`,
    price: 42,
    imageUrl: 'https://images.unsplash.com/photo-1556229010-aa3dfc65e3b8?auto=format&fit=crop&w=1200&q=80',
    inventory: 120,
    categories: ['conditioner', 'daily-care'],
    highlights: [
      'Instant detangling action',
      'Long-lasting moisture',
      'Color-safe formula'
    ],
    usage: 'Apply to clean, damp hair after shampooing. Leave for 2-3 minutes, then rinse.',
    customAttributes: {
      volume: '250ml',
      hair_type: ['dry'],
      scalp_type: ['sensitive'],
      scent: 'unscented',
      ingredients: ['argan-oil', 'collagen'],
      organic: true,
      vegan: true,
      paraben_free: true,
      sulfate_free: true,
      cruelty_free: true,
      application_method: 'direct',
      texture: 'cream'
    }
  },
  {
    name: 'Color Protect Hair Treatment',
    shortDescription: 'UV protection and color lock for vibrant, long-lasting color.',
    description: `Specially formulated for color-treated hair, this intensive treatment locks in color while protecting against UV damage and environmental stressors.`,
    price: 89,
    imageUrl: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&w=1200&q=80',
    inventory: 65,
    categories: ['treatments', 'color-care'],
    highlights: [
      'Extends color vibrancy by 50%',
      'UV protection formula',
      'Prevents color fade and brassiness'
    ],
    usage: 'Apply to damp hair after shampooing, leave for 5 minutes, then rinse.',
    customAttributes: {
      volume: '200ml',
      hair_type: ['color-treated'],
      scalp_type: ['sensitive'],
      scent: 'citrus',
      ingredients: ['argan-oil', 'keratin'],
      organic: false,
      vegan: false,
      paraben_free: true,
      sulfate_free: true,
      cruelty_free: true,
      application_method: 'pump',
      texture: 'cream'
    }
  },
  {
    name: 'Tea Tree Scalp Treatment',
    shortDescription: 'Purifying treatment for itchy, irritated scalp.',
    description: `Soothe and purify your scalp with this concentrated tea tree oil treatment. Combats dandruff, reduces itchiness, and promotes a healthy scalp environment.`,
    price: 54,
    imageUrl: 'https://images.unsplash.com/photo-1556228841-c0e1f86b18dc?auto=format&fit=crop&w=1200&q=80',
    inventory: 70,
    categories: ['treatments', 'scalp-care'],
    highlights: [
      'Natural antifungal and antibacterial properties',
      'Reduces dandruff and flaking',
      'Cooling, tingling sensation'
    ],
    usage: 'Apply directly to scalp, massage gently, leave for 10 minutes before shampooing.',
    customAttributes: {
      volume: '50ml',
      hair_type: ['oily'],
      scalp_type: ['itchy'],
      scent: 'mint',
      ingredients: ['tea-tree'],
      organic: true,
      vegan: true,
      paraben_free: true,
      sulfate_free: true,
      cruelty_free: true,
      application_method: 'dropper',
      texture: 'liquid'
    }
  }
];

const ensureSampleProducts = async () => {
  const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM products');
  const count = Number(rows[0]?.count ?? '0');
  if (count > 0) {
    console.log(`Products already exist (${count} products found), skipping seed`);
    return;
  }

  console.log(`Inserting ${sampleProducts.length} sample products...`);

  for (const product of sampleProducts) {
    await pool.query(
      `INSERT INTO products
        (name, short_description, description, price, image_url, inventory, categories, highlights, usage, custom_attributes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        product.name,
        product.shortDescription,
        product.description,
        product.price,
        product.imageUrl,
        product.inventory,
        JSON.stringify(product.categories),
        JSON.stringify(product.highlights),
        product.usage,
        JSON.stringify(product.customAttributes)
      ]
    );
    console.log(`✓ Inserted: ${product.name}`);
  }

  console.log(`\n✅ Successfully inserted ${sampleProducts.length} products`);
};

const seed = async () => {
  try {
    await ensureSampleProducts();
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

seed().catch((error) => {
  console.error('Failed to seed database', error);
  process.exit(1);
});
