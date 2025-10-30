import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { PencilIcon, TrashIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import RatingStars from '../../components/reviews/RatingStars';
import ReviewForm from '../../components/reviews/ReviewForm';
import { getUserOwnReviews, deleteReview } from '../../api/reviews';
import type { ReviewWithDetails } from '../../types/reviews';

const MyReviews = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [editingReview, setEditingReview] = useState<ReviewWithDetails | null>(null);

  // Fetch user's reviews
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-reviews', page, statusFilter],
    queryFn: () => getUserOwnReviews({ page, limit: 10, status: statusFilter }),
  });

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    },
  });

  const handleDelete = async (reviewId: number) => {
    if (window.confirm(t('reviews.confirmDelete', { defaultValue: 'Are you sure you want to delete this review?' }))) {
      deleteMutation.mutate(reviewId);
    }
  };

  const handleEditSuccess = () => {
    setEditingReview(null);
    queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {t(`reviews.status.${status}`, { defaultValue: status })}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{t('reviews.errorLoading', { defaultValue: 'Failed to load reviews' })}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('reviews.myReviews', { defaultValue: 'My Reviews' })}
          </h1>
          <p className="text-gray-600">
            {t('reviews.myReviewsDescription', { defaultValue: 'Manage your product reviews' })}
          </p>
        </div>

        {/* Edit Form Modal */}
        {editingReview && (
          <div className="mb-8">
            <ReviewForm
              productId={editingReview.productId}
              productName={editingReview.productName || 'Product'}
              existingReview={editingReview}
              isAuthenticated={true}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingReview(null)}
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              {t('reviews.filterByStatus', { defaultValue: 'Filter by status:' })}
            </label>
            <select
              value={statusFilter || ''}
              onChange={(e) => {
                setStatusFilter(e.target.value || undefined);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">{t('reviews.allStatuses', { defaultValue: 'All' })}</option>
              <option value="approved">{t('reviews.status.approved', { defaultValue: 'Approved' })}</option>
              <option value="pending">{t('reviews.status.pending', { defaultValue: 'Pending' })}</option>
              <option value="rejected">{t('reviews.status.rejected', { defaultValue: 'Rejected' })}</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        {data?.reviews && data.reviews.length > 0 ? (
          <div className="space-y-6">
            {data.reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-6">
                {/* Product Info */}
                <div className="flex items-start gap-4 mb-4 pb-4 border-b border-gray-200">
                  {review.productImageUrl && (
                    <img
                      src={review.productImageUrl}
                      alt={review.productName || ''}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <Link
                      to={`/${i18n.language}/products/${review.productId}`}
                      className="text-lg font-medium text-gray-900 hover:text-amber-600"
                    >
                      {review.productName}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(review.status)}
                      {review.isVerifiedPurchase && (
                        <span className="text-xs text-green-600 font-medium">
                          ✓ {t('reviews.verifiedPurchase', { defaultValue: 'Verified Purchase' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <RatingStars rating={review.rating} size="sm" />
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {review.title && (
                    <h3 className="text-lg font-medium text-gray-900">{review.title}</h3>
                  )}

                  {review.reviewText && (
                    <p className="text-gray-700">{review.reviewText}</p>
                  )}

                  {/* Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {review.images.map((imageUrl, index) => (
                        <img
                          key={index}
                          src={imageUrl}
                          alt={`Review ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* Admin Response */}
                  {review.adminResponse && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <ChatBubbleLeftIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-900 mb-1">
                            {t('reviews.responseFromStore', { defaultValue: 'Response from Store' })}
                          </p>
                          <p className="text-sm text-amber-800">
                            {review.adminResponse.responseText}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {review.status === 'rejected' && review.rejectionReason && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-medium text-red-900 mb-1">
                        {t('reviews.rejectionReason', { defaultValue: 'Rejection Reason' })}
                      </p>
                      <p className="text-sm text-red-800">{review.rejectionReason}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {review.status !== 'approved' && (
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setEditingReview(review)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <PencilIcon className="w-4 h-4" />
                        {t('common.edit', { defaultValue: 'Edit' })}
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={deleteMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        <TrashIcon className="w-4 h-4" />
                        {t('common.delete', { defaultValue: 'Delete' })}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">
              {t('reviews.noReviews', { defaultValue: 'You haven\'t written any reviews yet' })}
            </p>
            <Link
              to={`/${i18n.language}/products`}
              className="inline-flex items-center justify-center px-6 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700"
            >
              {t('reviews.startShopping', { defaultValue: 'Start Shopping' })}
            </Link>
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination && data.pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.previous', { defaultValue: 'Previous' })}
            </button>

            <span className="px-4 py-2 text-sm text-gray-600">
              {t('common.pageOf', {
                defaultValue: 'Page {{page}} of {{total}}',
                page,
                total: data.pagination.totalPages
              })}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.next', { defaultValue: 'Next' })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReviews;
