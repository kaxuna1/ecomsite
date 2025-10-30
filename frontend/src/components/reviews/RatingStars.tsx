import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 'sm',
  showValue = false,
  interactive = false,
  onChange,
  className = '',
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  const handleClick = (starIndex: number) => {
    if (interactive && onChange) {
      onChange(starIndex + 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, starIndex: number) => {
    if (interactive && onChange && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onChange(starIndex + 1);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <button
            key={`full-${i}`}
            type="button"
            onClick={() => handleClick(i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            disabled={!interactive}
            className={`${
              interactive
                ? 'cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 rounded'
                : 'cursor-default'
            }`}
            aria-label={`${i + 1} ${i + 1 === 1 ? 'star' : 'stars'}`}
            tabIndex={interactive ? 0 : -1}
          >
            <StarIcon className={`${sizeClasses[size]} text-amber-400`} />
          </button>
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <button
            type="button"
            onClick={() => handleClick(fullStars)}
            onKeyPress={(e) => handleKeyPress(e, fullStars)}
            disabled={!interactive}
            className={`${
              interactive
                ? 'cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 rounded'
                : 'cursor-default'
            } relative`}
            aria-label={`${fullStars + 0.5} stars`}
            tabIndex={interactive ? 0 : -1}
          >
            <StarOutlineIcon className={`${sizeClasses[size]} text-amber-400`} />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: '50%' }}
            >
              <StarIcon className={`${sizeClasses[size]} text-amber-400`} />
            </div>
          </button>
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <button
            key={`empty-${i}`}
            type="button"
            onClick={() => handleClick(fullStars + (hasHalfStar ? 1 : 0) + i)}
            onKeyPress={(e) => handleKeyPress(e, fullStars + (hasHalfStar ? 1 : 0) + i)}
            disabled={!interactive}
            className={`${
              interactive
                ? 'cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 rounded'
                : 'cursor-default'
            }`}
            aria-label={`${fullStars + (hasHalfStar ? 1 : 0) + i + 1} stars`}
            tabIndex={interactive ? 0 : -1}
          >
            <StarOutlineIcon className={`${sizeClasses[size]} text-gray-300`} />
          </button>
        ))}
      </div>

      {/* Rating value */}
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
