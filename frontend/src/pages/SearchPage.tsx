import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { searchProducts } from '../api/products';
import { getFilterableAttributes } from '../api/attributes';
import { SearchBar } from '../components/SearchBar';
import { useI18n } from '../context/I18nContext';
import type { Product } from '../types/product';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { t } = useI18n();

  const [filters, setFilters] = useState({
    isNew: false,
    isFeatured: false,
    onSale: false,
    priceRange: 'all' as 'all' | 'under25' | '25to50' | '50to100' | 'over100'
  });

  const [attributeFilters, setAttributeFilters] = useState<Record<string, any>>({});

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchProducts(query),
    enabled: query.trim().length > 0
  });

  const { data: filterableAttributes = [] } = useQuery({
    queryKey: ['filterable-attributes'],
    queryFn: () => getFilterableAttributes()
  });

  const filteredResults = results.filter((product) => {
    if (filters.isNew && !product.isNew) return false;
    if (filters.isFeatured && !product.isFeatured) return false;
    if (filters.onSale && !product.salePrice) return false;

    const price = product.salePrice || product.price;
    switch (filters.priceRange) {
      case 'under25':
        if (price >= 25) return false;
        break;
      case '25to50':
        if (price < 25 || price >= 50) return false;
        break;
      case '50to100':
        if (price < 50 || price >= 100) return false;
        break;
      case 'over100':
        if (price < 100) return false;
        break;
    }

    // Custom attribute filters
    if (Object.keys(attributeFilters).length > 0) {
      if (!product.customAttributes) return false;

      const matchesAttributes = Object.entries(attributeFilters).every(([key, value]) => {
        const productValue = product.customAttributes![key];

        if (value === null || value === undefined || value === '') return true;

        // Handle array values (multiselect)
        if (Array.isArray(value) && value.length === 0) return true;
        if (Array.isArray(value)) {
          if (!Array.isArray(productValue)) return false;
          return value.every(v => productValue.includes(v));
        }

        // Handle boolean
        if (typeof value === 'boolean') {
          return productValue === value;
        }

        // Handle string/number exact match
        return productValue === value;
      });

      if (!matchesAttributes) return false;
    }

    return true;
  });

  const clearFilters = () => {
    setFilters({
      isNew: false,
      isFeatured: false,
      onSale: false,
      priceRange: 'all'
    });
    setAttributeFilters({});
  };

  const hasActiveFilters =
    filters.isNew || filters.isFeatured || filters.onSale || filters.priceRange !== 'all' || Object.keys(attributeFilters).length > 0;

  if (!query) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <MagnifyingGlassIcon className="mx-auto h-16 w-16 text-midnight/20" />
          <h1 className="mt-4 font-display text-3xl text-midnight">Search Products</h1>
          <p className="mt-2 text-midnight/60">Enter a search term to find products</p>
          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBar />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <div className="mb-4">
          <SearchBar />
        </div>
        <h1 className="font-display text-2xl text-midnight md:text-3xl">
          Search results for "{query}"
        </h1>
        <p className="mt-2 text-midnight/60">
          {isLoading
            ? 'Searching...'
            : `${filteredResults.length} ${filteredResults.length === 1 ? 'product' : 'products'} found`}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Filters Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-champagne/40 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-jade" />
                <h2 className="font-semibold text-midnight">Filters</h2>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-jade transition-colors hover:text-jade/80"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Category Filters */}
            <div className="space-y-3 border-b border-champagne/20 pb-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.isNew}
                  onChange={(e) => setFilters({ ...filters, isNew: e.target.checked })}
                  className="h-4 w-4 rounded border-champagne/60 text-jade focus:ring-jade"
                />
                <span className="text-sm text-midnight">New Arrivals</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.isFeatured}
                  onChange={(e) => setFilters({ ...filters, isFeatured: e.target.checked })}
                  className="h-4 w-4 rounded border-champagne/60 text-jade focus:ring-jade"
                />
                <span className="text-sm text-midnight">Featured</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.onSale}
                  onChange={(e) => setFilters({ ...filters, onSale: e.target.checked })}
                  className="h-4 w-4 rounded border-champagne/60 text-jade focus:ring-jade"
                />
                <span className="text-sm text-midnight">On Sale</span>
              </label>
            </div>

            {/* Price Range Filter */}
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-semibold text-midnight">Price Range</h3>
              {[
                { value: 'all', label: 'All Prices' },
                { value: 'under25', label: 'Under $25' },
                { value: '25to50', label: '$25 - $50' },
                { value: '50to100', label: '$50 - $100' },
                { value: 'over100', label: 'Over $100' }
              ].map((option) => (
                <label key={option.value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={filters.priceRange === option.value}
                    onChange={() =>
                      setFilters({
                        ...filters,
                        priceRange: option.value as typeof filters.priceRange
                      })
                    }
                    className="h-4 w-4 border-champagne/60 text-jade focus:ring-jade"
                  />
                  <span className="text-sm text-midnight">{option.label}</span>
                </label>
              ))}
            </div>

            {/* Custom Attribute Filters */}
            {filterableAttributes.length > 0 && (
              <div className="mt-4 space-y-4 border-t border-champagne/20 pt-4">
                <h3 className="text-sm font-semibold text-midnight">Custom Filters</h3>
                {filterableAttributes.map((attr) => (
                  <div key={attr.id} className="space-y-2">
                    <label className="text-sm font-medium text-midnight/80">{attr.attributeLabel}</label>

                    {/* Boolean checkbox */}
                    {attr.dataType === 'boolean' && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={attributeFilters[attr.attributeKey] || false}
                          onChange={(e) => setAttributeFilters({
                            ...attributeFilters,
                            [attr.attributeKey]: e.target.checked || undefined
                          })}
                          className="h-4 w-4 rounded border-champagne/60 text-jade focus:ring-jade"
                        />
                        <span className="text-sm text-midnight/70">Yes</span>
                      </label>
                    )}

                    {/* Select dropdown */}
                    {attr.dataType === 'select' && attr.options && (
                      <select
                        value={attributeFilters[attr.attributeKey] || ''}
                        onChange={(e) => setAttributeFilters({
                          ...attributeFilters,
                          [attr.attributeKey]: e.target.value || undefined
                        })}
                        className="w-full rounded-lg border border-champagne/60 bg-white px-3 py-2 text-sm text-midnight focus:border-jade focus:ring-2 focus:ring-jade/20"
                      >
                        <option value="">All</option>
                        {attr.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}

                    {/* Multiselect checkboxes */}
                    {attr.dataType === 'multiselect' && attr.options && (
                      <div className="space-y-1.5">
                        {attr.options.map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={(attributeFilters[attr.attributeKey] || []).includes(opt.value)}
                              onChange={(e) => {
                                const currentValues = attributeFilters[attr.attributeKey] || [];
                                const newValues = e.target.checked
                                  ? [...currentValues, opt.value]
                                  : currentValues.filter((v: string) => v !== opt.value);
                                setAttributeFilters({
                                  ...attributeFilters,
                                  [attr.attributeKey]: newValues.length > 0 ? newValues : undefined
                                });
                              }}
                              className="h-4 w-4 rounded border-champagne/60 text-jade focus:ring-jade"
                            />
                            <span className="text-sm text-midnight/70">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Results Grid */}
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-jade/20 border-t-jade" />
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="rounded-2xl border border-champagne/40 bg-white p-12 text-center">
              <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-midnight/20" />
              <h3 className="mt-4 font-display text-xl text-midnight">No products found</h3>
              <p className="mt-2 text-midnight/60">
                Try adjusting your search or filters to find what you're looking for
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-jade px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-jade/90"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredResults.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/products/${product.id}`}
                    className="group block overflow-hidden rounded-2xl border border-champagne/40 bg-white transition-all hover:border-jade hover:shadow-lg"
                  >
                    <div className="aspect-square overflow-hidden bg-champagne/20">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <div className="mb-2 flex flex-wrap gap-1">
                        {product.isNew && (
                          <span className="rounded-full bg-jade/10 px-2 py-0.5 text-xs font-semibold text-jade">
                            New
                          </span>
                        )}
                        {product.isFeatured && (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600">
                            Featured
                          </span>
                        )}
                        {product.salePrice && (
                          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-600">
                            Sale
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-midnight group-hover:text-jade">
                        {product.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-midnight/60">
                        {product.shortDescription}
                      </p>
                      <div className="mt-3 flex items-baseline gap-2">
                        {product.salePrice ? (
                          <>
                            <span className="text-lg font-bold text-jade">
                              ${product.salePrice.toFixed(2)}
                            </span>
                            <span className="text-sm text-midnight/40 line-through">
                              ${product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-midnight">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
