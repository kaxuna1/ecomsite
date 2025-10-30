import api from './client';
import type {
  ProductReview,
  ReviewWithDetails,
  PaginatedReviews,
  ProductRatingAggregate,
  ReviewStatistics,
  CreateReviewPayload,
  UpdateReviewPayload,
  ReviewFilters,
  AdminReviewFilters,
  ReviewResponsePayload,
  HelpfulnessVotePayload,
} from '../types/reviews';

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

/**
 * Get reviews for a product with pagination and filters
 */
export const getProductReviews = async (
  productId: number,
  filters?: ReviewFilters
): Promise<PaginatedReviews> => {
  const response = await api.get(`/products/${productId}/reviews`, {
    params: filters,
  });
  return response.data;
};

/**
 * Get a single review by ID
 */
export const getReviewById = async (reviewId: number): Promise<ReviewWithDetails> => {
  const response = await api.get(`/reviews/${reviewId}`);
  return response.data;
};

/**
 * Check if user can review a product (authenticated only)
 * Returns whether user can review and existing review if any
 */
export const canUserReviewProduct = async (
  productId: number
): Promise<{ canReview: boolean; existingReview: ReviewWithDetails | null }> => {
  const response = await api.get(`/products/${productId}/can-review`);
  return response.data;
};

/**
 * Create a new review (authenticated or anonymous)
 * If authenticated, userId is extracted from token
 * If anonymous, reviewerName and reviewerEmail are required
 */
export const createReview = async (
  productId: number,
  payload: Omit<CreateReviewPayload, 'productId'>
): Promise<ProductReview> => {
  const response = await api.post(`/products/${productId}/reviews`, payload);
  return response.data;
};

/**
 * Update own review (authenticated only)
 */
export const updateReview = async (
  reviewId: number,
  payload: UpdateReviewPayload
): Promise<ProductReview> => {
  const response = await api.put(`/reviews/${reviewId}`, payload);
  return response.data;
};

/**
 * Delete own review (authenticated only)
 */
export const deleteReview = async (reviewId: number): Promise<void> => {
  await api.delete(`/reviews/${reviewId}`);
};

/**
 * Get current user's own reviews (authenticated only)
 */
export const getUserOwnReviews = async (
  filters?: { page?: number; limit?: number; status?: string }
): Promise<PaginatedReviews> => {
  const response = await api.get('/reviews/my-reviews', {
    params: filters,
  });
  return response.data;
};

/**
 * Vote on review helpfulness (authenticated or anonymous)
 * Anonymous users tracked by session cookie
 */
export const voteReviewHelpfulness = async (
  reviewId: number,
  isHelpful: boolean
): Promise<void> => {
  await api.post(`/reviews/${reviewId}/helpfulness`, { isHelpful });
};

/**
 * Get product rating summary (aggregates)
 */
export const getProductRatingSummary = async (
  productId: number
): Promise<ProductRatingAggregate> => {
  const response = await api.get(`/products/${productId}/rating-summary`);
  return response.data;
};

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * Get all reviews with admin filters (admin only)
 */
export const getAllReviewsAdmin = async (
  filters?: AdminReviewFilters
): Promise<PaginatedReviews> => {
  const response = await api.get('/admin/reviews', {
    params: filters,
  });
  return response.data;
};

/**
 * Approve a review (admin only)
 */
export const approveReview = async (reviewId: number): Promise<ProductReview> => {
  const response = await api.patch(`/admin/reviews/${reviewId}/approve`);
  return response.data;
};

/**
 * Reject a review (admin only)
 */
export const rejectReview = async (
  reviewId: number,
  reason?: string
): Promise<ProductReview> => {
  const response = await api.patch(`/admin/reviews/${reviewId}/reject`, { reason });
  return response.data;
};

/**
 * Flag a review for attention (admin only)
 */
export const flagReview = async (reviewId: number): Promise<ProductReview> => {
  const response = await api.patch(`/admin/reviews/${reviewId}/flag`);
  return response.data;
};

/**
 * Delete a review (admin only)
 */
export const deleteReviewAdmin = async (reviewId: number): Promise<void> => {
  await api.delete(`/admin/reviews/${reviewId}`);
};

/**
 * Add admin response to a review (admin only)
 */
export const addReviewResponse = async (
  reviewId: number,
  payload: ReviewResponsePayload
): Promise<any> => {
  const response = await api.post(`/admin/reviews/${reviewId}/response`, payload);
  return response.data;
};

/**
 * Delete admin response (admin only)
 */
export const deleteReviewResponse = async (reviewId: number): Promise<void> => {
  await api.delete(`/admin/reviews/${reviewId}/response`);
};

/**
 * Get review statistics for admin dashboard (admin only)
 */
export const getReviewStatistics = async (): Promise<ReviewStatistics> => {
  const response = await api.get('/admin/reviews/statistics');
  return response.data;
};

// ============================================================================
// REVIEW IMAGE UPLOADS
// ============================================================================

export interface ReviewImageUpload {
  filename: string;
  originalName: string;
  url: string;
}

/**
 * Upload a single review image
 * Public endpoint - no authentication required
 */
export const uploadReviewImage = async (file: File): Promise<ReviewImageUpload> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post('/review-images/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Upload multiple review images
 * Public endpoint - no authentication required
 */
export const uploadReviewImages = async (
  files: File[]
): Promise<{ images: ReviewImageUpload[]; uploadedCount: number }> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await api.post('/review-images/upload-multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
