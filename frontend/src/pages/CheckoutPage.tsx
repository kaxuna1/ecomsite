import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { createOrder } from '../api/orders';
import { useCart } from '../context/CartContext';
import { useI18n } from '../context/I18nContext';

interface CheckoutForm {
  name: string;
  email: string;
  phone?: string;
  address: string;
  notes?: string;
}

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const { t } = useI18n();
  const prefersReducedMotion = useReducedMotion();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CheckoutForm>();

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      clear();
      navigate('/');
    }
  });

  const onSubmit = (data: CheckoutForm) => {
    if (!items.length) return;
    mutation.mutate({
      customer: data,
      items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      total
    });
  };

  const fadeIn = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
      };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Helmet>
        <title>{t('checkout.title')} — {t('common.brand')}</title>
      </Helmet>
      <motion.div {...fadeIn}>
        <h1 className="font-display text-3xl text-midnight">{t('checkout.title')}</h1>
        <p className="mt-4 text-sm text-midnight/70">{t('checkout.intro')}</p>
      </motion.div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-6">
        <motion.fieldset className="space-y-4 rounded-3xl bg-white p-6 shadow-md" {...fadeIn}>
          <legend className="text-sm font-semibold uppercase tracking-[0.4em] text-midnight/60">
            {t('checkout.contactLegend')}
          </legend>
          <div>
            <label className="block text-sm font-semibold text-midnight">
              {t('checkout.nameLabel')}
              <input
                type="text"
                className="mt-2 w-full rounded-full border border-midnight/10 bg-champagne px-4 py-3"
                {...register('name', { required: t('checkout.nameError') })}
              />
            </label>
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-midnight">
              {t('checkout.emailLabel')}
              <input
                type="email"
                className="mt-2 w-full rounded-full border border-midnight/10 bg-champagne px-4 py-3"
                {...register('email', { required: t('checkout.emailError') })}
              />
            </label>
            {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-midnight">
              {t('checkout.phoneLabel')}
              <input
                type="tel"
                className="mt-2 w-full rounded-full border border-midnight/10 bg-champagne px-4 py-3"
                {...register('phone')}
              />
            </label>
          </div>
        </motion.fieldset>
        <motion.fieldset className="space-y-4 rounded-3xl bg-white p-6 shadow-md" {...fadeIn}>
          <legend className="text-sm font-semibold uppercase tracking-[0.4em] text-midnight/60">{t('checkout.shippingLegend')}</legend>
          <div>
            <label className="block text-sm font-semibold text-midnight">
              {t('checkout.addressLabel')}
              <textarea
                rows={3}
                className="mt-2 w-full rounded-3xl border border-midnight/10 bg-champagne px-4 py-3"
                {...register('address', { required: t('checkout.addressError') })}
              />
            </label>
            {errors.address && <p className="mt-1 text-xs text-rose-500">{errors.address.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-midnight">
              {t('checkout.notesLabel')}
              <textarea
                rows={3}
                className="mt-2 w-full rounded-3xl border border-midnight/10 bg-champagne px-4 py-3"
                {...register('notes')}
              />
            </label>
          </div>
        </motion.fieldset>
        <motion.section
          className="space-y-4 rounded-3xl bg-midnight px-6 py-8 text-champagne"
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">{t('checkout.orderTotal')}</p>
            <p className="text-lg font-semibold">${total.toFixed(2)}</p>
          </div>
          <p className="text-sm text-champagne/70">{t('checkout.manualProcessing')}</p>
          <button type="submit" className="btn-primary bg-white text-midnight hover:bg-blush" disabled={mutation.isPending}>
            {mutation.isPending ? t('checkout.submitting') : t('checkout.placeOrder')}
          </button>
          {mutation.isError && (
            <p className="text-xs text-rose-200">{t('checkout.error')}</p>
          )}
          {mutation.isSuccess && (
            <p className="text-xs text-champagne/80">{t('checkout.success')}</p>
          )}
        </motion.section>
      </form>
    </div>
  );
}

export default CheckoutPage;
