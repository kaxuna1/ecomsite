/**
 * Language Autocomplete Component
 *
 * Provides an autocomplete select box prepopulated with 111 world languages.
 * Users can search/filter languages by name or native name.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';
import worldLanguages from '../../data/worldLanguages.json';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export interface LanguageAutocompleteProps {
  value: LanguageOption | null;
  onChange: (language: LanguageOption) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const LanguageAutocomplete: React.FC<LanguageAutocompleteProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Search for a language...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter languages based on search query
  const filteredLanguages = worldLanguages.languages.filter(lang => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      lang.name.toLowerCase().includes(query) ||
      lang.nativeName.toLowerCase().includes(query) ||
      lang.code.toLowerCase().includes(query)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (language: LanguageOption) => {
    onChange(language);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredLanguages.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;

      case 'Enter':
        e.preventDefault();
        if (filteredLanguages[highlightedIndex]) {
          handleSelect(filteredLanguages[highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const displayText = value
    ? `${value.name} (${value.nativeName})`
    : '';

  return (
    <div ref={containerRef} className="relative">
      {/* Input Field */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-4 h-4 text-champagne/40" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : displayText}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full rounded-full border border-white/10 bg-white/5 pl-11 pr-10 py-3 text-champagne placeholder:text-champagne/40 focus:border-blush focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          autoComplete="off"
        />

        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown
            className={`w-4 h-4 text-champagne/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/10 bg-midnight shadow-2xl max-h-80 overflow-hidden">
          <div
            ref={listRef}
            className="overflow-y-auto max-h-80 py-2"
            style={{ scrollbarWidth: 'thin' }}
          >
            {filteredLanguages.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-champagne/60">
                No languages found matching "{searchQuery}"
              </div>
            ) : (
              filteredLanguages.map((language, index) => {
                const isSelected = value?.code === language.code;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => handleSelect(language)}
                    className={`
                      w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors
                      ${isHighlighted ? 'bg-white/10' : 'hover:bg-white/5'}
                      ${isSelected ? 'bg-blush/10' : ''}
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-semibold text-champagne">
                          {language.code.toUpperCase()}
                        </span>
                        <span className="text-sm text-champagne">
                          {language.name}
                        </span>
                      </div>
                      <div className="text-xs text-champagne/60 mt-0.5">
                        {language.nativeName}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-blush flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Results Count */}
          {filteredLanguages.length > 0 && (
            <div className="px-4 py-2 border-t border-white/10 bg-white/5">
              <p className="text-xs text-champagne/60">
                {filteredLanguages.length} {filteredLanguages.length === 1 ? 'language' : 'languages'} available
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LanguageAutocomplete;
