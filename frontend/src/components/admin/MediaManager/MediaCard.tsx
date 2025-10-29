import { useState } from 'react';
import {
  PhotoIcon,
  CheckCircleIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import type { CMSMedia } from '../../../api/media';

interface MediaCardProps {
  media: CMSMedia;
  isSelected?: boolean;
  onSelect?: (media: CMSMedia) => void;
  onDelete?: (media: CMSMedia) => void;
  onEdit?: (media: CMSMedia) => void;
  onView?: (media: CMSMedia) => void;
  showActions?: boolean;
  selectable?: boolean;
}

export default function MediaCard({
  media,
  isSelected = false,
  onSelect,
  onDelete,
  onEdit,
  onView,
  showActions = true,
  selectable = false
}: MediaCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleCardClick = () => {
    if (selectable && onSelect) {
      onSelect(media);
    } else if (onView) {
      onView(media);
    }
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-200 ${
        isSelected
          ? 'border-blush bg-blush/10 ring-2 ring-blush/30'
          : 'border-white/10 bg-white/5 hover:border-blush/50 hover:bg-white/10'
      } ${selectable || onView ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Indicator */}
      {selectable && (
        <div className="absolute left-2 top-2 z-10">
          {isSelected ? (
            <CheckCircleSolidIcon className="h-6 w-6 text-blush" />
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-white bg-midnight/50 opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </div>
      )}

      {/* Usage Badge */}
      {media.usageCount !== undefined && media.usageCount > 0 && (
        <div className="absolute right-2 top-2 z-10">
          <div className="flex items-center gap-1 rounded-full bg-midnight/80 px-2 py-1 text-xs font-semibold text-champagne backdrop-blur-sm">
            <DocumentDuplicateIcon className="h-3 w-3" />
            {media.usageCount}
          </div>
        </div>
      )}

      {/* Image Preview */}
      <div className="relative aspect-square overflow-hidden bg-white/5">
        {!imageError && media.mimeType?.startsWith('image/') ? (
          <img
            src={media.url}
            alt={media.altText || media.filename}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PhotoIcon className="h-16 w-16 text-champagne/20" />
          </div>
        )}

        {/* Hover Overlay with Actions */}
        {showActions && isHovered && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-midnight/80 backdrop-blur-sm transition-opacity">
            {onView && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView(media);
                }}
                className="rounded-full bg-champagne p-2 text-midnight transition-transform hover:scale-110"
                aria-label="View details"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(media);
                }}
                className="rounded-full bg-blush p-2 text-midnight transition-transform hover:scale-110"
                aria-label="Edit"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(media);
                }}
                className="rounded-full bg-rose-500 p-2 text-white transition-transform hover:scale-110"
                aria-label="Delete"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Media Info */}
      <div className="p-3">
        <div className="mb-1 truncate text-sm font-semibold text-champagne" title={media.originalName}>
          {media.originalName}
        </div>

        <div className="flex items-center justify-between text-xs text-champagne/60">
          <span>{formatFileSize(media.sizeBytes)}</span>
          {media.width && media.height && (
            <span>
              {media.width} × {media.height}
            </span>
          )}
        </div>

        {/* Tags */}
        {media.tags && media.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {media.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-champagne/80"
              >
                {tag.name}
              </span>
            ))}
            {media.tags.length > 2 && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-champagne/60">
                +{media.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Deleted Badge */}
        {media.isDeleted && (
          <div className="mt-2">
            <span className="rounded-full bg-rose-500/20 px-2 py-1 text-xs font-semibold text-rose-400">
              Deleted
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
