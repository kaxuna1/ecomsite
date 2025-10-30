// World-Class Search Modal Component
// Following 2025 UX best practices: CMD+K shortcut, modal overlay with backdrop blur,
// instant autocomplete, keyboard navigation, focus trap, accessibility (ARIA)

import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { searchProducts } from '../api/products';
import type { Product } from '../types/product';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { t } = useTranslation();
  const { lang = 'en' } = useParams<{ lang: string }>();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounce search query (300ms - industry standard)
  const debouncedQuery = useDebounce(query, 300);

  // Fetch search results
  const { data: products, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchProducts(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000
  });

  const maxResults = 8;
  const displayProducts = products?.slice(0, maxResults) || [];

  // Load recent searches from localStorage
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    }
  }, [isOpen]);

  // Save search to recent searches
  const saveRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    const updated = [
      searchTerm,
      ...recentSearches.filter(s => s !== searchTerm)
    ].slice(0, 5); // Keep max 5 recent searches

    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Focus trap - prevent tab outside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [products]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const hasResults = displayProducts.length > 0;
      const hasRecentSearches = !query && recentSearches.length > 0;
      const totalItems = hasResults ? displayProducts.length : hasRecentSearches ? recentSearches.length : 0;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (hasResults && selectedIndex >= 0) {
            handleProductClick(displayProducts[selectedIndex]);
          } else if (hasRecentSearches && selectedIndex >= 0) {
            const searchTerm = recentSearches[selectedIndex];
            setQuery(searchTerm);
            handleSearchSubmit(searchTerm);
          } else if (query.trim()) {
            handleSearchSubmit(query.trim());
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [displayProducts, selectedIndex, query, recentSearches, onClose]
  );

  const handleProductClick = (product: Product) => {
    saveRecentSearch(query);
    navigate(`/${lang}/products/${product.id}`);
    onClose();
  };

  const handleSearchSubmit = (searchTerm: string) => {
    if (searchTerm.trim()) {
      saveRecentSearch(searchTerm);
      navigate(`/${lang}/products?search=${encodeURIComponent(searchTerm.trim())}`);
      onClose();
    }
  };

  const handleRecentSearchClick = (searchTerm: string) => {
    setQuery(searchTerm);
    handleSearchSubmit(searchTerm);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Highlight matching text in results
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={index} className="font-bold text-jade">
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-modal-title"
      >
        {/* Backdrop with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-midnight/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Container */}
        <div className="flex min-h-full items-start justify-center p-4 pt-[10vh]">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative border-b border-champagne/40">
              <div className="flex items-center gap-3 px-4 py-4">
                <MagnifyingGlassIcon className="h-5 w-5 text-midnight/40 flex-shrink-0" />
                <input
                  ref={inputRef}
                  id="search-modal-input"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('search.placeholder')}
                  className="flex-1 text-base text-midnight placeholder-midnight/40 bg-transparent border-none outline-none"
                  autoComplete="off"
                  aria-label={t('search.placeholder')}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1.5 text-midnight/50 hover:text-midnight hover:bg-champagne/30 rounded-lg transition-colors"
                    aria-label={t('search.clearSearch')}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
                {isLoading && query.length >= 2 && (
                  <motion.div
                    className="h-4 w-4 border-2 border-jade/20 border-t-jade rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {/* Product Results */}
              {query.length >= 2 && displayProducts.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-midnight/60 uppercase tracking-wide">
                      {t('search.products')}
                    </p>
                  </div>
                  {displayProducts.map((product, index) => (
                    <motion.button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className={`w-full px-4 py-3 flex items-center gap-4 text-left transition-colors ${
                        selectedIndex === index
                          ? 'bg-jade/10'
                          : 'hover:bg-champagne/20'
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-12 h-12 bg-champagne/20 rounded-lg overflow-hidden">
                        {(() => {
                          // Get display image - prefer featured image from media library
                          const displayImage = product.images && product.images.length > 0
                            ? (product.images.find(img => img.isFeatured)?.url || product.images[0].url)
                            : product.imageUrl;
                          
                          return displayImage ? (
                            <img
                              src={displayImage}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <MagnifyingGlassIcon className="h-6 w-6 text-midnight/20" />
                            </div>
                          );
                        })()}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-midnight truncate">
                          {highlightMatch(product.name, query)}
                        </p>
                        {product.category && (
                          <p className="text-xs text-midnight/50 mt-0.5">
                            {t('search.inCategory')} {product.category}
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex-shrink-0 text-right">
                        {product.salePrice ? (
                          <div>
                            <p className="text-sm font-bold text-jade">
                              ${product.salePrice.toFixed(2)}
                            </p>
                            <p className="text-xs text-midnight/40 line-through">
                              ${product.price.toFixed(2)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm font-bold text-midnight">
                            ${product.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  ))}

                  {/* View All Results */}
                  {products && products.length > maxResults && (
                    <div className="border-t border-champagne/40 mt-2">
                      <button
                        onClick={() => handleSearchSubmit(query)}
                        className="w-full px-4 py-3 text-sm font-semibold text-jade hover:bg-jade/10 transition-colors text-center"
                      >
                        {t('search.viewAllResults', { count: products.length })} →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* No Results */}
              {query.length >= 2 && !isLoading && displayProducts.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-midnight/20 mb-3" />
                  <p className="text-midnight/60 text-sm">
                    {t('search.noResults', { query })}
                  </p>
                  <p className="text-midnight/40 text-xs mt-1">
                    {t('search.tryDifferentKeywords')}
                  </p>
                </div>
              )}

              {/* Recent Searches */}
              {!query && recentSearches.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-midnight/60 uppercase tracking-wide">
                      {t('search.recentSearches')}
                    </p>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-midnight/40 hover:text-midnight transition-colors"
                    >
                      {t('search.clear')}
                    </button>
                  </div>
                  {recentSearches.map((searchTerm, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(searchTerm)}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                        selectedIndex === index
                          ? 'bg-jade/10'
                          : 'hover:bg-champagne/20'
                      }`}
                    >
                      <ClockIcon className="h-4 w-4 text-midnight/40 flex-shrink-0" />
                      <span className="text-sm text-midnight">{searchTerm}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!query && recentSearches.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-midnight/20 mb-3" />
                  <p className="text-midnight/60 text-sm mb-1">
                    {t('search.searchForProducts')}
                  </p>
                  <p className="text-midnight/40 text-xs">
                    {t('search.startTyping')}
                  </p>
                </div>
              )}
            </div>

            {/* Footer with keyboard hints */}
            <div className="border-t border-champagne/40 bg-champagne/5 px-4 py-3">
              <div className="flex items-center justify-between text-xs text-midnight/50">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-2 py-1 bg-white rounded border border-midnight/10 font-mono text-[10px]">↑</kbd>
                    <kbd className="px-2 py-1 bg-white rounded border border-midnight/10 font-mono text-[10px]">↓</kbd>
                    {t('search.navigate')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-2 py-1 bg-white rounded border border-midnight/10 font-mono text-[10px]">Enter</kbd>
                    {t('search.select')}
                  </span>
                </div>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 bg-white rounded border border-midnight/10 font-mono text-[10px]">Esc</kbd>
                  {t('search.close')}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
