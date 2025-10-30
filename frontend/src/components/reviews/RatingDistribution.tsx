import { useTranslation } from 'react-i18next';
import RatingStars from './RatingStars';
import type { ProductRatingAggregate } from '../../types/reviews';

interface RatingDistributionProps {
  summary: ProductRatingAggregate;
  onFilterByRating?: (rating: number | null) => void;
  selectedRating?: number | null;
}

const RatingDistribution: React.FC<RatingDistributionProps> = ({
  summary,
  onFilterByRating,
  selectedRating,
}) => {
  const { t } = useTranslation();

  const ratingCounts = [
    { rating: 5, count: summary.rating5Count },
    { rating: 4, count: summary.rating4Count },
    { rating: 3, count: summary.rating3Count },
    { rating: 2, count: summary.rating2Count },
    { rating: 1, count: summary.rating1Count },
  ];

  const maxCount = Math.max(...ratingCounts.map(r => r.count));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Overall Rating */}
      <div className="text-center pb-6 border-b border-gray-200">
        <div className="text-5xl font-bold text-gray-900 mb-2">
          {summary.averageRating.toFixed(1)}
        </div>
        <RatingStars rating={summary.averageRating} size="lg" className="justify-center mb-2" />
        <div className="text-sm text-gray-600">
          {t('reviews.basedOn', {
            count: summary.totalReviews,
            defaultValue: 'Based on {{count}} reviews',
          })}
        </div>
        {summary.verifiedReviewCount > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {t('reviews.verifiedPurchases', {
              count: summary.verifiedReviewCount,
              defaultValue: '{{count}} verified purchases',
            })}
          </div>
        )}
      </div>

      {/* Rating Distribution */}
      <div className="mt-6 space-y-3">
        {ratingCounts.map(({ rating, count }) => {
          const percentage = summary.totalReviews > 0
            ? (count / summary.totalReviews) * 100
            : 0;

          return (
            <button
              key={rating}
              onClick={() => onFilterByRating?.(selectedRating === rating ? null : rating)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                onFilterByRating
                  ? 'hover:bg-gray-50 cursor-pointer'
                  : 'cursor-default'
              } ${
                selectedRating === rating
                  ? 'bg-amber-50 ring-2 ring-amber-200'
                  : ''
              }`}
              disabled={!onFilterByRating}
            >
              {/* Rating label */}
              <div className="flex items-center gap-1 w-16 flex-shrink-0">
                <span className="text-sm font-medium text-gray-700">{rating}</span>
                <RatingStars rating={rating} maxRating={1} size="xs" />
              </div>

              {/* Progress bar */}
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Count */}
              <div className="text-sm text-gray-600 w-12 text-right flex-shrink-0">
                {count}
              </div>
            </button>
          );
        })}
      </div>

      {/* Clear filter button */}
      {selectedRating && onFilterByRating && (
        <button
          onClick={() => onFilterByRating(null)}
          className="w-full mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium"
        >
          {t('reviews.clearFilter', { defaultValue: 'Clear filter' })}
        </button>
      )}
    </div>
  );
};

export default RatingDistribution;
