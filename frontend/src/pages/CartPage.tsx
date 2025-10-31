import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  TrashIcon,
  ShoppingBagIcon,
  TruckIcon,
  TagIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import Toast from '../components/Toast';
import { validatePromoCode } from '../api/promoCodes';

function CartPage() {
  const { lang = 'en' } = useParams<{ lang: string }>();
  const { items, removeItem, updateQuantity, subtotal, discount, promoCode, applyPromoCode, removePromoCode } = useCart();
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const discountedSubtotal = Math.max(subtotal - discount, 0);
  const shipping = discountedSubtotal >= 50 ? 0 : 9.99;
  const tax = discountedSubtotal * 0.1; // 10% tax
  const finalTotal = discountedSubtotal + shipping + tax;

  const handleRemove = (productId: number, productName: string, variantId?: number) => {
    setRemovingId(productId);
    setTimeout(() => {
      removeItem(productId, variantId);
      setRemovingId(null);
      setToastMessage(t('cart.removedFromCart', { productName }));
      setShowToast(true);
    }, 300);
  };

  const handleQuantityChange = (productId: number, newQuantity: number, variantId?: number) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity, variantId);
  };

  const handlePromoCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase();
    setPromoInput(code);
    setPromoError('');

    if (code.length >= 3) {
      setIsValidating(true);
      try {
        const result = await validatePromoCode(code, subtotal);
        if (result.valid && result.promoCode && result.discount !== undefined) {
          applyPromoCode(result.promoCode, result.discount);
          setToastMessage(t('cart.promoCodeAppliedSuccess', { discount: result.discount.toFixed(2) }));
          setShowToast(true);
          setPromoError('');
        } else {
          setPromoError(result.message);
          removePromoCode();
        }
      } catch (error) {
        setPromoError(t('cart.invalidPromoCode'));
        removePromoCode();
      } finally {
        setIsValidating(false);
      }
    } else if (promoCode) {
      removePromoCode();
    }
  };

  const handleRemovePromo = () => {
    removePromoCode();
    setPromoInput('');
    setPromoError('');
    setToastMessage(t('cart.promoCodeRemoved'));
    setShowToast(true);
  };

  const listAnimation = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
        transition: { duration: 0.4 }
      };

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
      };

  return (
    <div className="min-h-screen bg-bg-secondary/20 py-8 md:py-12">
      <Helmet>
        <title>{t('cart.title')} — {t('common.brand')}</title>
      </Helmet>

      <Toast
        message={toastMessage}
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <motion.div className="mb-8" {...fadeInUp}>
          <Link
            to={`/${lang}/products`}
            className="group mb-4 inline-flex items-center gap-2 text-sm font-medium text-text-primary/70 transition-colors hover:text-primary"
          >
            <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {t('cart.continueShopping')}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl text-text-primary md:text-4xl">{t('cart.title')}</h1>
              {items.length > 0 && (
                <p className="mt-2 text-sm text-text-primary/60">
                  {itemCount} {itemCount === 1 ? t('cart.item') : t('cart.items')} {t('cart.itemsInCart')}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <motion.div
            className="mx-auto max-w-md text-center"
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-lg"
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0]
                    }
              }
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <ShoppingBagIcon className="h-16 w-16 text-primary" />
            </motion.div>
            <h2 className="mb-3 font-display text-2xl text-text-primary">{t('cart.empty')}</h2>
            <p className="mb-8 text-sm text-text-primary/60">
              {t('cart.emptyMessage')}
            </p>
            <Link to={`/${lang}/products`} className="btn-primary inline-block">
              <span className="flex items-center gap-2">
                <ShoppingBagIcon className="h-5 w-5" />
                {t('cart.browse')}
              </span>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <motion.ul className="space-y-4" aria-label={t('cart.title')} {...fadeInUp}>
                <AnimatePresence mode="popLayout">
                  {items.map(({ product, quantity, variant }, index) => {
                    const itemPrice = variant?.price ?? product.price;
                    const itemInventory = variant?.inventory ?? product.inventory;
                    const uniqueKey = variant ? `${product.id}-${variant.id}` : `${product.id}`;

                    return (
                    <motion.li
                      key={uniqueKey}
                      layout
                      className={`group relative overflow-hidden rounded-3xl border-2 bg-white p-6 shadow-md transition-all ${
                        removingId === product.id
                          ? 'border-red-500 shadow-red-100'
                          : 'border-transparent hover:border-primary/20 hover:shadow-xl'
                      }`}
                      {...listAnimation}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Stock Warning */}
                      {itemInventory < quantity && (
                        <motion.div
                          className="mb-4 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-700"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                        >
                          <ExclamationTriangleIcon className="h-5 w-5" />
                          {t('cart.onlyLeftInStock', { count: itemInventory })}
                        </motion.div>
                      )}

                      <div className="flex gap-6">
                        {/* Product Image */}
                        <Link
                          to={`/${lang}/products/${product.id}`}
                          className="group/img relative flex-shrink-0 overflow-hidden rounded-2xl"
                        >
                          <motion.img
                            src={(() => {
                              // Get display image - prefer featured image from media library
                              if (product.images && product.images.length > 0) {
                                const featuredImage = product.images.find(img => img.isFeatured);
                                return featuredImage?.url || product.images[0].url;
                              }
                              return product.imageUrl;
                            })()}
                            alt={product.name}
                            className="h-32 w-32 object-cover transition-transform duration-500 group-hover/img:scale-110"
                            loading="lazy"
                            whileHover={{ scale: 1.05 }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-text-primary/20 to-transparent opacity-0 transition-opacity group-hover/img:opacity-100" />
                        </Link>

                        {/* Product Info */}
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <Link to={`/${lang}/products/${product.id}`}>
                              <h2 className="font-display text-xl text-text-primary transition-colors hover:text-primary">
                                {product.name}
                              </h2>
                            </Link>
                            <p className="mt-1 text-sm text-text-primary/60 line-clamp-2">
                              {product.shortDescription}
                            </p>

                            {/* Variant Information */}
                            {variant && (
                              <div className="mt-2 space-y-1">
                                {variant.options && variant.options.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-2">
                                    {variant.options.map((opt) => (
                                      <span
                                        key={`${opt.optionId}-${opt.valueId}`}
                                        className="inline-flex items-center gap-1 rounded-full bg-blush/10 px-2.5 py-0.5 text-xs font-medium text-blush"
                                      >
                                        <span className="font-semibold">{opt.optionName}:</span> {opt.value}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <p className="text-xs text-text-primary/50">
                                  {t('cart.sku')}: <span className="font-mono">{variant.sku}</span>
                                </p>
                              </div>
                            )}

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {product.categories.slice(0, 2).map((category) => (
                                <span
                                  key={category}
                                  className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize"
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Price & Quantity Controls */}
                          <div className="mt-4 flex items-end justify-between">
                            <div>
                              <p className="text-xs text-text-primary/50">{t('cart.price')}</p>
                              <p className="text-2xl font-bold text-primary">${itemPrice.toFixed(2)}</p>
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 rounded-full border-2 border-bg-secondary/60 bg-bg-secondary/30 p-1">
                                <motion.button
                                  type="button"
                                  onClick={() => handleQuantityChange(product.id, quantity - 1, variant?.id)}
                                  disabled={quantity <= 1}
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-text-primary transition-colors hover:bg-primary hover:text-text-inverse disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-text-primary"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  -
                                </motion.button>
                                <span className="w-8 text-center text-lg font-semibold text-text-primary">
                                  {quantity}
                                </span>
                                <motion.button
                                  type="button"
                                  onClick={() => handleQuantityChange(product.id, quantity + 1, variant?.id)}
                                  disabled={quantity >= itemInventory}
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-text-primary transition-colors hover:bg-primary hover:text-text-inverse disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-text-primary"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  +
                                </motion.button>
                              </div>

                              {/* Remove Button */}
                              <motion.button
                                type="button"
                                onClick={() => handleRemove(product.id, product.name, variant?.id)}
                                className="flex items-center gap-2 rounded-full border-2 border-bg-secondary/60 bg-white px-4 py-2 text-sm font-medium text-text-primary/70 transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-600"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <TrashIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('cart.remove')}</span>
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="mt-4 flex items-center justify-between border-t border-bg-secondary/40 pt-4">
                        <span className="text-sm text-text-primary/60">{t('cart.itemTotal')}:</span>
                        <span className="text-xl font-bold text-text-primary">
                          ${(itemPrice * quantity).toFixed(2)}
                        </span>
                      </div>
                    </motion.li>
                    );
                  })}
                </AnimatePresence>
              </motion.ul>
            </div>

            {/* Order Summary */}
            <motion.div className="lg:col-span-1" {...fadeInUp}>
              <div className="sticky top-24 space-y-6">
                {/* Summary Card */}
                <div className="rounded-3xl border-2 border-primary/20 bg-white p-6 shadow-lg">
                  <h2 className="mb-6 font-display text-2xl text-text-primary">{t('cart.orderSummary')}</h2>

                  <div className="space-y-4">
                    {/* Subtotal */}
                    <div className="flex justify-between text-sm">
                      <span className="text-text-primary/60">{t('cart.subtotal')} ({itemCount} {itemCount === 1 ? t('cart.item') : t('cart.items')})</span>
                      <span className="font-semibold text-text-primary">${subtotal.toFixed(2)}</span>
                    </div>

                    {/* Promo Code Section */}
                    {!promoCode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {!showPromoInput ? (
                          <motion.button
                            type="button"
                            onClick={() => setShowPromoInput(true)}
                            className="flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                            whileHover={{ x: 2 }}
                          >
                            <TagIcon className="h-4 w-4" />
                            {t('cart.havePromoCode')}
                          </motion.button>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                          >
                            <div className="relative">
                              <input
                                type="text"
                                value={promoInput}
                                onChange={handlePromoCodeChange}
                                placeholder={t('cart.enterPromoCode')}
                                className="w-full rounded-full border-2 border-primary/30 bg-bg-secondary/30 px-4 py-2 pr-10 text-sm font-medium uppercase text-text-primary placeholder:normal-case placeholder:text-text-primary/40 focus:border-primary focus:outline-none"
                              />
                              {isValidating && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                </div>
                              )}
                            </div>
                            {promoError && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-red-500"
                              >
                                {promoError}
                              </motion.p>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setShowPromoInput(false);
                                setPromoInput('');
                                setPromoError('');
                              }}
                              className="text-xs text-text-primary/60 hover:text-text-primary"
                            >
                              {t('cart.cancel')}
                            </button>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Applied Promo Code */}
                    {promoCode && discount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-lg bg-primary/10 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs font-semibold text-primary">{t('cart.promoApplied')}</p>
                              <p className="text-xs text-text-primary/70">{promoCode.code}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemovePromo}
                            className="rounded-full p-1 text-text-primary/60 transition-colors hover:bg-red-500/10 hover:text-red-600"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Discount */}
                    {discount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-primary">{t('cart.discount')}</span>
                        <span className="font-semibold text-primary">-${discount.toFixed(2)}</span>
                      </motion.div>
                    )}

                    {/* Shipping */}
                    <div className="flex justify-between text-sm">
                      <span className="text-text-primary/60">{t('cart.shipping')}</span>
                      <span className={`font-semibold ${shipping === 0 ? 'text-primary' : 'text-text-primary'}`}>
                        {shipping === 0 ? t('cart.free') : `$${shipping.toFixed(2)}`}
                      </span>
                    </div>

                    {/* Free Shipping Progress */}
                    {shipping > 0 && (
                      <motion.div
                        className="rounded-lg bg-primary/10 p-3"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                      >
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
                          <TruckIcon className="h-4 w-4" />
                          {t('cart.freeShippingProgress', { amount: (50 - discountedSubtotal).toFixed(2) })}
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-primary/20">
                          <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${(discountedSubtotal / 50) * 100}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Tax */}
                    <div className="flex justify-between text-sm">
                      <span className="text-text-primary/60">{t('cart.estimatedTax')}</span>
                      <span className="font-semibold text-text-primary">${tax.toFixed(2)}</span>
                    </div>

                    {/* Divider */}
                    <div className="border-t-2 border-dashed border-bg-secondary/60" />

                    {/* Total */}
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-text-primary">{t('cart.total')}</span>
                      <span className="font-bold text-primary">${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <motion.div className="mt-6">
                    <Link
                      to={`/${lang}/checkout`}
                      className="btn-primary block w-full text-center"
                    >
                      <motion.span
                        className="flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                        {t('cart.proceedToCheckout')}
                      </motion.span>
                    </Link>
                  </motion.div>

                  {/* Trust Badges */}
                  <div className="mt-6 space-y-3 border-t border-bg-secondary/40 pt-6">
                    <div className="flex items-center gap-3 text-sm text-text-primary/70">
                      <TruckIcon className="h-5 w-5 text-primary" />
                      <span>{t('cart.freeShippingOver50')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-text-primary/70">
                      <TagIcon className="h-5 w-5 text-primary" />
                      <span>{t('cart.bestPriceGuarantee')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;
