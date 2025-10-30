import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { forwardRef } from 'react';
import {
  UserIcon,
  ShoppingBagIcon,
  HeartIcon,
  TrashIcon,
  ShoppingCartIcon,
  SparklesIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { getFavorites, removeFavorite } from '../../api/favorites';
import { getProductVariants } from '../../api/variants';
import { useCart } from '../../context/CartContext';
import type { Favorite } from '../../types/product';

interface FavoriteProductCardProps {
  favorite: Favorite;
  index: number;
  onRemove: (productId: number) => void;
  lang: string;
}

const FavoriteProductCard = forwardRef<HTMLElement, FavoriteProductCardProps>(
  ({ favorite, index, onRemove, lang }, ref) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const product = favorite.product;

  // Fetch variants for this product
  const { data: variants = [] } = useQuery({
    queryKey: ['product-variants', product.id],
    queryFn: () => getProductVariants(product.id),
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  // Calculate variant info
  const hasVariants = variants.length > 0;
  const variantCount = variants.length;
  const priceRange = hasVariants
    ? {
        min: Math.min(...variants.map(v => v.price ?? product.price)),
        max: Math.max(...variants.map(v => v.price ?? product.price))
      }
    : null;
  const showPriceRange = priceRange && priceRange.min !== priceRange.max;

  // Get display image - prefer featured image from media library
  const getDisplayImage = () => {
    if (product.images && product.images.length > 0) {
      const featuredImage = product.images.find(img => img.isFeatured);
      return featuredImage?.url || product.images[0].url;
    }
    return product.imageUrl;
  };

  const handleAddToCart = () => {
    if (hasVariants) {
      navigate(`/${lang}/products/${product.id}`);
    } else {
      addItem(product);
    }
  };

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-champagne/40 bg-white shadow-lg transition-shadow duration-300 hover:shadow-2xl"
    >
      {/* Remove Button */}
      <button
        onClick={() => onRemove(product.id)}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-rose-500 hover:text-white"
      >
        <TrashIcon className="h-5 w-5" />
      </button>

      {/* Product Image */}
      <Link to={`/${lang}/products/${product.id}`} className="relative block aspect-[4/5] overflow-hidden bg-champagne">
        <img
          src={getDisplayImage()}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Badges */}
        <div className="absolute left-4 top-4 flex flex-col gap-2">
          {product.isNew && (
            <span className="flex items-center gap-1.5 rounded-full bg-jade/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <SparklesIcon className="h-3.5 w-3.5" />
              {t('favorites.new')}
            </span>
          )}
          {product.salePrice && (
            <span className="rounded-full bg-rose-500/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              {t('favorites.sale')} {Math.round(((product.price - product.salePrice) / product.price) * 100)}{t('favorites.off')}
            </span>
          )}
          {hasVariants && (
            <span className="flex items-center gap-1.5 rounded-full bg-blush/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <Squares2X2Icon className="h-3.5 w-3.5" />
              {variantCount} {variantCount === 1 ? 'Option' : 'Options'}
            </span>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Link to={`/${lang}/products/${product.id}`}>
          <h2 className="font-display text-lg leading-tight text-midnight line-clamp-2 group-hover:text-jade transition-colors">
            {product.name}
          </h2>
        </Link>

        <p className="text-sm text-midnight/70 line-clamp-2">{product.shortDescription}</p>

        {/* Price */}
        <div className="flex items-center gap-2 mt-auto">
          {showPriceRange ? (
            <div className="text-xl font-bold text-jade">
              ${priceRange!.min.toFixed(2)} - ${priceRange!.max.toFixed(2)}
            </div>
          ) : product.salePrice ? (
            <>
              <div className="text-xl font-bold text-rose-600">
                ${product.salePrice.toFixed(2)}
              </div>
              <span className="text-sm text-midnight/40 line-through">
                ${product.price.toFixed(2)}
              </span>
            </>
          ) : (
            <div className="text-xl font-bold text-jade">
              ${product.price.toFixed(2)}
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <motion.button
          onClick={handleAddToCart}
          disabled={product.inventory === 0}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-jade px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-jade/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCartIcon className="h-5 w-5" />
          {product.inventory === 0
            ? t('favorites.outOfStock')
            : hasVariants
            ? (t('favorites.selectOptions') || 'Select Options')
            : t('favorites.addToCart')}
        </motion.button>
      </div>
    </motion.article>
  );
});

FavoriteProductCard.displayName = 'FavoriteProductCard';

export default function FavoritesPage() {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { data: favorites, isLoading, error } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });

  const tabs = [
    { name: t('account.profile'), href: `/${lang}/account/profile`, icon: UserIcon },
    { name: t('account.orders'), href: `/${lang}/account/orders`, icon: ShoppingBagIcon },
    { name: t('account.favorites'), href: `/${lang}/account/favorites`, icon: HeartIcon }
  ];

  const handleRemoveFavorite = async (productId: number) => {
    await removeFavoriteMutation.mutateAsync(productId);
  };

  return (
    <div className="py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-4xl text-midnight mb-2">{t('favorites.title')}</h1>
          <p className="text-midnight/60">{t('favorites.subtitle')}</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-champagne/40 mb-6"
        >
          <nav className="flex space-x-1 p-2">
            {tabs.map((tab) => {
              // Normalize paths for comparison (remove trailing slashes)
              const normalizedPathname = location.pathname.replace(/\/$/, '');
              const normalizedHref = tab.href.replace(/\/$/, '');
              const isActive = normalizedPathname === normalizedHref;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.name}
                  to={tab.href}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-jade text-white shadow-lg'
                      : 'text-midnight/60 hover:bg-champagne/30 hover:text-midnight'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </motion.div>

        {/* Favorites Grid */}
        {isLoading ? (
          <div className="bg-white rounded-3xl shadow-lg border border-champagne/40 p-12 text-center">
            <motion.div
              className="h-12 w-12 mx-auto border-4 border-jade/20 border-t-jade rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="mt-4 text-midnight/60">{t('favorites.loading')}</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl shadow-lg border border-champagne/40 p-12 text-center">
            <TrashIcon className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-midnight/60">{t('favorites.loadError')}</p>
          </div>
        ) : !favorites || favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-lg border border-champagne/40 p-12 text-center"
          >
            <HeartIcon className="h-16 w-16 mx-auto text-midnight/20 mb-4" />
            <h3 className="font-display text-2xl text-midnight mb-2">{t('favorites.noFavoritesTitle')}</h3>
            <p className="text-midnight/60 mb-6">
              {t('favorites.noFavoritesMessage')}
            </p>
            <Link
              to={`/${lang}/products`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-jade text-white rounded-xl font-semibold hover:bg-jade/90 transition-all"
            >
              <ShoppingBagIcon className="h-5 w-5" />
              {t('favorites.browseProducts')}
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Count */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 flex items-center gap-2 text-midnight/60"
            >
              <HeartSolidIcon className="h-5 w-5 text-rose-500" />
              <span className="font-semibold">
                {favorites.length} {favorites.length === 1 ? t('orders.item') : t('orders.items')} {t('favorites.itemInFavorites')}
              </span>
            </motion.div>

            {/* Products Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {favorites.map((favorite, index) => (
                  <FavoriteProductCard
                    key={favorite.id}
                    favorite={favorite}
                    index={index}
                    onRemove={handleRemoveFavorite}
                    lang={lang || 'en'}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
