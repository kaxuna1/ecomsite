import { pool } from '../db/client';

async function updateProductMetadata() {
  try {
    console.log('Updating product metadata...');

    // Update products with varied metadata
    const updates = [
      // Product 1 - New & Featured
      { id: 1, is_new: true, is_featured: true, sale_price: null, sales_count: 342 },
      // Product 2 - On Sale
      { id: 2, is_new: false, is_featured: false, sale_price: 78.40, sales_count: 156 }, // 20% off from $98
      // Product 3 - Featured
      { id: 3, is_new: false, is_featured: true, sale_price: null, sales_count: 289 },
      // Product 4 - New & On Sale
      { id: 4, is_new: true, is_featured: false, sale_price: 116.00, sales_count: 98 }, // 20% off from $145
      // Product 5 - Featured & On Sale
      { id: 5, is_new: false, is_featured: true, sale_price: 111.20, sales_count: 412 }, // 20% off from $139
      // Product 6 - New
      { id: 6, is_new: true, is_featured: false, sale_price: null, sales_count: 67 },
      // Product 7 - On Sale
      { id: 7, is_new: false, is_featured: false, sale_price: 47.20, sales_count: 203 }, // 20% off from $59
      // Product 8 - Featured
      { id: 8, is_new: false, is_featured: true, sale_price: null, sales_count: 378 }
    ];

    for (const update of updates) {
      await pool.query(
        `UPDATE products
         SET is_new = $1, is_featured = $2, sale_price = $3, sales_count = $4
         WHERE id = $5`,
        [update.is_new, update.is_featured, update.sale_price, update.sales_count, update.id]
      );
      console.log(`Updated product ${update.id}`);
    }

    console.log('Product metadata updated successfully!');
    console.log('\nSummary:');
    console.log('- New Arrivals: 4 products (IDs: 1, 4, 6)');
    console.log('- Best Sellers (Featured): 4 products (IDs: 1, 3, 5, 8)');
    console.log('- On Sale: 4 products (IDs: 2, 4, 5, 7)');

    process.exit(0);
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
}

updateProductMetadata();
