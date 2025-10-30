import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLanguages } from '../../../../api/languages';
import { fetchProduct, getProductTranslation, saveProductTranslation } from '../../../../api/products';
import { translateProduct } from '../../../../api/ai';
import {
  GlobeAltIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };

  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
  };

  return debounced;
}

interface TranslationsTabProps {
  productId: number;
}

interface TranslationForm {
  name: string;
  shortDescription: string;
  description: string;
  highlights: string[];
  usage: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
}

export default function TranslationsTab({ productId }: TranslationsTabProps) {
  const queryClient = useQueryClient();
  const [selectedLang, setSelectedLang] = useState<string>('');
  const [formData, setFormData] = useState<TranslationForm>({
    name: '',
    shortDescription: '',
    description: '',
    highlights: [],
    usage: '',
    slug: '',
    metaTitle: '',
    metaDescription: ''
  });
  const [highlightInput, setHighlightInput] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Fetch languages
  const { data: languages = [] } = useQuery({
    queryKey: ['languages'],
    queryFn: fetchLanguages
  });

  // Fetch original product data
  const { data: originalProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId)
  });

  // Fetch translation for selected language
  const { data: translation, isLoading: translationLoading } = useQuery({
    queryKey: ['product-translation', productId, selectedLang],
    queryFn: () => getProductTranslation(productId, selectedLang),
    enabled: !!selectedLang && selectedLang !== 'en'
  });

  // Fetch translation status
  const { data: translationStatus } = useQuery({
    queryKey: ['translation-status', productId, selectedLang],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const response = await fetch(
        `${apiUrl}/products/${productId}/translations/status?lang=${selectedLang}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          return { completionPercentage: 0, hasTranslation: false };
        }
        throw new Error('Failed to fetch translation status');
      }
      return response.json();
    },
    enabled: !!selectedLang && selectedLang !== 'en'
  });

  // Save translation mutation
  const saveMutation = useMutation({
    mutationFn: async (data: TranslationForm) => {
      return saveProductTranslation(productId, selectedLang, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-translation', productId, selectedLang] });
      queryClient.invalidateQueries({ queryKey: ['translation-status', productId, selectedLang] });
      setIsDirty(false);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    },
    onError: (error) => {
      console.error('Failed to save translation:', error);
      setAutoSaveStatus('idle');
    }
  });

  // AI translation mutation
  const translateMutation = useMutation({
    mutationFn: async () => {
      if (!originalProduct) throw new Error('Original product not loaded');

      const response = await translateProduct({
        productName: originalProduct.name,
        shortDescription: originalProduct.shortDescription,
        description: originalProduct.description,
        highlights: originalProduct.highlights || [],
        usage: originalProduct.usage || '',
        sourceLanguage: 'en',
        targetLanguage: selectedLang
      });

      return response;
    },
    onSuccess: (aiTranslation) => {
      const translated = aiTranslation.translatedFields;
      setFormData({
        name: translated.name || '',
        shortDescription: translated.shortDescription || '',
        description: translated.description || '',
        highlights: translated.highlights || [],
        usage: translated.usage || '',
        slug: formData.slug,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription
      });
      setIsDirty(true);
    }
  });

  // Auto-save debounced
  const debouncedSave = useCallback(
    debounce(() => {
      if (isDirty && selectedLang && selectedLang !== 'en') {
        setAutoSaveStatus('saving');
        saveMutation.mutate(formData);
      }
    }, 3000),
    [isDirty, selectedLang, formData]
  );

  // Trigger auto-save when form changes
  useEffect(() => {
    if (isDirty) {
      debouncedSave();
    }
    return () => debouncedSave.cancel();
  }, [isDirty, debouncedSave]);

  // Load translation data into form
  useEffect(() => {
    if (translation) {
      setFormData({
        name: translation.name || '',
        shortDescription: translation.shortDescription || '',
        description: translation.description || '',
        highlights: translation.highlights || [],
        usage: translation.usage || '',
        slug: translation.slug || '',
        metaTitle: translation.metaTitle || '',
        metaDescription: translation.metaDescription || ''
      });
      setIsDirty(false);
    } else if (selectedLang && selectedLang !== 'en') {
      // Clear form for new translation
      setFormData({
        name: '',
        shortDescription: '',
        description: '',
        highlights: [],
        usage: '',
        slug: '',
        metaTitle: '',
        metaDescription: ''
      });
      setIsDirty(false);
    }
  }, [translation, selectedLang]);

  // Set default language on load
  useEffect(() => {
    if (languages.length > 0 && !selectedLang) {
      const nonDefaultLang = languages.find(lang => lang.code !== 'en');
      if (nonDefaultLang) {
        setSelectedLang(nonDefaultLang.code);
      }
    }
  }, [languages, selectedLang]);

  const handleCopyFromOriginal = (field: keyof TranslationForm) => {
    if (!originalProduct) return;

    setFormData(prev => ({
      ...prev,
      [field]: originalProduct[field] || ''
    }));
    setIsDirty(true);
  };

  const handleAddHighlight = () => {
    if (highlightInput.trim()) {
      setFormData(prev => ({
        ...prev,
        highlights: [...prev.highlights, highlightInput.trim()]
      }));
      setHighlightInput('');
      setIsDirty(true);
    }
  };

  const handleRemoveHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  };

  const handleFieldChange = (field: keyof TranslationForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleManualSave = () => {
    if (selectedLang && selectedLang !== 'en') {
      saveMutation.mutate(formData);
    }
  };

  const availableLanguages = languages.filter(lang => lang.code !== 'en');

  if (!selectedLang || selectedLang === 'en') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <GlobeAltIcon className="h-16 w-16 text-champagne/40 mb-4" />
        <h3 className="text-xl font-semibold text-champagne mb-2">Select a language to translate</h3>
        <p className="text-champagne/60 mb-6">Choose a target language to begin translating product content</p>
        <div className="flex gap-3">
          {availableLanguages.map(lang => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-champagne hover:bg-white/10 transition-colors"
            >
              {lang.nativeName}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const selectedLanguage = languages.find(lang => lang.code === selectedLang);
  const completionPercentage = translationStatus?.completionPercentage || 0;

  return (
    <div className="space-y-6">
      {/* Header with Language Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-champagne focus:outline-none focus:border-blush"
          >
            {availableLanguages.map(lang => (
              <option key={lang.code} value={lang.code} className="bg-midnight">
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>

          {/* Completion Status */}
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blush transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="text-sm text-champagne/60">{completionPercentage}%</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-save indicator */}
          {autoSaveStatus === 'saving' && (
            <div className="flex items-center gap-2 text-blush/60 text-sm">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          {autoSaveStatus === 'saved' && (
            <div className="flex items-center gap-2 text-emerald-400/60 text-sm">
              <CheckCircleIcon className="h-4 w-4" />
              <span>Saved</span>
            </div>
          )}

          {/* AI Translate Button */}
          <button
            onClick={() => translateMutation.mutate()}
            disabled={translateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blush rounded-xl text-white font-semibold hover:from-purple-700 hover:to-blush/90 transition-all disabled:opacity-50"
          >
            {translateMutation.isPending ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4" />
                AI Translate
              </>
            )}
          </button>

          {/* Manual Save */}
          <button
            onClick={handleManualSave}
            disabled={!isDirty || saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blush rounded-xl text-midnight font-semibold hover:bg-champagne transition-colors disabled:opacity-50"
          >
            <CheckCircleIcon className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>

      {/* Side-by-Side Editor */}
      <div className="grid grid-cols-2 gap-6">
        {/* Original (English) - Left Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-champagne">Original (English)</h3>
            <span className="text-xs text-champagne/40">Reference</span>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-champagne/60 mb-2">Product Name</label>
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-champagne/80">
              {originalProduct?.name || '—'}
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-champagne/60 mb-2">Short Description</label>
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-champagne/80 min-h-[80px]">
              {originalProduct?.shortDescription || '—'}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-champagne/60 mb-2">Full Description</label>
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-champagne/80 min-h-[200px] whitespace-pre-wrap">
              {originalProduct?.description || '—'}
            </div>
          </div>

          {/* Highlights */}
          <div>
            <label className="block text-sm font-medium text-champagne/60 mb-2">Highlights</label>
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-champagne/80 space-y-2">
              {originalProduct?.highlights && originalProduct.highlights.length > 0 ? (
                originalProduct.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-blush mt-1">•</span>
                    <span>{highlight}</span>
                  </div>
                ))
              ) : (
                <span className="text-champagne/40">No highlights</span>
              )}
            </div>
          </div>

          {/* Usage */}
          <div>
            <label className="block text-sm font-medium text-champagne/60 mb-2">Usage Instructions</label>
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-champagne/80 min-h-[100px] whitespace-pre-wrap">
              {originalProduct?.usage || '—'}
            </div>
          </div>
        </div>

        {/* Translation - Right Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-champagne">
              Translation ({selectedLanguage?.nativeName})
            </h3>
            <span className="text-xs text-champagne/40">Editable</span>
          </div>

          {/* Product Name */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-champagne/60">Product Name *</label>
              <button
                onClick={() => handleCopyFromOriginal('name')}
                className="flex items-center gap-1 text-xs text-blush hover:text-blush/80"
              >
                <DocumentDuplicateIcon className="h-3 w-3" />
                Copy
              </button>
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-champagne focus:outline-none focus:border-blush"
              placeholder="Enter translated name..."
            />
          </div>

          {/* Short Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-champagne/60">Short Description *</label>
              <button
                onClick={() => handleCopyFromOriginal('shortDescription')}
                className="flex items-center gap-1 text-xs text-blush hover:text-blush/80"
              >
                <DocumentDuplicateIcon className="h-3 w-3" />
                Copy
              </button>
            </div>
            <textarea
              value={formData.shortDescription}
              onChange={(e) => handleFieldChange('shortDescription', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-champagne focus:outline-none focus:border-blush resize-none"
              placeholder="Enter translated short description..."
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-champagne/60">Full Description *</label>
              <button
                onClick={() => handleCopyFromOriginal('description')}
                className="flex items-center gap-1 text-xs text-blush hover:text-blush/80"
              >
                <DocumentDuplicateIcon className="h-3 w-3" />
                Copy
              </button>
            </div>
            <textarea
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={8}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-champagne focus:outline-none focus:border-blush resize-none"
              placeholder="Enter translated full description..."
            />
          </div>

          {/* Highlights */}
          <div>
            <label className="block text-sm font-medium text-champagne/60 mb-2">Highlights</label>
            <div className="space-y-2">
              {formData.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-champagne">
                    {highlight}
                  </div>
                  <button
                    onClick={() => handleRemoveHighlight(index)}
                    className="px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={highlightInput}
                  onChange={(e) => setHighlightInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddHighlight()}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-champagne focus:outline-none focus:border-blush"
                  placeholder="Add a highlight..."
                />
                <button
                  onClick={handleAddHighlight}
                  className="px-4 py-2 bg-blush/20 text-blush rounded-xl hover:bg-blush/30 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-champagne/60">Usage Instructions</label>
              <button
                onClick={() => handleCopyFromOriginal('usage')}
                className="flex items-center gap-1 text-xs text-blush hover:text-blush/80"
              >
                <DocumentDuplicateIcon className="h-3 w-3" />
                Copy
              </button>
            </div>
            <textarea
              value={formData.usage}
              onChange={(e) => handleFieldChange('usage', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-champagne focus:outline-none focus:border-blush resize-none"
              placeholder="Enter translated usage instructions..."
            />
          </div>

          {/* SEO Fields */}
          <div className="pt-6 border-t border-white/10">
            <h4 className="text-sm font-semibold text-champagne/80 mb-4">SEO & URL (Optional)</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-champagne/60 mb-2">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleFieldChange('slug', e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-champagne focus:outline-none focus:border-blush"
                  placeholder="product-slug-url"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-champagne/60 mb-2">Meta Title</label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => handleFieldChange('metaTitle', e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-champagne focus:outline-none focus:border-blush"
                  placeholder="SEO title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-champagne/60 mb-2">Meta Description</label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => handleFieldChange('metaDescription', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-champagne focus:outline-none focus:border-blush resize-none"
                  placeholder="SEO description..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
