import { useState, useMemo, useEffect, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { fetchProducts, fetchFilterMetadata, type PaginatedProductsResponse } from '../api/products';
import type { Product } from '../types/product';
import { useI18n } from '../context/I18nContext';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'newest';

function ProductsPage() {
  const { t } = useI18n();
  const prefersReducedMotion = useReducedMotion();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [attributeFilters, setAttributeFilters] = useState<Record<string, any>>({});
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: true,
    attributes: true
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Initialize search query from URL parameter on mount
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // Build filters object for API
  const filters = useMemo(() => {
    const apiFilters: any = {};
    if (selectedCategory !== 'all') {
      apiFilters.category = selectedCategory;
    }
    if (searchQuery.trim()) {
      apiFilters.search = searchQuery.trim();
    }
    if (Object.keys(attributeFilters).length > 0) {
      const cleanedAttributes: Record<string, any> = {};
      Object.entries(attributeFilters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value) && value.length > 0) {
            cleanedAttributes[key] = value;
          } else if (!Array.isArray(value)) {
            cleanedAttributes[key] = value;
          }
        }
      });
      if (Object.keys(cleanedAttributes).length > 0) {
        apiFilters.attributes = cleanedAttributes;
      }
    }
    return apiFilters;
  }, [selectedCategory, searchQuery, attributeFilters]);

  // Fetch products with server-side filtering and pagination
  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ['products', filters, currentPage],
    queryFn: () => fetchProducts(filters, currentPage, 18),
    keepPreviousData: true
  });

  // Accumulate products when new pages load
  useEffect(() => {
    if (response) {
      if (currentPage === 1) {
        // First page - replace all products
        setAllProducts(response.products);
      } else {
        // Subsequent pages - append products
        setAllProducts(prev => [...prev, ...response.products]);
      }
      setTotalProducts(response.total);
      setHasMore(response.hasMore);
      setIsLoadingMore(false);
    }
  }, [response]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
  }, [filters]);

  // Fetch filter metadata with counts from backend
  const { data: filterMetadata } = useQuery({
    queryKey: ['filter-metadata'],
    queryFn: () => fetchFilterMetadata(),
    staleTime: Infinity // Cache indefinitely - filter metadata rarely changes
  });

  const categories = filterMetadata?.categories || [];
  const filterableAttributes = filterMetadata?.attributes || [];

  // Client-side sorting only (filtering is done server-side)
  const sortedProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];

    const sorted = [...allProducts];
    switch (sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => b.id - a.id);
    }

    return sorted;
  }, [allProducts, sortBy]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (searchQuery.trim()) count++;
    count += Object.keys(attributeFilters).filter(key => {
      const value = attributeFilters[key];
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && value !== '';
    }).length;
    return count;
  }, [selectedCategory, searchQuery, attributeFilters]);

  // Get active filter labels for chips
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

    if (selectedCategory !== 'all') {
      const categoryLabel = categories.find(c => c.value === selectedCategory)?.label || selectedCategory;
      chips.push({
        id: 'category',
        label: `Category: ${categoryLabel}`,
        onRemove: () => setSelectedCategory('all')
      });
    }

    Object.entries(attributeFilters).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;

      const attr = filterableAttributes.find(a => a.attributeKey === key);
      if (!attr) return;

      if (Array.isArray(value) && value.length > 0) {
        chips.push({
          id: `${key}`,
          label: `${attr.attributeLabel}: ${value.join(', ')}`,
          onRemove: () => {
            const newFilters = { ...attributeFilters };
            delete newFilters[key];
            setAttributeFilters(newFilters);
          }
        });
      } else if (!Array.isArray(value)) {
        chips.push({
          id: `${key}`,
          label: `${attr.attributeLabel}: ${value}`,
          onRemove: () => {
            const newFilters = { ...attributeFilters };
            delete newFilters[key];
            setAttributeFilters(newFilters);
          }
        });
      }
    });

    return chips;
  }, [selectedCategory, attributeFilters, filterableAttributes, categories]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setAttributeFilters({});
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      setCurrentPage(prev => prev + 1);
    }
  };

  // Filter Sidebar/Drawer Component
  const FilterContent = () => (
    <div className="h-full flex flex-col">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h2>
        <button
          onClick={() => setIsFilterDrawerOpen(false)}
          className="p-2 hover:bg-[var(--color-surface-hover)] rounded-full transition-colors"
        >
          <XMarkIcon className="h-5 w-5 text-[var(--color-text-primary)]" />
        </button>
      </div>

      {/* Filter Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
              </span>
              <button
                onClick={clearAllFilters}
                className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('categories')}
            className="w-full flex items-center justify-between text-left group"
          >
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Categories</h3>
            {expandedSections.categories ? (
              <ChevronUpIcon className="h-4 w-4 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors" />
            )}
          </button>

          {expandedSections.categories && (
            <div className="space-y-2 mt-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === 'all'}
                    onChange={() => setSelectedCategory('all')}
                    className="h-4 w-4 text-[var(--color-primary)] border-[var(--color-border)] focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                    All Products
                  </span>
                </label>
                {categories.map((category) => (
                  <label key={category.value} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === category.value}
                        onChange={() => setSelectedCategory(category.value)}
                        className="h-4 w-4 text-[var(--color-primary)] border-[var(--color-border)] focus:ring-[var(--color-primary)]"
                      />
                      <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] capitalize transition-colors">
                        {category.label}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
                      {category.count}
                    </span>
                  </label>
                ))}
            </div>
          )}
        </div>

        {/* Custom Attribute Filters */}
        {filterableAttributes.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('attributes')}
              className="w-full flex items-center justify-between text-left group"
            >
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Attributes</h3>
              {expandedSections.attributes ? (
                <ChevronUpIcon className="h-4 w-4 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors" />
              )}
            </button>

            {expandedSections.attributes && (
              <div className="space-y-4 mt-3">
                  {filterableAttributes.map((attr) => (
                    <div key={attr.id} className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-text-secondary)]">{attr.attributeLabel}</label>

                      {/* Boolean checkbox */}
                      {attr.dataType === 'boolean' && (
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={attributeFilters[attr.attributeKey] || false}
                            onChange={(e) => setAttributeFilters({
                              ...attributeFilters,
                              [attr.attributeKey]: e.target.checked || undefined
                            })}
                            className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                          />
                          <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">Yes</span>
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
                          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                        >
                          <option value="">All</option>
                          {attr.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label} ({opt.count})
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Multiselect checkboxes */}
                      {attr.dataType === 'multiselect' && attr.options && (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {attr.options.map((opt) => (
                            <label key={opt.value} className="flex items-center justify-between cursor-pointer group">
                              <div className="flex items-center gap-2">
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
                                  className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                />
                                <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                                  {opt.label}
                                </span>
                              </div>
                              <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
                                {opt.count}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Apply Button */}
      <div className="lg:hidden border-t border-[var(--color-border)] p-4">
        <button
          onClick={() => setIsFilterDrawerOpen(false)}
          className="w-full rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-button-text)] shadow-lg hover:shadow-xl transition-shadow"
        >
          Show {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <Helmet>
        <title>
          {t('products.title')} — {t('common.brand')}
        </title>
      </Helmet>

      {/* Toolbar: Search + Filters + Sort */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="lg:hidden flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 shadow-sm hover:shadow-md transition-all flex-shrink-0"
          >
            <FunnelIcon className="h-5 w-5 text-[var(--color-text-secondary)]" />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-[var(--color-button-text)]">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Search Bar */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-11 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] shadow-sm transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <XMarkIcon className="h-4 w-4 text-[var(--color-text-secondary)]" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <label htmlFor="sort" className="text-sm font-medium text-[var(--color-text-secondary)] hidden sm:block">
              Sort:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-primary)] shadow-sm transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <div
                key={chip.id}
                className="flex items-center gap-2 rounded-full bg-[var(--color-primary)]/10 px-3 py-1.5 text-sm text-[var(--color-primary)] border border-[var(--color-primary)]/20"
              >
                <span>{chip.label}</span>
                <button
                  onClick={chip.onRemove}
                  className="hover:bg-[var(--color-primary)]/20 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${chip.label} filter`}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm">
            <FilterContent />
          </div>
        </aside>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isFilterDrawerOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFilterDrawerOpen(false)}
                className="fixed inset-0 bg-[var(--color-text-primary)]/50 z-40 lg:hidden"
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 w-80 bg-[var(--color-background)] shadow-2xl z-50 lg:hidden"
              >
                <FilterContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Products Area */}
        <div className="flex-1 min-w-0">
          {/* Results Count */}
          <div className="mb-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {isLoading && currentPage === 1 ? (
                'Loading products...'
              ) : (
                <>
                  Showing <span className="font-semibold text-[var(--color-primary)]">{sortedProducts.length}</span>{' '}
                  {totalProducts > 0 && <span>of {totalProducts}</span>}{' '}
                  {totalProducts === 1 ? 'product' : 'products'}
                </>
              )}
            </p>
          </div>

          {/* Products Grid */}
          {isLoading && currentPage === 1 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {sortedProducts.length > 0 ? (
                <motion.div
                  key="products"
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  initial={prefersReducedMotion ? {} : { opacity: 0 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {sortedProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  className="mt-16 text-center"
                  initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                >
                  <FunnelIcon className="mx-auto h-16 w-16 text-[var(--color-text-tertiary)] mb-4" />
                  <p className="text-lg text-[var(--color-text-secondary)] mb-4">No products found matching your criteria.</p>
                  {activeFilterCount > 0 && (
                    <motion.button
                      type="button"
                      onClick={clearAllFilters}
                      className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-button-text)] shadow-lg hover:shadow-xl transition-shadow"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Clear All Filters
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Load More Button */}
          {!isLoading && sortedProducts.length > 0 && hasMore && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore || isFetching}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-8 py-3.5 text-sm font-semibold text-[var(--color-button-text)] shadow-lg hover:shadow-xl hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore || isFetching ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Load More Products</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;
