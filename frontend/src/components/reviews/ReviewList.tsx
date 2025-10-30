import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import ReviewItem from './ReviewItem';
import RatingDistribution from './RatingDistribution';
import type { ReviewSortBy } from '../../types/reviews';
import { getProductReviews } from '../../api/reviews';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ReviewListProps {
  productId: number;
  showDistribution?: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({
  productId,
  showDistribution = true,
}) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<ReviewSortBy>('recent');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ['reviews', productId, page, sortBy, selectedRating, verifiedOnly],
    queryFn: () =>
      getProductReviews(productId, {
        page,
        limit,
        sortBy,
        rating: selectedRating ?? undefined,
        verifiedOnly,
      }),
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as ReviewSortBy);
    setPage(1);
  };

  const handleRatingFilter = (rating: number | null) => {
    setSelectedRating(rating);
    setPage(1);
  };

  const handleVerifiedToggle = () => {
    setVerifiedOnly(!verifiedOnly);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t('reviews.loadError', { defaultValue: 'Failed to load reviews' })}</p>
      </div>
    );
  }

  if (!data) return null;

  const { reviews, pagination, summary } = data;

  return (
    <div className="space-y-6">
      {/* Distribution and filters section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating distribution */}
        {showDistribution && summary && (
          <div className="lg:col-span-1">
            <RatingDistribution
              summary={summary}
              onFilterByRating={handleRatingFilter}
              selectedRating={selectedRating}
            />
          </div>
        )}

        {/* Reviews section */}
        <div className={showDistribution ? 'lg:col-span-2' : 'lg:col-span-3'}>
          {/* Filters and sort */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              {/* Verified only toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={handleVerifiedToggle}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">
                  {t('reviews.verifiedOnly', { defaultValue: 'Verified purchases only' })}
                </span>
              </label>
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-gray-700 whitespace-nowrap">
                {t('reviews.sortBy', { defaultValue: 'Sort by:' })}
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={handleSortChange}
                className="block w-full sm:w-auto px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="recent">{t('reviews.sort.recent', { defaultValue: 'Most Recent' })}</option>
                <option value="helpful">{t('reviews.sort.helpful', { defaultValue: 'Most Helpful' })}</option>
                <option value="rating_high">{t('reviews.sort.ratingHigh', { defaultValue: 'Highest Rating' })}</option>
                <option value="rating_low">{t('reviews.sort.ratingLow', { defaultValue: 'Lowest Rating' })}</option>
              </select>
            </div>
          </div>

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                {selectedRating || verifiedOnly
                  ? t('reviews.noMatchingReviews', { defaultValue: 'No reviews match your filters' })
                  : t('reviews.noReviews', { defaultValue: 'No reviews yet. Be the first to review!' })}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {t('reviews.showingResults', {
                  start: (pagination.page - 1) * pagination.limit + 1,
                  end: Math.min(pagination.page * pagination.limit, pagination.total),
                  total: pagination.total,
                  defaultValue: 'Showing {{start}}-{{end}} of {{total}} reviews',
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          page === pageNum
                            ? 'bg-amber-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewList;
