import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
  CalendarIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import type { CMSMedia } from '../../../api/media';

interface MediaPreviewModalProps {
  media: CMSMedia | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (media: CMSMedia) => void;
}

export default function MediaPreviewModal({
  media,
  isOpen,
  onClose,
  onEdit
}: MediaPreviewModalProps) {
  if (!media) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Show a toast notification
    alert('Copied to clipboard!');
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl border border-white/20 bg-midnight shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
                  <Dialog.Title className="text-xl font-bold text-champagne">
                    Media Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 text-champagne/60 transition-colors hover:bg-white/10 hover:text-champagne"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="grid gap-6 p-6 lg:grid-cols-2">
                  {/* Image Preview */}
                  <div className="space-y-4">
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

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-champagne transition-colors hover:border-blush hover:bg-white/10"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        Open in New Tab
                      </a>
                      <button
                        onClick={() => copyToClipboard(media.url)}
                        className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-champagne transition-colors hover:border-blush hover:bg-white/10"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                        Copy URL
                      </button>
                      {onEdit && (
                        <button
                          onClick={() => {
                            onEdit(media);
                            onClose();
                          }}
                          className="flex items-center gap-2 rounded-full bg-blush px-4 py-2 text-sm font-semibold text-midnight transition-colors hover:bg-champagne"
                        >
                          Edit Details
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-6">
                    {/* File Information */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-champagne/60">
                        File Information
                      </h3>
                      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                        <div>
                          <div className="text-xs text-champagne/60">Filename</div>
                          <div className="text-sm font-medium text-champagne">{media.originalName}</div>
                        </div>
                        <div>
                          <div className="text-xs text-champagne/60">File Size</div>
                          <div className="text-sm font-medium text-champagne">
                            {formatFileSize(media.sizeBytes)}
                          </div>
                        </div>
                        {media.width && media.height && (
                          <div>
                            <div className="text-xs text-champagne/60">Dimensions</div>
                            <div className="text-sm font-medium text-champagne">
                              {media.width} × {media.height} pixels
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-champagne/60">File Type</div>
                          <div className="text-sm font-medium text-champagne">{media.mimeType}</div>
                        </div>
                      </div>
                    </div>

                    {/* Descriptive Information */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-champagne/60">
                        Description
                      </h3>
                      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                        {media.altText && (
                          <div>
                            <div className="text-xs text-champagne/60">Alt Text</div>
                            <div className="text-sm text-champagne">{media.altText}</div>
                          </div>
                        )}
                        {media.caption && (
                          <div>
                            <div className="text-xs text-champagne/60">Caption</div>
                            <div className="text-sm text-champagne">{media.caption}</div>
                          </div>
                        )}
                        {!media.altText && !media.caption && (
                          <div className="text-sm text-champagne/40">No description provided</div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {media.tags && media.tags.length > 0 && (
                      <div>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-champagne/60">
                          Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {media.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-champagne"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Usage */}
                    {media.usageCount !== undefined && (
                      <div>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-champagne/60">
                          Usage
                        </h3>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-center gap-2">
                            <DocumentDuplicateIcon className="h-5 w-5 text-champagne/60" />
                            <span className="text-sm text-champagne">
                              Used in {media.usageCount} {media.usageCount === 1 ? 'place' : 'places'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Upload Information */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-champagne/60">
                        Upload Information
                      </h3>
                      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-champagne/60" />
                          <div>
                            <div className="text-xs text-champagne/60">Uploaded</div>
                            <div className="text-sm text-champagne">{formatDate(media.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

