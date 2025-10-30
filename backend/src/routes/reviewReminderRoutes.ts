import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import { sendBatchReviewReminders } from '../services/notificationService';
import { pool } from '../db/client';

const router = Router();

/**
 * POST /api/admin/review-reminders/send
 * Send review reminders to customers who recently made purchases
 * Admin only - typically called by a cron job
 */
router.post('/send', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { daysAgo = 7, limit = 50 } = req.body;

    // Get completed orders from N days ago that don't have reviews yet
    const query = `
      SELECT DISTINCT
        o.id as order_id,
        o.customer_name,
        o.customer_email,
        oi.product_id,
        p.name as product_name,
        p.image_url as product_image_url
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_reviews pr ON pr.product_id = oi.product_id AND (
        pr.user_id = o.user_id OR
        pr.reviewer_email = o.customer_email
      )
      WHERE o.status = 'fulfilled'
        AND o.created_at >= NOW() - INTERVAL '${daysAgo + 1} days'
        AND o.created_at <= NOW() - INTERVAL '${daysAgo} days'
        AND pr.id IS NULL
      ORDER BY o.created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    // Group by customer email and order
    const ordersMap = new Map<string, any>();

    for (const row of result.rows) {
      const key = `${row.customer_email}-${row.order_id}`;

      if (!ordersMap.has(key)) {
        ordersMap.set(key, {
          customerEmail: row.customer_email,
          customerName: row.customer_name,
          orderId: row.order_id,
          items: []
        });
      }

      ordersMap.get(key).items.push({
        productId: row.product_id,
        productName: row.product_name,
        productImageUrl: row.product_image_url
      });
    }

    const orders = Array.from(ordersMap.values());

    // Send batch reminders
    const sentCount = await sendBatchReviewReminders(orders);

    res.json({
      success: true,
      ordersProcessed: orders.length,
      remindersSent: sentCount,
      daysAgo,
      limit
    });
  } catch (error: any) {
    console.error('Error sending review reminders:', error);
    res.status(500).json({
      message: error.message || 'Failed to send review reminders'
    });
  }
});

/**
 * GET /api/admin/review-reminders/preview
 * Preview which customers would receive reminders
 * Admin only - useful for testing before sending
 */
router.get('/preview', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const daysAgo = parseInt(req.query.daysAgo as string) || 7;
    const limit = parseInt(req.query.limit as string) || 50;

    // Get completed orders from N days ago that don't have reviews yet
    const query = `
      SELECT DISTINCT
        o.id as order_id,
        o.customer_name,
        o.customer_email,
        o.created_at,
        COUNT(DISTINCT oi.product_id) as product_count
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN product_reviews pr ON pr.product_id = oi.product_id AND (
        pr.user_id = o.user_id OR
        pr.reviewer_email = o.customer_email
      )
      WHERE o.status = 'fulfilled'
        AND o.created_at >= NOW() - INTERVAL '${daysAgo + 1} days'
        AND o.created_at <= NOW() - INTERVAL '${daysAgo} days'
        AND pr.id IS NULL
      GROUP BY o.id, o.customer_name, o.customer_email, o.created_at
      ORDER BY o.created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    res.json({
      orders: result.rows,
      count: result.rows.length,
      daysAgo,
      limit
    });
  } catch (error: any) {
    console.error('Error previewing review reminders:', error);
    res.status(500).json({
      message: error.message || 'Failed to preview review reminders'
    });
  }
});

export default router;
