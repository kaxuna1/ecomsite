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
    variantId: item.variant_id ?? undefined,
    name: item.name,
    price: parseFloat(item.price),
    quantity: item.quantity
  }))
});

const getItems = async (orderId: number) => {
  const result = await pool.query(
    'SELECT product_id, variant_id, name, price, quantity FROM order_items WHERE order_id = $1',
    [orderId]
  );
  return result.rows;
};

const getItemsForOrders = async (orderIds: number[]) => {
  if (orderIds.length === 0) return new Map<number, any[]>();

  const result = await pool.query(
    'SELECT order_id, product_id, variant_id, name, price, quantity FROM order_items WHERE order_id = ANY($1)',
    [orderIds]
  );

  const itemsByOrderId = new Map<number, any[]>();
  for (const row of result.rows) {
    const items = itemsByOrderId.get(row.order_id) ?? [];
    items.push(row);
    itemsByOrderId.set(row.order_id, items);
  }

  return itemsByOrderId;
};

export const orderService = {
  async list() {
    const ordersResult = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    const itemsByOrderId = await getItemsForOrders(ordersResult.rows.map((row) => row.id));
    const orders = ordersResult.rows.map((row) => {
      const items = itemsByOrderId.get(row.id) ?? [];
      return mapOrder(row, items);
    });
    return orders;
  },
  async listByUserId(userId: number) {
    const ordersResult = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    const itemsByOrderId = await getItemsForOrders(ordersResult.rows.map((row) => row.id));
    const orders = ordersResult.rows.map((row) => {
      const items = itemsByOrderId.get(row.id) ?? [];
      return mapOrder(row, items);
    });
    return orders;
  },
  async create(payload: OrderPayload, userId?: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Process each item
      const orderItems: Array<{
        productId: number;
        variantId: number | null;
        name: string;
        price: number;
        quantity: number;
      }> = [];
      let calculatedSubtotal = 0;
      for (const item of payload.items) {
        if (item.variantId) {
          const variantResult = await client.query(
            `SELECT
              pv.id,
              pv.product_id,
              pv.price,
              pv.sale_price,
              pv.inventory,
              p.name,
              p.price as product_price,
              p.sale_price as product_sale_price
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            WHERE pv.id = $1 AND p.id = $2
            FOR UPDATE`,
            [item.variantId, item.productId]
          );

          if (variantResult.rows.length === 0) {
            throw new Error(`Variant ${item.variantId} not found for product ${item.productId}`);
          }

          const variant = variantResult.rows[0];
          if (variant.inventory < item.quantity) {
            throw new Error(`Insufficient inventory for variant ${variant.id}`);
          }

          const unitPrice =
            variant.sale_price ?? variant.price ?? variant.product_sale_price ?? variant.product_price;
          if (unitPrice === null || unitPrice === undefined) {
            throw new Error(`Price not available for variant ${variant.id}`);
          }

          calculatedSubtotal += Number(unitPrice) * item.quantity;

          orderItems.push({
            productId: variant.product_id,
            variantId: variant.id,
            name: variant.name,
            price: Number(unitPrice),
            quantity: item.quantity
          });

          await client.query(
            'UPDATE product_variants SET inventory = inventory - $1 WHERE id = $2',
            [item.quantity, variant.id]
          );
        } else {
          // Check product exists and has inventory
          const productResult = await client.query(
            'SELECT id, name, price, sale_price, inventory FROM products WHERE id = $1 FOR UPDATE',
            [item.productId]
          );

          if (productResult.rows.length === 0) {
            throw new Error(`Product ${item.productId} not found`);
          }

          const product = productResult.rows[0];
          if (product.inventory < item.quantity) {
            throw new Error(`Insufficient inventory for product ${product.id}`);
          }

          const unitPrice = product.sale_price ?? product.price;
          calculatedSubtotal += Number(unitPrice) * item.quantity;

          orderItems.push({
            productId: product.id,
            variantId: null,
            name: product.name,
            price: Number(unitPrice),
            quantity: item.quantity
          });

          // Update inventory
          await client.query(
            'UPDATE products SET inventory = inventory - $1 WHERE id = $2',
            [item.quantity, item.productId]
          );
        }
      }

      const roundCurrency = (value: number) => Math.round(value * 100) / 100;
      const subtotal = roundCurrency(calculatedSubtotal);

      let promoCodeId: number | null = null;
      let discountAmount = 0;
      let promoCodeType: string | null = null;

      if (payload.promoCode) {
        let promoCode = payload.promoCode.code
          ? await promoCodeService.getByCode(payload.promoCode.code)
          : null;

        if (!promoCode && payload.promoCode.id) {
          promoCode = await promoCodeService.getById(payload.promoCode.id);
        }

        if (!promoCode) {
          throw new Error('Promo code not found');
        }

        const validation = await promoCodeService.validate(promoCode.code, subtotal, userId);
        if (!validation.valid || !validation.promoCode) {
          throw new Error(validation.error || 'Invalid promo code');
        }

        promoCodeId = validation.promoCode.id;
        promoCodeType = validation.promoCode.discountType;
        discountAmount = roundCurrency(Math.max(validation.discountAmount ?? 0, 0));
      }

      const discountedSubtotal = Math.max(subtotal - discountAmount, 0);
      const shipping = promoCodeType === 'FREE_SHIPPING'
        ? 0
        : discountedSubtotal >= 50
          ? 0
          : 9.99;
      const tax = roundCurrency(discountedSubtotal * 0.1);
      const expectedTotal = roundCurrency(discountedSubtotal + shipping + tax);
      const payloadTotal = Number(payload.total);

      if (Number.isNaN(payloadTotal) || Math.abs(payloadTotal - expectedTotal) > 0.01) {
        throw new Error('Order total is invalid');
      }

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
          expectedTotal,
          userId ?? null,
          payload.addressId ?? null,
          promoCodeId,
          discountAmount
        ]
      );
      const orderId = orderResult.rows[0].id;

      for (const item of orderItems) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, variant_id, name, price, quantity) VALUES ($1, $2, $3, $4, $5, $6)',
          [orderId, item.productId, item.variantId, item.name, item.price, item.quantity]
        );
      }

      await client.query('COMMIT');

      // Record promo code usage after the order commit so the order_id FK is valid.
      if (promoCodeId) {
        try {
          await promoCodeService.recordUsage(
            promoCodeId,
            orderId,
            discountAmount,
            userId
          );
        } catch (error) {
          console.error('Failed to record promo code usage:', error);
        }
      }

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
