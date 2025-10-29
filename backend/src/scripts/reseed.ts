import { pool } from '../db/client';

const reseed = async () => {
  try {
    console.log('Clearing existing data...');
    await pool.query('DELETE FROM order_items');
    console.log('✓ Order items cleared');
    await pool.query('DELETE FROM orders');
    console.log('✓ Orders cleared');
    await pool.query('DELETE FROM products');
    console.log('✓ Products cleared');

    console.log('\nRunning seed script...');
    await import('./seed');
  } catch (error) {
    console.error('Reseed failed:', error);
    throw error;
  }
};

reseed().catch((error) => {
  console.error('Failed to reseed database', error);
  process.exit(1);
});
