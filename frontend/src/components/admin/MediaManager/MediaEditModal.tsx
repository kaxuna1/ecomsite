import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMedia, type CMSMedia, type UpdateMediaPayload } from '../../../api/media';

interface MediaEditModalProps {
  media: CMSMedia | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MediaEditModal({ media, isOpen, onClose }: MediaEditModalProps) {
  const [formData, setFormData] = useState<UpdateMediaPayload>({
    altText: '',
    caption: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  useEffect(() => {
    if (media) {
      setFormData({
        altText: media.altText || '',
        caption: media.caption || ''
      });
      setErrors({});
    }
  }, [media]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMediaPayload }) =>
      updateMedia(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      onClose();
    },
    onError: (error: any) => {
      setErrors({
        submit: error.message || 'Failed to update media'
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!media) return;

    // Validate
    const newErrors: Record<string, string> = {};

    if (!formData.altText?.trim()) {
      newErrors.altText = 'Alt text is recommended for accessibility';
    }

    // Allow submission even with warnings
    await updateMutation.mutateAsync({
      id: media.id,
      data: formData
    });
  };

  const handleClose = () => {
    if (!updateMutation.isPending) {
      onClose();
    }
  };

  if (!media) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl border border-white/20 bg-midnight shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
                  <Dialog.Title className="text-xl font-bold text-champagne">
                    Edit Media Details
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    disabled={updateMutation.isPending}
                    className="rounded-full p-2 text-champagne/60 transition-colors hover:bg-white/10 hover:text-champagne disabled:opacity-50"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Image Preview */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-champagne/60">
                        Preview
                      </label>
                      <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5">
                        {media.mimeType?.startsWith('image/') ? (
                          <img
                            src={media.url}
                            alt={media.altText || media.filename}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <PhotoIcon className="h-24 w-24 text-champagne/20" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-champagne/60">
                        <div className="truncate">{media.originalName}</div>
                        {media.width && media.height && (
                          <div>
                            {media.width} × {media.height} pixels
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      {/* Alt Text */}
                      <div>
                        <label
                          htmlFor="altText"
                          className="mb-2 block text-sm font-semibold text-champagne"
                        >
                          Alt Text
                          <span className="ml-1 text-xs font-normal text-champagne/60">
                            (Recommended)
                          </span>
                        </label>
                        <input
                          id="altText"
                          type="text"
                          value={formData.altText}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, altText: e.target.value }))
                          }
                          placeholder="Describe the image for accessibility"
                          className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 transition-colors focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                        />
                        {errors.altText && (
                          <p className="mt-1 text-xs text-amber-400">{errors.altText}</p>
                        )}
                        <p className="mt-1 text-xs text-champagne/60">
                          Describe what's in the image. This helps screen readers and SEO.
                        </p>
                      </div>

                      {/* Caption */}
                      <div>
                        <label
                          htmlFor="caption"
                          className="mb-2 block text-sm font-semibold text-champagne"
                        >
                          Caption
                          <span className="ml-1 text-xs font-normal text-champagne/60">
                            (Optional)
                          </span>
                        </label>
                        <textarea
                          id="caption"
                          value={formData.caption}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, caption: e.target.value }))
                          }
                          placeholder="Add a caption or description"
                          rows={4}
                          className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 transition-colors focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                        />
                        <p className="mt-1 text-xs text-champagne/60">
                          Additional context or information about the image.
                        </p>
                      </div>

                      {/* File Info (Read-only) */}
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-champagne/60">
                          File Information
                        </h4>
                        <div className="space-y-1 text-sm text-champagne/80">
                          <div className="flex justify-between">
                            <span className="text-champagne/60">Type:</span>
                            <span>{media.mimeType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-champagne/60">Size:</span>
                            <span>
                              {(media.sizeBytes / 1024).toFixed(2)} KB
                            </span>
                          </div>
                          {media.usageCount !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-champagne/60">Used in:</span>
                              <span>
                                {media.usageCount} {media.usageCount === 1 ? 'place' : 'places'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {errors.submit && (
                    <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                      {errors.submit}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={updateMutation.isPending}
                      className="rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold text-champagne transition-colors hover:border-white/40 hover:bg-white/10 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="rounded-full bg-blush px-6 py-2.5 text-sm font-semibold text-midnight transition-colors hover:bg-champagne disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

