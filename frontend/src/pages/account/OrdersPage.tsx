import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserIcon,
  ShoppingBagIcon,
  HeartIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { fetchOrders } from '../../api/orders';
import type { Order } from '../../types/product';
import OrderStatusTimeline from '../../components/OrderStatusTimeline';

export default function OrdersPage() {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders
  });

  const tabs = [
    { name: 'Profile', href: `/${lang}/account/profile`, icon: UserIcon },
    { name: 'Orders', href: `/${lang}/account/orders`, icon: ShoppingBagIcon },
    { name: 'Favorites', href: `/${lang}/account/favorites`, icon: HeartIcon }
  ];

  const statusFilters = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <ClockIcon className="h-5 w-5" />;
      case 'confirmed':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'shipped':
        return <TruckIcon className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5" />;
      default:
        return <ShoppingBagIcon className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredOrders = orders?.filter(
    (order) => selectedStatus === 'all' || order.status.toLowerCase() === selectedStatus
  );

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-4xl text-midnight mb-2">My Orders</h1>
          <p className="text-midnight/60">Track and manage your orders</p>
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

        {/* Status Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                selectedStatus === filter.value
                  ? 'bg-jade text-white shadow-lg'
                  : 'bg-white text-midnight/60 border border-champagne/40 hover:border-jade hover:text-jade'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>

        {/* Orders List */}
        {isLoading ? (
          <div className="bg-white rounded-3xl shadow-lg border border-champagne/40 p-12 text-center">
            <motion.div
              className="h-12 w-12 mx-auto border-4 border-jade/20 border-t-jade rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="mt-4 text-midnight/60">Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl shadow-lg border border-champagne/40 p-12 text-center">
            <XCircleIcon className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-midnight/60">Failed to load orders. Please try again.</p>
          </div>
        ) : !filteredOrders || filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-lg border border-champagne/40 p-12 text-center"
          >
            <ShoppingCartIcon className="h-16 w-16 mx-auto text-midnight/20 mb-4" />
            <h3 className="font-display text-2xl text-midnight mb-2">No Orders Yet</h3>
            <p className="text-midnight/60 mb-6">
              {selectedStatus === 'all'
                ? "You haven't placed any orders yet."
                : `No ${selectedStatus} orders found.`}
            </p>
            <Link
              to={`/${lang}/products`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-jade text-white rounded-xl font-semibold hover:bg-jade/90 transition-all"
            >
              <ShoppingBagIcon className="h-5 w-5" />
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg border border-champagne/40 overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-midnight/60">Order #{order.id}</p>
                      <p className="text-xs text-midnight/40 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-midnight/60">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-jade">${order.total.toFixed(2)}</p>
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="p-2 text-midnight/60 hover:text-jade transition-colors"
                      >
                        {expandedOrder === order.id ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Details (Expandable) */}
                <AnimatePresence>
                  {expandedOrder === order.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-champagne/40 bg-champagne/5"
                    >
                      <div className="p-6 space-y-6">
                        {/* Order Status Timeline */}
                        <div>
                          <h4 className="font-semibold text-midnight mb-4">Order Status</h4>
                          <OrderStatusTimeline
                            currentStatus={order.status}
                            createdAt={order.createdAt}
                          />
                        </div>

                        {/* Items */}
                        <div>
                          <h4 className="font-semibold text-midnight mb-3">Order Items</h4>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between py-2 border-b border-champagne/40 last:border-0"
                              >
                                <div>
                                  <p className="font-medium text-midnight">{item.name || 'Product'}</p>
                                  <p className="text-sm text-midnight/60">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-semibold text-midnight">
                                  ${((item.price || 0) * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div>
                          <h4 className="font-semibold text-midnight mb-2">Delivery Information</h4>
                          <div className="space-y-1 text-sm text-midnight/60">
                            <p>{order.customer.name}</p>
                            <p>{order.customer.email}</p>
                            {order.customer.phone && <p>{order.customer.phone}</p>}
                            <p className="mt-2">{order.customer.address}</p>
                            {order.customer.notes && (
                              <p className="mt-2 italic">Note: {order.customer.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
