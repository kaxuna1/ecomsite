// BlockRenderer Component
// Dynamically renders CMS blocks based on type

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TruckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  HeartIcon as HeartOutlineIcon,
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { CMSBlock } from '../../types/cms';
import HeroBlock from './HeroBlock';
import ProductCarousel from './ProductCarousel';
import ProductList from './ProductList';
import QuickViewModal from './QuickViewModal';
import {
  fetchRandomProducts,
  fetchProductsByRules,
  fetchProductsByCategory,
  fetchProductsByAttributes,
  fetchRecommendedProducts,
  fetchRecentlyViewedProducts,
  type ProductRules
} from '../../api/products';
import { addFavorite, removeFavorite, getFavorites } from '../../api/favorites';
import { useCart } from '../../context/CartContext';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import RatingStars from '../reviews/RatingStars';

interface BlockRendererProps {
  block: CMSBlock;
}

export default function BlockRenderer({ block }: BlockRendererProps) {
  const { blockType, content } = block;

  // Route to appropriate block component
  switch (blockType) {
    case 'hero':
      return <HeroBlock content={content as any} />;

    case 'features':
      return <FeaturesBlock content={content as any} />;

    case 'products':
      return <ProductsBlock content={content as any} />;

    case 'testimonials':
      return <TestimonialsBlock content={content as any} />;

    case 'newsletter':
      return <NewsletterBlock content={content as any} />;

    case 'text_image':
      return <TextImageBlock content={content as any} />;

    case 'stats':
      return <StatsBlock content={content as any} />;

    case 'cta':
      return <CTABlock content={content as any} />;

    case 'faq':
      return <FAQBlock content={content as any} />;

    default:
      console.warn(`Unknown block type: ${blockType}`);
      return null;
  }
}

// Inline Features Block Component
function FeaturesBlock({ content }: { content: any }) {
  const prefersReducedMotion = useReducedMotion();
  const { title, subtitle, features, columns = 3, style = {} } = content;

  // Extract style values with defaults
  const bgColor = style?.backgroundColor || '#fef9f3';
  const cardBgColor = style?.cardBackgroundColor || '#ffffff';
  const textColor = style?.textColor || '#1e293b';
  const accentColor = style?.accentColor || '#10b981';
  const iconBgColor = style?.iconBackgroundColor || 'rgba(16, 185, 129, 0.1)';
  const layout = style?.layout || 'classic';
  const iconStyle = style?.iconStyle || 'circle';
  const cardHover = style?.cardHover !== false;
  const centerAlign = style?.centerAlign === true;

  // Icon mapping - extended set
  const iconMap: any = {
    truck: TruckIcon,
    shield: ShieldCheckIcon,
    sparkles: SparklesIcon,
    heart: HeartOutlineIcon,
    chat: ChatBubbleLeftRightIcon,
    lock: LockClosedIcon,
    check: CheckBadgeIcon
  };

  // Icon style mapping
  const iconStyleMap = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-2xl',
    none: ''
  };

  // Layout mapping
  const layoutMap = {
    classic: 'flex-col',
    modern: 'flex-row items-start gap-4',
    minimal: 'flex-col',
    cards: 'flex-col'
  };

  // Card styling based on layout
  const getCardClasses = () => {
    const base = 'group transition-all duration-300';

    switch (layout) {
      case 'classic':
        return `${base} rounded-3xl border-2 p-8 shadow-lg ${cardHover ? 'hover:shadow-2xl' : ''}`;
      case 'modern':
        return `${base} rounded-2xl bg-gradient-to-br from-white to-gray-50 p-6 shadow-md ${cardHover ? 'hover:shadow-xl' : ''}`;
      case 'minimal':
        return `${base} p-6`;
      case 'cards':
        return `${base} rounded-2xl p-8 shadow-xl ${cardHover ? 'hover:shadow-2xl hover:-translate-y-2' : ''}`;
      default:
        return base;
    }
  };

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7 }
      };

  return (
    <section style={{ backgroundColor: bgColor }} className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div className={centerAlign ? 'text-center' : ''} {...fadeInUp}>
          <h2 className="font-display text-3xl md:text-4xl" style={{ color: textColor }}>
            {title}
          </h2>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-base" style={{ color: textColor, opacity: 0.7 }}>
              {subtitle}
            </p>
          )}
        </motion.div>

        <div className={`mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-${columns}`}>
          {features.map((feature: any, index: number) => {
            const Icon = iconMap[feature.icon] || SparklesIcon;
            const cardClasses = getCardClasses();
            const flexDirection = layoutMap[layout];

            return (
              <motion.div
                key={feature.id}
                className={`${cardClasses} ${flexDirection}`}
                style={{
                  backgroundColor: cardBgColor,
                  borderColor: layout === 'classic' ? `${accentColor}40` : 'transparent'
                }}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 30 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={cardHover ? { y: layout === 'cards' ? -8 : -4 } : {}}
              >
                {/* Icon */}
                {iconStyle !== 'none' && (
                  <div
                    className={`${layout === 'modern' ? 'flex-shrink-0' : 'mb-4'} inline-flex ${iconStyleMap[iconStyle]} p-4 transition-transform ${cardHover ? 'group-hover:scale-110' : ''}`}
                    style={{ backgroundColor: iconBgColor }}
                  >
                    <Icon className="h-8 w-8" style={{ color: accentColor }} />
                  </div>
                )}

                {iconStyle === 'none' && (
                  <div className={layout === 'modern' ? 'flex-shrink-0' : 'mb-4'}>
                    <Icon className="h-8 w-8" style={{ color: accentColor }} />
                  </div>
                )}

                {/* Content */}
                <div className={centerAlign && layout !== 'modern' ? 'text-center' : ''}>
                  <h3
                    className="font-display text-xl"
                    style={{ color: textColor }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="mt-2 text-sm"
                    style={{ color: textColor, opacity: 0.7 }}
                  >
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Inline Products Block Component
function ProductsBlock({ content }: { content: any }) {
  const prefersReducedMotion = useReducedMotion();
  const {
    title,
    subtitle,
    selectionMethod = 'featured',
    productIds = [],
    categoryFilter = [],
    attributeFilters = {},
    sourceProductId,
    rules = {},
    displayStyle = 'grid',
    columns = 4,
    maxProducts = 8,
    sortBy = 'default',
    showCta = true,
    ctaText,
    ctaLink,
    showElements = {},
    style = {},
    carouselSettings = {}
  } = content;

  // Extract style properties
  const cardStyle = style?.cardStyle || 'elevated';
  const imageAspectRatio = style?.imageAspectRatio || '4:5';
  const hoverEffect = style?.hoverEffect || 'zoom';
  const gap = style?.gap || 'medium';
  const borderRadius = style?.borderRadius || 'large';

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const { addItem } = useCart();
  const { language } = useI18n();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch favorites
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: isAuthenticated
  });

  // Mutations
  const addFavoriteMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });

  // Build query key based on selection method
  const getQueryKey = () => {
    switch (selectionMethod) {
      case 'rules':
        return ['products', 'by-rules', rules, sortBy, maxProducts];
      case 'category':
        return ['products', 'by-category', categoryFilter, sortBy, maxProducts];
      case 'manual':
        return ['products', 'manual', productIds];
      case 'recommended':
        return ['products', 'recommended', sourceProductId];
      case 'recent':
        return ['products', 'recent', maxProducts];
      default:
        return ['products', 'featured', maxProducts];
    }
  };

  // Fetch products based on selection method
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: getQueryKey(),
    queryFn: async () => {
      switch (selectionMethod) {
        case 'rules':
          return await fetchProductsByRules(rules as ProductRules, { limit: maxProducts, sortBy });
        case 'category':
          if (categoryFilter.length > 0) {
            return await fetchProductsByCategory(categoryFilter, { limit: maxProducts, sortBy });
          }
          return await fetchRandomProducts(maxProducts);
        case 'manual':
          if (productIds.length > 0) {
            // Fetch specific products by IDs (would need new API endpoint)
            // For now, fall back to random
            return await fetchRandomProducts(maxProducts);
          }
          return [];
        case 'recommended':
          if (sourceProductId) {
            return await fetchRecommendedProducts(sourceProductId, 'related', maxProducts);
          }
          return await fetchRandomProducts(maxProducts);
        case 'recent':
          return await fetchRandomProducts(maxProducts);
        case 'featured':
        default:
          return await fetchRandomProducts(maxProducts);
      }
    },
    enabled: true
  });

  const displayProducts = products.slice(0, maxProducts);

  const handleQuickAdd = (product: any) => {
    addItem(product);
    setToastMessage(`${product.name} added to cart!`);
    setShowToast(true);
  };

  const handleQuickView = (product: any) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleFavoriteClick = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate(`/${language}/login`, { state: { from: window.location.pathname } });
      return;
    }

    const isFavorited = favorites?.some(fav => fav.productId === productId);

    if (isFavorited) {
      await removeFavoriteMutation.mutateAsync(productId);
    } else {
      await addFavoriteMutation.mutateAsync(productId);
    }
  };

  // Style mappings
  const columnClasses = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  const gapClasses = {
    none: 'gap-0',
    small: 'gap-3',
    medium: 'gap-6',
    large: 'gap-8'
  };

  const cardStyleClasses = {
    elevated: 'shadow-lg hover:shadow-2xl',
    flat: 'shadow-none',
    outlined: 'shadow-none border-2 border-champagne/40',
    minimal: 'shadow-none border-0'
  };

  const borderRadiusClasses = {
    none: 'rounded-none',
    small: 'rounded-lg',
    medium: 'rounded-3xl',
    large: 'rounded-[2rem]',
    full: 'rounded-full'
  };

  const hoverEffectClasses = {
    zoom: 'hover:scale-105',
    lift: 'hover:-translate-y-2',
    fade: 'hover:opacity-90',
    slide: 'hover:translate-x-1',
    none: ''
  };

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7 }
      };

  const gridClasses = `grid ${columnClasses[columns as keyof typeof columnClasses] || columnClasses[4]} ${gapClasses[gap as keyof typeof gapClasses] || gapClasses.medium}`;

  // Error state
  if (error) {
    return (
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-red-500">Failed to load products. Please try again later.</p>
        </div>
      </section>
    );
  }

  // Empty state
  if (!isLoading && displayProducts.length === 0) {
    return (
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-midnight/60">No products found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div className="text-center" {...fadeInUp}>
          <p className="text-xs uppercase tracking-[0.6em] text-jade">
            {selectionMethod === 'rules' && rules.showNewArrivals ? 'New Arrivals' :
             selectionMethod === 'rules' && rules.showBestsellers ? 'Best Sellers' :
             selectionMethod === 'rules' && rules.showOnSale ? 'On Sale' :
             'Featured Products'}
          </p>
          <h2 className="mt-2 font-display text-3xl text-midnight md:text-4xl">{title}</h2>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-base text-midnight/70">
              {subtitle}
            </p>
          )}
        </motion.div>

        {isLoading ? (
          <div className={`mt-12 ${gridClasses}`}>
            {[...Array(maxProducts)].map((_, i) => (
              <div key={i} className={`h-96 animate-pulse bg-champagne/30 ${borderRadiusClasses[borderRadius as keyof typeof borderRadiusClasses]}`} />
            ))}
          </div>
        ) : displayStyle === 'carousel' ? (
          <div className="mt-12">
            <ProductCarousel
              products={displayProducts}
              carouselSettings={carouselSettings}
              showElements={showElements}
              style={style}
              onQuickAdd={handleQuickAdd}
              onQuickView={handleQuickView}
            />
          </div>
        ) : displayStyle === 'list' ? (
          <div className="mt-12">
            <ProductList
              products={displayProducts}
              showElements={showElements}
              style={style}
              onQuickAdd={handleQuickAdd}
            />
          </div>
        ) : (
          <div className={`mt-12 ${gridClasses}`}>
            {displayProducts.map((product: any, index: number) => (
              <motion.article
                key={product.id}
                className={`group relative flex flex-col overflow-hidden border-2 border-champagne/40 bg-white transition-all hover:border-jade/40 ${borderRadiusClasses[borderRadius as keyof typeof borderRadiusClasses]} ${cardStyleClasses[cardStyle as keyof typeof cardStyleClasses]} ${hoverEffectClasses[hoverEffect as keyof typeof hoverEffectClasses]}`}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 30 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Product Image */}
                {showElements.image !== false && (
                  <Link to={`/${language}/products/${product.id}`} className={`relative overflow-hidden bg-champagne ${imageAspectRatio === '1:1' ? 'aspect-square' : imageAspectRatio === '4:5' ? 'aspect-[4/5]' : imageAspectRatio === '3:4' ? 'aspect-[3/4]' : 'aspect-[16/9]'}`}>
                    <motion.img
                      src={(() => {
                        // Prefer featured image from media library
                        if (product.images && product.images.length > 0) {
                          const featuredImage = product.images.find((img: any) => img.isFeatured);
                          return featuredImage?.url || product.images[0].url;
                        }
                        // Fallback to imageUrl with API prefix if needed
                        const imageUrl = product.imageUrl;
                        if (imageUrl && imageUrl.startsWith('/uploads/') && !imageUrl.startsWith('http')) {
                          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
                          return `${apiUrl}${imageUrl}`;
                        }
                        return imageUrl;
                      })()}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      whileHover={hoverEffect === 'zoom' ? { scale: 1.05 } : {}}
                      transition={{ duration: 0.4 }}
                    />
                    {/* Quick View Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 via-midnight/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                    {/* Badges */}
                    {showElements.badges !== false && (
                      <>
                        {product.isNew && (
                          <div className="absolute left-3 top-3 rounded-full bg-jade/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                            New
                          </div>
                        )}
                        {product.salePrice && (
                          <div className="absolute right-3 top-3 rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                            Sale
                          </div>
                        )}
                      </>
                    )}

                    {/* Stock Badge */}
                    {showElements.stock !== false && product.inventory < 10 && product.inventory > 0 && (
                      <div className="absolute left-3 top-12 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                        Only {product.inventory} left
                      </div>
                    )}

                    {/* Wishlist Button - Top Right */}
                    {showElements.wishlist !== false && (
                      <motion.button
                        type="button"
                        onClick={(e) => handleFavoriteClick(e, product.id)}
                        className="absolute right-3 top-3 z-10 rounded-full bg-white p-2 shadow-lg transition-all hover:scale-110"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        title={favorites?.some(fav => fav.productId === product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        {favorites?.some(fav => fav.productId === product.id) ? (
                          <HeartSolidIcon className="h-5 w-5 text-rose-500" />
                        ) : (
                          <HeartOutlineIcon className="h-5 w-5 text-midnight" />
                        )}
                      </motion.button>
                    )}

                    {/* Action Buttons */}
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      {showElements.quickView !== false && (
                        <motion.button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleQuickView(product);
                          }}
                          className="flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-midnight shadow-xl"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Quick View"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </motion.button>
                      )}
                      {showElements.addToCart !== false && (
                        <motion.button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleQuickAdd(product);
                          }}
                          className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-midnight shadow-xl"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          <span>Add</span>
                        </motion.button>
                      )}
                    </div>
                  </Link>
                )}

                {/* Product Info */}
                <div className="flex flex-1 flex-col gap-2 p-6">
                  {/* Star Rating */}
                  {showElements.rating !== false && product.averageRating && product.reviewCount && product.reviewCount > 0 && (
                    <div className="flex items-center gap-2">
                      <RatingStars rating={product.averageRating} size="sm" />
                      {showElements.reviewCount !== false && (
                        <span className="text-xs text-midnight/60">
                          ({product.reviewCount})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Product Title */}
                  {showElements.title !== false && (
                    <Link to={`/${language}/products/${product.id}`}>
                      <h3 className="font-display text-lg leading-tight text-midnight transition-colors hover:text-jade line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                  )}

                  {/* Short Description */}
                  {showElements.shortDescription !== false && product.shortDescription && (
                    <p className="mt-1 text-sm text-midnight/60 line-clamp-2">{product.shortDescription}</p>
                  )}

                  {/* Description (full) */}
                  {showElements.description !== false && showElements.shortDescription === false && product.description && (
                    <p className="mt-1 text-sm text-midnight/60 line-clamp-3">{product.description}</p>
                  )}

                  {/* Price */}
                  {showElements.price !== false && (
                    <div className="mt-auto flex items-center gap-2">
                      <span className="text-xl font-bold text-jade">${(product.salePrice || product.price).toFixed(2)}</span>
                      {showElements.comparePrice !== false && product.salePrice && (
                        <span className="text-sm text-midnight/40 line-through">${product.price.toFixed(2)}</span>
                      )}
                    </div>
                  )}

                  {/* Categories */}
                  {showElements.categories !== false && product.categories && product.categories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {product.categories.slice(0, 2).map((category: string) => (
                        <span
                          key={category}
                          className="rounded-full bg-jade/10 px-2 py-0.5 text-xs font-medium text-jade capitalize"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {showCta !== false && (
          <motion.div className="mt-12 text-center" {...fadeInUp}>
            <Link
              to={ctaLink || `/${language}/products`}
              className="inline-flex items-center gap-2 rounded-full bg-midnight px-8 py-4 text-base font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
            >
              <span>{ctaText || 'View All Products'}</span>
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </motion.div>
        )}
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50 rounded-lg bg-jade px-6 py-4 text-white shadow-2xl"
            onAnimationComplete={() => {
              setTimeout(() => setShowToast(false), 2000);
            }}
          >
            <p className="font-semibold">{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// Inline Testimonials Block Component
function TestimonialsBlock({ content }: { content: any }) {
  const prefersReducedMotion = useReducedMotion();
  const { title, subtitle, testimonials, style = {} } = content;

  // Style values with defaults
  const bgColor = style?.backgroundColor || '#f5f3e7';
  const cardBgColor = style?.cardBackgroundColor || '#ffffff';
  const textColor = style?.textColor || '#0f172a';
  const accentColor = style?.accentColor || '#10b981';
  const columns = style?.columns || 3;
  const cardStyle = style?.cardStyle || 'elevated';
  const showAvatars = style?.showAvatars !== false;
  const showCompany = style?.showCompany !== false;
  const showLocation = style?.showLocation !== false;

  // Column class mapping
  const columnMap = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4'
  };

  // Card style mapping
  const cardStyleMap = {
    elevated: 'shadow-lg border-2 border-opacity-20',
    flat: 'shadow-none border-2 border-opacity-20',
    outlined: 'shadow-none border-2',
    minimal: 'shadow-none border-0'
  };

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7 }
      };

  return (
    <section
      className="py-16 md:py-24"
      style={{ backgroundColor: bgColor }}
    >
      <div className="mx-auto max-w-7xl px-4">
        <motion.div className="text-center" {...fadeInUp}>
          <p
            className="text-xs uppercase tracking-[0.6em]"
            style={{ color: accentColor }}
          >
            Testimonials
          </p>
          <h2
            className="mt-2 font-display text-3xl md:text-4xl"
            style={{ color: textColor }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="mx-auto mt-4 max-w-2xl text-base"
              style={{ color: textColor, opacity: 0.7 }}
            >
              {subtitle}
            </p>
          )}
        </motion.div>

        <div className={`mt-12 grid gap-8 ${columnMap[columns as keyof typeof columnMap]}`}>
          {testimonials.map((testimonial: any, index: number) => (
            <motion.blockquote
              key={testimonial.id}
              className={`flex flex-col gap-6 rounded-3xl p-8 ${cardStyleMap[cardStyle as keyof typeof cardStyleMap]}`}
              style={{
                backgroundColor: cardBgColor,
                borderColor: textColor
              }}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 30 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Avatar + Star Rating Row */}
              <div className="flex items-center justify-between">
                {showAvatars && testimonial.avatarUrl ? (
                  <img
                    src={testimonial.avatarUrl}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full object-cover border-2"
                    style={{ borderColor: accentColor }}
                  />
                ) : (
                  <div className="h-1 w-1" /> /* Spacer if no avatar */
                )}

                {/* Star Rating */}
                <div className="flex items-center gap-1">
                  {[...Array(testimonial.rating || 5)].map((_, i) => (
                    <StarIconSolid
                      key={i}
                      className="h-5 w-5"
                      style={{ color: accentColor }}
                    />
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <p
                className="text-base leading-relaxed flex-1"
                style={{ color: textColor, opacity: 0.8 }}
              >
                {testimonial.text}
              </p>

              {/* Customer Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <cite
                      className="text-sm font-semibold not-italic block"
                      style={{ color: textColor }}
                    >
                      {testimonial.name}
                    </cite>
                    {showCompany && (testimonial.jobTitle || testimonial.company) && (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: textColor, opacity: 0.6 }}
                      >
                        {testimonial.jobTitle}
                        {testimonial.jobTitle && testimonial.company && ' at '}
                        {testimonial.company}
                      </p>
                    )}
                    {showLocation && testimonial.location && (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: textColor, opacity: 0.5 }}
                      >
                        {testimonial.location}
                      </p>
                    )}
                  </div>

                  {testimonial.verified && (
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: accentColor }}
                    >
                      <CheckBadgeIcon className="h-4 w-4" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

// Enhanced Newsletter Block Component with Templates and API Integration
function NewsletterBlock({ content }: { content: any }) {
  const prefersReducedMotion = useReducedMotion();
  const {
    title,
    description,
    buttonText,
    placeholderText = 'Enter your email',
    template = 'gradient',
    style = {}
  } = content;

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Extract style values with defaults
  const bgColor = style?.backgroundColor || '#10b981';
  const textColor = style?.textColor || '#ffffff';
  const buttonColor = style?.buttonColor || '#ffffff';
  const buttonTextColor = style?.buttonTextColor || '#10b981';
  const showIcon = style?.showIcon !== false;
  const centerAlign = style?.centerAlign !== false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          source: 'website_cms_block'
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: 'Thank you for subscribing! Check your email for confirmation.'
        });
        setEmail('');
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to subscribe. Please try again.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to subscribe. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7 }
      };

  // Template-specific rendering
  if (template === 'gradient') {
    return (
      <section
        style={{ background: `linear-gradient(135deg, ${bgColor}, ${bgColor}e6, #1e293b)` }}
        className="py-16 text-white md:py-20"
      >
        <div className="mx-auto max-w-4xl px-4">
          <motion.div className={centerAlign ? 'text-center' : ''} {...fadeInUp}>
            {showIcon && <SparklesIcon className="mx-auto h-12 w-12 text-white/80" />}
            <h2 className="mt-4 font-display text-3xl md:text-4xl" style={{ color: textColor }}>
              {title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base" style={{ color: textColor, opacity: 0.8 }}>
              {description}
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="mx-auto mt-10 max-w-xl"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col gap-4 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholderText}
                required
                disabled={isSubmitting}
                className="flex-1 rounded-full border-2 border-white/30 bg-white/10 px-6 py-4 text-white placeholder-white/60 backdrop-blur transition-all focus:border-white focus:bg-white/20 focus:outline-none disabled:opacity-50"
              />
              <motion.button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                className="rounded-full px-8 py-4 font-semibold shadow-xl transition-all hover:shadow-2xl disabled:opacity-50"
                whileHover={isSubmitting ? {} : { scale: 1.05 }}
                whileTap={isSubmitting ? {} : { scale: 0.95 }}
              >
                {isSubmitting ? 'Subscribing...' : buttonText}
              </motion.button>
            </div>
            {message && (
              <p
                className={`mt-3 text-center text-sm ${
                  message.type === 'success' ? 'text-green-300' : 'text-red-300'
                }`}
              >
                {message.text}
              </p>
            )}
            <p className="mt-4 text-center text-xs text-white/60">
              By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
            </p>
          </motion.form>

          <motion.div
            className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm"
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2 text-white/80">
              <LockClosedIcon className="h-5 w-5" />
              <span>We protect your privacy</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <CheckBadgeIcon className="h-5 w-5" />
              <span>No spam, ever</span>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  if (template === 'minimal') {
    return (
      <section style={{ backgroundColor: bgColor }} className="py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className={centerAlign ? 'text-center' : ''}>
              {showIcon && (
                <svg
                  className="h-10 w-10 mx-auto"
                  style={{ color: textColor }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              )}
              <h2 className="mt-4 font-display text-2xl md:text-3xl" style={{ color: textColor }}>
                {title}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm" style={{ color: textColor, opacity: 0.7 }}>
                {description}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mx-auto mt-6 max-w-md">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={placeholderText}
                  required
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm placeholder-white/50 focus:border-white/40 focus:outline-none disabled:opacity-50"
                  style={{ color: textColor }}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                  className="rounded-lg px-6 py-3 text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Subscribing...' : buttonText}
                </button>
              </div>
              {message && (
                <p
                  className={`mt-2 text-center text-xs ${
                    message.type === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {message.text}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    );
  }

  if (template === 'split') {
    return (
      <section style={{ backgroundColor: bgColor }} className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="grid md:grid-cols-2">
              <div className="flex items-center justify-center p-12" style={{ backgroundColor: buttonColor }}>
                <svg
                  className="h-32 w-32"
                  style={{ color: buttonTextColor }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="p-12">
                <h2 className="font-display text-3xl text-midnight">{title}</h2>
                <p className="mt-4 text-base text-midnight/70">{description}</p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={placeholderText}
                    required
                    disabled={isSubmitting}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-midnight focus:border-jade focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                    className="w-full rounded-lg px-6 py-3 font-semibold transition-all hover:shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? 'Subscribing...' : buttonText}
                  </button>
                  {message && (
                    <p
                      className={`text-center text-sm ${
                        message.type === 'success' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {message.text}
                    </p>
                  )}
                  <p className="text-center text-xs text-midnight/50">No spam. Unsubscribe anytime.</p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (template === 'card') {
    return (
      <section style={{ backgroundColor: bgColor }} className="py-16 md:py-20">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-3xl bg-white p-10 shadow-2xl">
            <div className={centerAlign ? 'text-center' : ''}>
              {showIcon && (
                <div
                  className="mx-auto inline-flex rounded-full p-4"
                  style={{ backgroundColor: `${buttonColor}20` }}
                >
                  <svg
                    className="h-10 w-10"
                    style={{ color: buttonColor }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              <h2 className="mt-4 font-display text-3xl text-midnight">{title}</h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-midnight/70">{description}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={placeholderText}
                  required
                  disabled={isSubmitting}
                  className="flex-1 rounded-full border-2 border-gray-200 px-6 py-4 text-midnight focus:border-jade focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                  className="rounded-full px-8 py-4 font-semibold shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                >
                  {isSubmitting ? 'Subscribing...' : buttonText}
                </button>
              </div>
              {message && (
                <p
                  className={`mt-3 text-center text-sm ${
                    message.type === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {message.text}
                </p>
              )}
              <p className="mt-4 text-center text-xs text-midnight/50">
                Join 10,000+ subscribers. No spam, ever.
              </p>
            </form>
          </div>
        </div>
      </section>
    );
  }

  // Default: gradient template
  return null;
}

// Inline Text + Image Block Component
function TextImageBlock({ content }: { content: any }) {
  const prefersReducedMotion = useReducedMotion();
  const { title, content: bodyContent, image, imagePosition = 'right', imageAlt } = content;

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7 }
      };

  const isImageLeft = imagePosition === 'left';

  // Parse markdown-style content (basic support for **bold** and line breaks)
  const renderContent = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Handle bold text
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const rendered = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-midnight">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      });

      return (
        <p key={idx} className={idx > 0 ? 'mt-4' : ''}>
          {rendered}
        </p>
      );
    });
  };

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className={`grid gap-12 items-center lg:grid-cols-2 ${isImageLeft ? 'lg:grid-flow-dense' : ''}`}>
          {/* Text Content */}
          <motion.div
            className={isImageLeft ? 'lg:col-start-2' : ''}
            {...fadeInUp}
          >
            <h2 className="font-display text-3xl text-midnight md:text-4xl lg:text-5xl">
              {title}
            </h2>
            <div className="mt-6 text-base leading-relaxed text-midnight/70 md:text-lg">
              {renderContent(bodyContent)}
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            className={isImageLeft ? 'lg:col-start-1 lg:row-start-1' : ''}
            initial={prefersReducedMotion ? {} : { opacity: 0, x: isImageLeft ? -30 : 30 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border-2 border-champagne/40 shadow-2xl">
              <img
                src={image || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80"}
                alt={imageAlt || title}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Inline Stats Block Component
function StatsBlock({ content }: { content: any }) {
  const prefersReducedMotion = useReducedMotion();
  const { title, subtitle, stats, columns = 4 } = content;

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7 }
      };

  return (
    <section className="bg-gradient-to-br from-midnight via-midnight/95 to-jade/20 py-16 text-white md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        {title && (
          <motion.div className="text-center" {...fadeInUp}>
            <h2 className="font-display text-3xl md:text-4xl">{title}</h2>
            {subtitle && (
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/70">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}

        <div className={`mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-${columns}`}>
          {stats.map((stat: any, index: number) => (
            <motion.div
              key={stat.id}
              className="group relative overflow-hidden rounded-3xl border-2 border-white/10 bg-white/5 p-8 text-center backdrop-blur transition-all hover:border-jade/40 hover:bg-white/10"
              initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-jade/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative z-10">
                {stat.icon && (
                  <div className="mb-4 text-4xl">{stat.icon}</div>
                )}
                <motion.div
                  className="font-display text-4xl font-bold md:text-5xl lg:text-6xl text-jade"
                  initial={prefersReducedMotion ? {} : { opacity: 0 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                >
                  {stat.value}
                </motion.div>
                <p className="mt-3 text-base font-medium text-white/80">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Inline CTA Block Component
function CTABlock({ content }: { content: any }) {
  const prefersReducedMotion = useReducedMotion();
  const {
    title,
    description,
    primaryButtonText,
    primaryButtonLink,
    secondaryButtonText,
    secondaryButtonLink,
    backgroundImage,
    backgroundImageAlt,
    style = {}
  } = content;

  // Default style values
  const bgColor = style?.backgroundColor || '#10b981';
  const textColor = style?.textColor || '#ffffff';
  const overlayOpacity = style?.overlayOpacity || 80;
  const textAlignment = style?.textAlignment || 'center';
  const padding = style?.padding || 'large';

  // Primary button styles
  const primaryBtn = style?.primaryButton || {};
  const primaryBgColor = primaryBtn.backgroundColor || '#ffffff';
  const primaryTextColor = primaryBtn.textColor || '#0f172a';
  const primaryHoverBg = primaryBtn.hoverBackgroundColor || '#f5f3e7';
  const primaryHoverText = primaryBtn.hoverTextColor || '#0f172a';
  const primarySize = primaryBtn.size || 'medium';
  const primaryStyle = primaryBtn.style || 'solid';
  const primaryRadius = primaryBtn.borderRadius || 'full';

  // Secondary button styles
  const secondaryBtn = style?.secondaryButton || {};
  const secondaryBgColor = secondaryBtn.backgroundColor || 'rgba(255, 255, 255, 0.1)';
  const secondaryTextColor = secondaryBtn.textColor || '#ffffff';
  const secondaryHoverBg = secondaryBtn.hoverBackgroundColor || 'rgba(255, 255, 255, 0.2)';
  const secondaryHoverText = secondaryBtn.hoverTextColor || '#ffffff';
  const secondarySize = secondaryBtn.size || 'medium';
  const secondaryStyle = secondaryBtn.style || 'outline';
  const secondaryRadius = secondaryBtn.borderRadius || 'full';

  // Padding mapping
  const paddingMap = {
    'small': 'py-12',
    'medium': 'py-16',
    'large': 'py-20 md:py-32',
    'extra-large': 'py-32 md:py-40'
  };

  // Text alignment mapping
  const alignmentMap = {
    'left': 'text-left items-start',
    'center': 'text-center items-center',
    'right': 'text-right items-end'
  };

  // Button size mapping
  const sizeMap = {
    'small': 'px-6 py-2 text-sm',
    'medium': 'px-8 py-4 text-base',
    'large': 'px-10 py-5 text-lg'
  };

  // Border radius mapping
  const radiusMap = {
    'none': 'rounded-none',
    'small': 'rounded',
    'medium': 'rounded-lg',
    'large': 'rounded-xl',
    'full': 'rounded-full'
  };

  // Button style helper
  const getButtonClasses = (
    btnStyle: string,
    bgColor: string,
    textColor: string,
    hoverBg: string,
    hoverText: string,
    size: string,
    radius: string
  ) => {
    const baseClasses = `inline-flex items-center gap-2 font-semibold shadow-2xl transition-all ${sizeMap[size as keyof typeof sizeMap]} ${radiusMap[radius as keyof typeof radiusMap]}`;

    if (btnStyle === 'solid') {
      return baseClasses;
    } else if (btnStyle === 'outline') {
      return `${baseClasses} border-2`;
    } else {
      // ghost
      return baseClasses;
    }
  };

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7 }
      };

  return (
    <section
      className={`relative overflow-hidden ${paddingMap[padding as keyof typeof paddingMap]}`}
      style={{ backgroundColor: backgroundImage ? undefined : bgColor }}
    >
      {/* Background Image */}
      {backgroundImage && (
        <>
          <div className="absolute inset-0">
            <img
              src={backgroundImage}
              alt={backgroundImageAlt || "CTA Background"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div
            className="absolute inset-0 bg-gradient-to-br from-current via-current to-current"
            style={{
              color: bgColor,
              opacity: overlayOpacity / 100
            }}
          />
        </>
      )}

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-1/4 -top-1/4 h-96 w-96 rounded-full bg-champagne/10 blur-3xl"
          animate={prefersReducedMotion ? undefined : {
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ repeat: Infinity, duration: 8 }}
        />
        <motion.div
          className="absolute -bottom-1/4 -left-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl"
          animate={prefersReducedMotion ? undefined : {
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ repeat: Infinity, duration: 10 }}
        />
      </div>

      <div className={`relative z-10 mx-auto max-w-4xl px-4 flex flex-col ${alignmentMap[textAlignment as keyof typeof alignmentMap]}`}>
        <motion.div {...fadeInUp}>
          <h2
            className="font-display text-3xl md:text-4xl lg:text-5xl"
            style={{ color: textColor }}
          >
            {title}
          </h2>
          {description && (
            <p
              className={`mt-6 max-w-2xl text-base md:text-lg ${textAlignment === 'center' ? 'mx-auto' : ''}`}
              style={{ color: textColor, opacity: 0.9 }}
            >
              {description}
            </p>
          )}
        </motion.div>

        <motion.div
          className={`mt-10 flex flex-col gap-4 sm:flex-row ${textAlignment === 'center' ? 'justify-center' : textAlignment === 'right' ? 'justify-end' : 'justify-start'}`}
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          {primaryButtonText && primaryButtonLink && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to={primaryButtonLink}
                className={`group ${getButtonClasses(primaryStyle, primaryBgColor, primaryTextColor, primaryHoverBg, primaryHoverText, primarySize, primaryRadius)}`}
                style={{
                  backgroundColor: primaryStyle === 'solid' ? primaryBgColor : primaryStyle === 'outline' ? 'transparent' : 'transparent',
                  color: primaryTextColor,
                  borderColor: primaryStyle === 'outline' ? primaryBgColor : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (primaryStyle === 'solid') {
                    e.currentTarget.style.backgroundColor = primaryHoverBg;
                    e.currentTarget.style.color = primaryHoverText;
                  } else if (primaryStyle === 'outline') {
                    e.currentTarget.style.backgroundColor = primaryHoverBg;
                    e.currentTarget.style.color = primaryHoverText;
                    e.currentTarget.style.borderColor = primaryHoverBg;
                  } else {
                    e.currentTarget.style.backgroundColor = primaryHoverBg;
                    e.currentTarget.style.color = primaryHoverText;
                  }
                }}
                onMouseLeave={(e) => {
                  if (primaryStyle === 'solid') {
                    e.currentTarget.style.backgroundColor = primaryBgColor;
                    e.currentTarget.style.color = primaryTextColor;
                  } else if (primaryStyle === 'outline') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = primaryTextColor;
                    e.currentTarget.style.borderColor = primaryBgColor;
                  } else {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = primaryTextColor;
                  }
                }}
              >
                <span>{primaryButtonText}</span>
                <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          )}

          {secondaryButtonText && secondaryButtonLink && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to={secondaryButtonLink}
                className={getButtonClasses(secondaryStyle, secondaryBgColor, secondaryTextColor, secondaryHoverBg, secondaryHoverText, secondarySize, secondaryRadius)}
                style={{
                  backgroundColor: secondaryStyle === 'solid' ? secondaryBgColor : secondaryStyle === 'outline' ? 'transparent' : 'transparent',
                  color: secondaryTextColor,
                  borderColor: secondaryStyle === 'outline' ? secondaryTextColor : 'transparent',
                  backdropFilter: secondaryStyle !== 'solid' ? 'blur(8px)' : undefined
                }}
                onMouseEnter={(e) => {
                  if (secondaryStyle === 'solid') {
                    e.currentTarget.style.backgroundColor = secondaryHoverBg;
                    e.currentTarget.style.color = secondaryHoverText;
                  } else if (secondaryStyle === 'outline') {
                    e.currentTarget.style.backgroundColor = secondaryHoverBg;
                    e.currentTarget.style.color = secondaryHoverText;
                    e.currentTarget.style.borderColor = secondaryHoverText;
                  } else {
                    e.currentTarget.style.backgroundColor = secondaryHoverBg;
                    e.currentTarget.style.color = secondaryHoverText;
                  }
                }}
                onMouseLeave={(e) => {
                  if (secondaryStyle === 'solid') {
                    e.currentTarget.style.backgroundColor = secondaryBgColor;
                    e.currentTarget.style.color = secondaryTextColor;
                  } else if (secondaryStyle === 'outline') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = secondaryTextColor;
                    e.currentTarget.style.borderColor = secondaryTextColor;
                  } else {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = secondaryTextColor;
                  }
                }}
              >
                <span>{secondaryButtonText}</span>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// Inline FAQ Block Component (2025 Best Practices)
function FAQBlock({ content }: { content: any }) {
  const prefersReducedMotion = useReducedMotion();
  const { title, subtitle, faqs, categories = [], enableSearch = true, enableCategories = true } = content;

  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter FAQs based on search and category
  const filteredFAQs = faqs.filter((faq: any) => {
    const matchesSearch = !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Toggle individual FAQ
  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  // Expand all FAQs
  const expandAll = () => {
    setOpenItems(new Set(filteredFAQs.map((faq: any) => faq.id)));
  };

  // Collapse all FAQs
  const collapseAll = () => {
    setOpenItems(new Set());
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleItem(id);
    }
  };

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7 }
      };

  return (
    <section className="bg-champagne/10 py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <motion.div className="text-center mb-12" {...fadeInUp}>
          {title && (
            <h2 className="font-display text-3xl text-midnight md:text-4xl">{title}</h2>
          )}
          {subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-base text-midnight/70">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Controls Bar */}
        {(enableSearch || enableCategories) && (
          <motion.div
            className="mb-8 space-y-4"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {/* Search Bar */}
            {enableSearch && (
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-midnight/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search FAQs..."
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-midnight/10 rounded-xl text-midnight placeholder-midnight/40 focus:outline-none focus:border-jade transition-colors"
                  aria-label="Search frequently asked questions"
                />
              </div>
            )}

            {/* Category Filters + Expand/Collapse */}
            <div className="flex flex-wrap items-center gap-3">
              {enableCategories && categories.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-jade text-white shadow-lg'
                        : 'bg-white text-midnight/70 hover:bg-midnight/5'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category: string) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-jade text-white shadow-lg'
                          : 'bg-white text-midnight/70 hover:bg-midnight/5'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                  <div className="h-6 w-px bg-midnight/10 mx-2" />
                </>
              )}

              {/* Expand/Collapse All */}
              <button
                type="button"
                onClick={expandAll}
                className="px-3 py-2 text-sm text-jade hover:text-jade/80 font-medium transition-colors"
                aria-label="Expand all questions"
              >
                Expand All
              </button>
              <span className="text-midnight/20">|</span>
              <button
                type="button"
                onClick={collapseAll}
                className="px-3 py-2 text-sm text-jade hover:text-jade/80 font-medium transition-colors"
                aria-label="Collapse all questions"
              >
                Collapse All
              </button>
            </div>
          </motion.div>
        )}

        {/* FAQ List */}
        {filteredFAQs.length === 0 ? (
          <motion.div
            className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-midnight/10"
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={prefersReducedMotion ? {} : { opacity: 1 }}
          >
            <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-midnight/20 mb-3" />
            <p className="text-midnight/50">No FAQs found matching your search.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredFAQs.map((faq: any, index: number) => {
              const isOpen = openItems.has(faq.id);

              return (
                <motion.div
                  key={faq.id}
                  className="bg-white rounded-xl border-2 border-midnight/10 overflow-hidden transition-all hover:border-jade/40 hover:shadow-lg"
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Question Header - 44px minimum touch target */}
                  <button
                    type="button"
                    onClick={() => toggleItem(faq.id)}
                    onKeyDown={(e) => handleKeyDown(e, faq.id)}
                    className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left group min-h-[44px]"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                  >
                    <h3 className="font-semibold text-midnight text-base md:text-lg group-hover:text-jade transition-colors flex-1">
                      {faq.question}
                    </h3>

                    {/* Caret Icon - Down when collapsed, Up when expanded */}
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="flex-shrink-0"
                    >
                      <ChevronDownIcon className="h-6 w-6 text-jade" aria-hidden="true" />
                    </motion.div>
                  </button>

                  {/* Answer Content - Smooth 300ms animation */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${faq.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                        role="region"
                        aria-labelledby={`faq-question-${faq.id}`}
                      >
                        <div className="px-6 pb-5 pt-2 text-midnight/70 leading-relaxed border-t border-midnight/5">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
