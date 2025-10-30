import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useMutation } from '@tanstack/react-query';
import {
  SparklesIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import {
  generateProductDescription,
  GenerateDescriptionRequest,
  GenerateDescriptionResponse,
} from '../../api/ai';

interface AIDescriptionGeneratorProps {
  productName: string;
  shortDescription?: string;
  categories?: string[];
  currentDescription?: string;
  currentHighlights?: string[];
  currentUsage?: string;
  currentMetaDescription?: string;
  isOpen: boolean;
  onApply: (generated: GenerateDescriptionResponse) => void;
  onClose: () => void;
}

type Tone = 'professional' | 'luxury' | 'casual' | 'friendly' | 'technical';
type Length = 'short' | 'medium' | 'long';

const toneOptions: { value: Tone; label: string; description: string; icon: string }[] = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Polished, business-focused tone',
    icon: '💼',
  },
  {
    value: 'luxury',
    label: 'Luxury',
    description: 'Sophisticated, premium language',
    icon: '✨',
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Relaxed, conversational style',
    icon: '😊',
  },
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm, approachable tone',
    icon: '🤗',
  },
  {
    value: 'technical',
    label: 'Technical',
    description: 'Detailed, specification-focused',
    icon: '🔬',
  },
];

const lengthOptions: { value: Length; label: string; description: string }[] = [
  { value: 'short', label: 'Short', description: '~100 words' },
  { value: 'medium', label: 'Medium', description: '~200 words' },
  { value: 'long', label: 'Long', description: '~300 words' },
];

export default function AIDescriptionGenerator({
  productName,
  shortDescription,
  categories,
  currentDescription,
  currentHighlights,
  currentUsage,
  currentMetaDescription,
  isOpen,
  onApply,
  onClose,
}: AIDescriptionGeneratorProps) {
  const [tone, setTone] = useState<Tone>('luxury');
  const [length, setLength] = useState<Length>('medium');
  const [generatedData, setGeneratedData] = useState<GenerateDescriptionResponse | null>(null);

  const generateMutation = useMutation({
    mutationFn: (data: GenerateDescriptionRequest) => generateProductDescription(data),
    onSuccess: (data) => {
      setGeneratedData(data);
    },
  });

  const handleGenerate = () => {
    if (!productName.trim()) {
      return;
    }

    const request: GenerateDescriptionRequest = {
      productName,
      shortDescription,
      categories,
      tone,
      length,
    };

    generateMutation.mutate(request);
  };

  const handleApply = () => {
    if (generatedData) {
      // Check if we're overwriting existing content
      const hasExistingContent =
        (currentDescription && currentDescription.trim()) ||
        (currentHighlights && currentHighlights.length > 0) ||
        (currentUsage && currentUsage.trim()) ||
        (currentMetaDescription && currentMetaDescription.trim());

      if (hasExistingContent) {
        const confirmed = window.confirm(
          'This will overwrite existing content. Are you sure you want to continue?'
        );
        if (!confirmed) return;
      }

      onApply(generatedData);
      handleClose();
    }
  };

  const handleClose = () => {
    setGeneratedData(null);
    onClose();
  };

  const handleRegenerate = () => {
    setGeneratedData(null);
    handleGenerate();
  };

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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl border border-white/10 bg-midnight p-8 text-left align-middle shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-3">
                      <SparklesIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-champagne">
                        AI Description Generator
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-champagne/60">
                        Generate compelling product content powered by AI
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
                  <p className="mt-1 text-lg font-semibold text-champagne">{productName || 'Untitled Product'}</p>
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
                    {/* Tone Selector */}
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-champagne">
                        Tone
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {toneOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setTone(option.value)}
                            className={`group relative rounded-xl border p-3 text-center transition-all ${
                              tone === option.value
                                ? 'border-blush bg-blush/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="mb-1 text-2xl">{option.icon}</div>
                            <p
                              className={`text-xs font-semibold ${
                                tone === option.value ? 'text-champagne' : 'text-champagne/60'
                              }`}
                            >
                              {option.label}
                            </p>
                            {tone === option.value && (
                              <CheckIcon className="absolute right-2 top-2 h-4 w-4 text-blush" />
                            )}
                            {/* Tooltip */}
                            <div className="invisible absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-midnight px-2 py-1 text-xs text-champagne opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                              {option.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Length Selector */}
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-champagne">
                        Length
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {lengthOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setLength(option.value)}
                            className={`rounded-xl border p-4 text-center transition-all ${
                              length === option.value
                                ? 'border-blush bg-blush/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <p
                              className={`text-lg font-bold ${
                                length === option.value ? 'text-champagne' : 'text-champagne/60'
                              }`}
                            >
                              {option.label}
                            </p>
                            <p className="mt-1 text-xs text-champagne/40">{option.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Info Banner */}
                    <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                      <InformationCircleIcon className="h-5 w-5 shrink-0 text-blue-400" />
                      <div className="text-xs text-champagne/80">
                        <p className="font-semibold">AI-generated content is a starting point</p>
                        <p className="mt-1">
                          Review and edit the generated content to match your brand voice and ensure
                          accuracy before publishing.
                        </p>
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
                          Generating...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="h-5 w-5" />
                          Generate with AI
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
                              Failed to generate content
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
                            Content Generated Successfully
                          </p>
                          <p className="mt-0.5 text-xs text-champagne/60">
                            {generatedData.tokensUsed.toLocaleString()} tokens used • ${generatedData.cost.toFixed(4)} • {generatedData.provider}
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

                    {/* Description */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <StarIcon className="h-4 w-4 text-purple-400" />
                        <p className="text-sm font-semibold text-champagne">Full Description</p>
                      </div>
                      <div className="rounded-lg bg-midnight/50 p-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-champagne/80">
                          {generatedData.description}
                        </p>
                      </div>
                    </div>

                    {/* Highlights */}
                    {generatedData.highlights && generatedData.highlights.length > 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <StarIcon className="h-4 w-4 text-purple-400" />
                          <p className="text-sm font-semibold text-champagne">
                            Product Highlights ({generatedData.highlights.length})
                          </p>
                        </div>
                        <ul className="space-y-2">
                          {generatedData.highlights.map((highlight, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-3 rounded-lg bg-midnight/50 p-3"
                            >
                              <CheckIcon className="h-5 w-5 shrink-0 text-blush" />
                              <span className="text-sm text-champagne/80">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Usage */}
                    {generatedData.usage && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <StarIcon className="h-4 w-4 text-purple-400" />
                          <p className="text-sm font-semibold text-champagne">
                            Usage Instructions
                          </p>
                        </div>
                        <div className="rounded-lg bg-midnight/50 p-4">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-champagne/80">
                            {generatedData.usage}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Meta Description */}
                    {generatedData.metaDescription && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <StarIcon className="h-4 w-4 text-purple-400" />
                          <p className="text-sm font-semibold text-champagne">
                            Meta Description
                            <span className="ml-2 text-xs text-champagne/40">
                              ({generatedData.metaDescription.length}/160 chars)
                            </span>
                          </p>
                        </div>
                        <div className="rounded-lg bg-midnight/50 p-4">
                          <p className="text-sm leading-relaxed text-champagne/80">
                            {generatedData.metaDescription}
                          </p>
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
