import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../api/orders';
import { useCart } from '../context/CartContext';

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Helmet>
        <title>Luxia Checkout</title>
      </Helmet>
      <h1 className="font-display text-3xl">Secure Checkout</h1>
      <p className="mt-4 text-sm text-midnight/70">
        After confirming your ritual, you will receive an email and SMS with manual payment instructions. Orders ship once payment is verified by our concierge team.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-6">
        <fieldset className="space-y-4 rounded-3xl bg-white p-6 shadow-md">
          <legend className="text-sm font-semibold uppercase tracking-[0.4em] text-midnight/60">
            Contact Information
          </legend>
          <div>
            <label className="block text-sm font-semibold text-midnight">
              Full name
              <input
                type="text"
                className="mt-2 w-full rounded-full border border-midnight/10 bg-champagne px-4 py-3"
                {...register('name', { required: 'Please enter your name' })}
              />
            </label>
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-midnight">
              Email address
              <input
                type="email"
                className="mt-2 w-full rounded-full border border-midnight/10 bg-champagne px-4 py-3"
                {...register('email', { required: 'Email is required' })}
              />
            </label>
            {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-midnight">
              Phone (optional for SMS updates)
              <input
                type="tel"
                className="mt-2 w-full rounded-full border border-midnight/10 bg-champagne px-4 py-3"
                {...register('phone')}
              />
            </label>
          </div>
        </fieldset>
        <fieldset className="space-y-4 rounded-3xl bg-white p-6 shadow-md">
          <legend className="text-sm font-semibold uppercase tracking-[0.4em] text-midnight/60">Shipping</legend>
          <div>
            <label className="block text-sm font-semibold text-midnight">
              Address
              <textarea
                rows={3}
                className="mt-2 w-full rounded-3xl border border-midnight/10 bg-champagne px-4 py-3"
                {...register('address', { required: 'Address is required' })}
              />
            </label>
            {errors.address && <p className="mt-1 text-xs text-rose-500">{errors.address.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-midnight">
              Order notes (optional)
              <textarea
                rows={3}
                className="mt-2 w-full rounded-3xl border border-midnight/10 bg-champagne px-4 py-3"
                {...register('notes')}
              />
            </label>
          </div>
        </fieldset>
        <section className="space-y-4 rounded-3xl bg-midnight px-6 py-8 text-champagne">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">Order Total</p>
            <p className="text-lg font-semibold">${total.toFixed(2)}</p>
          </div>
          <p className="text-sm text-champagne/70">
            Payment is processed manually for bespoke verification. Expect a confirmation within 24 hours.
          </p>
          <button type="submit" className="btn-primary bg-white text-midnight hover:bg-blush" disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Submitting…' : 'Place order'}
          </button>
          {mutation.isError && (
            <p className="text-xs text-rose-200">An error occurred. Please try again or contact our concierge.</p>
          )}
          {mutation.isSuccess && (
            <p className="text-xs text-champagne/80">
              Thank you. We have emailed manual payment instructions and will ship once confirmed.
            </p>
          )}
        </section>
      </form>
    </div>
  );
}

export default CheckoutPage;
