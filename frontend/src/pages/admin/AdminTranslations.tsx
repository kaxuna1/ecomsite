import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { fetchLanguages } from '../../api/languages';

interface Product {
  id: number;
  name: string;
  shortDescription: string;
  description: string;
  highlights?: string[];
  usage?: string;
}

interface Translation {
  id: number;
  product_id: number;
  language_code: string;
  name: string;
  short_description: string;
  description: string;
  highlights?: string[];
  usage?: string;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
}

interface TranslationStatus {
  productId: number;
  productName: string;
  languageCode: string;
  completionPercentage: number;
  hasTranslation: boolean;
  fields: {
    name: boolean;
    shortDescription: boolean;
    description: boolean;
    highlights: boolean;
    usage: boolean;
    slug: boolean;
    metaTitle: boolean;
    metaDescription: boolean;
  };
}

export default function AdminTranslations() {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  
  // State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showMobileProductList, setShowMobileProductList] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    highlights: [] as string[],
    usage: '',
    metaTitle: '',
    metaDescription: ''
  });

  // Fetch all enabled languages
  const { data: languages = [], isLoading: languagesLoading } = useQuery({
    queryKey: ['languages'],
    queryFn: () => fetchLanguages(false)
  });

  // Set default language when languages are loaded
  useEffect(() => {
    if (languages.length > 0 && !selectedLanguage) {
      const nonDefaultLang = languages.find(lang => !lang.isDefault);
      setSelectedLanguage(nonDefaultLang?.code || languages[0].code);
    }
  }, [languages, selectedLanguage]);

  // Fetch all products in English
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'en'],
    queryFn: async () => {
      const res = await api.get('/products?lang=en&limit=1000');
      return (res.data.products || []) as Product[];
    }
  });

  // Fetch translation for selected product
  const { data: translation, isLoading: translationLoading } = useQuery<Translation>({
    queryKey: ['translation', selectedProduct?.id, selectedLanguage],
    queryFn: async () => {
      const res = await api.get(`/products/${selectedProduct!.id}/translations/${selectedLanguage}`);
      return res.data;
    },
    enabled: !!selectedProduct,
    retry: false
  });

  // Fetch translation status for all products
  const { data: translationStatuses = [] } = useQuery<TranslationStatus[]>({
    queryKey: ['translation-statuses', selectedLanguage],
    queryFn: async () => {
      const res = await api.get(`/products/translations/status?lang=${selectedLanguage}`);
      return res.data;
    },
    enabled: !!selectedLanguage,
    retry: false
  });

  // Update form when translation loads
  useEffect(() => {
    if (translation) {
      const newData = {
        name: translation.name || '',
        shortDescription: translation.short_description || '',
        description: translation.description || '',
        highlights: translation.highlights || [],
        usage: translation.usage || '',
        metaTitle: translation.meta_title || '',
        metaDescription: translation.meta_description || ''
      };
      setFormData(newData);
      setHasUnsavedChanges(false);
    } else if (selectedProduct) {
      setFormData({
        name: '',
        shortDescription: '',
        description: '',
        highlights: [],
        usage: '',
        metaTitle: '',
        metaDescription: ''
      });
      setHasUnsavedChanges(false);
    }
  }, [translation, selectedProduct]);

  // Track unsaved changes
  useEffect(() => {
    if (translation || selectedProduct) {
      const hasChanges = 
        formData.name !== (translation?.name || '') ||
        formData.shortDescription !== (translation?.short_description || '') ||
        formData.description !== (translation?.description || '') ||
        formData.usage !== (translation?.usage || '') ||
        formData.metaTitle !== (translation?.meta_title || '') ||
        formData.metaDescription !== (translation?.meta_description || '') ||
        JSON.stringify(formData.highlights) !== JSON.stringify(translation?.highlights || []);
      
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, translation, selectedProduct]);

  // Save translation mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(
        `/products/${selectedProduct!.id}/translations/${selectedLanguage}`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translation'] });
      queryClient.invalidateQueries({ queryKey: ['translation-statuses'] });
      setHasUnsavedChanges(false);
      toast.success('Translation saved successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save translation');
    }
  });

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges || !selectedProduct) return;

    const timeoutId = setTimeout(() => {
      handleSave();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [formData, autoSaveEnabled, hasUnsavedChanges]);

  const handleSave = () => {
    if (!selectedProduct) return;
    
    saveMutation.mutate({
      name: formData.name,
      shortDescription: formData.shortDescription,
      description: formData.description,
      highlights: formData.highlights,
      usage: formData.usage,
      metaTitle: formData.metaTitle,
      metaDescription: formData.metaDescription
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  // Highlight management
  const addHighlight = () => {
    setFormData({ ...formData, highlights: [...formData.highlights, ''] });
  };

  const updateHighlight = (index: number, value: string) => {
    const newHighlights = [...formData.highlights];
    newHighlights[index] = value;
    setFormData({ ...formData, highlights: newHighlights });
  };

  const removeHighlight = (index: number) => {
    const newHighlights = formData.highlights.filter((_, i) => i !== index);
    setFormData({ ...formData, highlights: newHighlights });
  };

  // Copy from original
  const copyFromOriginal = (field: keyof typeof formData) => {
    if (!selectedProduct) return;
    
    const originalValue = selectedProduct[field as keyof Product];
    if (originalValue !== undefined) {
      setFormData({ ...formData, [field]: originalValue });
      toast.success('Copied from original');
    }
  };

  // Navigation between products
  const currentProductIndex = products?.findIndex(p => p.id === selectedProduct?.id) ?? -1;
  const canGoPrevious = currentProductIndex > 0;
  const canGoNext = currentProductIndex < (products?.length ?? 0) - 1;

  const goToPrevious = () => {
    if (canGoPrevious && products) {
      if (hasUnsavedChanges) {
        if (confirm('You have unsaved changes. Continue?')) {
          setSelectedProduct(products[currentProductIndex - 1]);
        }
      } else {
        setSelectedProduct(products[currentProductIndex - 1]);
      }
    }
  };

  const goToNext = () => {
    if (canGoNext && products) {
      if (hasUnsavedChanges) {
        if (confirm('You have unsaved changes. Continue?')) {
          setSelectedProduct(products[currentProductIndex + 1]);
        }
      } else {
        setSelectedProduct(products[currentProductIndex + 1]);
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S / Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges) {
          handleSave();
        }
      }
      
      // Arrow keys to navigate (when not in input)
      if (!(e.target as HTMLElement).matches('input, textarea')) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goToPrevious();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          goToNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, selectedProduct, currentProductIndex, products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Get translation status for a product
  const getProductStatus = useCallback((productId: number): TranslationStatus | undefined => {
    return translationStatuses.find(s => s.productId === productId);
  }, [translationStatuses]);

  // Calculate overall completion percentage (average of all products)
  const overallCompletionPercentage = useMemo(() => {
    if (!translationStatuses?.length) return 0;
    const total = translationStatuses.reduce((sum, s) => sum + s.completionPercentage, 0);
    return Math.round(total / translationStatuses.length);
  }, [translationStatuses]);

  // Character count helpers
  const getCharCount = (text: string) => text.length;
  const getCharCountColor = (count: number, ideal: number, max: number) => {
    if (count === 0) return 'text-champagne/40';
    if (count < ideal) return 'text-amber-400';
    if (count > max) return 'text-rose-400';
    return 'text-emerald-400';
  };

  return (
    <>
      <Helmet>
        <title>Product Translations — Luxia Admin</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h1 className="font-display text-3xl text-champagne">Product Translations</h1>
            <p className="mt-1 text-sm text-champagne/70">
              Manage product translations for different languages
            </p>
          </div>

          {/* Language Selector & Stats */}
          <div className="flex flex-col gap-3 sm:items-end">
            {!languagesLoading && (
              <div className="flex items-center gap-3">
                <GlobeAltIcon className="h-5 w-5 text-champagne/60" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-champagne transition-colors focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-midnight">
                      {lang.nativeName} ({lang.code.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {products && products.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5">
                  <CheckCircleSolidIcon className="h-4 w-4 text-emerald-400" />
                  <span className="text-champagne/80">{overallCompletionPercentage}% Complete</span>
                </div>
                <div className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-champagne/80">
                  {translationStatuses.filter(s => s.completionPercentage === 100).length} / {products.length}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Auto-save toggle */}
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 text-sm text-amber-400"
              >
                <ExclamationTriangleIcon className="h-4 w-4" />
                <span>Unsaved changes</span>
              </motion.div>
            )}
            {saveMutation.isPending && (
              <div className="flex items-center gap-2 text-sm text-blush">
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            {!hasUnsavedChanges && !saveMutation.isPending && selectedProduct && (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircleSolidIcon className="h-4 w-4" />
                <span>All changes saved</span>
              </div>
            )}
          </div>
          
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => setAutoSaveEnabled(e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-blush focus:ring-2 focus:ring-blush/20"
            />
            <span className="text-sm text-champagne/80">Auto-save</span>
          </label>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Product List Sidebar */}
          <aside className={`lg:col-span-4 xl:col-span-3 ${showMobileProductList ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-champagne/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full rounded-xl border border-white/20 bg-white/5 py-2.5 pl-11 pr-4 text-champagne placeholder-champagne/40 transition-colors focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                />
              </div>

              {/* Product List */}
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto rounded-2xl border border-white/10 bg-white/5">
                <div className="p-3">
                  <h2 className="mb-3 px-3 text-sm font-semibold uppercase tracking-wider text-champagne/60">
                    Products ({filteredProducts.length})
                  </h2>
                  {productsLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 animate-pulse rounded-xl bg-white/10" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredProducts.map((product) => {
                        const status = getProductStatus(product.id);
                        const isSelected = selectedProduct?.id === product.id;
                        
                        return (
                          <motion.button
                            key={product.id}
                            onClick={() => {
                              if (hasUnsavedChanges && selectedProduct?.id !== product.id) {
                                if (confirm('You have unsaved changes. Continue?')) {
                                  setSelectedProduct(product);
                                  setShowMobileProductList(false);
                                }
                              } else {
                                setSelectedProduct(product);
                                setShowMobileProductList(false);
                              }
                            }}
                            className={`group relative w-full rounded-xl px-3 py-2.5 text-left transition-all ${
                              isSelected
                                ? 'bg-blush text-midnight shadow-lg'
                                : 'text-champagne hover:bg-white/10'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="line-clamp-2 text-sm font-medium">
                                {product.name}
                              </span>
                              {status && status.completionPercentage > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className={`text-xs font-medium ${
                                    isSelected ? 'text-midnight' :
                                    status.completionPercentage === 100 ? 'text-emerald-400' : 'text-yellow-400'
                                  }`}>
                                    {status.completionPercentage}%
                                  </span>
                                  {status.completionPercentage === 100 && (
                                    <CheckCircleSolidIcon
                                      className={`h-4 w-4 flex-shrink-0 ${
                                        isSelected ? 'text-midnight' : 'text-emerald-400'
                                      }`}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Translation Editor */}
          <main className={`lg:col-span-8 xl:col-span-9 ${showMobileProductList ? 'hidden lg:block' : 'block'}`}>
            {selectedProduct ? (
              <motion.div
                key={selectedProduct.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Product Header with Navigation */}
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-xl text-champagne">
                      {selectedProduct.name}
                    </h2>
                    <p className="mt-1 text-sm text-champagne/60">
                      Translating to {languages.find(l => l.code === selectedLanguage)?.nativeName}
                    </p>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToPrevious}
                      disabled={!canGoPrevious}
                      className="rounded-full border border-white/20 bg-white/5 p-2 text-champagne transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                      title="Previous product (←)"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <span className="text-sm text-champagne/60">
                      {currentProductIndex + 1} / {products?.length || 0}
                    </span>
                    <button
                      onClick={goToNext}
                      disabled={!canGoNext}
                      className="rounded-full border border-white/20 bg-white/5 p-2 text-champagne transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                      title="Next product (→)"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Translation Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <label className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-champagne/60">
                        <span>Original Name</span>
                      </label>
                      <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-champagne">
                        {selectedProduct.name}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <label className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-champagne/60">
                        <span>Translated Name *</span>
                        <button
                          type="button"
                          onClick={() => copyFromOriginal('name')}
                          className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs text-champagne/80 transition-colors hover:bg-white/10"
                        >
                          <DocumentDuplicateIcon className="h-3 w-3" />
                          Copy
                        </button>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-champagne transition-colors focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                        required
                        placeholder="Enter translated name..."
                      />
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className={getCharCountColor(getCharCount(formData.name), 40, 60)}>
                          {getCharCount(formData.name)} characters
                        </span>
                        <span className="text-champagne/40">Ideal: 40-60</span>
                      </div>
                    </div>
                  </div>

                  {/* Short Description */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-champagne/60">
                        Original Short Description
                      </label>
                      <p className="whitespace-pre-wrap rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-champagne/90">
                        {selectedProduct.shortDescription}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <label className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-champagne/60">
                        <span>Translated Short Description *</span>
                        <button
                          type="button"
                          onClick={() => copyFromOriginal('shortDescription')}
                          className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs text-champagne/80 transition-colors hover:bg-white/10"
                        >
                          <DocumentDuplicateIcon className="h-3 w-3" />
                          Copy
                        </button>
                      </label>
                      <textarea
                        value={formData.shortDescription}
                        onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-champagne transition-colors focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                        rows={3}
                        required
                        placeholder="Enter translated short description..."
                      />
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className={getCharCountColor(getCharCount(formData.shortDescription), 120, 160)}>
                          {getCharCount(formData.shortDescription)} characters
                        </span>
                        <span className="text-champagne/40">Ideal: 120-160</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-champagne/60">
                        Original Description
                      </label>
                      <p className="whitespace-pre-wrap rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-champagne/90">
                        {selectedProduct.description}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <label className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-champagne/60">
                        <span>Translated Description *</span>
                        <button
                          type="button"
                          onClick={() => copyFromOriginal('description')}
                          className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs text-champagne/80 transition-colors hover:bg-white/10"
                        >
                          <DocumentDuplicateIcon className="h-3 w-3" />
                          Copy
                        </button>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-champagne transition-colors focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                        rows={6}
                        required
                        placeholder="Enter translated description..."
                      />
                      <div className="mt-2 text-xs text-champagne/60">
                        {getCharCount(formData.description)} characters
                      </div>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-champagne/60">
                        Original Highlights
                      </label>
                      {selectedProduct.highlights && selectedProduct.highlights.length > 0 ? (
                        <ul className="space-y-2">
                          {selectedProduct.highlights.map((h, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-champagne/90"
                            >
                              <CheckCircleSolidIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-champagne/40">No highlights</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-champagne/60">
                        Translated Highlights
                      </label>
                      <AnimatePresence mode="popLayout">
                        {formData.highlights.map((highlight, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="mb-3 flex gap-2"
                          >
                            <input
                              type="text"
                              value={highlight}
                              onChange={(e) => updateHighlight(index, e.target.value)}
                              className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-champagne transition-colors focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                              placeholder={`Highlight ${index + 1}...`}
                            />
                            <button
                              type="button"
                              onClick={() => removeHighlight(index)}
                              className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-rose-400 transition-colors hover:bg-rose-500/20"
                              title="Remove highlight"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <button
                        type="button"
                        onClick={addHighlight}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-champagne transition-colors hover:border-blush hover:bg-white/10"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add Highlight
                      </button>
                    </div>
                  </div>

                  {/* Usage */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-champagne/60">
                        Original Usage
                      </label>
                      {selectedProduct.usage ? (
                        <p className="whitespace-pre-wrap rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-champagne/90">
                          {selectedProduct.usage}
                        </p>
                      ) : (
                        <p className="text-sm italic text-champagne/40">No usage instructions</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <label className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-champagne/60">
                        <span>Translated Usage</span>
                        {selectedProduct.usage && (
                          <button
                            type="button"
                            onClick={() => copyFromOriginal('usage')}
                            className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs text-champagne/80 transition-colors hover:bg-white/10"
                          >
                            <DocumentDuplicateIcon className="h-3 w-3" />
                            Copy
                          </button>
                        )}
                      </label>
                      <textarea
                        value={formData.usage}
                        onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-champagne transition-colors focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                        rows={4}
                        placeholder="Enter translated usage instructions..."
                      />
                    </div>
                  </div>

                  {/* SEO Metadata */}
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-display text-champagne">
                      <SparklesIcon className="h-5 w-5 text-blush" />
                      SEO Metadata
                    </h3>
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div>
                        <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-champagne/60">
                          Meta Title
                        </label>
                        <input
                          type="text"
                          value={formData.metaTitle}
                          onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-champagne transition-colors focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                          placeholder="SEO title for this product"
                        />
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className={getCharCountColor(getCharCount(formData.metaTitle), 50, 60)}>
                            {getCharCount(formData.metaTitle)} characters
                          </span>
                          <span className="text-champagne/40">Ideal: 50-60</span>
                        </div>
                      </div>
                      <div>
                        <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-champagne/60">
                          Meta Description
                        </label>
                        <input
                          type="text"
                          value={formData.metaDescription}
                          onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-champagne transition-colors focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                          placeholder="SEO description for this product"
                        />
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className={getCharCountColor(getCharCount(formData.metaDescription), 150, 160)}>
                            {getCharCount(formData.metaDescription)} characters
                          </span>
                          <span className="text-champagne/40">Ideal: 150-160</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="sticky bottom-6 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-midnight/95 p-4 shadow-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(null)}
                        className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-champagne transition-colors hover:bg-white/10"
                      >
                        Close
                      </button>
                      
                      {/* Mobile product selector */}
                      <button
                        type="button"
                        onClick={() => setShowMobileProductList(true)}
                        className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-champagne transition-colors hover:bg-white/10 lg:hidden"
                      >
                        All Products
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={saveMutation.isPending || !hasUnsavedChanges}
                      className="flex items-center gap-2 rounded-full bg-blush px-6 py-2.5 text-sm font-semibold text-midnight transition-colors hover:bg-champagne disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saveMutation.isPending ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4" />
                          Save Translation
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex min-h-[500px] items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-12 text-center"
              >
                <div>
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/5">
                    <GlobeAltIcon className="h-10 w-10 text-champagne/40" />
                  </div>
                  <h3 className="mb-2 text-xl font-display text-champagne">
                    Select a Product
                  </h3>
                  <p className="mx-auto max-w-md text-sm text-champagne/60">
                    Choose a product from the sidebar to start translating its content to {languages.find(l => l.code === selectedLanguage)?.nativeName || 'another language'}
                  </p>
                  <button
                    onClick={() => setShowMobileProductList(true)}
                    className="mt-6 rounded-full border border-white/20 bg-blush px-6 py-2.5 text-sm font-semibold text-midnight transition-colors hover:bg-champagne lg:hidden"
                  >
                    View Products
                  </button>
                </div>
              </motion.div>
            )}
          </main>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-center text-xs text-champagne/60">
            <span className="font-semibold">Keyboard shortcuts:</span> 
            <span className="mx-2">⌘+S / Ctrl+S to save</span>
            <span className="mx-2">← → to navigate products</span>
          </p>
        </div>
      </div>
    </>
  );
}
