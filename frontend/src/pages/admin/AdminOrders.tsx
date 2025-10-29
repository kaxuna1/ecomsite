import { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  PrinterIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClipboardDocumentIcon,
  CreditCardIcon,
  TruckIcon,
  CalendarIcon,
  UserIcon,
  ShoppingBagIcon,
  PencilIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { fetchOrders, updateOrderStatus } from '../../api/orders';
import type { Order } from '../../types/product';
import LoadingState from '../../components/admin/LoadingState';
import EmptyState from '../../components/admin/EmptyState';
import SearchInput from '../../components/admin/SearchInput';
import Badge from '../../components/admin/Badge';
import Button from '../../components/admin/Button';
import Dropdown, { type DropdownItem } from '../../components/admin/Dropdown';
import DataTable, { type Column } from '../../components/admin/DataTable';

type FilterOption = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

function AdminOrders() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  });

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        o =>
          o.id.toString().includes(query) ||
          o.customer.name.toLowerCase().includes(query) ||
          o.customer.email.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterOption !== 'all') {
      filtered = filtered.filter(o => o.status === filterOption);
    }

    // Sort by newest first
    return [...filtered].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, searchQuery, filterOption]);

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'info' | 'error' | 'neutral' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateMutation.mutate({ id: orderId, status: newStatus });
  };

  const columns: Column<Order>[] = [
    {
      key: 'id',
      label: 'Order',
      sortable: true,
      render: (order) => (
        <div>
          <p className="font-semibold text-champagne">#{order.id}</p>
          <p className="text-xs text-champagne/50">{formatDate(order.createdAt)}</p>
        </div>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: false,
      render: (order) => (
        <div>
          <p className="font-medium text-champagne">{order.customer.name}</p>
          <p className="text-sm text-champagne/60">{order.customer.email}</p>
          {order.customer.phone && (
            <p className="text-xs text-champagne/50">{order.customer.phone}</p>
          )}
        </div>
      )
    },
    {
      key: 'items',
      label: 'Items',
      sortable: false,
      render: (order) => (
        <div>
          <p className="text-champagne">{order.items.length} item(s)</p>
          <p className="text-xs text-champagne/50">
            {order.items.map(item => item.name || `Product ${item.productId}`).join(', ').slice(0, 50)}
            {order.items.map(item => item.name || `Product ${item.productId}`).join(', ').length > 50 ? '...' : ''}
          </p>
        </div>
      )
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (order) => (
        <p className="font-semibold text-champagne">${order.total.toFixed(2)}</p>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (order) => (
        <Badge variant={getStatusBadgeVariant(order.status)} size="sm">
          {order.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'right',
      render: (order) => {
        const dropdownItems: DropdownItem[] = [
          {
            label: 'View Details',
            icon: <EyeIcon />,
            onClick: () => setSelectedOrder(order)
          }
        ];

        // Add status change options based on current status
        if (order.status === 'pending') {
          dropdownItems.push({
            label: 'Mark as Confirmed',
            icon: <CheckCircleIcon />,
            onClick: () => handleStatusChange(order.id, 'confirmed')
          });
          dropdownItems.push({
            label: 'Cancel Order',
            icon: <XCircleIcon />,
            onClick: () => handleStatusChange(order.id, 'cancelled'),
            danger: true
          });
        } else if (order.status === 'confirmed') {
          dropdownItems.push({
            label: 'Mark as Completed',
            icon: <CheckCircleIcon />,
            onClick: () => handleStatusChange(order.id, 'completed')
          });
          dropdownItems.push({
            label: 'Cancel Order',
            icon: <XCircleIcon />,
            onClick: () => handleStatusChange(order.id, 'cancelled'),
            danger: true
          });
        }

        return (
          <Dropdown
            trigger={
              <button
                type="button"
                className="rounded-full p-2 text-champagne/70 transition-colors hover:bg-white/10 hover:text-champagne"
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
            }
            items={dropdownItems}
          />
        );
      }
    }
  ];

  if (isLoading) {
    return <LoadingState message="Loading orders..." />;
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Orders — Luxia Admin</title>
      </Helmet>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-champagne">Order Management</h1>
          <p className="mt-1 text-sm text-champagne/70">
            {filteredOrders.length} of {orders.length} orders
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          icon={<ArrowDownTrayIcon />}
          onClick={() => alert('Export functionality coming soon!')}
        >
          Export
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search by order ID, customer name, or email..."
          />
        </div>

        <div className="relative">
          <FunnelIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-champagne/40" />
          <select
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value as FilterOption)}
            className="w-full appearance-none rounded-full border border-white/20 bg-midnight px-12 py-3 text-champagne focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/20 p-2">
              <ClockIcon className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-champagne">
                {orders.filter(o => o.status === 'pending').length}
              </p>
              <p className="text-xs text-champagne/60">Pending</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-500/20 p-2">
              <CheckCircleIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-champagne">
                {orders.filter(o => o.status === 'confirmed').length}
              </p>
              <p className="text-xs text-champagne/60">Confirmed</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-500/20 p-2">
              <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-champagne">
                {orders.filter(o => o.status === 'completed').length}
              </p>
              <p className="text-xs text-champagne/60">Completed</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-rose-500/20 p-2">
              <XCircleIcon className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-champagne">
                {orders.filter(o => o.status === 'cancelled').length}
              </p>
              <p className="text-xs text-champagne/60">Cancelled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        keyExtractor={(order) => order.id.toString()}
        onRowClick={(order) => setSelectedOrder(order)}
        emptyState={
          <EmptyState
            icon={<ClockIcon className="h-16 w-16" />}
            title="No orders found"
            description={
              searchQuery || filterOption !== 'all'
                ? "Try adjusting your search or filters"
                : "Orders will appear here once customers make purchases"
            }
          />
        }
        sortable={false}
      />

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          isUpdating={updateMutation.isPending}
        />
      )}
    </div>
  );
}

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onStatusChange: (orderId: number, status: string) => void;
  isUpdating: boolean;
}

function OrderDetailsModal({ order, onClose, onStatusChange, isUpdating }: OrderDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'notes'>('overview');
  const [showConfirmDialog, setShowConfirmDialog] = useState<{ action: string; status: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'info' | 'error' | 'neutral' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showConfirmDialog) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showConfirmDialog]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyOrder = () => {
    const orderText = `
Order #${order.id}
Date: ${formatDate(order.createdAt)}
Status: ${order.status}

Customer:
${order.customer.name}
${order.customer.email}
${order.customer.phone || ''}
${order.customer.address}

Items:
${order.items.map(item => `${item.name} x${item.quantity} - $${(item.price! * item.quantity).toFixed(2)}`).join('\n')}

Total: $${order.total.toFixed(2)}
    `.trim();

    navigator.clipboard.writeText(orderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChangeConfirm = () => {
    if (showConfirmDialog) {
      onStatusChange(order.id, showConfirmDialog.status);
      setShowConfirmDialog(null);
      onClose();
    }
  };

  const statusTimeline = useMemo(() => {
    const timeline = [
      {
        status: 'pending',
        label: 'Order Placed',
        icon: ClockIcon,
        color: 'amber',
        date: order.createdAt,
        completed: true
      },
      {
        status: 'confirmed',
        label: 'Confirmed',
        icon: CheckCircleIcon,
        color: 'blue',
        completed: order.status === 'confirmed' || order.status === 'completed'
      },
      {
        status: 'completed',
        label: 'Completed',
        icon: CheckIcon,
        color: 'emerald',
        completed: order.status === 'completed'
      }
    ];

    if (order.status === 'cancelled') {
      return [
        timeline[0],
        {
          status: 'cancelled',
          label: 'Cancelled',
          icon: XCircleIcon,
          color: 'rose',
          completed: true
        }
      ];
    }

    return timeline;
  }, [order.status, order.createdAt]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/95 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="max-h-[95vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-midnight shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-white/10 bg-white/5 px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <h2 className="font-display text-3xl text-champagne">Order #{order.id}</h2>
                  <Badge variant={getStatusBadgeVariant(order.status)} size="lg">
                    {order.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-champagne/60">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {formatDate(order.createdAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingBagIcon className="h-4 w-4" />
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCardIcon className="h-4 w-4" />
                    ${order.total.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="rounded-full p-2 text-champagne/70 transition-colors hover:bg-white/10 hover:text-champagne"
                  title="Print order"
                >
                  <PrinterIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleCopyOrder}
                  className="rounded-full p-2 text-champagne/70 transition-colors hover:bg-white/10 hover:text-champagne"
                  title="Copy order details"
                >
                  {copied ? (
                    <CheckIcon className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <ClipboardDocumentIcon className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-champagne/70 transition-colors hover:bg-white/10 hover:text-champagne"
                  title="Close (Esc)"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 flex gap-1 border-b border-white/10">
              {[
                { id: 'overview', label: 'Overview', icon: ShoppingBagIcon },
                { id: 'timeline', label: 'Timeline', icon: ClockIcon },
                { id: 'notes', label: 'Notes', icon: PencilIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-champagne'
                        : 'text-champagne/50 hover:text-champagne/80'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blush"
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(95vh-240px)] overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Customer Information */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-champagne/60" />
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-champagne/60">
                        Customer Information
                      </h3>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-champagne/50">
                          Contact Details
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <UserIcon className="h-5 w-5 flex-shrink-0 text-champagne/40 mt-0.5" />
                            <div>
                              <p className="text-sm text-champagne/60">Name</p>
                              <p className="text-champagne">{order.customer.name}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <EnvelopeIcon className="h-5 w-5 flex-shrink-0 text-champagne/40 mt-0.5" />
                            <div>
                              <p className="text-sm text-champagne/60">Email</p>
                              <a
                                href={`mailto:${order.customer.email}`}
                                className="text-blush hover:text-blush/80 transition-colors"
                              >
                                {order.customer.email}
                              </a>
                            </div>
                          </div>
                          {order.customer.phone && (
                            <div className="flex items-start gap-3">
                              <PhoneIcon className="h-5 w-5 flex-shrink-0 text-champagne/40 mt-0.5" />
                              <div>
                                <p className="text-sm text-champagne/60">Phone</p>
                                <a
                                  href={`tel:${order.customer.phone}`}
                                  className="text-blush hover:text-blush/80 transition-colors"
                                >
                                  {order.customer.phone}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-champagne/50">
                          Shipping Address
                        </p>
                        <div className="flex items-start gap-3">
                          <MapPinIcon className="h-5 w-5 flex-shrink-0 text-champagne/40 mt-0.5" />
                          <p className="whitespace-pre-line text-champagne/80 leading-relaxed">
                            {order.customer.address}
                          </p>
                        </div>
                      </div>
                    </div>
                    {order.customer.notes && (
                      <div className="mt-6 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                          Customer Notes
                        </p>
                        <p className="text-sm text-champagne/80">{order.customer.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingBagIcon className="h-5 w-5 text-champagne/60" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-champagne/60">
                          Order Items
                        </h3>
                      </div>
                      <p className="text-sm text-champagne/60">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <div className="space-y-4">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-champagne">{item.name || `Product ${item.productId}`}</p>
                            <div className="mt-1 flex items-center gap-4 text-sm text-champagne/60">
                              <span>Qty: {item.quantity}</span>
                              <span>•</span>
                              <span>${item.price?.toFixed(2)} each</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-champagne">
                              ${item.price !== undefined ? (item.price * item.quantity).toFixed(2) : '—'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Price Breakdown */}
                    <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
                      <div className="flex items-center justify-between text-champagne/70">
                        <span>Subtotal</span>
                        <span>${order.total.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-champagne/70">
                        <span>Shipping</span>
                        <span className="text-emerald-400">FREE</span>
                      </div>
                      <div className="flex items-center justify-between text-champagne/70">
                        <span>Tax</span>
                        <span>Included</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/10 pt-3 text-lg font-bold">
                        <span className="text-champagne">Total</span>
                        <span className="font-display text-2xl text-blush">${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'timeline' && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="mb-6 flex items-center gap-2">
                      <ClockIcon className="h-5 w-5 text-champagne/60" />
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-champagne/60">
                        Order Timeline
                      </h3>
                    </div>
                    <div className="space-y-6">
                      {statusTimeline.map((step, index) => {
                        const Icon = step.icon;
                        const isLast = index === statusTimeline.length - 1;
                        return (
                          <div key={step.status} className="relative flex gap-4">
                            {/* Timeline Line */}
                            {!isLast && (
                              <div className={`absolute left-6 top-12 h-full w-0.5 ${
                                step.completed ? `bg-${step.color}-500/30` : 'bg-white/10'
                              }`} />
                            )}

                            {/* Icon */}
                            <div className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                              step.completed
                                ? `bg-${step.color}-500/20 ring-4 ring-${step.color}-500/10`
                                : 'bg-white/5 ring-4 ring-white/5'
                            }`}>
                              <Icon className={`h-6 w-6 ${
                                step.completed ? `text-${step.color}-400` : 'text-champagne/40'
                              }`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-6">
                              <div className="flex items-center justify-between">
                                <p className={`font-semibold ${
                                  step.completed ? 'text-champagne' : 'text-champagne/40'
                                }`}>
                                  {step.label}
                                </p>
                                {step.date && (
                                  <p className="text-sm text-champagne/50">
                                    {formatTime(step.date)}
                                  </p>
                                )}
                              </div>
                              {step.date && (
                                <p className="mt-1 text-sm text-champagne/60">
                                  {formatDate(step.date)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notes' && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <PencilIcon className="h-5 w-5 text-champagne/60" />
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-champagne/60">
                        Internal Notes
                      </h3>
                    </div>
                    <div className="rounded-xl bg-white/5 p-4 text-center">
                      <p className="text-sm text-champagne/50">
                        Internal notes feature coming soon...
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-white/10 bg-white/5 px-8 py-6">
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={onClose} icon={<XMarkIcon />}>
                Close
              </Button>
              {order.status === 'pending' && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => setShowConfirmDialog({ action: 'confirm', status: 'confirmed' })}
                    loading={isUpdating}
                    icon={<CheckCircleIcon />}
                  >
                    Confirm Order
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setShowConfirmDialog({ action: 'cancel', status: 'cancelled' })}
                    loading={isUpdating}
                    icon={<XCircleIcon />}
                  >
                    Cancel Order
                  </Button>
                </>
              )}
              {order.status === 'confirmed' && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => setShowConfirmDialog({ action: 'complete', status: 'completed' })}
                    loading={isUpdating}
                    icon={<TruckIcon />}
                  >
                    Mark as Completed
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setShowConfirmDialog({ action: 'cancel', status: 'cancelled' })}
                    loading={isUpdating}
                    icon={<XCircleIcon />}
                  >
                    Cancel Order
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Confirmation Dialog */}
          <AnimatePresence>
            {showConfirmDialog && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-midnight/80 backdrop-blur-sm"
                onClick={() => setShowConfirmDialog(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-midnight p-6 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="mb-2 text-xl font-semibold text-champagne">
                    Confirm Action
                  </h3>
                  <p className="mb-6 text-champagne/70">
                    Are you sure you want to {showConfirmDialog.action} this order? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => setShowConfirmDialog(null)}
                      fullWidth
                    >
                      Cancel
                    </Button>
                    <Button
                      variant={showConfirmDialog.action === 'cancel' ? 'danger' : 'primary'}
                      onClick={handleStatusChangeConfirm}
                      loading={isUpdating}
                      fullWidth
                    >
                      Confirm
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AdminOrders;
