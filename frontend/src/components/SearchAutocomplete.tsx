// World-Class Search Autocomplete Component
// Following 2025 UX best practices: instant search, rich autocomplete with images,
// keyboard navigation, debounced API calls, visual highlighting, mobile optimization

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { searchProducts } from '../api/products';
import { useI18n } from '../context/I18nContext';
import type { Product } from '../types/product';

interface SearchAutocompleteProps {
  onClose?: () => void;
  className?: string;
  isMobile?: boolean;
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

export default function SearchAutocomplete({ onClose, className = '', isMobile = false }: SearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { lang } = useI18n();

  // Debounce search query (300ms - industry standard)
  const debouncedQuery = useDebounce(query, 300);

  // Fetch search results
  const { data: products, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchProducts(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000 // Cache results for 30 seconds
  });

  // Max results based on device (research shows 10 for desktop, 8 for mobile)
  const maxResults = isMobile ? 8 : 10;
  const displayProducts = products?.slice(0, maxResults) || [];

  // Show dropdown when we have query and results
  useEffect(() => {
    setIsOpen(debouncedQuery.length >= 2 && (displayProducts.length > 0 || !isLoading));
  }, [debouncedQuery, displayProducts, isLoading]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [products]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || displayProducts.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < displayProducts.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < displayProducts.length) {
            handleProductClick(displayProducts[selectedIndex]);
          } else if (query.trim()) {
            handleSearchSubmit();
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
      }
    },
    [isOpen, displayProducts, selectedIndex, query]
  );

  const handleProductClick = (product: Product) => {
    navigate(`/${lang}/products/${product.id}`);
    handleClose();
  };

  const handleSearchSubmit = () => {
    if (query.trim()) {
      navigate(`/${lang}/products?search=${encodeURIComponent(query.trim())}`);
      handleClose();
    }
  };

  const handleClose = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    onClose?.();
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

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-midnight/50 pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search products..."
          className="w-full pl-10 pr-10 py-2.5 rounded-full border border-champagne/60 bg-champagne/20 text-sm text-midnight placeholder-midnight/50 focus:border-jade focus:outline-none focus:ring-2 focus:ring-jade/20 transition-all"
          autoFocus={isMobile}
          autoComplete="off"
        />
        {query && (
          <button
            onClick={handleClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-midnight/50 hover:text-midnight transition-colors"
            aria-label="Clear search"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
        {isLoading && query.length >= 2 && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <motion.div
              className="h-4 w-4 border-2 border-jade/20 border-t-jade rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}
      </div>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-midnight/50 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-champagne/40 overflow-hidden ${
              isMobile ? 'fixed left-0 right-0 mx-4 z-50' : 'z-50'
            }`}
            style={isMobile ? { width: 'calc(100% - 2rem)' } : {}}
          >
            {displayProducts.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                {/* Results Header */}
                <div className="px-4 py-3 border-b border-champagne/40 bg-champagne/5">
                  <p className="text-xs font-semibold text-midnight/60 uppercase tracking-wide">
                    {products && products.length > maxResults
                      ? `Top ${maxResults} of ${products.length} results`
                      : `${displayProducts.length} ${displayProducts.length === 1 ? 'result' : 'results'}`}
                  </p>
                </div>

                {/* Product Results */}
                <div className="py-2">
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
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MagnifyingGlassIcon className="h-6 w-6 text-midnight/20" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-midnight truncate">
                          {highlightMatch(product.name, query)}
                        </p>
                        {product.category && (
                          <p className="text-xs text-midnight/50 mt-0.5">
                            in {product.category}
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
                </div>

                {/* View All Results */}
                {products && products.length > maxResults && (
                  <div className="border-t border-champagne/40 bg-champagne/5">
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full px-4 py-3 text-sm font-semibold text-jade hover:bg-jade/10 transition-colors text-center"
                    >
                      View all {products.length} results →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Empty State */
              <div className="px-4 py-8 text-center">
                <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-midnight/20 mb-3" />
                <p className="text-midnight/60 text-sm">
                  No products found for "{query}"
                </p>
                <p className="text-midnight/40 text-xs mt-1">
                  Try different keywords
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Hints (Desktop only) */}
      {!isMobile && isOpen && displayProducts.length > 0 && (
        <div className="absolute top-full mt-1 right-0 text-xs text-midnight/40 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/50 rounded border border-midnight/10">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/50 rounded border border-midnight/10">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/50 rounded border border-midnight/10">Enter</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/50 rounded border border-midnight/10">Esc</kbd>
            close
          </span>
        </div>
      )}
    </div>
  );
}
