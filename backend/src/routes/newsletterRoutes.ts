/**
 * Newsletter Routes
 *
 * Routes for newsletter subscription management
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import * as newsletterService from '../services/newsletterService';

const router = Router();

/**
 * POST /api/newsletter/subscribe
 *
 * Public endpoint for newsletter subscription
 * No authentication required
 */
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { email, name, source } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Get IP address and user agent
    const ip_address = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;
    const user_agent = req.headers['user-agent'];

    const subscription = await newsletterService.createSubscription({
      email,
      name,
      source: source || 'website',
      ip_address,
      user_agent
    });

    return res.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: {
        id: subscription.id,
        email: subscription.email,
        status: subscription.status
      }
    });
  } catch (error: any) {
    console.error('Newsletter subscription error:', error);

    if (error.message === 'This email is already subscribed') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to subscribe to newsletter'
    });
  }
});

/**
 * POST /api/newsletter/unsubscribe
 *
 * Public endpoint for newsletter unsubscription
 * No authentication required
 */
router.post('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    await newsletterService.unsubscribeByEmail(email);

    return res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error: any) {
    console.error('Newsletter unsubscribe error:', error);

    if (error.message === 'Active subscription not found for this email') {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found for this email'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe from newsletter'
    });
  }
});

/**
 * GET /api/admin/newsletter/subscriptions
 *
 * Get all newsletter subscriptions with filters and pagination
 * Admin only
 */
router.get('/admin/subscriptions', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      status,
      source,
      search,
      startDate,
      endDate,
      page,
      limit
    } = req.query;

    const result = await newsletterService.listSubscriptions({
      status: status as string,
      source: source as string,
      search: search as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch subscriptions'
    });
  }
});

/**
 * GET /api/admin/newsletter/subscriptions/:id
 *
 * Get single subscription by ID
 * Admin only
 */
router.get('/admin/subscriptions/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID'
      });
    }

    const subscription = await newsletterService.getSubscriptionById(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    return res.json({
      success: true,
      data: subscription
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription'
    });
  }
});

/**
 * PUT /api/admin/newsletter/subscriptions/:id
 *
 * Update subscription
 * Admin only
 */
router.put('/admin/subscriptions/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID'
      });
    }

    const { name, status, metadata } = req.body;

    const subscription = await newsletterService.updateSubscription(id, {
      name,
      status,
      metadata
    });

    return res.json({
      success: true,
      data: subscription,
      message: 'Subscription updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating subscription:', error);

    if (error.message === 'Subscription not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to update subscription'
    });
  }
});

/**
 * DELETE /api/admin/newsletter/subscriptions/:id
 *
 * Delete subscription
 * Admin only
 */
router.delete('/admin/subscriptions/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID'
      });
    }

    await newsletterService.deleteSubscription(id);

    return res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting subscription:', error);

    if (error.message === 'Subscription not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to delete subscription'
    });
  }
});

/**
 * GET /api/admin/newsletter/stats
 *
 * Get newsletter subscription statistics
 * Admin only
 */
router.get('/admin/stats', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await newsletterService.getSubscriptionStats();

    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

/**
 * GET /api/admin/newsletter/export
 *
 * Export subscriptions to CSV
 * Admin only
 */
router.get('/admin/export', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      status,
      source,
      search,
      startDate,
      endDate
    } = req.query;

    const csvContent = await newsletterService.exportSubscriptionsToCSV({
      status: status as string,
      source: source as string,
      search: search as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="newsletter-subscriptions-${Date.now()}.csv"`);

    return res.send(csvContent);
  } catch (error: any) {
    console.error('Error exporting subscriptions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export subscriptions'
    });
  }
});

export default router;
