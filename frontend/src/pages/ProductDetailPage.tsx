import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { ShoppingBagIcon, CheckIcon, SparklesIcon, TruckIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { fetchProduct } from '../api/products';
import { useCart } from '../context/CartContext';
import { useI18n } from '../context/I18nContext';
import { SEOHead } from '../components/SEOHead';
import ImageZoom from '../components/ImageZoom';
import Toast from '../components/Toast';
import VariantSelector from '../components/VariantSelector';
import type { ProductVariant } from '../types/product';

function ProductDetailPage() {
  const { id } = useParams();
  const productId = Number(id);
  const { addItem } = useCart();
  const { t } = useI18n();
  const prefersReducedMotion = useReducedMotion();

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId),
    enabled: Number.isFinite(productId)
  });

  if (!productId || Number.isNaN(productId)) {
    return <p className="p-8 text-center">{t('productDetail.notFound')}</p>;
  }

  if (isLoading || !product) {
    return (
      <div className="p-8" role="status">
        {t('productDetail.loading')}
      </div>
    );
  }

  const handleAddToCart = async () => {
    setIsAdding(true);
    // Add product with variant and quantity
    addItem(product, quantity, selectedVariant || undefined);
    await new Promise(resolve => setTimeout(resolve, 600));
    setIsAdding(false);
    setShowToast(true);
  };

  const fadeIn = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
      };

  const staggerChildren = prefersReducedMotion
    ? {}
    : {
        animate: {
          transition: {
            staggerChildren: 0.1
          }
        }
      };

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
      };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <SEOHead product={product} />

      <Toast
        message={`Added ${quantity} ${quantity === 1 ? 'item' : 'items'} to cart!`}
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      <motion.div className="grid gap-8 lg:grid-cols-2 lg:gap-12" {...fadeIn}>
        {/* Image Section */}
        <motion.div {...fadeInUp}>
          <ImageZoom src={product.imageUrl} alt={product.name} />

          {/* Trust Badges */}
          <motion.div
            className="mt-6 grid grid-cols-2 gap-4"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            <motion.div
              className="flex items-center gap-3 rounded-2xl border border-champagne/60 bg-white p-4"
              variants={fadeInUp}
              whileHover={{ scale: 1.02, borderColor: 'rgb(var(--jade))' }}
            >
              <TruckIcon className="h-6 w-6 text-jade flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-midnight">Free Shipping</p>
                <p className="text-[10px] text-midnight/60">Orders over $50</p>
              </div>
            </motion.div>
            <motion.div
              className="flex items-center gap-3 rounded-2xl border border-champagne/60 bg-white p-4"
              variants={fadeInUp}
              whileHover={{ scale: 1.02, borderColor: 'rgb(var(--jade))' }}
            >
              <ShieldCheckIcon className="h-6 w-6 text-jade flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-midnight">Authentic</p>
                <p className="text-[10px] text-midnight/60">100% Genuine</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Product Info Section */}
        <motion.div className="space-y-6" {...fadeInUp}>
          {/* Stock Badge */}
          {product.inventory < 10 && product.inventory > 0 && (
            <motion.div
              className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-600"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
            >
              <SparklesIcon className="h-4 w-4" />
              Only {product.inventory} left in stock
            </motion.div>
          )}

          {product.inventory === 0 && (
            <motion.div
              className="inline-flex items-center rounded-full bg-gray-900/90 px-4 py-2 text-sm font-semibold text-white"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
            >
              Out of Stock
            </motion.div>
          )}

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {product.categories.map((category, index) => (
              <motion.span
                key={category}
                className="rounded-full bg-jade/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-jade"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                {category}
              </motion.span>
            ))}
          </div>

          {/* Title & Description */}
          <div>
            <motion.h1
              className="font-display text-3xl text-midnight lg:text-4xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {product.name}
            </motion.h1>
            <motion.p
              className="mt-3 text-base text-midnight/70 lg:text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {product.shortDescription}
            </motion.p>
          </div>

          {/* Price */}
          <motion.div
            className="flex items-baseline gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.4 }}
          >
            <span className="text-3xl font-bold text-jade">${product.price.toFixed(2)}</span>
            <span className="text-sm text-midnight/60">Per unit</span>
          </motion.div>

          {/* Description */}
          <motion.p
            className="text-sm leading-relaxed text-midnight/70 border-l-4 border-jade/20 pl-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            {product.description}
          </motion.p>

          {/* Highlights */}
          {product.highlights && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.4em] text-midnight/60">
                {t('productDetail.highlights')}
              </h2>
              <ul className="space-y-2">
                {product.highlights.map((highlight, index) => (
                  <motion.li
                    key={highlight}
                    className="flex items-start gap-2 text-sm text-midnight/70"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                  >
                    <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-jade" />
                    <span>{highlight}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Usage */}
          {product.usage && (
            <motion.div
              className="rounded-2xl bg-champagne/30 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.4em] text-midnight/60">
                {t('productDetail.usage')}
              </h2>
              <p className="text-sm leading-relaxed text-midnight/70">{product.usage}</p>
            </motion.div>
          )}

          {/* Variant Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="pt-6 border-t border-champagne/10"
          >
            <VariantSelector
              productId={product.id}
              onVariantChange={setSelectedVariant}
            />
          </motion.div>

          {/* Quantity Selector & Add to Cart */}
          <motion.div
            className="space-y-4 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-4">
              <label htmlFor="quantity" className="text-sm font-semibold text-midnight">
                Quantity:
              </label>
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-champagne/60 bg-white text-midnight transition-colors hover:border-jade hover:text-jade disabled:opacity-50"
                  disabled={quantity <= 1}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  -
                </motion.button>
                <span className="w-12 text-center text-lg font-semibold text-midnight">{quantity}</span>
                <motion.button
                  type="button"
                  onClick={() => setQuantity(Math.min(selectedVariant?.inventory ?? product.inventory, quantity + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-champagne/60 bg-white text-midnight transition-colors hover:border-jade hover:text-jade disabled:opacity-50"
                  disabled={quantity >= (selectedVariant?.inventory ?? product.inventory)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  +
                </motion.button>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding || (selectedVariant?.inventory ?? product.inventory) === 0}
              className="w-full rounded-full bg-jade px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={product.inventory > 0 ? { scale: 1.02, y: -2 } : {}}
              whileTap={product.inventory > 0 ? { scale: 0.98 } : {}}
            >
              <AnimatePresence mode="wait">
                {isAdding ? (
                  <motion.div
                    key="adding"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <motion.div
                      className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span>Adding to cart...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="add"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <ShoppingBagIcon className="h-5 w-5" />
                    <span>{product.inventory === 0 ? 'Out of Stock' : t('productDetail.addToCart')}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ProductDetailPage;
