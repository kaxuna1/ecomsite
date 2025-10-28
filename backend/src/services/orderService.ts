import type { PoolClient } from 'pg';
import { pool } from '../db/client';
import type { OrderPayload } from '../types';

interface OrderRow {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_notes: string | null;
  customer_address: string;
  total: number;
  status: string;
  created_at: string;
}

interface OrderItemRow {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
}

const mapOrder = (row: OrderRow, items: OrderItemRow[]) => ({
  id: row.id,
  customer: {
    name: row.customer_name,
    email: row.customer_email,
    phone: row.customer_phone ?? undefined,
    notes: row.customer_notes ?? undefined,
    address: row.customer_address
  },
  total: Number(row.total),
  status: row.status,
  createdAt: row.created_at,
  items: items.map((item) => ({
    productId: item.product_id,
    name: item.name,
    price: Number(item.price),
    quantity: item.quantity
  }))
});

const getOrderWithItems = async (id: number, client?: PoolClient) => {
  const executor = client ?? pool;
  const orderResult = await executor.query<OrderRow>('SELECT * FROM orders WHERE id = $1', [id]);
  if (orderResult.rowCount === 0) return null;
  const itemResult = await executor.query<OrderItemRow>(
    'SELECT product_id, name, price, quantity FROM order_items WHERE order_id = $1',
    [id]
  );
  return mapOrder(orderResult.rows[0], itemResult.rows);
};

export const orderService = {
  async list() {
    const result = await pool.query<OrderRow>('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = await Promise.all(result.rows.map((row) => getOrderWithItems(row.id)));
    return orders.filter((order): order is NonNullable<typeof order> => Boolean(order));
  },
  async create(payload: OrderPayload) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const orderResult = await client.query<OrderRow>(
        `INSERT INTO orders
          (customer_name, customer_email, customer_phone, customer_notes, customer_address, total, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')
         RETURNING *`,
        [
          payload.customer.name,
          payload.customer.email,
          payload.customer.phone ?? null,
          payload.customer.notes ?? null,
          payload.customer.address,
          Number(payload.total)
        ]
      );
      const order = orderResult.rows[0];

      for (const item of payload.items) {
        const productResult = await client.query(
          'SELECT id, name, price, inventory FROM products WHERE id = $1 FOR UPDATE',
          [item.productId]
        );
        if (productResult.rowCount === 0) {
          throw new Error(`Product ${item.productId} not found`);
        }
        const product = productResult.rows[0] as {
          id: number;
          name: string;
          price: number;
          inventory: number;
        };
        if (Number(product.inventory) < item.quantity) {
          throw new Error(`Insufficient inventory for product ${product.id}`);
        }

        await client.query(
          'INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES ($1, $2, $3, $4, $5)',
          [order.id, product.id, product.name, product.price, item.quantity]
        );
        await client.query('UPDATE products SET inventory = inventory - $1 WHERE id = $2', [item.quantity, product.id]);
      }

      await client.query('COMMIT');
      return await getOrderWithItems(order.id, client);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  async updateStatus(id: number, status: string) {
    const result = await pool.query<OrderRow>(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rowCount === 0) return null;
    return getOrderWithItems(id);
  }
};
