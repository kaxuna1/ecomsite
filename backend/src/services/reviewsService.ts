import { pool } from '../db/client';
import {
  notifyReviewSubmitted,
  notifyReviewApproved,
  notifyReviewResponse,
  notifyAdminNewReview
} from './notificationService';
import type {
  ProductReview,
  ReviewWithDetails,
  CreateReviewPayload,
  UpdateReviewPayload,
  ReviewFilters,
  AdminReviewFilters,
  PaginatedReviews,
  ProductRatingAggregate,
  ReviewResponse,
  ReviewResponsePayload,
  HelpfulnessVotePayload,
  ReviewStatistics
} from '../types/reviews';

/**
 * Get reviews for a product with pagination and filters
 */
export async function getProductReviews(
  productId: number,
  filters: ReviewFilters = {},
  userId?: number,
  sessionId?: string
): Promise<PaginatedReviews> {
  const {
    status = 'approved',
    rating,
    verifiedOnly = false,
    page = 1,
    limit = 10,
    sortBy = 'recent'
  } = filters;

  const offset = (page - 1) * limit;

  // Build WHERE clause
  const conditions: string[] = ['pr.product_id = $1'];
  const params: any[] = [productId];
  let paramIndex = 2;

  // Status filter: show approved reviews to everyone, and pending reviews only to their author
  if (userId) {
    conditions.push(`(pr.status = $${paramIndex} OR (pr.user_id = $${paramIndex + 1} AND pr.status = 'pending'))`);
    params.push(status, userId);
    paramIndex += 2;
  } else {
    conditions.push(`pr.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (rating) {
    conditions.push(`pr.rating = $${paramIndex}`);
    params.push(rating);
    paramIndex++;
  }

  if (verifiedOnly) {
    conditions.push('pr.is_verified_purchase = true');
  }

  // Build ORDER BY clause
  let orderBy = 'pr.created_at DESC';
  switch (sortBy) {
    case 'helpful':
      orderBy = 'pr.helpful_count DESC, pr.created_at DESC';
      break;
    case 'rating_high':
      orderBy = 'pr.rating DESC, pr.created_at DESC';
      break;
    case 'rating_low':
      orderBy = 'pr.rating ASC, pr.created_at DESC';
      break;
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM product_reviews pr
    WHERE ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0]?.total || '0');

  // Get reviews with details
  const reviewsQuery = `
    SELECT
      pr.*,
      p.name as product_name,
      p.image_url as product_image_url,
      u.name as user_name,
      u.email as user_email,
      rr.id as response_id,
      rr.response_text,
      rr.created_at as response_created_at,
      au.name as response_admin_name
      ${userId ? `, rh.is_helpful as user_voted_helpful` : ''}
    FROM product_reviews pr
    LEFT JOIN products p ON pr.product_id = p.id
    LEFT JOIN users u ON pr.user_id = u.id
    LEFT JOIN review_responses rr ON pr.id = rr.review_id
    LEFT JOIN admin_users au ON rr.admin_user_id = au.id
    ${userId ? `LEFT JOIN review_helpfulness rh ON pr.id = rh.review_id AND rh.user_id = $${paramIndex}` : ''}
    ${sessionId && !userId ? `LEFT JOIN review_helpfulness rh ON pr.id = rh.review_id AND rh.session_id = $${paramIndex}` : ''}
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
  `;

  if (userId) {
    params.push(userId);
  } else if (sessionId) {
    params.push(sessionId);
  }
  params.push(limit, offset);

  const reviewsResult = await pool.query(reviewsQuery, params);

  const reviews: ReviewWithDetails[] = reviewsResult.rows.map((row: any) => ({
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    orderId: row.order_id,
    rating: row.rating,
    title: row.title,
    reviewText: row.review_text,
    isVerifiedPurchase: row.is_verified_purchase,
    images: row.images || [],
    videos: row.videos || [],
    status: row.status,
    moderatedBy: row.moderated_by,
    moderatedAt: row.moderated_at,
    rejectionReason: row.rejection_reason,
    reviewerName: row.reviewer_name || row.user_name,
    reviewerEmail: row.reviewer_email,
    helpfulCount: row.helpful_count,
    notHelpfulCount: row.not_helpful_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    productName: row.product_name,
    productImageUrl: row.product_image_url,
    userName: row.user_name,
    userEmail: row.user_email,
    response: row.response_id ? {
      id: row.response_id,
      reviewId: row.id,
      adminUserId: row.response_admin_id,
      responseText: row.response_text,
      createdAt: row.response_created_at,
      updatedAt: row.response_created_at,
      adminUserName: row.response_admin_name
    } : undefined,
    userHasVoted: row.user_voted_helpful !== null,
    userVotedHelpful: row.user_voted_helpful
  }));

  // Get rating summary
  const summaryQuery = `
    SELECT * FROM product_rating_aggregates WHERE product_id = $1
  `;
  const summaryResult = await pool.query(summaryQuery, [productId]);
  const summary = summaryResult.rows[0] ? {
    productId: summaryResult.rows[0].product_id,
    averageRating: parseFloat(summaryResult.rows[0].average_rating),
    totalReviews: summaryResult.rows[0].total_reviews,
    totalRatings: summaryResult.rows[0].total_ratings,
    rating1Count: summaryResult.rows[0].rating_1_count,
    rating2Count: summaryResult.rows[0].rating_2_count,
    rating3Count: summaryResult.rows[0].rating_3_count,
    rating4Count: summaryResult.rows[0].rating_4_count,
    rating5Count: summaryResult.rows[0].rating_5_count,
    verifiedAverageRating: parseFloat(summaryResult.rows[0].verified_average_rating),
    verifiedReviewCount: summaryResult.rows[0].verified_review_count,
    lastReviewAt: summaryResult.rows[0].last_review_at,
    updatedAt: summaryResult.rows[0].updated_at
  } : undefined;

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    summary
  };
}

/**
 * Get a single review by ID
 */
export async function getReviewById(reviewId: number, userId?: number): Promise<ReviewWithDetails | null> {
  const query = `
    SELECT
      pr.*,
      p.name as product_name,
      p.image_url as product_image_url,
      u.name as user_name,
      u.email as user_email,
      rr.id as response_id,
      rr.response_text,
      rr.created_at as response_created_at,
      au.name as response_admin_name
      ${userId ? `, rh.is_helpful as user_voted_helpful` : ''}
    FROM product_reviews pr
    LEFT JOIN products p ON pr.product_id = p.id
    LEFT JOIN users u ON pr.user_id = u.id
    LEFT JOIN review_responses rr ON pr.id = rr.review_id
    LEFT JOIN admin_users au ON rr.admin_user_id = au.id
    ${userId ? `LEFT JOIN review_helpfulness rh ON pr.id = rh.review_id AND rh.user_id = $2` : ''}
    WHERE pr.id = $1
  `;

  const params = userId ? [reviewId, userId] : [reviewId];
  const result = await pool.query(query, params);

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    orderId: row.order_id,
    rating: row.rating,
    title: row.title,
    reviewText: row.review_text,
    isVerifiedPurchase: row.is_verified_purchase,
    images: row.images || [],
    videos: row.videos || [],
    status: row.status,
    moderatedBy: row.moderated_by,
    moderatedAt: row.moderated_at,
    rejectionReason: row.rejection_reason,
    reviewerName: row.reviewer_name || row.user_name,
    reviewerEmail: row.reviewer_email,
    helpfulCount: row.helpful_count,
    notHelpfulCount: row.not_helpful_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    productName: row.product_name,
    productImageUrl: row.product_image_url,
    userName: row.user_name,
    response: row.response_id ? {
      id: row.response_id,
      reviewId: row.id,
      adminUserId: row.response_admin_id,
      responseText: row.response_text,
      createdAt: row.response_created_at,
      updatedAt: row.response_created_at,
      adminUserName: row.response_admin_name
    } : undefined,
    userHasVoted: row.user_voted_helpful !== null,
    userVotedHelpful: row.user_voted_helpful
  };
}

/**
 * Get user's review for a specific product (if exists)
 */
export async function getUserReviewForProduct(
  userId: number,
  productId: number
): Promise<ReviewWithDetails | null> {
  const query = `
    SELECT
      pr.*,
      u.name as user_name,
      p.name as product_name,
      p.image_url as product_image_url,
      (SELECT COUNT(*) FROM review_helpfulness WHERE review_id = pr.id AND is_helpful = true) as helpful_count,
      (SELECT COUNT(*) FROM review_helpfulness WHERE review_id = pr.id AND is_helpful = false) as not_helpful_count,
      rr.id as response_id,
      rr.response_text,
      rr.created_at as response_created_at,
      au.name as response_admin_name
    FROM product_reviews pr
    LEFT JOIN users u ON pr.user_id = u.id
    LEFT JOIN products p ON pr.product_id = p.id
    LEFT JOIN review_responses rr ON pr.id = rr.review_id
    LEFT JOIN admin_users au ON rr.admin_user_id = au.id
    WHERE pr.user_id = $1 AND pr.product_id = $2
  `;

  const result = await pool.query(query, [userId, productId]);

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToReviewWithDetails(result.rows[0], userId);
}

/**
 * Create a new review (authenticated users only)
 */
export async function createReview(
  payload: CreateReviewPayload,
  userId: number
): Promise<ProductReview> {
  const {
    productId,
    rating,
    title,
    reviewText,
    images = [],
    videos = [],
    orderId
  } = payload;

  // Check if order exists and belongs to user (for verified purchase)
  let isVerifiedPurchase = false;
  if (orderId) {
    const orderCheck = await pool.query(
      'SELECT id FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );
    isVerifiedPurchase = orderCheck.rows.length > 0;
  }

  // Check if user already reviewed this product
  const existingReview = await pool.query(
    'SELECT id FROM product_reviews WHERE user_id = $1 AND product_id = $2',
    [userId, productId]
  );
  if (existingReview.rows.length > 0) {
    throw new Error('You have already reviewed this product');
  }

  const query = `
    INSERT INTO product_reviews (
      product_id, user_id, order_id, rating, title, review_text,
      images, videos, is_verified_purchase, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const result = await pool.query(query, [
    productId,
    userId,
    orderId || null,
    rating,
    title || null,
    reviewText || null,
    JSON.stringify(images),
    JSON.stringify(videos),
    isVerifiedPurchase,
    'pending' // Reviews need moderation before being visible to everyone
  ]);

  const row = result.rows[0];
  const review: ProductReview = {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    orderId: row.order_id,
    rating: row.rating,
    title: row.title,
    reviewText: row.review_text,
    isVerifiedPurchase: row.is_verified_purchase,
    images: row.images || [],
    videos: row.videos || [],
    status: row.status,
    moderatedBy: row.moderated_by,
    moderatedAt: row.moderated_at,
    rejectionReason: row.rejection_reason,
    reviewerName: row.reviewer_name,
    reviewerEmail: row.reviewer_email,
    helpfulCount: row.helpful_count,
    notHelpfulCount: row.not_helpful_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  // Get product info for notifications
  const productResult = await pool.query(
    'SELECT name, image_url FROM products WHERE id = $1',
    [productId]
  );
  const product = productResult.rows[0];

  // Get user info
  const userResult = await pool.query(
    'SELECT name, email FROM users WHERE id = $1',
    [userId]
  );
  const userName = userResult.rows[0]?.name;
  const userEmail = userResult.rows[0]?.email;

  // Send notification to customer
  try {
    await notifyReviewSubmitted(
      { ...review, productName: product?.name, productImageUrl: product?.image_url },
      userEmail,
      userName
    );
  } catch (error) {
    console.error('Failed to send review submitted notification:', error);
  }

  // Send notification to admin about new review
  try {
    const reviewWithDetails: ReviewWithDetails = {
      ...review,
      productName: product?.name,
      productImageUrl: product?.image_url,
      userName,
      userEmail,
    };
    await notifyAdminNewReview(reviewWithDetails);
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }

  return review;
}

/**
 * Update a review (user can only update their own)
 */
export async function updateReview(
  reviewId: number,
  payload: UpdateReviewPayload,
  userId: number
): Promise<ProductReview> {
  // Verify ownership
  const ownerCheck = await pool.query(
    'SELECT id FROM product_reviews WHERE id = $1 AND user_id = $2',
    [reviewId, userId]
  );

  if (ownerCheck.rows.length === 0) {
    throw new Error('Review not found or unauthorized');
  }

  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (payload.rating !== undefined) {
    updates.push(`rating = $${paramIndex}`);
    params.push(payload.rating);
    paramIndex++;
  }

  if (payload.title !== undefined) {
    updates.push(`title = $${paramIndex}`);
    params.push(payload.title);
    paramIndex++;
  }

  if (payload.reviewText !== undefined) {
    updates.push(`review_text = $${paramIndex}`);
    params.push(payload.reviewText);
    paramIndex++;
  }

  if (payload.images !== undefined) {
    updates.push(`images = $${paramIndex}`);
    params.push(JSON.stringify(payload.images));
    paramIndex++;
  }

  if (payload.videos !== undefined) {
    updates.push(`videos = $${paramIndex}`);
    params.push(JSON.stringify(payload.videos));
    paramIndex++;
  }

  updates.push(`updated_at = NOW()`);

  const query = `
    UPDATE product_reviews
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  params.push(reviewId);
  const result = await pool.query(query, params);

  const row = result.rows[0];
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    orderId: row.order_id,
    rating: row.rating,
    title: row.title,
    reviewText: row.review_text,
    isVerifiedPurchase: row.is_verified_purchase,
    images: row.images || [],
    videos: row.videos || [],
    status: row.status,
    moderatedBy: row.moderated_by,
    moderatedAt: row.moderated_at,
    rejectionReason: row.rejection_reason,
    reviewerName: row.reviewer_name,
    reviewerEmail: row.reviewer_email,
    helpfulCount: row.helpful_count,
    notHelpfulCount: row.not_helpful_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Delete a review (user can only delete their own)
 */
export async function deleteReview(reviewId: number, userId: number): Promise<void> {
  const result = await pool.query(
    'DELETE FROM product_reviews WHERE id = $1 AND user_id = $2',
    [reviewId, userId]
  );

  if (result.rowCount === 0) {
    throw new Error('Review not found or unauthorized');
  }
}

/**
 * Vote on review helpfulness
 */
export async function voteReviewHelpfulness(
  reviewId: number,
  payload: HelpfulnessVotePayload,
  userId?: number,
  sessionId?: string
): Promise<void> {
  if (!userId && !sessionId) {
    throw new Error('User ID or session ID required');
  }

  const query = `
    INSERT INTO review_helpfulness (review_id, user_id, session_id, is_helpful)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (review_id, user_id, session_id)
    DO UPDATE SET is_helpful = $4, created_at = NOW()
  `;

  await pool.query(query, [reviewId, userId || null, sessionId || null, payload.isHelpful]);
}

/**
 * Get product rating summary
 */
export async function getProductRatingSummary(productId: number): Promise<ProductRatingAggregate | null> {
  const query = `SELECT * FROM product_rating_aggregates WHERE product_id = $1`;
  const result = await pool.query(query, [productId]);

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    productId: row.product_id,
    averageRating: parseFloat(row.average_rating),
    totalReviews: row.total_reviews,
    totalRatings: row.total_ratings,
    rating1Count: row.rating_1_count,
    rating2Count: row.rating_2_count,
    rating3Count: row.rating_3_count,
    rating4Count: row.rating_4_count,
    rating5Count: row.rating_5_count,
    verifiedAverageRating: parseFloat(row.verified_average_rating),
    verifiedReviewCount: row.verified_review_count,
    lastReviewAt: row.last_review_at,
    updatedAt: row.updated_at
  };
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Get all reviews with admin filters
 */
export async function getAllReviewsAdmin(filters: AdminReviewFilters = {}): Promise<PaginatedReviews> {
  const {
    productId,
    userId,
    status,
    rating,
    searchTerm,
    page = 1,
    limit = 20,
    sortBy = 'recent'
  } = filters;

  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (productId) {
    conditions.push(`pr.product_id = $${paramIndex}`);
    params.push(productId);
    paramIndex++;
  }

  if (userId) {
    conditions.push(`pr.user_id = $${paramIndex}`);
    params.push(userId);
    paramIndex++;
  }

  if (status) {
    conditions.push(`pr.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (rating) {
    conditions.push(`pr.rating = $${paramIndex}`);
    params.push(rating);
    paramIndex++;
  }

  if (searchTerm) {
    conditions.push(`(pr.review_text ILIKE $${paramIndex} OR pr.title ILIKE $${paramIndex} OR pr.reviewer_name ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`);
    params.push(`%${searchTerm}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderBy = 'pr.created_at DESC';
  switch (sortBy) {
    case 'helpful':
      orderBy = 'pr.helpful_count DESC';
      break;
    case 'rating_high':
      orderBy = 'pr.rating DESC';
      break;
    case 'rating_low':
      orderBy = 'pr.rating ASC';
      break;
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM product_reviews pr
    LEFT JOIN users u ON pr.user_id = u.id
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0]?.total || '0');

  // Get reviews
  const reviewsQuery = `
    SELECT
      pr.*,
      p.name as product_name,
      p.image_url as product_image_url,
      u.name as user_name,
      u.email as user_email,
      rr.id as response_id,
      rr.response_text,
      au.name as response_admin_name
    FROM product_reviews pr
    LEFT JOIN products p ON pr.product_id = p.id
    LEFT JOIN users u ON pr.user_id = u.id
    LEFT JOIN review_responses rr ON pr.id = rr.review_id
    LEFT JOIN admin_users au ON rr.admin_user_id = au.id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);
  const reviewsResult = await pool.query(reviewsQuery, params);

  const reviews: ReviewWithDetails[] = reviewsResult.rows.map((row: any) => ({
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    orderId: row.order_id,
    rating: row.rating,
    title: row.title,
    reviewText: row.review_text,
    isVerifiedPurchase: row.is_verified_purchase,
    images: row.images || [],
    videos: row.videos || [],
    status: row.status,
    moderatedBy: row.moderated_by,
    moderatedAt: row.moderated_at,
    rejectionReason: row.rejection_reason,
    reviewerName: row.reviewer_name || row.user_name,
    reviewerEmail: row.reviewer_email,
    helpfulCount: row.helpful_count,
    notHelpfulCount: row.not_helpful_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    productName: row.product_name,
    productImageUrl: row.product_image_url,
    userName: row.user_name,
    response: row.response_id ? {
      id: row.response_id,
      reviewId: row.id,
      adminUserId: row.response_admin_id,
      responseText: row.response_text,
      createdAt: row.response_created_at,
      updatedAt: row.response_created_at,
      adminUserName: row.response_admin_name
    } : undefined
  }));

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Moderate review (approve/reject/flag)
 */
export async function moderateReview(
  reviewId: number,
  status: 'approved' | 'rejected' | 'flagged',
  adminUserId: number,
  rejectionReason?: string
): Promise<ProductReview> {
  const query = `
    UPDATE product_reviews
    SET status = $1, moderated_by = $2, moderated_at = NOW(), rejection_reason = $3, updated_at = NOW()
    WHERE id = $4
    RETURNING *
  `;

  const result = await pool.query(query, [status, adminUserId, rejectionReason || null, reviewId]);

  if (result.rows.length === 0) {
    throw new Error('Review not found');
  }

  const row = result.rows[0];
  const review: ProductReview = {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    orderId: row.order_id,
    rating: row.rating,
    title: row.title,
    reviewText: row.review_text,
    isVerifiedPurchase: row.is_verified_purchase,
    images: row.images || [],
    videos: row.videos || [],
    status: row.status,
    moderatedBy: row.moderated_by,
    moderatedAt: row.moderated_at,
    rejectionReason: row.rejection_reason,
    reviewerName: row.reviewer_name,
    reviewerEmail: row.reviewer_email,
    helpfulCount: row.helpful_count,
    notHelpfulCount: row.not_helpful_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  // Send notification when review is approved
  if (status === 'approved') {
    try {
      // Get product and user info
      const productResult = await pool.query(
        'SELECT name, image_url FROM products WHERE id = $1',
        [review.productId]
      );
      const product = productResult.rows[0];

      let userEmail = review.reviewerEmail;
      let userName = review.reviewerName;

      if (review.userId) {
        const userResult = await pool.query(
          'SELECT name, email FROM users WHERE id = $1',
          [review.userId]
        );
        if (userResult.rows.length > 0) {
          userEmail = userEmail || userResult.rows[0].email;
          userName = userName || userResult.rows[0].name;
        }
      }

      const reviewWithDetails: ReviewWithDetails = {
        ...review,
        productName: product?.name,
        productImageUrl: product?.image_url,
        userEmail,
        userName,
      };

      await notifyReviewApproved(reviewWithDetails);
    } catch (error) {
      console.error('Failed to send review approved notification:', error);
    }
  }

  return review;
}

/**
 * Delete review (admin)
 */
export async function deleteReviewAdmin(reviewId: number): Promise<void> {
  const result = await pool.query('DELETE FROM product_reviews WHERE id = $1', [reviewId]);

  if (result.rowCount === 0) {
    throw new Error('Review not found');
  }
}

/**
 * Add admin response to review
 */
export async function addReviewResponse(
  reviewId: number,
  payload: ReviewResponsePayload,
  adminUserId: number
): Promise<ReviewResponse> {
  const query = `
    INSERT INTO review_responses (review_id, admin_user_id, response_text)
    VALUES ($1, $2, $3)
    ON CONFLICT (review_id)
    DO UPDATE SET response_text = $3, updated_at = NOW()
    RETURNING *
  `;

  const result = await pool.query(query, [reviewId, adminUserId, payload.responseText]);

  const row = result.rows[0];
  const response: ReviewResponse = {
    id: row.id,
    reviewId: row.review_id,
    adminUserId: row.admin_user_id,
    responseText: row.response_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  // Send notification to customer about admin response
  try {
    // Get review with details
    const reviewResult = await pool.query(`
      SELECT
        pr.*,
        p.name as product_name,
        p.image_url as product_image_url,
        u.name as user_name,
        u.email as user_email
      FROM product_reviews pr
      LEFT JOIN products p ON pr.product_id = p.id
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.id = $1
    `, [reviewId]);

    if (reviewResult.rows.length > 0) {
      const reviewRow = reviewResult.rows[0];
      const reviewWithDetails: ReviewWithDetails = {
        id: reviewRow.id,
        productId: reviewRow.product_id,
        userId: reviewRow.user_id,
        orderId: reviewRow.order_id,
        rating: reviewRow.rating,
        title: reviewRow.title,
        reviewText: reviewRow.review_text,
        isVerifiedPurchase: reviewRow.is_verified_purchase,
        images: reviewRow.images || [],
        videos: reviewRow.videos || [],
        status: reviewRow.status,
        moderatedBy: reviewRow.moderated_by,
        moderatedAt: reviewRow.moderated_at,
        rejectionReason: reviewRow.rejection_reason,
        reviewerName: reviewRow.reviewer_name,
        reviewerEmail: reviewRow.reviewer_email,
        helpfulCount: reviewRow.helpful_count,
        notHelpfulCount: reviewRow.not_helpful_count,
        createdAt: reviewRow.created_at,
        updatedAt: reviewRow.updated_at,
        productName: reviewRow.product_name,
        productImageUrl: reviewRow.product_image_url,
        userName: reviewRow.user_name,
        userEmail: reviewRow.user_email,
      };

      await notifyReviewResponse(reviewWithDetails, payload.responseText);
    }
  } catch (error) {
    console.error('Failed to send review response notification:', error);
  }

  return response;
}

/**
 * Delete admin response
 */
export async function deleteReviewResponse(reviewId: number): Promise<void> {
  await pool.query('DELETE FROM review_responses WHERE review_id = $1', [reviewId]);
}

/**
 * Get review statistics for admin
 */
export async function getReviewStatistics(): Promise<ReviewStatistics> {
  const statsQuery = `
    SELECT
      COUNT(*) as total_reviews,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_reviews,
      COUNT(*) FILTER (WHERE status = 'approved') as approved_reviews,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected_reviews,
      COUNT(*) FILTER (WHERE status = 'flagged') as flagged_reviews,
      AVG(rating) FILTER (WHERE status = 'approved') as average_rating
    FROM product_reviews
  `;

  const statsResult = await pool.query(statsQuery);
  const stats = statsResult.rows[0];

  // Get recent reviews
  const recentQuery = `
    SELECT
      pr.*,
      p.name as product_name,
      p.image_url as product_image_url,
      u.name as user_name
    FROM product_reviews pr
    LEFT JOIN products p ON pr.product_id = p.id
    LEFT JOIN users u ON pr.user_id = u.id
    ORDER BY pr.created_at DESC
    LIMIT 10
  `;

  const recentResult = await pool.query(recentQuery);

  const recentReviews: ReviewWithDetails[] = recentResult.rows.map((row: any) => ({
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    orderId: row.order_id,
    rating: row.rating,
    title: row.title,
    reviewText: row.review_text,
    isVerifiedPurchase: row.is_verified_purchase,
    images: row.images || [],
    videos: row.videos || [],
    status: row.status,
    moderatedBy: row.moderated_by,
    moderatedAt: row.moderated_at,
    rejectionReason: row.rejection_reason,
    reviewerName: row.reviewer_name || row.user_name,
    reviewerEmail: row.reviewer_email,
    helpfulCount: row.helpful_count,
    notHelpfulCount: row.not_helpful_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    productName: row.product_name,
    productImageUrl: row.product_image_url,
    userName: row.user_name
  }));

  return {
    totalReviews: parseInt(stats.total_reviews),
    pendingReviews: parseInt(stats.pending_reviews),
    approvedReviews: parseInt(stats.approved_reviews),
    rejectedReviews: parseInt(stats.rejected_reviews),
    flaggedReviews: parseInt(stats.flagged_reviews),
    averageRating: parseFloat(stats.average_rating) || 0,
    recentReviews
  };
}

/**
 * Get user's own reviews with pagination
 */
export async function getUserOwnReviews(
  userId: number,
  filters: { page?: number; limit?: number; status?: string } = {}
): Promise<PaginatedReviews> {
  const { page = 1, limit = 10, status } = filters;
  const offset = (page - 1) * limit;

  // Build WHERE clause
  const conditions: string[] = ['pr.user_id = $1'];
  const params: any[] = [userId];
  let paramIndex = 2;

  if (status) {
    conditions.push(`pr.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Get reviews with product details
  const query = `
    SELECT
      pr.*,
      p.name as product_name,
      p.image_url as product_image_url,
      p.slug as product_slug,
      COALESCE(
        (SELECT json_build_object(
          'responseText', rr.response_text,
          'respondedAt', rr.responded_at,
          'respondedBy', rr.responded_by,
          'adminUserName', au.name
        )
        FROM review_responses rr
        LEFT JOIN admin_users au ON rr.responded_by = au.id
        WHERE rr.review_id = pr.id
        LIMIT 1),
        NULL
      ) as admin_response
    FROM product_reviews pr
    JOIN products p ON pr.product_id = p.id
    WHERE ${whereClause}
    ORDER BY pr.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM product_reviews pr
    WHERE ${whereClause}
  `;

  const countResult = await pool.query(countQuery, params.slice(0, paramIndex - 1));
  const total = parseInt(countResult.rows[0].total);

  const reviews: ReviewWithDetails[] = result.rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    orderId: row.order_id,
    rating: row.rating,
    title: row.title,
    reviewText: row.review_text,
    isVerifiedPurchase: row.is_verified_purchase,
    images: row.images || [],
    videos: row.videos || [],
    status: row.status,
    moderatedBy: row.moderated_by,
    moderatedAt: row.moderated_at,
    rejectionReason: row.rejection_reason,
    reviewerName: row.reviewer_name,
    reviewerEmail: row.reviewer_email,
    helpfulCount: row.helpful_count,
    notHelpfulCount: row.not_helpful_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    productName: row.product_name,
    productImageUrl: row.product_image_url,
    productSlug: row.product_slug,
    adminResponse: row.admin_response
  }));

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
