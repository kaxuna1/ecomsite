import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import * as reviewsService from '../services/reviewsService';
import { optionalAuthMiddleware, authMiddleware, adminAuthMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Helper function to handle validation errors
const validate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Helper to get session ID from cookies or generate one
const getSessionId = (req: express.Request, res: express.Response): string => {
  if (req.cookies?.sessionId) {
    return req.cookies.sessionId;
  }
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  // Set cookie for 1 year
  res.cookie('sessionId', sessionId, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });
  return sessionId;
};

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * GET /api/products/:productId/reviews
 * Get reviews for a product
 */
router.get(
  '/products/:productId/reviews',
  [
    param('productId').isInt({ min: 1 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('rating').optional().isInt({ min: 1, max: 5 }),
    query('verifiedOnly').optional().isBoolean(),
    query('sortBy').optional().isIn(['recent', 'helpful', 'rating_high', 'rating_low'])
  ],
  validate,
  optionalAuthMiddleware,
  async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
      const verifiedOnly = req.query.verifiedOnly === 'true';
      const sortBy = (req.query.sortBy as any) || 'recent';

      const userId = (req as any).userId;
      const sessionId = !userId ? getSessionId(req, res) : undefined;

      const result = await reviewsService.getProductReviews(
        productId,
        { page, limit, rating, verifiedOnly, sortBy },
        userId,
        sessionId
      );

      res.json(result);
    } catch (error) {
      console.error('Get product reviews error:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }
);

/**
 * GET /api/reviews/:id
 * Get a single review by ID
 */
router.get(
  '/reviews/:id',
  [param('id').isInt({ min: 1 })],
  validate,
  optionalAuthMiddleware,
  async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const userId = (req as any).userId;

      const review = await reviewsService.getReviewById(reviewId, userId);

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.json(review);
    } catch (error) {
      console.error('Get review error:', error);
      res.status(500).json({ error: 'Failed to fetch review' });
    }
  }
);

/**
 * GET /api/products/:productId/can-review
 * Check if user can review this product (authenticated users only)
 */
router.get(
  '/products/:productId/can-review',
  [param('productId').isInt({ min: 1 })],
  validate,
  authMiddleware,
  async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      // Check if user already reviewed this product
      const existingReview = await reviewsService.getUserReviewForProduct(userId, productId);

      res.json({
        canReview: !existingReview,
        existingReview: existingReview || null
      });
    } catch (error) {
      console.error('Check can review error:', error);
      res.status(500).json({ error: 'Failed to check review eligibility' });
    }
  }
);

/**
 * POST /api/products/:productId/reviews
 * Create a new review (authenticated users only)
 */
router.post(
  '/products/:productId/reviews',
  [
    param('productId').isInt({ min: 1 }),
    body('rating').isInt({ min: 1, max: 5 }),
    body('title').optional().isString().trim().isLength({ max: 200 }),
    body('reviewText').optional().isString().trim(),
    body('images').optional().isArray(),
    body('videos').optional().isArray(),
    body('orderId').optional().isInt({ min: 1 })
  ],
  validate,
  authMiddleware,
  async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      const payload = {
        productId,
        rating: req.body.rating,
        title: req.body.title,
        reviewText: req.body.reviewText,
        images: req.body.images,
        videos: req.body.videos,
        orderId: req.body.orderId
      };

      const review = await reviewsService.createReview(payload, userId);

      res.status(201).json(review);
    } catch (error: any) {
      console.error('Create review error:', error);
      if (error.message === 'You have already reviewed this product') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create review' });
    }
  }
);

/**
 * PUT /api/reviews/:id
 * Update own review (authenticated only)
 */
router.put(
  '/reviews/:id',
  [
    param('id').isInt({ min: 1 }),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('title').optional().isString().trim().isLength({ max: 200 }),
    body('reviewText').optional().isString().trim(),
    body('images').optional().isArray(),
    body('videos').optional().isArray()
  ],
  validate,
  authMiddleware,
  async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      const payload = {
        rating: req.body.rating,
        title: req.body.title,
        reviewText: req.body.reviewText,
        images: req.body.images,
        videos: req.body.videos
      };

      const review = await reviewsService.updateReview(reviewId, payload, userId);

      res.json(review);
    } catch (error: any) {
      console.error('Update review error:', error);
      if (error.message === 'Review not found or unauthorized') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update review' });
    }
  }
);

/**
 * DELETE /api/reviews/:id
 * Delete own review (authenticated only)
 */
router.delete(
  '/reviews/:id',
  [param('id').isInt({ min: 1 })],
  validate,
  authMiddleware,
  async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      await reviewsService.deleteReview(reviewId, userId);

      res.status(204).send();
    } catch (error: any) {
      console.error('Delete review error:', error);
      if (error.message === 'Review not found or unauthorized') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to delete review' });
    }
  }
);

/**
 * POST /api/reviews/:id/helpfulness
 * Vote on review helpfulness
 */
router.post(
  '/reviews/:id/helpfulness',
  [
    param('id').isInt({ min: 1 }),
    body('isHelpful').isBoolean()
  ],
  validate,
  optionalAuthMiddleware,
  async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const userId = (req as any).userId;
      const sessionId = !userId ? getSessionId(req, res) : undefined;

      await reviewsService.voteReviewHelpfulness(
        reviewId,
        { isHelpful: req.body.isHelpful },
        userId,
        sessionId
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Vote helpfulness error:', error);
      res.status(500).json({ error: 'Failed to record vote' });
    }
  }
);

/**
 * GET /api/products/:productId/rating-summary
 * Get product rating summary
 */
router.get(
  '/products/:productId/rating-summary',
  [param('productId').isInt({ min: 1 })],
  validate,
  async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);

      const summary = await reviewsService.getProductRatingSummary(productId);

      if (!summary) {
        return res.json({
          productId,
          averageRating: 0,
          totalReviews: 0,
          totalRatings: 0,
          rating1Count: 0,
          rating2Count: 0,
          rating3Count: 0,
          rating4Count: 0,
          rating5Count: 0,
          verifiedAverageRating: 0,
          verifiedReviewCount: 0
        });
      }

      res.json(summary);
    } catch (error) {
      console.error('Get rating summary error:', error);
      res.status(500).json({ error: 'Failed to fetch rating summary' });
    }
  }
);

/**
 * GET /api/reviews/my-reviews
 * Get current user's own reviews (authenticated only)
 */
router.get(
  '/reviews/my-reviews',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'approved', 'rejected'])
  ],
  validate,
  authMiddleware,
  async (req, res) => {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      const filters = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        status: req.query.status as string | undefined
      };

      const result = await reviewsService.getUserOwnReviews(userId, filters);

      res.json(result);
    } catch (error) {
      console.error('Get user reviews error:', error);
      res.status(500).json({ error: 'Failed to fetch your reviews' });
    }
  }
);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * GET /api/admin/reviews
 * Get all reviews with filters (admin only)
 */
router.get(
  '/admin/reviews',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('productId').optional().isInt({ min: 1 }),
    query('userId').optional().isInt({ min: 1 }),
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'flagged']),
    query('rating').optional().isInt({ min: 1, max: 5 }),
    query('searchTerm').optional().isString().trim(),
    query('sortBy').optional().isIn(['recent', 'helpful', 'rating_high', 'rating_low'])
  ],
  validate,
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const filters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        productId: req.query.productId ? parseInt(req.query.productId as string) : undefined,
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        status: req.query.status as any,
        rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
        searchTerm: req.query.searchTerm as string,
        sortBy: (req.query.sortBy as any) || 'recent'
      };

      const result = await reviewsService.getAllReviewsAdmin(filters);

      res.json(result);
    } catch (error) {
      console.error('Get all reviews error:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }
);

/**
 * PATCH /api/admin/reviews/:id/approve
 * Approve a review
 */
router.patch(
  '/admin/reviews/:id/approve',
  [param('id').isInt({ min: 1 })],
  validate,
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const adminUserId = (req as any).adminId;

      if (!adminUserId) {
        return res.status(401).json({ error: 'Admin authentication required' });
      }

      const review = await reviewsService.moderateReview(reviewId, 'approved', adminUserId);

      res.json(review);
    } catch (error: any) {
      console.error('Approve review error:', error);
      if (error.message === 'Review not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to approve review' });
    }
  }
);

/**
 * PATCH /api/admin/reviews/:id/reject
 * Reject a review
 */
router.patch(
  '/admin/reviews/:id/reject',
  [
    param('id').isInt({ min: 1 }),
    body('reason').optional().isString().trim()
  ],
  validate,
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const adminUserId = (req as any).adminId;
      const reason = req.body.reason;

      if (!adminUserId) {
        return res.status(401).json({ error: 'Admin authentication required' });
      }

      const review = await reviewsService.moderateReview(reviewId, 'rejected', adminUserId, reason);

      res.json(review);
    } catch (error: any) {
      console.error('Reject review error:', error);
      if (error.message === 'Review not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to reject review' });
    }
  }
);

/**
 * PATCH /api/admin/reviews/:id/flag
 * Flag a review for attention
 */
router.patch(
  '/admin/reviews/:id/flag',
  [param('id').isInt({ min: 1 })],
  validate,
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const adminUserId = (req as any).adminId;

      if (!adminUserId) {
        return res.status(401).json({ error: 'Admin authentication required' });
      }

      const review = await reviewsService.moderateReview(reviewId, 'flagged', adminUserId);

      res.json(review);
    } catch (error: any) {
      console.error('Flag review error:', error);
      if (error.message === 'Review not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to flag review' });
    }
  }
);

/**
 * DELETE /api/admin/reviews/:id
 * Delete a review (admin only)
 */
router.delete(
  '/admin/reviews/:id',
  [param('id').isInt({ min: 1 })],
  validate,
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);

      await reviewsService.deleteReviewAdmin(reviewId);

      res.status(204).send();
    } catch (error: any) {
      console.error('Delete review error:', error);
      if (error.message === 'Review not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to delete review' });
    }
  }
);

/**
 * POST /api/admin/reviews/:id/response
 * Add admin response to a review
 */
router.post(
  '/admin/reviews/:id/response',
  [
    param('id').isInt({ min: 1 }),
    body('responseText').isString().trim().notEmpty()
  ],
  validate,
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const adminUserId = (req as any).adminId;

      if (!adminUserId) {
        return res.status(401).json({ error: 'Admin authentication required' });
      }

      const response = await reviewsService.addReviewResponse(
        reviewId,
        { responseText: req.body.responseText },
        adminUserId
      );

      res.status(201).json(response);
    } catch (error) {
      console.error('Add review response error:', error);
      res.status(500).json({ error: 'Failed to add response' });
    }
  }
);

/**
 * DELETE /api/admin/reviews/:id/response
 * Delete admin response
 */
router.delete(
  '/admin/reviews/:id/response',
  [param('id').isInt({ min: 1 })],
  validate,
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);

      await reviewsService.deleteReviewResponse(reviewId);

      res.status(204).send();
    } catch (error) {
      console.error('Delete review response error:', error);
      res.status(500).json({ error: 'Failed to delete response' });
    }
  }
);

/**
 * GET /api/admin/reviews/statistics
 * Get review statistics
 */
router.get(
  '/admin/reviews/statistics',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const statistics = await reviewsService.getReviewStatistics();

      res.json(statistics);
    } catch (error) {
      console.error('Get review statistics error:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
);

export default router;
