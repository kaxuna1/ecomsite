import { pool } from '../db/client';
import type { OrderPayload } from '../types';
import { promoCodeService } from './promoCodeService';

const mapOrder = (row: any, items: any[]) => ({
  id: row.id,
  customer: {
    name: row.customer_name,
    email: row.customer_email,
    phone: row.customer_phone ?? undefined,
    notes: row.customer_notes ?? undefined,
    address: row.customer_address
  },
  total: parseFloat(row.total),
  status: row.status,
  createdAt: row.created_at,
  items: items.map((item) => ({
    productId: item.product_id,
    name: item.name,
    price: parseFloat(item.price),
    quantity: item.quantity
  }))
});

const getItems = async (orderId: number) => {
  const result = await pool.query(
    'SELECT product_id, name, price, quantity FROM order_items WHERE order_id = $1',
    [orderId]
  );
  return result.rows;
};

export const orderService = {
  async list() {
    const ordersResult = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = await Promise.all(
      ordersResult.rows.map(async (row) => {
        const items = await getItems(row.id);
        return mapOrder(row, items);
      })
    );
    return orders;
  },
  async listByUserId(userId: number) {
    const ordersResult = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    const orders = await Promise.all(
      ordersResult.rows.map(async (row) => {
        const items = await getItems(row.id);
        return mapOrder(row, items);
      })
    );
    return orders;
  },
  async create(payload: OrderPayload, userId?: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert order (with optional user_id, address_id, and promo code)
      const orderResult = await client.query(
        `INSERT INTO orders (customer_name, customer_email, customer_phone, customer_notes, customer_address, total, status, user_id, address_id, promo_code_id, discount_amount)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10)
         RETURNING *`,
        [
          payload.customer.name,
          payload.customer.email,
          payload.customer.phone ?? null,
          payload.customer.notes ?? null,
          payload.customer.address,
          payload.total,
          userId ?? null,
          payload.addressId ?? null,
          payload.promoCode?.id ?? null,
          payload.promoCode?.discount ?? 0
        ]
      );
      const orderId = orderResult.rows[0].id;

      // Process each item
      for (const item of payload.items) {
        // Check product exists and has inventory
        const productResult = await client.query(
          'SELECT id, name, price, inventory FROM products WHERE id = $1',
          [item.productId]
        );

        if (productResult.rows.length === 0) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const product = productResult.rows[0];
        if (product.inventory < item.quantity) {
          throw new Error(`Insufficient inventory for product ${product.id}`);
        }

        // Insert order item
        await client.query(
          'INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES ($1, $2, $3, $4, $5)',
          [orderId, product.id, product.name, product.price, item.quantity]
        );

        // Update inventory
        await client.query(
          'UPDATE products SET inventory = inventory - $1 WHERE id = $2',
          [item.quantity, item.productId]
        );
      }

      // Record promo code usage if applied
      if (payload.promoCode) {
        await promoCodeService.recordUsage(
          payload.promoCode.id,
          orderId,
          payload.promoCode.discount,
          userId
        );
      }

      await client.query('COMMIT');

      // Fetch and return the complete order
      const finalOrderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
      const items = await getItems(orderId);
      return mapOrder(finalOrderResult.rows[0], items);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  async updateStatus(id: number, status: string) {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) return null;
    const items = await getItems(id);
    return mapOrder(result.rows[0], items);
  }
};
