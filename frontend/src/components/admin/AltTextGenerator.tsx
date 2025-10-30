import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useMutation } from '@tanstack/react-query';
import {
  SparklesIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  PhotoIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import {
  generateImageAltText,
  GenerateAltTextRequest,
  GenerateAltTextResponse,
} from '../../api/ai';

interface AltTextGeneratorProps {
  imageUrl: string;
  filename?: string;
  productName?: string;
  productCategory?: string;
  onApply: (altText: GenerateAltTextResponse) => void;
  onClose: () => void;
}

export default function AltTextGenerator({
  imageUrl,
  filename,
  productName,
  productCategory,
  onApply,
  onClose,
}: AltTextGeneratorProps) {
  const [generatedData, setGeneratedData] = useState<GenerateAltTextResponse | null>(null);
  const [editedAltText, setEditedAltText] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedCaption, setEditedCaption] = useState('');
  const [showCaption, setShowCaption] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const generateMutation = useMutation({
    mutationFn: (data: GenerateAltTextRequest) => generateImageAltText(data),
    onSuccess: (data) => {
      setGeneratedData(data);
      setEditedAltText(data.altText);
      setEditedTitle(data.title);
      setEditedCaption(data.caption || '');
      toast.success('Alt text generated successfully!');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate alt text'
      );
    },
  });

  const handleGenerate = () => {
    if (!imageUrl.trim()) {
      toast.error('Image URL is required');
      return;
    }

    const request: GenerateAltTextRequest = {
      imageUrl,
      filename,
      productName,
      productCategory,
    };

    generateMutation.mutate(request);
  };

  const handleApply = () => {
    if (generatedData) {
      const updatedData: GenerateAltTextResponse = {
        ...generatedData,
        altText: editedAltText,
        title: editedTitle,
        caption: editedCaption || generatedData.caption,
      };
      onApply(updatedData);
      toast.success('Alt text applied to image!');
      handleClose();
    }
  };

  const handleClose = () => {
    setGeneratedData(null);
    setEditedAltText('');
    setEditedTitle('');
    setEditedCaption('');
    setShowCaption(false);
    setShowDescription(false);
    onClose();
  };

  const handleRegenerate = () => {
    setGeneratedData(null);
    setEditedAltText('');
    setEditedTitle('');
    setEditedCaption('');
    handleGenerate();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const getCharacterCountClass = (current: number) => {
    if (current > 125) return 'text-rose-400';
    if (current >= 100 && current <= 125) return 'text-green-400';
    if (current > 80) return 'text-amber-400';
    return 'text-champagne/60';
  };

  return (
    <Transition appear show={true} as={Fragment}>
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl border border-white/10 bg-midnight p-8 text-left align-middle shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-3">
                      <PhotoIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-champagne">
                        Alt Text Generator
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-champagne/60">
                        Generate accessible alt text powered by AI
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full p-2 text-champagne/60 transition-colors hover:bg-white/5 hover:text-champagne"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Image Preview */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-32 w-32 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/128?text=Image';
                      }}
                    />
                    <div className="flex-1">
                      {productName && (
                        <p className="text-lg font-semibold text-champagne">{productName}</p>
                      )}
                      {filename && (
                        <p className="mt-1 text-sm text-champagne/60">File: {filename}</p>
                      )}
                      {productCategory && (
                        <span className="mt-2 inline-block rounded-full bg-blush/20 px-3 py-1 text-xs font-medium text-champagne">
                          {productCategory}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Settings */}
                {!generatedData && (
                  <div className="mt-6 space-y-6">
                    {/* Info Banner */}
                    <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                      <InformationCircleIcon className="h-5 w-5 shrink-0 text-blue-400" />
                      <div className="text-xs text-champagne/80">
                        <p className="font-semibold">Alt Text Best Practices</p>
                        <ul className="mt-2 space-y-1">
                          <li>• Be descriptive and specific about the image content</li>
                          <li>• Optimal length: 100-125 characters for screen readers</li>
                          <li>• Include relevant context and product details</li>
                          <li>• Avoid "image of" or "picture of" - go straight to description</li>
                        </ul>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={!imageUrl.trim() || generateMutation.isPending}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {generateMutation.isPending ? (
                        <>
                          <ArrowPathIcon className="h-5 w-5 animate-spin" />
                          Analyzing Image...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="h-5 w-5" />
                          Generate Alt Text
                        </>
                      )}
                    </button>

                    {/* Error Display */}
                    {generateMutation.isError && (
                      <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                        <div className="flex items-start gap-3">
                          <XMarkIcon className="h-5 w-5 shrink-0 text-rose-400" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-rose-400">
                              Failed to generate alt text
                            </p>
                            <p className="mt-1 text-xs text-champagne/60">
                              {generateMutation.error instanceof Error
                                ? generateMutation.error.message
                                : 'An unexpected error occurred. Please try again.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Generated Content Display */}
                {generatedData && (
                  <div className="mt-6 space-y-6">
                    {/* Success Banner */}
                    <div className="flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                      <div className="flex items-center gap-3">
                        <CheckIcon className="h-6 w-6 text-green-400" />
                        <div>
                          <p className="text-sm font-semibold text-green-400">
                            Alt Text Generated Successfully
                          </p>
                          <p className="mt-0.5 text-xs text-champagne/60">
                            You can edit the text before applying
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRegenerate}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-champagne transition-colors hover:border-white/20 hover:bg-white/10"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                        Regenerate
                      </button>
                    </div>

                    {/* Alt Text (Editable) */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StarIcon className="h-4 w-4 text-purple-400" />
                          <p className="text-sm font-semibold text-champagne">Alt Text</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${getCharacterCountClass(editedAltText.length)}`}>
                            {editedAltText.length} chars
                            {editedAltText.length >= 100 && editedAltText.length <= 125 && ' ✓'}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(editedAltText, 'Alt text')}
                            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-champagne/60 transition-colors hover:border-white/20 hover:text-champagne"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={editedAltText}
                        onChange={(e) => setEditedAltText(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-white/10 bg-midnight/50 p-3 text-sm text-champagne placeholder:text-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                      />
                    </div>

                    {/* Title Attribute (Editable) */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StarIcon className="h-4 w-4 text-purple-400" />
                          <p className="text-sm font-semibold text-champagne">Title Attribute</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(editedTitle, 'Title')}
                          className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-champagne/60 transition-colors hover:border-white/20 hover:text-champagne"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-midnight/50 p-3 text-sm text-champagne placeholder:text-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                      />
                    </div>

                    {/* Caption (Expandable & Editable) */}
                    {generatedData.caption && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <button
                          type="button"
                          onClick={() => setShowCaption(!showCaption)}
                          className="flex w-full items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <StarIcon className="h-4 w-4 text-purple-400" />
                            <p className="text-sm font-semibold text-champagne">Caption</p>
                          </div>
                          {showCaption ? (
                            <ChevronUpIcon className="h-5 w-5 text-champagne/60" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 text-champagne/60" />
                          )}
                        </button>
                        {showCaption && (
                          <div className="mt-3 space-y-2">
                            <textarea
                              value={editedCaption}
                              onChange={(e) => setEditedCaption(e.target.value)}
                              rows={3}
                              className="w-full rounded-lg border border-white/10 bg-midnight/50 p-3 text-sm text-champagne placeholder:text-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                            />
                            <button
                              type="button"
                              onClick={() => copyToClipboard(editedCaption, 'Caption')}
                              className="text-xs text-champagne/60 transition-colors hover:text-champagne"
                            >
                              Copy to clipboard
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Image Description (Expandable, Read-only) */}
                    {generatedData.imageDescription && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <button
                          type="button"
                          onClick={() => setShowDescription(!showDescription)}
                          className="flex w-full items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <StarIcon className="h-4 w-4 text-purple-400" />
                            <p className="text-sm font-semibold text-champagne">
                              Long Description
                            </p>
                          </div>
                          {showDescription ? (
                            <ChevronUpIcon className="h-5 w-5 text-champagne/60" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 text-champagne/60" />
                          )}
                        </button>
                        {showDescription && (
                          <div className="mt-3">
                            <div className="rounded-lg bg-midnight/50 p-3">
                              <p className="whitespace-pre-wrap text-sm text-champagne/80">
                                {generatedData.imageDescription}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(
                                  generatedData.imageDescription!,
                                  'Description'
                                )
                              }
                              className="mt-2 text-xs text-champagne/60 transition-colors hover:text-champagne"
                            >
                              Copy to clipboard
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SEO Keywords */}
                    {generatedData.seoKeywords && generatedData.seoKeywords.length > 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <StarIcon className="h-4 w-4 text-purple-400" />
                          <p className="text-sm font-semibold text-champagne">
                            SEO Keywords ({generatedData.seoKeywords.length})
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {generatedData.seoKeywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-champagne"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-champagne transition-colors hover:border-white/30 hover:bg-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleApply}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
                      >
                        <CheckIcon className="h-5 w-5" />
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
