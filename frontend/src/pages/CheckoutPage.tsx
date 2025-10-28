import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  TagIcon,
  TruckIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { createOrder } from '../api/orders';
import { useCart } from '../context/CartContext';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import AddressSelector from '../components/AddressSelector';
import type { UserAddress } from '../types/address';

interface CheckoutForm {
  name: string;
  email: string;
  phone?: string;
  address: string;
  notes?: string;
}

function CheckoutPage() {
  const { items, total, subtotal, discount, promoCode, clear } = useCart();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { isAuthenticated, user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CheckoutForm>();

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items.length, navigate]);

  // Auto-fill form when address is selected or set user email for logged-in users
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setValue('email', user.email);
    }

    if (selectedAddress) {
      const addressString = [
        selectedAddress.addressLine1,
        selectedAddress.addressLine2,
        `${selectedAddress.city}, ${selectedAddress.state || ''} ${selectedAddress.postalCode}`,
        selectedAddress.country
      ].filter(Boolean).join(', ');

      setValue('name', selectedAddress.name);
      setValue('address', addressString);
      if (selectedAddress.phone) {
        setValue('phone', selectedAddress.phone);
      }
    }
  }, [selectedAddress, setValue, user, isAuthenticated]);

  const handleAddressSelect = (address: UserAddress | null) => {
    setSelectedAddress(address);
  };

  const shipping = subtotal - discount >= 50 ? 0 : 9.99;
  const tax = (subtotal - discount) * 0.1;
  const finalTotal = subtotal - discount + shipping + tax;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      clear();
      navigate('/order-success', { state: { order }, replace: true });
    }
  });

  const onSubmit = (data: CheckoutForm) => {
    if (!items.length) return;
    mutation.mutate({
      customer: data,
      items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      total: finalTotal,
      promoCode: promoCode?.code,
      addressId: selectedAddress?.id
    });
  };

  const fadeIn = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
      };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <Helmet>
        <title>{t('checkout.title')} — {t('common.brand')}</title>
      </Helmet>

      {/* Back to Cart Link */}
      <Link
        to="/cart"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-jade transition-colors hover:text-jade/80"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Cart
      </Link>

      <motion.div {...fadeIn} className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl text-midnight flex items-center gap-3">
          <ShoppingBagIcon className="h-8 w-8 text-jade" />
          {t('checkout.title')}
        </h1>
        <p className="mt-3 text-sm text-midnight/70">{t('checkout.intro')}</p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* User Status */}
            {isAuthenticated && user && (
              <motion.div
                className="flex items-center gap-3 rounded-2xl border-2 border-jade/20 bg-jade/10 p-4"
                {...fadeIn}
              >
                <UserIcon className="h-5 w-5 text-jade" />
                <div>
                  <p className="text-sm font-semibold text-midnight">Logged in as {user.name}</p>
                  <p className="text-xs text-midnight/70">{user.email}</p>
                </div>
              </motion.div>
            )}

            {/* Saved Addresses (for logged-in users) */}
            {isAuthenticated && (
              <motion.div className="rounded-3xl border-2 border-jade/20 bg-white p-6 shadow-lg" {...fadeIn}>
                <AddressSelector
                  onSelect={handleAddressSelect}
                  selectedAddressId={selectedAddress?.id || null}
                />
              </motion.div>
            )}

            {/* Contact & Shipping Information */}
            <motion.fieldset className="space-y-4 rounded-3xl border-2 border-jade/20 bg-white p-6 shadow-lg" {...fadeIn}>
              <legend className="text-sm font-semibold uppercase tracking-[0.4em] text-midnight/60 px-2">
                <div className="flex items-center gap-2">
                  <TruckIcon className="h-4 w-4" />
                  {t('checkout.contactLegend')} & Delivery
                </div>
              </legend>
              <div>
                <label className="block text-sm font-semibold text-midnight">
                  {t('checkout.nameLabel')} *
                  <input
                    type="text"
                    className={`mt-2 w-full rounded-full border-2 ${
                      errors.name ? 'border-red-500 bg-red-50' : 'border-jade/30 bg-champagne/50'
                    } px-4 py-3 text-midnight transition-colors focus:border-jade focus:bg-white focus:outline-none`}
                    placeholder="Enter your full name"
                    {...register('name', { required: t('checkout.nameError') })}
                  />
                </label>
                {errors.name && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 flex items-center gap-1 text-xs text-red-600"
                  >
                    <ExclamationCircleIcon className="h-4 w-4" />
                    {errors.name.message}
                  </motion.p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-midnight">
                  {t('checkout.emailLabel')} *
                  <input
                    type="email"
                    className={`mt-2 w-full rounded-full border-2 ${
                      errors.email ? 'border-red-500 bg-red-50' : 'border-jade/30 bg-champagne/50'
                    } px-4 py-3 text-midnight transition-colors focus:border-jade focus:bg-white focus:outline-none`}
                    placeholder="your@email.com"
                    {...register('email', {
                      required: t('checkout.emailError'),
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                </label>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 flex items-center gap-1 text-xs text-red-600"
                  >
                    <ExclamationCircleIcon className="h-4 w-4" />
                    {errors.email.message}
                  </motion.p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-midnight">
                  {t('checkout.phoneLabel')} (Optional)
                  <input
                    type="tel"
                    className="mt-2 w-full rounded-full border-2 border-jade/30 bg-champagne/50 px-4 py-3 text-midnight transition-colors focus:border-jade focus:bg-white focus:outline-none"
                    placeholder="+1 (555) 000-0000"
                    {...register('phone')}
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-midnight">
                  {t('checkout.addressLabel')} *
                  <textarea
                    rows={3}
                    className={`mt-2 w-full rounded-3xl border-2 ${
                      errors.address ? 'border-red-500 bg-red-50' : 'border-jade/30 bg-champagne/50'
                    } px-4 py-3 text-midnight transition-colors focus:border-jade focus:bg-white focus:outline-none resize-none`}
                    placeholder="Street address, city, state, postal code"
                    {...register('address', { required: t('checkout.addressError') })}
                  />
                </label>
                {errors.address && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 flex items-center gap-1 text-xs text-red-600"
                  >
                    <ExclamationCircleIcon className="h-4 w-4" />
                    {errors.address.message}
                  </motion.p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-midnight">
                  {t('checkout.notesLabel')} (Optional)
                  <textarea
                    rows={3}
                    className="mt-2 w-full rounded-3xl border-2 border-jade/30 bg-champagne/50 px-4 py-3 text-midnight transition-colors focus:border-jade focus:bg-white focus:outline-none resize-none"
                    placeholder="Delivery instructions, gift message, etc."
                    {...register('notes')}
                  />
                </label>
              </div>
            </motion.fieldset>

            {/* Place Order Button */}
            <motion.button
              type="submit"
              disabled={mutation.isPending || isSubmitting}
              className="w-full rounded-full bg-jade px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-jade/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              whileHover={{ scale: mutation.isPending || isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {mutation.isPending || isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('checkout.submitting')}
                </span>
              ) : (
                t('checkout.placeOrder')
              )}
            </motion.button>

            {/* Error/Success Messages */}
            {mutation.isError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-red-50 border-2 border-red-200 px-4 py-3 text-sm text-red-800"
              >
                <div className="flex items-center gap-2">
                  <ExclamationCircleIcon className="h-5 w-5" />
                  {t('checkout.error')}
                </div>
              </motion.div>
            )}
            {mutation.isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-jade/10 border-2 border-jade px-4 py-3 text-sm text-jade"
              >
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  {t('checkout.success')}
                </div>
              </motion.div>
            )}
          </form>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Order Items */}
            <motion.div
              className="rounded-3xl border-2 border-jade/20 bg-white p-6 shadow-lg"
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl text-midnight">
                <ShoppingBagIcon className="h-5 w-5" />
                Order Items ({itemCount})
              </h2>
              <div className="space-y-4">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-3 border-b border-champagne/30 pb-4 last:border-0 last:pb-0">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-midnight line-clamp-1">{product.name}</h3>
                      <p className="mt-1 text-xs text-midnight/60">Qty: {quantity}</p>
                      <p className="mt-1 text-sm font-bold text-jade">${(product.price * quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Price Summary */}
            <motion.section
              className="space-y-4 rounded-3xl border-2 border-jade/20 bg-midnight px-6 py-6 text-champagne shadow-lg"
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h2 className="text-lg font-semibold">{t('checkout.orderTotal')}</h2>

              <div className="space-y-3 border-t border-champagne/20 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-champagne/70">Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>

                {promoCode && discount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between rounded-lg bg-jade/20 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <TagIcon className="h-4 w-4 text-jade" />
                        <div>
                          <p className="font-medium text-jade">Promo Applied</p>
                          <p className="text-xs text-champagne/70">{promoCode.code}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-jade">-${discount.toFixed(2)}</span>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <TruckIcon className="h-4 w-4" />
                    <span className="text-champagne/70">Shipping</span>
                  </div>
                  <span className={`font-semibold ${shipping === 0 ? 'text-jade' : ''}`}>
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>

                {shipping > 0 && (
                  <div className="text-xs text-champagne/60 italic">
                    Add ${(50 - (subtotal - discount)).toFixed(2)} more for free shipping
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-champagne/70">Tax (10%)</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between border-t border-champagne/40 pt-3 text-xl font-bold">
                  <span>Total</span>
                  <span className="text-jade">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="rounded-lg bg-champagne/10 px-3 py-2 text-xs text-champagne/80">
                <p>{t('checkout.manualProcessing')}</p>
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
