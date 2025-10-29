import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '../hooks/useDebounce';
import { autocompleteProducts } from '../api/products';
import { motion, AnimatePresence } from 'framer-motion';

interface AutocompleteResult {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
  salePrice: number | null;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.trim().length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await autocompleteProducts(debouncedQuery, 8);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  const handleSelectSuggestion = (suggestion: AutocompleteResult) => {
    navigate(`/products/${suggestion.id}`);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-xl">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder="Search products..."
          className="w-full rounded-full border-2 border-champagne/40 bg-white px-5 py-3 pl-12 pr-12 text-midnight transition-all focus:border-jade focus:outline-none focus:ring-2 focus:ring-jade/20"
        />
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-midnight/40" />

        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-midnight/40 transition-colors hover:text-midnight"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}

        {isLoading && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-jade/20 border-t-jade" />
          </div>
        )}
      </form>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-champagne/40 bg-white shadow-xl"
          >
            <div className="max-h-96 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={`flex w-full items-center gap-4 border-b border-champagne/20 p-4 text-left transition-colors last:border-b-0 ${
                    index === selectedIndex ? 'bg-jade/5' : 'hover:bg-champagne/10'
                  }`}
                >
                  <img
                    src={suggestion.imageUrl}
                    alt={suggestion.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-midnight">{suggestion.name}</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      {suggestion.salePrice ? (
                        <>
                          <span className="text-sm font-semibold text-jade">
                            ${suggestion.salePrice.toFixed(2)}
                          </span>
                          <span className="text-xs text-midnight/40 line-through">
                            ${suggestion.price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-midnight">
                          ${suggestion.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <MagnifyingGlassIcon className="h-5 w-5 text-midnight/20" />
                </button>
              ))}
            </div>

            {query.trim() && (
              <button
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-2 border-t border-champagne/40 bg-champagne/5 p-3 text-sm font-medium text-jade transition-colors hover:bg-champagne/10"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                View all results for "{query}"
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
