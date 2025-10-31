/**
 * AI Footer Generator Component
 *
 * Allows admins to generate footer content using AI based on brand information
 * and business context. Supports customization of style, tone, and structure.
 */

import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { generateFooterContent, GenerateFooterRequest } from '../../api/ai';

export interface AIFooterGeneratorProps {
  onGenerate: (footerData: any) => void;
  currentFooter?: any;
  brandName?: string;
  brandDescription?: string;
}

interface GenerationOptions {
  brandName: string;
  brandDescription: string;
  industry: string;
  targetAudience: string;
  businessType: 'ecommerce' | 'saas' | 'agency' | 'blog' | 'other';
  includeNewsletter: boolean;
  includeSocial: boolean;
  columnsCount: number;
  style: 'minimal' | 'comprehensive' | 'balanced';
  tone: 'professional' | 'friendly' | 'luxury' | 'casual';
}

export const AIFooterGenerator: React.FC<AIFooterGeneratorProps> = ({
  onGenerate,
  currentFooter,
  brandName: initialBrandName = '',
  brandDescription: initialBrandDescription = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [options, setOptions] = useState<GenerationOptions>({
    brandName: initialBrandName,
    brandDescription: initialBrandDescription,
    industry: 'E-commerce',
    targetAudience: 'Modern consumers interested in quality products',
    businessType: 'ecommerce',
    includeNewsletter: true,
    includeSocial: true,
    columnsCount: 4,
    style: 'balanced',
    tone: 'professional'
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      // Prepare request payload
      const request: GenerateFooterRequest = {
        brandName: options.brandName,
        brandDescription: options.brandDescription,
        industry: options.industry,
        targetAudience: options.targetAudience,
        businessType: options.businessType,
        includeNewsletter: options.includeNewsletter,
        includeSocial: options.includeSocial,
        columnsCount: options.columnsCount,
        style: options.style,
        tone: options.tone,
        existingFooter: currentFooter
      };

      // Call the AI API
      const result = await generateFooterContent(request);

      // Pass the generated footer data to the parent component
      onGenerate(result);
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating footer content');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateOption = <K extends keyof GenerationOptions>(
    key: K,
    value: GenerationOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-jade to-jade/80 text-midnight rounded-lg hover:from-jade/90 hover:to-jade/70 transition-all shadow-md hover:shadow-lg font-medium"
        title="Generate footer content with AI"
      >
        <Sparkles className="w-4 h-4" />
        <span>AI Footer Generator</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-midnight rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-jade to-jade/80 text-midnight px-6 py-4 flex items-center justify-between border-b border-jade/20">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold font-display">AI Footer Generator</h2>
                  <p className="text-sm opacity-80">
                    Generate professional footer content instantly
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-midnight/20 rounded-full p-2 transition"
                disabled={isGenerating}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Info Box */}
              <div className="bg-jade/10 border border-jade/20 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-jade flex-shrink-0 mt-0.5" />
                <div className="text-sm text-champagne">
                  <p className="font-medium mb-1">How it works:</p>
                  <p className="text-champagne/70">
                    AI will generate comprehensive footer content including columns, contact info,
                    social links, newsletter section, and legal links based on your brand context.
                  </p>
                </div>
              </div>

              {/* Brand Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-champagne flex items-center gap-2">
                  <span className="w-8 h-8 bg-jade/20 text-jade rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  Brand Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-champagne mb-2">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      value={options.brandName}
                      onChange={(e) => updateOption('brandName', e.target.value)}
                      placeholder="Your Brand Name"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-champagne mb-2">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={options.industry}
                      onChange={(e) => updateOption('industry', e.target.value)}
                      placeholder="e.g., Fashion, Technology, Health"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-champagne mb-2">
                    Brand Description
                  </label>
                  <textarea
                    value={options.brandDescription}
                    onChange={(e) => updateOption('brandDescription', e.target.value)}
                    placeholder="Brief description of your brand, products, and value proposition"
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-champagne mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={options.targetAudience}
                    onChange={(e) => updateOption('targetAudience', e.target.value)}
                    placeholder="e.g., Young professionals, Parents, Tech enthusiasts"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
                  />
                </div>
              </div>

              {/* Generation Options */}
              <div className="space-y-4">
                <h3 className="font-semibold text-champagne flex items-center gap-2">
                  <span className="w-8 h-8 bg-jade/20 text-jade rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  Generation Options
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-champagne mb-2">
                      Business Type
                    </label>
                    <select
                      value={options.businessType}
                      onChange={(e) => updateOption('businessType', e.target.value as any)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors"
                    >
                      <option value="ecommerce" className="bg-midnight">E-commerce</option>
                      <option value="saas" className="bg-midnight">SaaS</option>
                      <option value="agency" className="bg-midnight">Agency</option>
                      <option value="blog" className="bg-midnight">Blog</option>
                      <option value="other" className="bg-midnight">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-champagne mb-2">
                      Number of Columns
                    </label>
                    <select
                      value={options.columnsCount}
                      onChange={(e) => updateOption('columnsCount', parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors"
                    >
                      <option value="2" className="bg-midnight">2 Columns (Minimal)</option>
                      <option value="3" className="bg-midnight">3 Columns</option>
                      <option value="4" className="bg-midnight">4 Columns (Recommended)</option>
                      <option value="5" className="bg-midnight">5 Columns (Comprehensive)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-champagne mb-2">
                      Style
                    </label>
                    <select
                      value={options.style}
                      onChange={(e) => updateOption('style', e.target.value as any)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors"
                    >
                      <option value="minimal" className="bg-midnight">Minimal - Essential links only</option>
                      <option value="balanced" className="bg-midnight">Balanced - Recommended</option>
                      <option value="comprehensive" className="bg-midnight">Comprehensive - Detailed site map</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-champagne mb-2">
                      Tone
                    </label>
                    <select
                      value={options.tone}
                      onChange={(e) => updateOption('tone', e.target.value as any)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors"
                    >
                      <option value="professional" className="bg-midnight">Professional</option>
                      <option value="friendly" className="bg-midnight">Friendly</option>
                      <option value="luxury" className="bg-midnight">Luxury</option>
                      <option value="casual" className="bg-midnight">Casual</option>
                    </select>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.includeNewsletter}
                      onChange={(e) => updateOption('includeNewsletter', e.target.checked)}
                      className="w-4 h-4 text-jade border-white/20 rounded focus:ring-jade bg-white/5"
                    />
                    <span className="text-sm text-champagne">Include Newsletter Section</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.includeSocial}
                      onChange={(e) => updateOption('includeSocial', e.target.checked)}
                      className="w-4 h-4 text-jade border-white/20 rounded focus:ring-jade bg-white/5"
                    />
                    <span className="text-sm text-champagne">Include Social Links</span>
                  </label>
                </div>
              </div>

              {/* Status Messages */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div className="text-sm text-red-200">{error}</div>
                </div>
              )}

              {success && (
                <div className="bg-jade/10 border border-jade/20 rounded-lg p-4 flex gap-3">
                  <CheckCircle className="w-5 h-5 text-jade flex-shrink-0" />
                  <div className="text-sm text-champagne">
                    Footer content generated successfully!
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-midnight/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between border-t border-white/10">
              <div className="text-sm text-champagne/60">
                {currentFooter && (
                  <span className="text-jade">
                    Existing footer will be used as reference
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-champagne bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !options.brandName}
                  className="px-6 py-2 bg-gradient-to-r from-jade to-jade/80 text-midnight rounded-lg hover:from-jade/90 hover:to-jade/70 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Footer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFooterGenerator;
