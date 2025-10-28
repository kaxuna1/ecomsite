import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingBagIcon, CheckIcon, SparklesIcon, FireIcon, TagIcon, HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { Product } from '../types/product';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { addFavorite, removeFavorite, getFavorites } from '../api/favorites';

interface ProductCardProps {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prefersReducedMotion = useReducedMotion();

  // Fetch favorites to check if this product is favorited
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: isAuthenticated
  });

  const isFavorited = favorites?.some(fav => fav.productId === product.id) || false;

  // Add to favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });

  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    try {
      if (isFavorited) {
        await removeFavoriteMutation.mutateAsync(product.id);
      } else {
        await addFavoriteMutation.mutateAsync(product.id);
      }
    } catch (error) {
      console.error('Failed to update favorite:', error);
    }
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);
    addItem(product);

    // Simulate adding with animation
    await new Promise(resolve => setTimeout(resolve, 600));
    setIsAdding(false);
    setShowSuccess(true);

    // Hide success after 2s
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const cardVariants = prefersReducedMotion
    ? {}
    : {
        hidden: { opacity: 0, y: 50 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            delay: index * 0.1,
            ease: [0.25, 0.46, 0.45, 0.94]
          }
        }
      };

  const imageVariants = prefersReducedMotion
    ? {}
    : {
        hover: {
          scale: 1.08,
          transition: { duration: 0.6, ease: 'easeOut' }
        }
      };

  const overlayVariants = prefersReducedMotion
    ? {}
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.3 }
        },
        exit: {
          opacity: 0,
          transition: { duration: 0.2 }
        }
      };

  const buttonVariants = prefersReducedMotion
    ? {}
    : {
        rest: { scale: 1 },
        hover: { scale: 1.05 },
        tap: { scale: 0.95 }
      };

  return (
    <motion.article
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-champagne/40 bg-white shadow-lg transition-shadow duration-300 hover:shadow-2xl"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={prefersReducedMotion ? undefined : { y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Favorite Button */}
      <motion.button
        onClick={handleFavoriteClick}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
          {isFavorited ? (
            <motion.div
              key="favorited"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <HeartSolidIcon className="h-5 w-5 text-rose-500" />
            </motion.div>
          ) : (
            <motion.div
              key="not-favorited"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <HeartOutlineIcon className="h-5 w-5 text-midnight/60" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Top Badges Container */}
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
        {/* New Badge */}
        {product.isNew && (
          <motion.div
            className="flex items-center gap-1.5 rounded-full bg-jade/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2 + index * 0.1, type: 'spring' }}
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            NEW
          </motion.div>
        )}

        {/* Best Seller Badge */}
        {product.isFeatured && (
          <motion.div
            className="flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.25 + index * 0.1, type: 'spring' }}
          >
            <FireIcon className="h-3.5 w-3.5" />
            BEST SELLER
          </motion.div>
        )}

        {/* Sale Badge */}
        {product.salePrice && (
          <motion.div
            className="flex items-center gap-1.5 rounded-full bg-rose-500/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
          >
            <TagIcon className="h-3.5 w-3.5" />
            SALE {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
          </motion.div>
        )}

        {/* Stock Badge */}
        {product.inventory < 10 && product.inventory > 0 && (
          <motion.div
            className="flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.35 + index * 0.1, type: 'spring' }}
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            Only {product.inventory} left
          </motion.div>
        )}

        {/* Out of Stock Badge */}
        {product.inventory === 0 && (
          <motion.div
            className="rounded-full bg-gray-900/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
          >
            Out of Stock
          </motion.div>
        )}
      </div>

      <Link to={`/products/${product.id}`} className="relative block aspect-[4/5] overflow-hidden bg-champagne">
        <motion.img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover"
          loading="lazy"
          variants={imageVariants}
          whileHover="hover"
        />

        {/* Hover Overlay */}
        <AnimatePresence>
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-midnight/60 via-midnight/20 to-transparent opacity-0 group-hover:opacity-100"
            variants={overlayVariants}
            initial="hidden"
            whileHover="visible"
            exit="exit"
          />
        </AnimatePresence>

        {/* Quick Add Button */}
        <motion.button
          type="button"
          onClick={handleQuickAdd}
          disabled={isAdding || showSuccess || product.inventory === 0}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-midnight shadow-xl opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          variants={buttonVariants}
          initial="rest"
          whileHover={product.inventory > 0 ? "hover" : "rest"}
          whileTap={product.inventory > 0 ? "tap" : "rest"}
        >
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className="flex items-center gap-2"
              >
                <CheckIcon className="h-5 w-5 text-green-600" />
                <span>Added!</span>
              </motion.div>
            ) : isAdding ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  className="h-5 w-5 rounded-full border-2 border-midnight/20 border-t-midnight"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <span>Adding...</span>
              </motion.div>
            ) : (
              <motion.div
                key="add"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <ShoppingBagIcon className="h-5 w-5" />
                <span>Quick Add</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </Link>

      {/* Product Info */}
      <div className="flex flex-1 flex-col gap-2 p-6">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display text-lg leading-tight text-midnight line-clamp-2 group-hover:text-jade transition-colors">
            {product.name}
          </h2>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {product.salePrice ? (
              <>
                <motion.div
                  className="rounded-full bg-rose-500/10 px-3 py-1 text-sm font-bold text-rose-600"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  ${product.salePrice.toFixed(2)}
                </motion.div>
                <span className="text-xs text-midnight/40 line-through">
                  ${product.price.toFixed(2)}
                </span>
              </>
            ) : (
              <motion.div
                className="rounded-full bg-jade/10 px-3 py-1 text-sm font-bold text-jade"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                ${product.price.toFixed(2)}
              </motion.div>
            )}
          </div>
        </div>

        <p className="text-sm text-midnight/70 line-clamp-2">{product.shortDescription}</p>

        {/* Categories */}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {product.categories.slice(0, 3).map((category) => (
            <span
              key={category}
              className="rounded-full bg-champagne/50 px-2.5 py-0.5 text-xs font-medium text-midnight/60 capitalize"
            >
              {category}
            </span>
          ))}
        </div>
      </div>

      {/* Shine Effect on Hover */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100"
        initial={false}
        animate={{
          background: [
            'linear-gradient(90deg, transparent 0%, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%, transparent 100%)',
            'linear-gradient(90deg, transparent 0%, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%, transparent 100%)'
          ],
          backgroundPosition: ['-200%', '200%']
        }}
        transition={{
          duration: 1.5,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatDelay: 1
        }}
      />
    </motion.article>
  );
}
