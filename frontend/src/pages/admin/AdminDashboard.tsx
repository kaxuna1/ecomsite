import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  FireIcon,
  TagIcon,
  PlusIcon,
  ArrowRightIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { fetchProducts } from '../../api/products';
import { fetchOrders, updateOrderStatus } from '../../api/orders';
import type { Product } from '../../types/product';
import type { Order } from '../../types/order';

function AdminDashboard() {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;

    const lowStockProducts = products.filter(p => p.inventory > 0 && p.inventory <= 10);
    const outOfStockProducts = products.filter(p => p.inventory === 0);
    const newProducts = products.filter(p => p.isNew);
    const featuredProducts = products.filter(p => p.isFeatured);
    const saleProducts = products.filter(p => p.salePrice);

    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Get recent orders (last 5)
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders: orders.length,
      pendingOrders,
      confirmedOrders,
      completedOrders,
      averageOrderValue,
      totalProducts: products.length,
      lowStockProducts,
      outOfStockProducts,
      newProducts,
      featuredProducts,
      saleProducts,
      recentOrders
    };
  }, [products, orders]);

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'confirmed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-white/10 text-champagne border-white/20';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isLoading = productsLoading || ordersLoading;

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Admin Dashboard — Luxia</title>
      </Helmet>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-champagne">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-champagne/70">
            Monitor your store performance and manage operations
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/products"
            className="flex items-center gap-2 rounded-full bg-blush px-5 py-2.5 text-sm font-semibold text-midnight transition-colors hover:bg-champagne"
          >
            <PlusIcon className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl bg-gradient-to-br from-emerald-500/20 to-jade/10 border border-emerald-500/20 p-6 shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-champagne/70">Total Revenue</p>
              <p className="mt-3 font-display text-3xl text-champagne">${metrics.totalRevenue.toFixed(2)}</p>
              <p className="mt-2 text-xs text-champagne/60">
                ${metrics.averageOrderValue.toFixed(2)} avg order
              </p>
            </div>
            <div className="rounded-full bg-emerald-500/20 p-3">
              <CurrencyDollarIcon className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </motion.div>

        {/* Total Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl bg-gradient-to-br from-blue-500/20 to-blush/10 border border-blue-500/20 p-6 shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-champagne/70">Total Orders</p>
              <p className="mt-3 font-display text-3xl text-champagne">{metrics.totalOrders}</p>
              <p className="mt-2 text-xs text-champagne/60">
                {metrics.completedOrders} completed
              </p>
            </div>
            <div className="rounded-full bg-blue-500/20 p-3">
              <ShoppingBagIcon className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </motion.div>

        {/* Pending Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 border border-amber-500/20 p-6 shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-champagne/70">Pending Orders</p>
              <p className="mt-3 font-display text-3xl text-champagne">{metrics.pendingOrders}</p>
              <p className="mt-2 text-xs text-champagne/60">
                Awaiting confirmation
              </p>
            </div>
            <div className="rounded-full bg-amber-500/20 p-3">
              <ClockIcon className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </motion.div>

        {/* Active Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/20 p-6 shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-champagne/70">Active Products</p>
              <p className="mt-3 font-display text-3xl text-champagne">{metrics.totalProducts}</p>
              <p className="mt-2 text-xs text-champagne/60">
                {metrics.newProducts.length} new arrivals
              </p>
            </div>
            <div className="rounded-full bg-purple-500/20 p-3">
              <CubeIcon className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl text-champagne">Recent Orders</h2>
              <Link
                to="/admin/orders"
                className="flex items-center gap-1 text-sm text-blush hover:text-champagne transition-colors"
              >
                View All
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-champagne/60">Loading orders...</div>
            ) : metrics.recentOrders.length === 0 ? (
              <div className="py-12 text-center text-champagne/60">No orders yet</div>
            ) : (
              <div className="space-y-4">
                {metrics.recentOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-champagne">Order #{order.id}</p>
                        <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${getOrderStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-champagne/70">{order.customerName}</p>
                      <p className="mt-1 text-xs text-champagne/50">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-champagne">${order.total.toFixed(2)}</p>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'confirmed' })}
                          disabled={updateStatusMutation.isPending}
                          className="mt-2 rounded-full bg-blush px-3 py-1 text-xs font-semibold text-midnight transition-colors hover:bg-champagne disabled:opacity-50"
                        >
                          Confirm
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Alerts & Quick Stats */}
        <div className="space-y-6">
          {/* Inventory Alerts */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
            <div className="mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
              <h2 className="font-display text-lg text-champagne">Inventory Alerts</h2>
            </div>

            {isLoading ? (
              <div className="py-6 text-center text-sm text-champagne/60">Loading...</div>
            ) : (
              <div className="space-y-4">
                {/* Out of Stock */}
                {metrics.outOfStockProducts.length > 0 && (
                  <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4">
                    <div className="flex items-center gap-2">
                      <XCircleIcon className="h-5 w-5 text-rose-400" />
                      <div>
                        <p className="text-sm font-semibold text-rose-400">Out of Stock</p>
                        <p className="text-xs text-champagne/60">
                          {metrics.outOfStockProducts.length} {metrics.outOfStockProducts.length === 1 ? 'product' : 'products'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Low Stock */}
                {metrics.lowStockProducts.length > 0 && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
                      <div>
                        <p className="text-sm font-semibold text-amber-400">Low Stock</p>
                        <p className="text-xs text-champagne/60">
                          {metrics.lowStockProducts.length} {metrics.lowStockProducts.length === 1 ? 'product' : 'products'} (≤10 units)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {metrics.outOfStockProducts.length === 0 && metrics.lowStockProducts.length === 0 && (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-400">All Good</p>
                        <p className="text-xs text-champagne/60">No inventory issues</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Categories */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
            <h2 className="mb-4 font-display text-lg text-champagne">Product Categories</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4 text-jade" />
                  <span className="text-sm text-champagne">New Arrivals</span>
                </div>
                <span className="font-semibold text-champagne">{metrics.newProducts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FireIcon className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-champagne">Best Sellers</span>
                </div>
                <span className="font-semibold text-champagne">{metrics.featuredProducts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-rose-400" />
                  <span className="text-sm text-champagne">On Sale</span>
                </div>
                <span className="font-semibold text-champagne">{metrics.saleProducts.length}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
            <h2 className="mb-4 font-display text-lg text-champagne">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/admin/products"
                className="flex w-full items-center justify-between rounded-xl bg-white/5 p-3 text-sm text-champagne transition-colors hover:bg-white/10"
              >
                <span>Manage Products</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                to="/admin/orders"
                className="flex w-full items-center justify-between rounded-xl bg-white/5 p-3 text-sm text-champagne transition-colors hover:bg-white/10"
              >
                <span>View All Orders</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Summary */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/20 p-3">
              <ClockIcon className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-champagne">{metrics.pendingOrders}</p>
              <p className="text-xs text-champagne/60">Pending</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-500/20 p-3">
              <CheckCircleIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-champagne">{metrics.confirmedOrders}</p>
              <p className="text-xs text-champagne/60">Confirmed</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-500/20 p-3">
              <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-champagne">{metrics.completedOrders}</p>
              <p className="text-xs text-champagne/60">Completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
