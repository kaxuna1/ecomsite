import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, TagIcon } from '@heroicons/react/24/outline';
import { fetchSaleProducts } from '../api/products';
import { useI18n } from '../context/I18nContext';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';

type SortOption = 'discount' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

function SalePage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'sale'],
    queryFn: fetchSaleProducts
  });
  const { t } = useI18n();
  const prefersReducedMotion = useReducedMotion();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('discount');

  // Get unique categories
  const categories = useMemo(() => {
    if (!products) return [];
    const allCategories = products.flatMap(p => p.categories);
    return Array.from(new Set(allCategories));
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.shortDescription.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.categories.includes(selectedCategory));
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        sorted.sort((a, b) => {
          const priceA = a.salePrice ?? a.price;
          const priceB = b.salePrice ?? b.price;
          return priceA - priceB;
        });
        break;
      case 'price-desc':
        sorted.sort((a, b) => {
          const priceA = a.salePrice ?? a.price;
          const priceB = b.salePrice ?? b.price;
          return priceB - priceA;
        });
        break;
      case 'discount':
      default:
        // Already sorted by backend by discount percentage DESC
        break;
    }

    return sorted;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
      };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <Helmet>
        <title>Sale — {t('common.brand')}</title>
        <meta name="description" content="Luxury hair care on sale - Save on premium products" />
      </Helmet>

      {/* Header */}
      <motion.header className="space-y-6 text-center" {...fadeInUp}>
        <div className="space-y-4">
          <motion.div
            className="inline-flex items-center gap-2"
            initial={prefersReducedMotion ? {} : { scale: 0, rotate: -180 }}
            animate={prefersReducedMotion ? {} : { scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <TagIcon className="h-10 w-10 text-rose-500" />
            <h1 className="font-display text-4xl text-midnight sm:text-5xl lg:text-6xl">
              Sale
            </h1>
          </motion.div>
          <p className="mx-auto max-w-2xl text-base text-midnight/70">
            Discover exceptional savings on our luxury hair care collection - limited time offers
          </p>
        </div>

        {/* Search Bar */}
        <motion.div
          className="mx-auto max-w-2xl"
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-midnight/40" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sale items..."
              className="w-full rounded-full border border-champagne/60 bg-white px-12 py-4 text-sm text-midnight placeholder-midnight/40 shadow-sm transition-all focus:border-jade focus:ring-2 focus:ring-jade/20 focus:outline-none"
            />
            {searchQuery && (
              <motion.button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-champagne/50 transition-colors"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="text-midnight/60">✕</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.header>

      {/* Filters */}
      <motion.div
        className="mt-12 flex flex-wrap items-center justify-between gap-4"
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-jade text-white shadow-md'
                : 'bg-champagne/30 text-midnight/70 hover:bg-champagne/50'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            All Categories
          </motion.button>
          {categories.map((category) => (
            <motion.button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-all ${
                selectedCategory === category
                  ? 'bg-jade text-white shadow-md'
                  : 'bg-champagne/30 text-midnight/70 hover:bg-champagne/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category}
            </motion.button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm font-medium text-midnight/60">
            Sort by:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-full border border-champagne/60 bg-white px-4 py-2 text-sm font-medium text-midnight shadow-sm transition-all focus:border-jade focus:ring-2 focus:ring-jade/20 focus:outline-none"
          >
            <option value="discount">Biggest Discount</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
          </select>
        </div>
      </motion.div>

      {/* Results Count */}
      <motion.p
        className="mt-6 text-sm text-midnight/60"
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={prefersReducedMotion ? {} : { opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {isLoading ? (
          'Loading sale items...'
        ) : (
          <>
            Showing <span className="font-semibold text-jade">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'product' : 'products'} on sale
          </>
        )}
      </motion.p>

      {/* Products Grid */}
      {isLoading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {filteredProducts.length > 0 ? (
            <motion.div
              key="products"
              className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={prefersReducedMotion ? {} : { opacity: 1 }}
              exit={prefersReducedMotion ? {} : { opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {filteredProducts.map((product, index) => (
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
              <TagIcon className="mx-auto h-16 w-16 text-midnight/20" />
              <p className="mt-4 text-lg text-midnight/60">No sale items found matching your criteria.</p>
              <motion.button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 rounded-full bg-jade px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear Filters
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export default SalePage;
