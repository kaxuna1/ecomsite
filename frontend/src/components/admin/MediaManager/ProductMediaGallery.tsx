import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  PlusIcon,
  StarIcon,
  TrashIcon,
  PhotoIcon,
  ScissorsIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import MediaSelector from './MediaSelector';
import MediaUploader from './MediaUploader';
import ImageCropEditor, { CropData } from './ImageCropEditor';
import {
  getProductMedia,
  attachMediaToProduct,
  detachMediaFromProduct,
  reorderProductMedia,
  setFeaturedProductImage,
  uploadMedia,
  type CMSMedia,
  type ProductMediaLink
} from '../../../api/media';

interface ProductMediaGalleryProps {
  productId: number;
  maxImages?: number;
}

interface SortableImageProps {
  media: ProductMediaLink;
  isFeatured: boolean;
  onSetFeatured: () => void;
  onRemove: () => void;
  onCrop: () => void;
}

function SortableImage({ media, isFeatured, onSetFeatured, onRemove, onCrop }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: media.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-square cursor-move overflow-hidden rounded-xl border-2 border-white/10 bg-white/5 transition-all hover:border-blush/50"
      {...attributes}
      {...listeners}
    >
      {/* Image */}
      {media.url ? (
        <img
          src={media.url}
          alt={media.altText || media.originalName || 'Product image'}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <PhotoIcon className="h-16 w-16 text-champagne/20" />
        </div>
      )}

      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute left-2 top-2">
          <div className="flex items-center gap-1 rounded-full bg-blush px-2 py-1 text-xs font-semibold text-midnight">
            <StarSolidIcon className="h-3 w-3" />
            Featured
          </div>
        </div>
      )}

      {/* Hover Actions */}
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-midnight/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetFeatured();
          }}
          className={`rounded-full p-2 transition-all ${
            isFeatured
              ? 'bg-blush text-midnight'
              : 'bg-champagne/20 text-champagne hover:bg-champagne hover:text-midnight'
          }`}
          title={isFeatured ? 'Featured image' : 'Set as featured'}
        >
          <StarIcon className="h-5 w-5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onCrop();
          }}
          className="rounded-full bg-champagne/20 p-2 text-champagne transition-all hover:bg-champagne hover:text-midnight"
          title="Crop image"
        >
          <ScissorsIcon className="h-5 w-5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded-full bg-rose-500/80 p-2 text-white transition-all hover:bg-rose-500"
          title="Remove image"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Display Order */}
      <div className="absolute bottom-2 right-2">
        <div className="rounded-full bg-midnight/80 px-2 py-1 text-xs font-semibold text-champagne backdrop-blur-sm">
          #{media.displayOrder + 1}
        </div>
      </div>
    </div>
  );
}

export default function ProductMediaGallery({ productId, maxImages = 10 }: ProductMediaGalleryProps) {
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [cropImage, setCropImage] = useState<ProductMediaLink | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Fetch product media
  const { data: productMedia = [], isLoading } = useQuery({
    queryKey: ['product-media', productId],
    queryFn: () => getProductMedia(productId),
    enabled: !!productId
  });

  // Attach media mutation
  const attachMutation = useMutation({
    mutationFn: ({ mediaId, isFeatured }: { mediaId: number; isFeatured?: boolean }) =>
      attachMediaToProduct(productId, mediaId, { isFeatured }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-media', productId] });
    }
  });

  // Detach media mutation
  const detachMutation = useMutation({
    mutationFn: (mediaId: number) => detachMediaFromProduct(productId, mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-media', productId] });
    }
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: (mediaIds: number[]) => reorderProductMedia(productId, mediaIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-media', productId] });
    }
  });

  // Set featured mutation
  const setFeaturedMutation = useMutation({
    mutationFn: (mediaId: number) => setFeaturedProductImage(productId, mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-media', productId] });
    }
  });

  // Upload and attach mutation
  const uploadAndAttachMutation = useMutation({
    mutationFn: async (file: File) => {
      const uploadedMedia = await uploadMedia(file, {
        altText: file.name.split('.')[0]
      });
      await attachMediaToProduct(productId, uploadedMedia.id, {
        isFeatured: productMedia.length === 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-media', productId] });
      queryClient.invalidateQueries({ queryKey: ['media'] });
    }
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = productMedia.findIndex((item) => item.id === active.id);
      const newIndex = productMedia.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(productMedia, oldIndex, newIndex);
      const mediaIds = newOrder.map((item) => item.mediaId);

      reorderMutation.mutate(mediaIds);
    }
  };

  const handleSelectFromLibrary = (media: CMSMedia | CMSMedia[]) => {
    const mediaArray = Array.isArray(media) ? media : [media];

    mediaArray.forEach((m) => {
      attachMutation.mutate({
        mediaId: m.id,
        isFeatured: productMedia.length === 0
      });
    });

    setShowMediaSelector(false);
  };

  const handleUploadComplete = () => {
    setShowUploader(false);
    queryClient.invalidateQueries({ queryKey: ['product-media', productId] });
  };

  const handleRemoveImage = async (mediaId: number) => {
    if (!confirm('Remove this image from the product?')) return;

    try {
      await detachMutation.mutateAsync(mediaId);
    } catch (error: any) {
      alert(error.message || 'Failed to remove image');
    }
  };

  const handleSetFeatured = async (mediaId: number) => {
    try {
      await setFeaturedMutation.mutateAsync(mediaId);
    } catch (error: any) {
      alert(error.message || 'Failed to set featured image');
    }
  };

  const handleSaveCrop = async (croppedImage: Blob, cropData: CropData) => {
    if (!cropImage) return;

    try {
      // Upload cropped image as new media
      const file = new File([croppedImage], `${cropImage.originalName}_cropped.jpg`, {
        type: 'image/jpeg'
      });

      const uploadedMedia = await uploadMedia(file, {
        altText: cropImage.altText || undefined,
        caption: `Cropped version of ${cropImage.originalName}`
      });

      // Attach to product
      await attachMediaToProduct(productId, uploadedMedia.id, {
        displayOrder: cropImage.displayOrder
      });

      // Remove old image
      await detachMediaFromProduct(productId, cropImage.mediaId);

      queryClient.invalidateQueries({ queryKey: ['product-media', productId] });
      queryClient.invalidateQueries({ queryKey: ['media'] });

      setCropImage(null);
    } catch (error: any) {
      alert(error.message || 'Failed to save cropped image');
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-xl bg-white/5" />
        ))}
      </div>
    );
  }

  const canAddMore = productMedia.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Gallery Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={productMedia.map((m) => m.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {productMedia.map((media) => (
              <SortableImage
                key={media.id}
                media={media}
                isFeatured={media.isFeatured}
                onSetFeatured={() => handleSetFeatured(media.mediaId)}
                onRemove={() => handleRemoveImage(media.mediaId)}
                onCrop={() => setCropImage(media)}
              />
            ))}

            {/* Add New Placeholder */}
            {canAddMore && (
              <div className="aspect-square">
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-4 transition-colors hover:border-blush hover:bg-white/10">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowMediaSelector(true)}
                      className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-white/10"
                      title="Select from library"
                    >
                      <PhotoIcon className="h-8 w-8 text-champagne/40" />
                      <span className="text-xs text-champagne/60">Library</span>
                    </button>

                    <button
                      onClick={() => setShowUploader(!showUploader)}
                      className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-white/10"
                      title="Upload new"
                    >
                      <CloudArrowUpIcon className="h-8 w-8 text-champagne/40" />
                      <span className="text-xs text-champagne/60">Upload</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Upload Section */}
      {showUploader && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <MediaUploader onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {/* Info */}
      {productMedia.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2 text-sm text-champagne/60">
          <span>
            {productMedia.length} / {maxImages} images
          </span>
          <span className="text-xs">Drag to reorder</span>
        </div>
      )}

      {/* Empty State */}
      {productMedia.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 p-12">
          <PhotoIcon className="mb-4 h-16 w-16 text-champagne/20" />
          <h3 className="mb-2 text-lg font-semibold text-champagne">No images yet</h3>
          <p className="mb-4 text-sm text-champagne/60">Add images to showcase your product</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMediaSelector(true)}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-champagne transition-colors hover:border-blush hover:bg-white/10"
            >
              <PhotoIcon className="h-4 w-4" />
              Select from Library
            </button>
            <button
              onClick={() => setShowUploader(true)}
              className="flex items-center gap-2 rounded-full bg-blush px-4 py-2 text-sm font-semibold text-midnight transition-colors hover:bg-champagne"
            >
              <PlusIcon className="h-4 w-4" />
              Upload New
            </button>
          </div>
        </div>
      )}

      {/* Media Selector Modal */}
      <MediaSelector
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={handleSelectFromLibrary}
        multiple={true}
        maxSelection={maxImages - productMedia.length}
      />

      {/* Crop Editor */}
      {cropImage && cropImage.url && (
        <ImageCropEditor
          imageUrl={cropImage.url}
          imageName={cropImage.originalName || 'Product image'}
          onSave={handleSaveCrop}
          onClose={() => setCropImage(null)}
        />
      )}
    </div>
  );
}
