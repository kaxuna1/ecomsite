import { pool } from '../db/client';

async function fixOrder() {
  try {
    // Update order #2 to associate with user_id = 1
    const result = await pool.query(
      'UPDATE orders SET user_id = $1 WHERE id = $2 AND user_id IS NULL RETURNING *',
      [1, 2]
    );

    if (result.rows.length > 0) {
      console.log('✓ Order #2 updated successfully');
      console.log('Order details:', result.rows[0]);
    } else {
      console.log('Order #2 not found or already has a user_id');

      // Check if order exists
      const check = await pool.query('SELECT id, user_id, customer_name FROM orders WHERE id = 2');
      if (check.rows.length > 0) {
        console.log('Order #2 exists with:', check.rows[0]);
      } else {
        console.log('Order #2 does not exist in database');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Failed to update order:', error);
    process.exit(1);
  }
}

fixOrder();
