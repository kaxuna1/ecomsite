import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
import { useI18n } from '../context/I18nContext';
import Toast from '../components/Toast';
import { validatePromoCode } from '../api/promoCodes';

function CartPage() {
  const { lang = 'en' } = useParams<{ lang: string }>();
  const { items, removeItem, updateQuantity, subtotal, discount, promoCode, applyPromoCode, removePromoCode } = useCart();
  const { t } = useI18n();
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
      setToastMessage(`${productName} removed from cart`);
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
          setToastMessage(`Promo code applied! You saved $${result.discount.toFixed(2)}`);
          setShowToast(true);
          setPromoError('');
        } else {
          setPromoError(result.message);
          removePromoCode();
        }
      } catch (error) {
        setPromoError('Invalid promo code');
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
    setToastMessage('Promo code removed');
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
    <div className="min-h-screen bg-champagne/20 py-8 md:py-12">
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
            className="group mb-4 inline-flex items-center gap-2 text-sm font-medium text-midnight/70 transition-colors hover:text-jade"
          >
            <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Continue Shopping
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl text-midnight md:text-4xl">{t('cart.title')}</h1>
              {items.length > 0 && (
                <p className="mt-2 text-sm text-midnight/60">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
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
              <ShoppingBagIcon className="h-16 w-16 text-jade" />
            </motion.div>
            <h2 className="mb-3 font-display text-2xl text-midnight">{t('cart.empty')}</h2>
            <p className="mb-8 text-sm text-midnight/60">
              Add some items to your cart to get started on your beauty journey
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
                          : 'border-transparent hover:border-jade/20 hover:shadow-xl'
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
                          Only {itemInventory} left in stock
                        </motion.div>
                      )}

                      <div className="flex gap-6">
                        {/* Product Image */}
                        <Link
                          to={`/${lang}/products/${product.id}`}
                          className="group/img relative flex-shrink-0 overflow-hidden rounded-2xl"
                        >
                          <motion.img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-32 w-32 object-cover transition-transform duration-500 group-hover/img:scale-110"
                            loading="lazy"
                            whileHover={{ scale: 1.05 }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-midnight/20 to-transparent opacity-0 transition-opacity group-hover/img:opacity-100" />
                        </Link>

                        {/* Product Info */}
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <Link to={`/${lang}/products/${product.id}`}>
                              <h2 className="font-display text-xl text-midnight transition-colors hover:text-jade">
                                {product.name}
                              </h2>
                            </Link>
                            <p className="mt-1 text-sm text-midnight/60 line-clamp-2">
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
                                <p className="text-xs text-midnight/50">
                                  SKU: <span className="font-mono">{variant.sku}</span>
                                </p>
                              </div>
                            )}

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {product.categories.slice(0, 2).map((category) => (
                                <span
                                  key={category}
                                  className="rounded-full bg-jade/10 px-2 py-0.5 text-xs font-medium text-jade capitalize"
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Price & Quantity Controls */}
                          <div className="mt-4 flex items-end justify-between">
                            <div>
                              <p className="text-xs text-midnight/50">Price</p>
                              <p className="text-2xl font-bold text-jade">${itemPrice.toFixed(2)}</p>
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 rounded-full border-2 border-champagne/60 bg-champagne/30 p-1">
                                <motion.button
                                  type="button"
                                  onClick={() => handleQuantityChange(product.id, quantity - 1, variant?.id)}
                                  disabled={quantity <= 1}
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-midnight transition-colors hover:bg-jade hover:text-white disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-midnight"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  -
                                </motion.button>
                                <span className="w-8 text-center text-lg font-semibold text-midnight">
                                  {quantity}
                                </span>
                                <motion.button
                                  type="button"
                                  onClick={() => handleQuantityChange(product.id, quantity + 1, variant?.id)}
                                  disabled={quantity >= itemInventory}
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-midnight transition-colors hover:bg-jade hover:text-white disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-midnight"
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
                                className="flex items-center gap-2 rounded-full border-2 border-champagne/60 bg-white px-4 py-2 text-sm font-medium text-midnight/70 transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-600"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <TrashIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">Remove</span>
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="mt-4 flex items-center justify-between border-t border-champagne/40 pt-4">
                        <span className="text-sm text-midnight/60">Item total:</span>
                        <span className="text-xl font-bold text-midnight">
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
                <div className="rounded-3xl border-2 border-jade/20 bg-white p-6 shadow-lg">
                  <h2 className="mb-6 font-display text-2xl text-midnight">Order Summary</h2>

                  <div className="space-y-4">
                    {/* Subtotal */}
                    <div className="flex justify-between text-sm">
                      <span className="text-midnight/60">Subtotal ({itemCount} items)</span>
                      <span className="font-semibold text-midnight">${subtotal.toFixed(2)}</span>
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
                            className="flex items-center gap-2 text-sm font-medium text-jade transition-colors hover:text-jade/80"
                            whileHover={{ x: 2 }}
                          >
                            <TagIcon className="h-4 w-4" />
                            Have a promo code?
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
                                placeholder="Enter promo code"
                                className="w-full rounded-full border-2 border-jade/30 bg-champagne/30 px-4 py-2 pr-10 text-sm font-medium uppercase text-midnight placeholder:normal-case placeholder:text-midnight/40 focus:border-jade focus:outline-none"
                              />
                              {isValidating && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-jade border-t-transparent" />
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
                              className="text-xs text-midnight/60 hover:text-midnight"
                            >
                              Cancel
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
                        className="rounded-lg bg-jade/10 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-5 w-5 text-jade" />
                            <div>
                              <p className="text-xs font-semibold text-jade">Promo Applied</p>
                              <p className="text-xs text-midnight/70">{promoCode.code}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemovePromo}
                            className="rounded-full p-1 text-midnight/60 transition-colors hover:bg-red-500/10 hover:text-red-600"
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
                        <span className="text-jade">Discount</span>
                        <span className="font-semibold text-jade">-${discount.toFixed(2)}</span>
                      </motion.div>
                    )}

                    {/* Shipping */}
                    <div className="flex justify-between text-sm">
                      <span className="text-midnight/60">Shipping</span>
                      <span className={`font-semibold ${shipping === 0 ? 'text-jade' : 'text-midnight'}`}>
                        {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                      </span>
                    </div>

                    {/* Free Shipping Progress */}
                    {shipping > 0 && (
                      <motion.div
                        className="rounded-lg bg-jade/10 p-3"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                      >
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-jade">
                          <TruckIcon className="h-4 w-4" />
                          Add ${(50 - discountedSubtotal).toFixed(2)} more for FREE shipping!
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-jade/20">
                          <motion.div
                            className="h-full bg-jade"
                            initial={{ width: 0 }}
                            animate={{ width: `${(discountedSubtotal / 50) * 100}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Tax */}
                    <div className="flex justify-between text-sm">
                      <span className="text-midnight/60">Estimated Tax</span>
                      <span className="font-semibold text-midnight">${tax.toFixed(2)}</span>
                    </div>

                    {/* Divider */}
                    <div className="border-t-2 border-dashed border-champagne/60" />

                    {/* Total */}
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-midnight">Total</span>
                      <span className="font-bold text-jade">${finalTotal.toFixed(2)}</span>
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
                        Proceed to Checkout
                      </motion.span>
                    </Link>
                  </motion.div>

                  {/* Trust Badges */}
                  <div className="mt-6 space-y-3 border-t border-champagne/40 pt-6">
                    <div className="flex items-center gap-3 text-sm text-midnight/70">
                      <TruckIcon className="h-5 w-5 text-jade" />
                      <span>Free shipping on orders over $50</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-midnight/70">
                      <TagIcon className="h-5 w-5 text-jade" />
                      <span>Best price guarantee</span>
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
