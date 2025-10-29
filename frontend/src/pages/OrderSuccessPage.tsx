import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  CheckCircleIcon,
  EnvelopeIcon,
  ShoppingBagIcon,
  HomeIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import type { Order } from '../types/product';

export default function OrderSuccessPage() {
  const { lang = 'en' } = useParams<{ lang: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const order = location.state?.order as Order | undefined;

  // Redirect to home if no order data
  useEffect(() => {
    if (!order) {
      navigate(`/${lang}`, { replace: true });
    }
  }, [order, navigate, lang]);

  if (!order) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-champagne/30 to-white py-12">
      <Helmet>
        <title>Order Confirmation  Luxia Products</title>
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute inset-0 bg-jade/20 rounded-full blur-2xl"
            />
            <div className="relative bg-gradient-to-br from-jade to-jade/80 rounded-full p-6">
              <CheckCircleIcon className="h-20 w-20 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl sm:text-5xl text-midnight mb-4">
            Order Confirmed!
          </h1>
          <p className="text-lg text-midnight/70 mb-2">
            Thank you for your order
          </p>
          <p className="text-sm text-midnight/60">
            Order #{order.id} " {formatDate(order.createdAt)}
          </p>
        </motion.div>

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl shadow-2xl border border-champagne/40 overflow-hidden mb-6"
        >
          {/* Email Confirmation Notice */}
          <div className="bg-gradient-to-r from-jade/10 to-jade/5 border-b border-jade/20 px-6 py-4">
            <div className="flex items-start gap-3">
              <EnvelopeIcon className="h-6 w-6 text-jade flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-midnight">Confirmation email sent</p>
                <p className="text-sm text-midnight/70 mt-1">
                  We've sent order details to <span className="font-medium">{order.customer.email}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="px-6 py-6 border-b border-champagne/30">
            <h2 className="font-display text-xl text-midnight mb-4 flex items-center gap-2">
              <ShoppingBagIcon className="h-5 w-5" />
              Order Items
            </h2>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-champagne/20 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-midnight">{item.name}</p>
                    <p className="text-sm text-midnight/60">Quantity: {item.quantity}</p>
                  </div>
                  {item.price && (
                    <p className="text-lg font-semibold text-jade">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Information */}
          <div className="px-6 py-6 bg-champagne/5">
            <h3 className="font-semibold text-midnight mb-3">Delivery Information</h3>
            <div className="space-y-2 text-sm text-midnight/70">
              <p className="font-medium text-midnight">{order.customer.name}</p>
              <p>{order.customer.email}</p>
              {order.customer.phone && <p>{order.customer.phone}</p>}
              <p className="mt-3 pt-3 border-t border-champagne/30">{order.customer.address}</p>
              {order.customer.notes && (
                <p className="mt-3 pt-3 border-t border-champagne/30 italic">
                  Note: {order.customer.notes}
                </p>
              )}
            </div>
          </div>

          {/* Order Total */}
          <div className="bg-midnight px-6 py-6">
            <div className="flex items-center justify-between">
              <span className="text-champagne text-lg font-semibold">Order Total</span>
              <span className="text-3xl font-display text-jade">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* What's Next Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg border border-champagne/40 p-6 mb-8"
        >
          <h3 className="font-display text-xl text-midnight mb-4">What's Next?</h3>
          <div className="space-y-3 text-sm text-midnight/70">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-jade/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-jade">1</span>
              </div>
              <p>Our team will review your order and contact you with payment instructions</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-jade/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-jade">2</span>
              </div>
              <p>Once payment is confirmed, we'll process and ship your order</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-jade/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-jade">3</span>
              </div>
              <p>You'll receive tracking information via email</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {isAuthenticated && (
            <Link
              to={`/${lang}/account/orders`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-jade text-white rounded-xl font-semibold shadow-lg hover:bg-jade/90 transition-all"
            >
              <UserIcon className="h-5 w-5" />
              View My Orders
            </Link>
          )}
          <Link
            to={`/${lang}/products`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-midnight border-2 border-jade/30 rounded-xl font-semibold hover:bg-champagne/30 transition-all"
          >
            <ShoppingBagIcon className="h-5 w-5" />
            Continue Shopping
          </Link>
          <Link
            to={`/${lang}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-champagne/50 text-midnight rounded-xl font-semibold hover:bg-champagne/70 transition-all"
          >
            <HomeIcon className="h-5 w-5" />
            Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
