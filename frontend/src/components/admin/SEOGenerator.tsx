import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useMutation } from '@tanstack/react-query';
import {
  SparklesIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  HashtagIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import {
  generateSEOMeta,
  GenerateSEORequest,
  GenerateSEOResponse,
} from '../../api/ai';

interface SEOGeneratorProps {
  productName: string;
  shortDescription?: string;
  description?: string;
  categories?: string[];
  onApply: (seo: GenerateSEOResponse) => void;
  onClose: () => void;
}

export default function SEOGenerator({
  productName,
  shortDescription,
  description,
  categories,
  onApply,
  onClose,
}: SEOGeneratorProps) {
  const [targetKeyword, setTargetKeyword] = useState('');
  const [generatedData, setGeneratedData] = useState<GenerateSEOResponse | null>(null);

  const generateMutation = useMutation({
    mutationFn: (data: GenerateSEORequest) => generateSEOMeta(data),
    onSuccess: (data) => {
      setGeneratedData(data);
      toast.success('SEO meta generated successfully!');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate SEO meta'
      );
    },
  });

  const handleGenerate = () => {
    if (!productName.trim()) {
      toast.error('Product name is required');
      return;
    }

    const request: GenerateSEORequest = {
      productName,
      shortDescription,
      description,
      categories,
      targetKeyword: targetKeyword.trim() || undefined,
    };

    generateMutation.mutate(request);
  };

  const handleApply = () => {
    if (generatedData) {
      onApply(generatedData);
      toast.success('SEO meta applied to product!');
      handleClose();
    }
  };

  const handleClose = () => {
    setGeneratedData(null);
    setTargetKeyword('');
    onClose();
  };

  const handleRegenerate = () => {
    setGeneratedData(null);
    handleGenerate();
  };

  const getCharacterCountClass = (current: number, max: number) => {
    if (current > max) return 'text-rose-400';
    if (current > max * 0.9) return 'text-amber-400';
    return 'text-green-400';
  };

  const getCharacterCountIcon = (current: number, max: number) => {
    if (current > max) return '⚠️';
    if (current > max * 0.9) return '⚡';
    return '✓';
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
                      <HashtagIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-champagne">
                        SEO Meta Generator
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-champagne/60">
                        Generate optimized meta tags powered by AI
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

                {/* Product Info */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-champagne/60">Product Name</p>
                  <p className="mt-1 text-lg font-semibold text-champagne">
                    {productName || 'Untitled Product'}
                  </p>
                  {categories && categories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <span
                          key={cat}
                          className="rounded-full bg-blush/20 px-3 py-1 text-xs font-medium text-champagne"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Settings */}
                {!generatedData && (
                  <div className="mt-6 space-y-6">
                    {/* Target Keyword Input */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-champagne">
                        Target Keyword (Optional)
                      </label>
                      <input
                        type="text"
                        value={targetKeyword}
                        onChange={(e) => setTargetKeyword(e.target.value)}
                        placeholder="e.g., luxury hair serum, organic scalp treatment"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-champagne placeholder:text-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                      />
                      <p className="mt-1 text-xs text-champagne/40">
                        Leave blank to let AI choose the best keyword
                      </p>
                    </div>

                    {/* Info Banner */}
                    <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                      <InformationCircleIcon className="h-5 w-5 shrink-0 text-blue-400" />
                      <div className="text-xs text-champagne/80">
                        <p className="font-semibold">SEO Best Practices</p>
                        <ul className="mt-2 space-y-1">
                          <li>• Meta Title: 50-60 characters (optimal for search results)</li>
                          <li>• Meta Description: 150-160 characters (shows in snippets)</li>
                          <li>• Focus Keyword: Primary search term to rank for</li>
                          <li>• Secondary Keywords: Supporting terms for broader reach</li>
                        </ul>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={!productName.trim() || generateMutation.isPending}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {generateMutation.isPending ? (
                        <>
                          <ArrowPathIcon className="h-5 w-5 animate-spin" />
                          Generating SEO Meta...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="h-5 w-5" />
                          Generate SEO Meta
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
                              Failed to generate SEO meta
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
                            SEO Meta Generated Successfully
                          </p>
                          <p className="mt-0.5 text-xs text-champagne/60">
                            Optimized for search engines and click-through rate
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

                    {/* Meta Title */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="h-4 w-4 text-purple-400" />
                          <p className="text-sm font-semibold text-champagne">Meta Title</p>
                        </div>
                        <span
                          className={`text-xs font-semibold ${getCharacterCountClass(
                            generatedData.metaTitle.length,
                            60
                          )}`}
                        >
                          {getCharacterCountIcon(generatedData.metaTitle.length, 60)}{' '}
                          {generatedData.metaTitle.length}/60
                        </span>
                      </div>
                      <div className="rounded-lg bg-midnight/50 p-4">
                        <p className="text-base font-semibold leading-relaxed text-champagne">
                          {generatedData.metaTitle}
                        </p>
                      </div>
                    </div>

                    {/* Meta Description */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="h-4 w-4 text-purple-400" />
                          <p className="text-sm font-semibold text-champagne">Meta Description</p>
                        </div>
                        <span
                          className={`text-xs font-semibold ${getCharacterCountClass(
                            generatedData.metaDescription.length,
                            160
                          )}`}
                        >
                          {getCharacterCountIcon(generatedData.metaDescription.length, 160)}{' '}
                          {generatedData.metaDescription.length}/160
                        </span>
                      </div>
                      <div className="rounded-lg bg-midnight/50 p-4">
                        <p className="text-sm leading-relaxed text-champagne/80">
                          {generatedData.metaDescription}
                        </p>
                      </div>
                    </div>

                    {/* Focus Keyword */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <HashtagIcon className="h-4 w-4 text-purple-400" />
                        <p className="text-sm font-semibold text-champagne">Focus Keyword</p>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-2 text-sm font-semibold text-champagne">
                        <StarIcon className="h-4 w-4 text-blush" />
                        {generatedData.focusKeyword}
                      </div>
                    </div>

                    {/* Secondary Keywords */}
                    {generatedData.secondaryKeywords &&
                      generatedData.secondaryKeywords.length > 0 && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <HashtagIcon className="h-4 w-4 text-purple-400" />
                            <p className="text-sm font-semibold text-champagne">
                              Secondary Keywords ({generatedData.secondaryKeywords.length})
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {generatedData.secondaryKeywords.map((keyword, index) => (
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

                    {/* Open Graph Tags */}
                    {(generatedData.openGraphTitle || generatedData.openGraphDescription) && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <GlobeAltIcon className="h-4 w-4 text-purple-400" />
                          <p className="text-sm font-semibold text-champagne">
                            Open Graph (Social Media)
                          </p>
                        </div>
                        <div className="space-y-3">
                          {generatedData.openGraphTitle && (
                            <div className="rounded-lg bg-midnight/50 p-3">
                              <p className="mb-1 text-xs font-semibold text-champagne/60">
                                OG Title
                              </p>
                              <p className="text-sm text-champagne">
                                {generatedData.openGraphTitle}
                              </p>
                            </div>
                          )}
                          {generatedData.openGraphDescription && (
                            <div className="rounded-lg bg-midnight/50 p-3">
                              <p className="mb-1 text-xs font-semibold text-champagne/60">
                                OG Description
                              </p>
                              <p className="text-sm text-champagne/80">
                                {generatedData.openGraphDescription}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Estimated CTR */}
                    {generatedData.estimatedCTR && (
                      <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                        <div className="flex items-center gap-3">
                          <ChartBarIcon className="h-5 w-5 text-green-400" />
                          <div>
                            <p className="text-xs font-semibold text-champagne/60">
                              Estimated Click-Through Rate
                            </p>
                            <p className="mt-1 text-lg font-bold text-green-400">
                              {generatedData.estimatedCTR}
                            </p>
                          </div>
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
                        Apply to Product
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
