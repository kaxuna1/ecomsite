/**
 * AI Footer Translator Component
 *
 * Allows admins to translate footer content to different languages using AI
 */

import React, { useState, useEffect } from 'react';
import { Languages, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { translateFooterContent } from '../../api/ai';
import { fetchFooterSettings } from '../../api/cmsAdmin';
import { fetchLanguages } from '../../api/languages';
import type { Language } from '../../types/language';

export interface AIFooterTranslatorProps {
  currentLanguage: string;
  onTranslate: (translatedData: any, targetLanguage: string) => void;
  brandName?: string;
}

export const AIFooterTranslator: React.FC<AIFooterTranslatorProps> = ({
  currentLanguage,
  onTranslate,
  brandName: initialBrandName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);

  const [targetLanguage, setTargetLanguage] = useState(currentLanguage !== 'en' ? currentLanguage : '');
  const [preserveBrandName, setPreserveBrandName] = useState(true);
  const [tone, setTone] = useState<'professional' | 'luxury' | 'casual' | 'friendly'>('professional');

  // Load available languages when modal opens
  useEffect(() => {
    if (isOpen && languages.length === 0) {
      loadLanguages();
    }
  }, [isOpen]);

  const loadLanguages = async () => {
    setIsLoadingLanguages(true);
    try {
      // Fetch all languages including disabled ones (for translation purposes)
      const allLanguages = await fetchLanguages(true);
      setLanguages(allLanguages);
    } catch (err) {
      console.error('Failed to load languages:', err);
      // Fallback to minimal languages if API fails
      setLanguages([
        { code: 'en', name: 'English', nativeName: 'English', isDefault: true, isEnabled: true, displayOrder: 0, createdAt: '' },
        { code: 'ka', name: 'Georgian', nativeName: 'ქართული', isDefault: false, isEnabled: true, displayOrder: 1, createdAt: '' }
      ]);
    } finally {
      setIsLoadingLanguages(false);
    }
  };

  const handleTranslate = async () => {
    if (!targetLanguage) {
      setError('Please select a target language');
      return;
    }

    if (targetLanguage === 'en') {
      setError('Cannot translate to English (it\'s the source language)');
      return;
    }

    setIsTranslating(true);
    setError(null);
    setSuccess(false);

    try {
      // ALWAYS fetch English footer as the source
      console.log('🌐 Fetching English footer as translation source...');
      const englishFooter = await fetchFooterSettings('en');

      // Extract translatable fields from English footer
      const fields: any = {};

      if (englishFooter.brandName) fields.brandName = englishFooter.brandName;
      if (englishFooter.brandTagline) fields.brandTagline = englishFooter.brandTagline;
      if (englishFooter.footerColumns) fields.footerColumns = englishFooter.footerColumns;
      if (englishFooter.contactInfo) fields.contactInfo = englishFooter.contactInfo;
      if (englishFooter.newsletterTitle) fields.newsletterTitle = englishFooter.newsletterTitle;
      if (englishFooter.newsletterDescription) fields.newsletterDescription = englishFooter.newsletterDescription;
      if (englishFooter.newsletterPlaceholder) fields.newsletterPlaceholder = englishFooter.newsletterPlaceholder;
      if (englishFooter.newsletterButtonText) fields.newsletterButtonText = englishFooter.newsletterButtonText;
      if (englishFooter.copyrightText) fields.copyrightText = englishFooter.copyrightText;
      if (englishFooter.bottomLinks) fields.bottomLinks = englishFooter.bottomLinks;

      // Build preserve terms list
      const preserveTerms: string[] = [];
      if (preserveBrandName && initialBrandName) {
        preserveTerms.push(initialBrandName);
      }
      if (preserveBrandName && englishFooter.brandName && !preserveTerms.includes(englishFooter.brandName)) {
        preserveTerms.push(englishFooter.brandName);
      }

      console.log(`🔄 Translating from English to ${targetLanguage}...`);

      // Call the AI API (always en -> target language)
      const result = await translateFooterContent({
        fields,
        sourceLanguage: 'en',
        targetLanguage,
        preserveTerms,
        tone
      });

      console.log('✅ Translation complete, applying to current view...');

      // Pass the translated content AND target language to the parent component
      onTranslate(result.translatedFields, targetLanguage);
      setSuccess(true);

      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setTargetLanguage(currentLanguage !== 'en' ? currentLanguage : '');
      }, 2000);
    } catch (err: any) {
      console.error('❌ Translation error:', err);
      setError(err.message || 'An error occurred while translating footer content');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
        title="Translate footer content with AI"
      >
        <Languages className="w-4 h-4" />
        <span>AI Translate</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-midnight rounded-lg shadow-2xl max-w-2xl w-full border border-white/10">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex items-center justify-between border-b border-blue-400/20 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Languages className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold font-display">AI Footer Translator</h2>
                  <p className="text-sm opacity-90">
                    Translate footer to another language
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded-full p-2 transition"
                disabled={isTranslating}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-champagne">
                  <p className="font-medium mb-1">How it works:</p>
                  <p className="text-champagne/70">
                    AI will translate the English footer content to your selected language.
                    All translations are based on the main English version to ensure consistency.
                  </p>
                </div>
              </div>

              {/* Target Language */}
              <div>
                <label className="block text-sm font-medium text-champagne mb-2">
                  Translate To *
                </label>
                {isLoadingLanguages ? (
                  <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne/60 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading languages...
                  </div>
                ) : (
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-blue-500 transition-colors"
                    disabled={isLoadingLanguages}
                  >
                    <option value="" className="bg-midnight">Select target language...</option>
                    {languages
                      .filter(l => l.code !== 'en')
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map(lang => (
                        <option key={lang.code} value={lang.code} className="bg-midnight">
                          {lang.name} ({lang.nativeName})
                        </option>
                      ))
                    }
                  </select>
                )}
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-champagne mb-2">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors"
                >
                  <option value="professional" className="bg-midnight">Professional</option>
                  <option value="luxury" className="bg-midnight">Luxury</option>
                  <option value="friendly" className="bg-midnight">Friendly</option>
                  <option value="casual" className="bg-midnight">Casual</option>
                </select>
              </div>

              {/* Preserve Brand Name */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveBrandName}
                    onChange={(e) => setPreserveBrandName(e.target.checked)}
                    className="w-4 h-4 text-blue-500 border-white/20 rounded focus:ring-blue-500 bg-white/5"
                  />
                  <span className="text-sm text-champagne">
                    Don't translate brand name ({initialBrandName || currentFooter?.brandName || 'brand name'})
                  </span>
                </label>
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
                    Footer translated successfully!
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-midnight/95 backdrop-blur-sm px-6 py-4 flex items-center justify-end gap-3 border-t border-white/10 rounded-b-lg">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-champagne bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
                disabled={isTranslating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTranslate}
                disabled={isTranslating || !targetLanguage}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <Languages className="w-4 h-4" />
                    Translate Footer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFooterTranslator;
