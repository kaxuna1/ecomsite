import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import RatingStars from './RatingStars';
import { createReview, updateReview, uploadReviewImages } from '../../api/reviews';
import type { CreateReviewPayload, UpdateReviewPayload, ReviewWithDetails } from '../../types/reviews';

interface ReviewFormProps {
  productId: number;
  productName: string;
  existingReview?: ReviewWithDetails;
  orderId?: number;
  isAuthenticated: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  productName,
  existingReview,
  orderId,
  isAuthenticated,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [reviewText, setReviewText] = useState(existingReview?.reviewText || '');
  const [images, setImages] = useState<string[]>(existingReview?.images || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: Omit<CreateReviewPayload, 'productId'>) =>
      createReview(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onSuccess?.();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateReviewPayload) =>
      updateReview(existingReview!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      onSuccess?.();
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (rating === 0) {
      newErrors.rating = t('reviews.form.errors.ratingRequired', { defaultValue: 'Please select a rating' });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (existingReview) {
      // Update existing review
      const payload: UpdateReviewPayload = {
        rating,
        title: title.trim() || undefined,
        reviewText: reviewText.trim() || undefined,
        images,
      };
      updateMutation.mutate(payload);
    } else {
      // Create new review
      const payload: Omit<CreateReviewPayload, 'productId'> = {
        rating,
        title: title.trim() || undefined,
        reviewText: reviewText.trim() || undefined,
        images,
        orderId,
      };
      createMutation.mutate(payload);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'));

      if (fileArray.length === 0) {
        setUploadError('Please select valid image files');
        return;
      }

      // Upload images to server
      const response = await uploadReviewImages(fileArray);

      // Add uploaded image URLs to state
      const newImageUrls = response.images.map((img) => img.url);
      setImages((prev) => [...prev, ...newImageUrls]);
    } catch (error: any) {
      console.error('Error uploading review images:', error);
      setUploadError(error.response?.data?.message || 'Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
      // Clear input so the same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isUploading;
  const error = createMutation.error || updateMutation.error;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {existingReview
          ? t('reviews.form.editTitle', { defaultValue: 'Edit Your Review' })
          : t('reviews.form.writeTitle', { defaultValue: 'Write a Review' })}
      </h2>

      <div className="mb-4 text-sm text-gray-600">
        {t('reviews.form.reviewingProduct', { defaultValue: 'Reviewing: ' })}
        <span className="font-medium text-gray-900">{productName}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('reviews.form.rating', { defaultValue: 'Rating' })} *
          </label>
          <RatingStars
            rating={rating}
            size="lg"
            interactive
            onChange={setRating}
          />
          {errors.rating && (
            <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            {t('reviews.form.title', { defaultValue: 'Review Title' })}
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder={t('reviews.form.titlePlaceholder', { defaultValue: 'Summarize your experience' })}
          />
          <div className="mt-1 text-xs text-gray-500 text-right">{title.length}/200</div>
        </div>

        {/* Review Text */}
        <div>
          <label htmlFor="reviewText" className="block text-sm font-medium text-gray-700 mb-1">
            {t('reviews.form.review', { defaultValue: 'Your Review' })}
          </label>
          <textarea
            id="reviewText"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder={t('reviews.form.reviewPlaceholder', { defaultValue: 'Share your experience with this product...' })}
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('reviews.form.photos', { defaultValue: 'Add Photos' })}
          </label>

          <div className="space-y-4">
            {/* Image previews */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Upload ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {images.length < 5 && (
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploading ? (
                    <>
                      <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-sm text-gray-600">
                        {t('reviews.form.uploading', { defaultValue: 'Uploading...' })}
                      </p>
                    </>
                  ) : (
                    <>
                      <PhotoIcon className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {t('reviews.form.uploadPhotos', { defaultValue: 'Click to upload photos' })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('reviews.form.maxPhotos', { defaultValue: 'Up to 5 photos (max 5MB each)' })}
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            )}

            {/* Upload error */}
            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{uploadError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              {(error as any).response?.data?.error || t('reviews.form.errors.submitFailed', { defaultValue: 'Failed to submit review. Please try again.' })}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </button>
          )}
          <button
            type="submit"
            disabled={isPending || rating === 0}
            className="px-6 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {existingReview
              ? t('reviews.form.update', { defaultValue: 'Update Review' })
              : t('reviews.form.submit', { defaultValue: 'Submit Review' })}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
