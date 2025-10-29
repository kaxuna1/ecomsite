import MediaCard from './MediaCard';
import type { CMSMedia } from '../../../api/media';

interface MediaGridProps {
  media: CMSMedia[];
  selectedMedia?: Set<number>;
  onSelectMedia?: (media: CMSMedia) => void;
  onDeleteMedia?: (media: CMSMedia) => void;
  onEditMedia?: (media: CMSMedia) => void;
  onViewMedia?: (media: CMSMedia) => void;
  isLoading?: boolean;
  selectable?: boolean;
}

export default function MediaGrid({
  media,
  selectedMedia = new Set(),
  onSelectMedia,
  onDeleteMedia,
  onEditMedia,
  onViewMedia,
  isLoading = false,
  selectable = false
}: MediaGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-xl bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 p-12">
        <div className="mb-4 rounded-full bg-white/5 p-6">
          <svg
            className="h-16 w-16 text-champagne/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-champagne">
          No media found
        </h3>
        <p className="text-sm text-champagne/60">
          Upload your first image to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {media.map((item) => (
        <MediaCard
          key={item.id}
          media={item}
          isSelected={selectedMedia.has(item.id)}
          onSelect={onSelectMedia}
          onDelete={onDeleteMedia}
          onEdit={onEditMedia}
          onView={onViewMedia}
          selectable={selectable}
          showActions={!selectable}
        />
      ))}
    </div>
  );
}
