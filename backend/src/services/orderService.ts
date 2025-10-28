import { db } from '../db/client';
import type { OrderPayload } from '../types';

const mapOrder = (row: any) => ({
  id: row.id,
  customer: {
    name: row.customer_name,
    email: row.customer_email,
    phone: row.customer_phone ?? undefined,
    notes: row.customer_notes ?? undefined,
    address: row.customer_address
  },
  total: row.total,
  status: row.status,
  createdAt: row.created_at,
  items: getItems(row.id)
});

const getItems = (orderId: number) => {
  const stmt = db.prepare('SELECT product_id, name, price, quantity FROM order_items WHERE order_id = ?');
  return stmt.all(orderId).map((item) => ({
    productId: item.product_id,
    name: item.name,
    price: item.price,
    quantity: item.quantity
  }));
};

export const orderService = {
  list() {
    const stmt = db.prepare('SELECT * FROM orders ORDER BY created_at DESC');
    return stmt.all().map(mapOrder);
  },
  create: db.transaction((payload: OrderPayload) => {
    const insertOrder = db.prepare(`
      INSERT INTO orders (customer_name, customer_email, customer_phone, customer_notes, customer_address, total, status)
      VALUES (@name, @email, @phone, @notes, @address, @total, 'pending')
    `);
    const result = insertOrder.run({
      name: payload.customer.name,
      email: payload.customer.email,
      phone: payload.customer.phone ?? null,
      notes: payload.customer.notes ?? null,
      address: payload.customer.address,
      total: payload.total
    });
    const orderId = Number(result.lastInsertRowid);

    const productLookup = db.prepare('SELECT id, name, price, inventory FROM products WHERE id = ?');
    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (@orderId, @productId, @name, @price, @quantity)'
    );
    const updateInventory = db.prepare('UPDATE products SET inventory = inventory - ? WHERE id = ?');

    payload.items.forEach((item) => {
      const product = productLookup.get(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      if (product.inventory < item.quantity) {
        throw new Error(`Insufficient inventory for product ${product.id}`);
      }
      insertItem.run({
        orderId,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      });
      updateInventory.run(item.quantity, item.productId);
    });

    return mapOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId));
  }),
  updateStatus(id: number, status: string) {
    db.prepare('UPDATE orders SET status = ?, created_at = created_at WHERE id = ?').run(status, id);
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    return row ? mapOrder(row) : null;
  }
};
