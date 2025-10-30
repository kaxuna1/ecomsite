import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  FlagIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import {
  getAllReviewsAdmin,
  approveReview,
  rejectReview,
  flagReview,
  deleteReviewAdmin,
  addReviewResponse,
  deleteReviewResponse,
} from '../../api/reviews';
import type { ReviewWithDetails, ReviewStatus } from '../../types/reviews';
import LoadingState from '../../components/admin/LoadingState';
import EmptyState from '../../components/admin/EmptyState';
import SearchInput from '../../components/admin/SearchInput';
import Badge from '../../components/admin/Badge';
import RatingStars from '../../components/reviews/RatingStars';

type FilterOption = 'all' | ReviewStatus;

function AdminReviews() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [selectedReview, setSelectedReview] = useState<ReviewWithDetails | null>(null);
  const [responseText, setResponseText] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page, filterOption, searchQuery],
    queryFn: () =>
      getAllReviewsAdmin({
        page,
        limit,
        status: filterOption !== 'all' ? filterOption : undefined,
        searchTerm: searchQuery || undefined,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: approveReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setSelectedReview(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ reviewId, reason }: { reviewId: number; reason?: string }) =>
      rejectReview(reviewId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setSelectedReview(null);
      setShowRejectModal(false);
      setRejectionReason('');
    },
  });

  const flagMutation = useMutation({
    mutationFn: flagReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setSelectedReview(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReviewAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setSelectedReview(null);
    },
  });

  const addResponseMutation = useMutation({
    mutationFn: ({ reviewId, text }: { reviewId: number; text: string }) =>
      addReviewResponse(reviewId, { responseText: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setShowResponseModal(false);
      setResponseText('');
      setSelectedReview(null);
    },
  });

  const deleteResponseMutation = useMutation({
    mutationFn: deleteReviewResponse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setSelectedReview(null);
    },
  });

  const getStatusBadgeVariant = (
    status: ReviewStatus
  ): 'success' | 'warning' | 'info' | 'error' | 'neutral' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'flagged':
        return 'info';
      default:
        return 'neutral';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReject = () => {
    if (selectedReview) {
      rejectMutation.mutate({
        reviewId: selectedReview.id,
        reason: rejectionReason || undefined,
      });
    }
  };

  const handleAddResponse = () => {
    if (selectedReview && responseText.trim()) {
      addResponseMutation.mutate({
        reviewId: selectedReview.id,
        text: responseText.trim(),
      });
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading reviews..." />;
  }

  const reviews = data?.reviews || [];
  const pagination = data?.pagination;

  return (
    <>
      <Helmet>
        <title>Review Management | Admin</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-champagne">Review Management</h1>
          <p className="mt-2 text-sm text-champagne/60">
            Moderate product reviews, respond to customers, and manage feedback
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-white/5 rounded-lg border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-champagne/60">Total Reviews</p>
                <p className="mt-1 text-2xl font-semibold text-champagne">
                  {pagination?.total || 0}
                </p>
              </div>
              <StarIcon className="h-8 w-8 text-amber-400" />
            </div>
          </div>
          <div className="bg-yellow-500/10 rounded-lg border border-yellow-500/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-400">Pending</p>
                <p className="mt-1 text-2xl font-semibold text-yellow-300">
                  {reviews.filter((r) => r.status === 'pending').length}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-green-500/10 rounded-lg border border-green-500/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-400">Approved</p>
                <p className="mt-1 text-2xl font-semibold text-green-300">
                  {reviews.filter((r) => r.status === 'approved').length}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="bg-blue-500/10 rounded-lg border border-blue-500/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-400">Flagged</p>
                <p className="mt-1 text-2xl font-semibold text-blue-300">
                  {reviews.filter((r) => r.status === 'flagged').length}
                </p>
              </div>
              <FlagIcon className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search reviews by product or reviewer..."
            className="sm:w-96"
          />

          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-champagne/60" />
            <select
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value as FilterOption)}
              className="rounded-lg border-white/10 bg-white/5 text-champagne text-sm focus:border-blush focus:ring-blush"
            >
              <option value="all">All Reviews</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <EmptyState
            icon={<StarIcon className="h-12 w-12" />}
            title="No reviews found"
            description="No reviews match your current filters."
          />
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-lg border border-white/10 p-6"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <RatingStars rating={review.rating} size="sm" />
                      <Badge variant={getStatusBadgeVariant(review.status)}>
                        {review.status}
                      </Badge>
                      {review.isVerifiedPurchase && (
                        <Badge variant="success">Verified Purchase</Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-champagne">
                      {review.title || 'No title'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-champagne/60 mt-1">
                      <span>{review.reviewerName || review.userName || 'Anonymous'}</span>
                      <span>•</span>
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>

                  {/* Product Info */}
                  {review.productName && (
                    <div className="flex items-center gap-2 ml-4">
                      {review.productImageUrl && (
                        <img
                          src={review.productImageUrl}
                          alt={review.productName}
                          className="w-12 h-12 object-cover rounded border border-white/10"
                        />
                      )}
                      <span className="text-sm text-champagne/80">{review.productName}</span>
                    </div>
                  )}
                </div>

                {/* Review Text */}
                {review.reviewText && (
                  <p className="text-champagne/70 mb-4">{review.reviewText}</p>
                )}

                {/* Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {review.images.slice(0, 4).map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`Review image ${index + 1}`}
                        className="w-16 h-16 object-cover rounded border border-white/10"
                      />
                    ))}
                  </div>
                )}

                {/* Admin Response */}
                {review.response && (
                  <div className="bg-white/5 border-l-4 border-blush/50 p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-champagne">
                        Admin Response
                      </span>
                      <button
                        onClick={() => {
                          if (confirm('Delete this response?')) {
                            deleteResponseMutation.mutate(review.id);
                          }
                        }}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-sm text-champagne/70">{review.response.responseText}</p>
                  </div>
                )}

                {/* Rejection Reason */}
                {review.status === 'rejected' && review.rejectionReason && (
                  <div className="bg-red-500/10 border-l-4 border-red-500/50 p-4 mb-4">
                    <span className="text-sm font-medium text-red-400">
                      Rejection Reason:
                    </span>
                    <p className="text-sm text-red-300 mt-1">{review.rejectionReason}</p>
                  </div>
                )}

                {/* Actions - Using simple buttons with inline icons */}
                <div className="flex items-center gap-2 pt-4 border-t border-white/10 flex-wrap">
                  {review.status === 'pending' && (
                    <>
                      <button
                        onClick={() => approveMutation.mutate(review.id)}
                        disabled={approveMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReview(review);
                          setShowRejectModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => flagMutation.mutate(review.id)}
                        disabled={flagMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-yellow-100 hover:bg-yellow-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FlagIcon className="h-4 w-4" />
                        Flag
                      </button>
                    </>
                  )}

                  {review.status === 'approved' && !review.response && (
                    <button
                      onClick={() => {
                        setSelectedReview(review);
                        setShowResponseModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <ChatBubbleLeftIcon className="h-4 w-4" />
                      Add Response
                    </button>
                  )}

                  {review.status === 'flagged' && (
                    <>
                      <button
                        onClick={() => approveMutation.mutate(review.id)}
                        disabled={approveMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReview(review);
                          setShowRejectModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      if (confirm('Permanently delete this review?')) {
                        deleteMutation.mutate(review.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-auto"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <p className="text-sm text-champagne/60">
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, pagination.total)} of{' '}
              {pagination.total} reviews
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-champagne bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-champagne/60">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 text-sm font-medium text-champagne bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reject Review</h3>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter reason for rejection..."
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {rejectMutation.isPending ? 'Rejecting...' : 'Reject Review'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Response Modal */}
      <AnimatePresence>
        {showResponseModal && selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Response</h3>
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setResponseText('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <label htmlFor="response-text" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response
                </label>
                <textarea
                  id="response-text"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Write your response to the customer..."
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setResponseText('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddResponse}
                  disabled={!responseText.trim() || addResponseMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addResponseMutation.isPending ? 'Adding...' : 'Add Response'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AdminReviews;
