// Review Types for Frontend

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export type ReviewSortBy = 'recent' | 'helpful' | 'rating_high' | 'rating_low';

export interface ProductReview {
  id: number;
  productId: number;
  userId?: number | null;
  orderId?: number | null;

  // Review Data
  rating: number; // 1-5
  title?: string | null;
  reviewText?: string | null;

  // Verification
  isVerifiedPurchase: boolean;

  // Media
  images: string[];
  videos: string[];

  // Moderation
  status: ReviewStatus;
  moderatedBy?: number | null;
  moderatedAt?: string | null;
  rejectionReason?: string | null;

  // Metadata (for anonymous reviews)
  reviewerName?: string | null;
  reviewerEmail?: string | null;

  // Helpfulness
  helpfulCount: number;
  notHelpfulCount: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface ReviewResponse {
  id: number;
  reviewId: number;
  adminUserId: number;
  responseText: string;
  createdAt: string;
  updatedAt: string;

  // Populated fields
  adminUserName?: string;
  adminUserEmail?: string;
}

export interface ReviewWithDetails extends ProductReview {
  // Product details
  productName?: string;
  productImageUrl?: string;

  // User details
  userName?: string;
  userEmail?: string;

  // Response
  response?: ReviewResponse;

  // User's vote
  userHasVoted?: boolean;
  userVotedHelpful?: boolean;
}

export interface ProductRatingAggregate {
  productId: number;
  averageRating: number;
  totalReviews: number;
  totalRatings: number;

  // Rating distribution
  rating1Count: number;
  rating2Count: number;
  rating3Count: number;
  rating4Count: number;
  rating5Count: number;

  // Verified stats
  verifiedAverageRating: number;
  verifiedReviewCount: number;

  lastReviewAt?: string | null;
  updatedAt: string;
}

export interface PaginatedReviews {
  reviews: ReviewWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary?: ProductRatingAggregate;
}

export interface ReviewStatistics {
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  flaggedReviews: number;
  averageRating: number;
  recentReviews: ReviewWithDetails[];
}

// DTOs for API requests

export interface CreateReviewPayload {
  productId: number;
  rating: number; // 1-5
  title?: string;
  reviewText?: string;
  images?: string[];
  videos?: string[];
  orderId?: number;
}

export interface UpdateReviewPayload {
  rating?: number;
  title?: string;
  reviewText?: string;
  images?: string[];
  videos?: string[];
}

export interface ReviewFilters {
  productId?: number;
  userId?: number;
  status?: ReviewStatus;
  rating?: number;
  verifiedOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: ReviewSortBy;
}

export interface AdminReviewFilters extends ReviewFilters {
  searchTerm?: string;
  moderatedBy?: number;
}

export interface ReviewResponsePayload {
  responseText: string;
}

export interface HelpfulnessVotePayload {
  isHelpful: boolean;
}
