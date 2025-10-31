/**
 * AI Attribute Generator Component
 *
 * Generates industry-standard product attributes using AI
 * based on product category, type, and brand focus
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { generateAttributes, type GeneratedAttribute } from '../../api/ai';

export interface AIAttributeGeneratorProps {
  existingAttributes: string[]; // Attribute keys that already exist
  onAttributesGenerated: (attributes: GeneratedAttribute[]) => void;
}

export const AIAttributeGenerator: React.FC<AIAttributeGeneratorProps> = ({
  existingAttributes,
  onAttributesGenerated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    productCategory: '',
    productType: '',
    brandFocus: '',
    numberOfAttributes: 10
  });

  const handleGenerate = async () => {
    if (!formData.productCategory.trim()) {
      setError('Product category is required');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('🎨 Generating attributes with AI...');

      const result = await generateAttributes({
        productCategory: formData.productCategory.trim(),
        productType: formData.productType.trim() || undefined,
        brandFocus: formData.brandFocus.trim() || undefined,
        numberOfAttributes: formData.numberOfAttributes,
        existingAttributes
      });

      console.log(`✅ Generated ${result.attributes.length} attributes`);

      onAttributesGenerated(result.attributes);
      setSuccess(true);

      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setFormData({
          productCategory: '',
          productType: '',
          brandFocus: '',
          numberOfAttributes: 10
        });
      }, 2000);
    } catch (err: any) {
      console.error('❌ Error generating attributes:', err);
      setError(err.response?.data?.error || err.message || 'Failed to generate attributes');
    } finally {
      setIsGenerating(false);
    }
  };

  const categoryExamples = [
    'Beauty & Cosmetics',
    'Fashion & Apparel',
    'Electronics',
    'Home & Furniture',
    'Sports & Outdoors',
    'Food & Beverage',
    'Toys & Games',
    'Automotive'
  ];

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-medium uppercase tracking-wider text-white transition-all hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <SparklesIcon className="h-5 w-5" />
        AI Generate
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/80 p-4 backdrop-blur-sm"
            onClick={() => !isGenerating && setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-midnight p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-2">
                    <SparklesIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl uppercase tracking-wider text-champagne">
                      AI Attribute Generator
                    </h2>
                    <p className="text-sm text-champagne/60">
                      Generate industry-standard product attributes
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isGenerating}
                  className="rounded-lg p-2 text-champagne/60 transition-colors hover:bg-white/5 hover:text-champagne disabled:opacity-50"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Info Box */}
              <div className="mb-6 rounded-lg border border-purple-500/20 bg-purple-500/10 p-4 flex gap-3">
                <InformationCircleIcon className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-champagne">
                  <p className="font-medium mb-1">How it works:</p>
                  <p className="text-champagne/70">
                    AI analyzes your product category and generates comprehensive, industry-standard
                    attributes with proper data types and filterable options. Perfect for building
                    a complete product catalog quickly.
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Product Category */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-champagne/80">
                    Product Category *
                  </label>
                  <input
                    type="text"
                    value={formData.productCategory}
                    onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                    placeholder="e.g., Electronics, Fashion, Home & Furniture"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-champagne placeholder:text-champagne/40 focus:border-purple-500 focus:outline-none"
                    disabled={isGenerating}
                  />
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs text-champagne/60">Examples:</span>
                    {categoryExamples.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setFormData({ ...formData, productCategory: example })}
                        className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-champagne/80 hover:bg-white/10 transition-colors"
                        disabled={isGenerating}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-champagne/80">
                    Product Type (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                    placeholder="e.g., Laptop, T-Shirt, Sofa, Smartphone"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-champagne placeholder:text-champagne/40 focus:border-purple-500 focus:outline-none"
                    disabled={isGenerating}
                  />
                  <p className="mt-1 text-xs text-champagne/60">
                    More specific = more relevant attributes
                  </p>
                </div>

                {/* Brand Focus */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-champagne/80">
                    Brand Focus (optional)
                  </label>
                  <select
                    value={formData.brandFocus}
                    onChange={(e) => setFormData({ ...formData, brandFocus: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-champagne focus:border-purple-500 focus:outline-none"
                    disabled={isGenerating}
                  >
                    <option value="">Any</option>
                    <option value="Luxury">Luxury/Premium</option>
                    <option value="Budget">Budget-Friendly/Value</option>
                    <option value="Eco-Friendly">Eco-Friendly/Sustainable</option>
                    <option value="Professional">Professional/Enterprise</option>
                    <option value="Performance">Performance/High-End</option>
                    <option value="Everyday">Everyday/Casual</option>
                  </select>
                </div>

                {/* Number of Attributes */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-champagne/80">
                    Number of Attributes
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="20"
                    value={formData.numberOfAttributes}
                    onChange={(e) => setFormData({ ...formData, numberOfAttributes: parseInt(e.target.value) || 10 })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-champagne focus:border-purple-500 focus:outline-none"
                    disabled={isGenerating}
                  />
                  <p className="mt-1 text-xs text-champagne/60">
                    Range: 3-20. Start with 8-12 for most categories.
                  </p>
                </div>

                {existingAttributes.length > 0 && (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-medium text-champagne mb-2">
                      Existing Attributes ({existingAttributes.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {existingAttributes.slice(0, 10).map((attr) => (
                        <span key={attr} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-champagne/60">
                          {attr}
                        </span>
                      ))}
                      {existingAttributes.length > 10 && (
                        <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-champagne/60">
                          +{existingAttributes.length - 10} more
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-champagne/60">
                      AI will avoid duplicating these attributes
                    </p>
                  </div>
                )}

                {/* Status Messages */}
                {error && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 flex gap-3">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                    <div className="text-sm text-red-200">{error}</div>
                  </div>
                )}

                {success && (
                  <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 flex gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <div className="text-sm text-champagne">
                      Attributes generated successfully!
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !formData.productCategory.trim()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-medium uppercase tracking-wider text-white transition-all hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      Generate Attributes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isGenerating}
                  className="rounded-full border border-white/10 px-6 py-3 font-medium uppercase tracking-wider text-champagne transition-all hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAttributeGenerator;
