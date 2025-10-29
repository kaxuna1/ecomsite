import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  PlusIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import MediaGrid from './MediaGrid';
import MediaUploader from './MediaUploader';
import { getAllMedia, deleteMedia, type MediaFilters, type CMSMedia } from '../../../api/media';

interface MediaLibraryProps {
  mode?: 'browse' | 'select';
  onSelect?: (media: CMSMedia | CMSMedia[]) => void;
  onClose?: () => void;
  multiple?: boolean;
  maxSelection?: number;
}

export default function MediaLibrary({
  mode = 'browse',
  onSelect,
  onClose,
  multiple = false,
  maxSelection
}: MediaLibraryProps) {
  const [filters, setFilters] = useState<MediaFilters>({
    search: '',
    limit: 50,
    offset: 0
  });
  const [showUploader, setShowUploader] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  // Fetch media
  const { data: media = [], isLoading, refetch } = useQuery({
    queryKey: ['media', filters],
    queryFn: () => getAllMedia(filters)
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    }
  });

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search, offset: 0 }));
  };

  const handleSelectMedia = (media: CMSMedia) => {
    if (mode !== 'select') return;

    const newSelected = new Set(selectedMedia);

    if (newSelected.has(media.id)) {
      newSelected.delete(media.id);
    } else {
      if (!multiple) {
        newSelected.clear();
      }
      if (!maxSelection || newSelected.size < maxSelection) {
        newSelected.add(media.id);
      }
    }

    setSelectedMedia(newSelected);
  };

  const handleConfirmSelection = () => {
    if (!onSelect) return;

    const selected = media.filter((m) => selectedMedia.has(m.id));

    if (multiple) {
      onSelect(selected);
    } else if (selected.length > 0) {
      onSelect(selected[0]);
    }

    onClose?.();
  };

  const handleDeleteMedia = async (mediaItem: CMSMedia) => {
    if (!confirm(`Delete "${mediaItem.originalName}"?`)) return;

    try {
      await deleteMutation.mutateAsync(mediaItem.id);
    } catch (error: any) {
      alert(error.message || 'Failed to delete media');
    }
  };

  const handleViewMedia = (media: CMSMedia) => {
    // TODO: Open details panel or modal
    console.log('View media:', media);
  };

  const handleEditMedia = (media: CMSMedia) => {
    // TODO: Open edit modal
    console.log('Edit media:', media);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-midnight/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-champagne">
              {mode === 'select' ? 'Select Media' : 'Media Library'}
            </h2>
            <p className="mt-1 text-sm text-champagne/60">
              {mode === 'select'
                ? `Select ${multiple ? 'one or more images' : 'an image'}`
                : 'Manage your uploaded media files'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'select' && onClose && (
              <button
                onClick={onClose}
                className="rounded-full p-2 text-champagne/60 transition-colors hover:bg-white/10 hover:text-champagne"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-champagne/40" />
            <input
              type="text"
              placeholder="Search by filename or alt text..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-full border border-white/20 bg-white/5 py-2 pl-10 pr-4 text-champagne placeholder-champagne/40 transition-colors focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                showFilters
                  ? 'border-blush bg-blush text-midnight'
                  : 'border-white/20 bg-white/5 text-champagne hover:border-blush hover:bg-white/10'
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filters
            </button>

            {mode !== 'select' && (
              <button
                onClick={() => setShowUploader(!showUploader)}
                className="flex items-center gap-2 rounded-full bg-blush px-4 py-2 text-sm font-semibold text-midnight transition-colors hover:bg-champagne"
              >
                <PlusIcon className="h-4 w-4" />
                Upload
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-champagne/60">
                  Min Width
                </label>
                <input
                  type="number"
                  value={filters.minWidth || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minWidth: e.target.value ? Number(e.target.value) : undefined
                    }))
                  }
                  className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-2 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none"
                  placeholder="e.g. 800"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-champagne/60">
                  Min Height
                </label>
                <input
                  type="number"
                  value={filters.minHeight || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minHeight: e.target.value ? Number(e.target.value) : undefined
                    }))
                  }
                  className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-2 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none"
                  placeholder="e.g. 600"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-champagne/60">
                  File Type
                </label>
                <select
                  value={filters.mimeType || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      mimeType: e.target.value || undefined
                    }))
                  }
                  className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-2 text-champagne focus:border-blush focus:outline-none"
                >
                  <option value="">All types</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WebP</option>
                  <option value="image/gif">GIF</option>
                  <option value="image/avif">AVIF</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() =>
                    setFilters({
                      search: '',
                      limit: 50,
                      offset: 0
                    })
                  }
                  className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-champagne transition-colors hover:border-rose-500 hover:bg-rose-500/10 hover:text-rose-400"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {showUploader && mode !== 'select' && (
          <div className="mb-6">
            <MediaUploader
              onUploadComplete={() => {
                refetch();
                setShowUploader(false);
              }}
            />
          </div>
        )}

        <MediaGrid
          media={media}
          selectedMedia={selectedMedia}
          onSelectMedia={mode === 'select' ? handleSelectMedia : undefined}
          onDeleteMedia={mode !== 'select' ? handleDeleteMedia : undefined}
          onEditMedia={mode !== 'select' ? handleEditMedia : undefined}
          onViewMedia={mode !== 'select' ? handleViewMedia : undefined}
          isLoading={isLoading}
          selectable={mode === 'select'}
        />
      </div>

      {/* Footer (for select mode) */}
      {mode === 'select' && (
        <div className="border-t border-white/10 bg-midnight/50 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-champagne/60">
              {selectedMedia.size > 0 ? (
                <span>
                  {selectedMedia.size} selected
                  {maxSelection && ` (max ${maxSelection})`}
                </span>
              ) : (
                <span>No media selected</span>
              )}
            </div>

            <div className="flex gap-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="rounded-full border border-white/20 bg-white/5 px-6 py-2 text-sm font-semibold text-champagne transition-colors hover:border-white/40 hover:bg-white/10"
                >
                  Cancel
                </button>
              )}

              <button
                onClick={handleConfirmSelection}
                disabled={selectedMedia.size === 0}
                className="rounded-full bg-blush px-6 py-2 text-sm font-semibold text-midnight transition-colors hover:bg-champagne disabled:cursor-not-allowed disabled:opacity-50"
              >
                Select ({selectedMedia.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
