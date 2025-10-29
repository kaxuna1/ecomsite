import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/90 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-midnight p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl text-champagne">Order #{order.id}</h2>
            <p className="mt-1 text-sm text-champagne/60">{formatDate(order.createdAt)}</p>
          </div>
          <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
        </div>

        {/* Customer Information */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-champagne/60">
            Customer Information
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-champagne/50">Name</p>
              <p className="mt-1 text-champagne">{order.customer.name}</p>
            </div>
            <div>
              <p className="text-xs text-champagne/50">Email</p>
              <p className="mt-1 text-champagne">{order.customer.email}</p>
            </div>
            {order.customer.phone && (
              <div>
                <p className="text-xs text-champagne/50">Phone</p>
                <p className="mt-1 text-champagne">{order.customer.phone}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-champagne/50">Address</p>
              <p className="mt-1 whitespace-pre-line text-champagne">{order.customer.address}</p>
            </div>
          </div>
          {order.customer.notes && (
            <div className="mt-4">
              <p className="text-xs text-champagne/50">Notes</p>
              <p className="mt-1 text-champagne">{order.customer.notes}</p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-champagne/60">
            Order Items
          </h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-champagne">{item.name || `Product ${item.productId}`}</p>
                  <p className="text-sm text-champagne/60">Quantity: {item.quantity}</p>
                </div>
                <p className="font-semibold text-champagne">
                  ${item.price !== undefined ? (item.price * item.quantity).toFixed(2) : '—'}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-champagne">Total</p>
              <p className="font-display text-2xl text-champagne">${order.total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} fullWidth>
            Close
          </Button>
          {order.status === 'pending' && (
            <>
              <Button
                variant="primary"
                onClick={() => {
                  onStatusChange(order.id, 'confirmed');
                  onClose();
                }}
                loading={isUpdating}
                fullWidth
              >
                Confirm Order
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  onStatusChange(order.id, 'cancelled');
                  onClose();
                }}
                loading={isUpdating}
                fullWidth
              >
                Cancel
              </Button>
            </>
          )}
          {order.status === 'confirmed' && (
            <>
              <Button
                variant="primary"
                onClick={() => {
                  onStatusChange(order.id, 'completed');
                  onClose();
                }}
                loading={isUpdating}
                fullWidth
              >
                Mark as Completed
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  onStatusChange(order.id, 'cancelled');
                  onClose();
                }}
                loading={isUpdating}
                fullWidth
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AdminOrders;
