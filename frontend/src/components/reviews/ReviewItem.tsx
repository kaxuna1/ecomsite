import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HandThumbUpIcon, HandThumbDownIcon, CheckBadgeIcon, ClockIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolidIcon, HandThumbDownIcon as HandThumbDownSolidIcon } from '@heroicons/react/24/solid';
import RatingStars from './RatingStars';
import type { ReviewWithDetails } from '../../types/reviews';
import { voteReviewHelpfulness } from '../../api/reviews';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ReviewItemProps {
  review: ReviewWithDetails;
  showProductInfo?: boolean;
  onEdit?: (review: ReviewWithDetails) => void;
  onDelete?: (reviewId: number) => void;
}

const ReviewItem: React.FC<ReviewItemProps> = ({
  review,
  showProductInfo = false,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [userVote, setUserVote] = useState<boolean | null>(
    review.userHasVoted ? review.userVotedHelpful ?? null : null
  );

  const voteMutation = useMutation({
    mutationFn: (isHelpful: boolean) => voteReviewHelpfulness(review.id, isHelpful),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const handleVote = (isHelpful: boolean) => {
    if (userVote === isHelpful) {
      // User is clicking the same vote again - this would need backend support to remove vote
      return;
    }
    setUserVote(isHelpful);
    voteMutation.mutate(isHelpful);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <RatingStars rating={review.rating} size="sm" />
            {review.isVerifiedPurchase && (
              <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                <CheckBadgeIcon className="w-4 h-4" />
                <span>{t('reviews.verifiedPurchase', { defaultValue: 'Verified Purchase' })}</span>
              </div>
            )}
            {review.status === 'pending' && (
              <div className="flex items-center gap-1 text-amber-600 text-xs font-medium bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                <ClockIcon className="w-4 h-4" />
                <span>{t('reviews.pendingModeration', { defaultValue: 'Pending Moderation' })}</span>
              </div>
            )}
          </div>
          {review.title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{review.title}</h3>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">
              {review.reviewerName || review.userName || t('reviews.anonymous', { defaultValue: 'Anonymous' })}
            </span>
            <span>•</span>
            <span>{formatDate(review.createdAt)}</span>
          </div>
        </div>

        {/* Product info (for user's review list) */}
        {showProductInfo && review.productName && (
          <div className="ml-4 flex items-center gap-2">
            {review.productImageUrl && (
              <img
                src={review.productImageUrl}
                alt={review.productName}
                className="w-12 h-12 object-cover rounded"
              />
            )}
            <span className="text-sm text-gray-700">{review.productName}</span>
          </div>
        )}
      </div>

      {/* Review text */}
      {review.reviewText && (
        <p className="text-gray-700 whitespace-pre-wrap mb-4">{review.reviewText}</p>
      )}

      {/* Media */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {review.images.map((imageUrl, index) => (
            <img
              key={index}
              src={imageUrl}
              alt={`Review image ${index + 1}`}
              className="w-24 h-24 object-cover rounded border border-gray-200 flex-shrink-0"
            />
          ))}
        </div>
      )}

      {/* Admin response */}
      {review.response && (
        <div className="bg-gray-50 border-l-4 border-gray-300 p-4 mb-4">
          <div className="text-sm font-medium text-gray-900 mb-1">
            {t('reviews.responseFrom', {
              name: review.response.adminUserName || 'Admin',
              defaultValue: 'Response from {{name}}',
            })}
          </div>
          <p className="text-sm text-gray-700">{review.response.responseText}</p>
          <div className="text-xs text-gray-500 mt-2">
            {formatDate(review.response.createdAt)}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        {/* Helpfulness voting */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {t('reviews.wasThisHelpful', { defaultValue: 'Was this helpful?' })}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVote(true)}
              disabled={voteMutation.isPending}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                userVote === true
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {userVote === true ? (
                <HandThumbUpSolidIcon className="w-4 h-4" />
              ) : (
                <HandThumbUpIcon className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{review.helpfulCount}</span>
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={voteMutation.isPending}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                userVote === false
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {userVote === false ? (
                <HandThumbDownSolidIcon className="w-4 h-4" />
              ) : (
                <HandThumbDownIcon className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{review.notHelpfulCount}</span>
            </button>
          </div>
        </div>

        {/* Edit/Delete actions (for own reviews) */}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(review)}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                {t('common.edit', { defaultValue: 'Edit' })}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(review.id)}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                {t('common.delete', { defaultValue: 'Delete' })}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewItem;
