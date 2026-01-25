import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  TagIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import {
  getAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getPromoCodeStats
} from '../../api/promoCodes';
import type {
  PromoCode,
  CreatePromoCodePayload,
  UpdatePromoCodePayload,
  DiscountType
} from '../../types/product';
import PageHeader from '../../components/admin/PageHeader';
import SearchInput from '../../components/admin/SearchInput';
import LoadingState from '../../components/admin/LoadingState';
import EmptyState from '../../components/admin/EmptyState';

function AdminPromoCodes() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const hasActiveFilters = Boolean(searchQuery);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [viewingStats, setViewingStats] = useState<number | null>(null);

  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ['admin-promo-codes'],
    queryFn: getAllPromoCodes
  });

  const { data: stats } = useQuery({
    queryKey: ['promo-stats', viewingStats],
    queryFn: () => getPromoCodeStats(viewingStats!),
    enabled: viewingStats !== null
  });

  const createMutation = useMutation({
    mutationFn: createPromoCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      setShowModal(false);
      setEditingPromo(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePromoCodePayload }) =>
      updatePromoCode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      setShowModal(false);
      setEditingPromo(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deletePromoCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      setShowDeleteConfirm(null);
    }
  });

  const filteredPromoCodes = promoCodes.filter((promo) =>
    promo.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetFilters = () => {
    setSearchQuery('');
  };

  const handleOpenModal = (promo?: PromoCode) => {
    setEditingPromo(promo || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPromo(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Promo Codes"
        description="Manage discount codes for your customers"
        actions={(
          <motion.button
            type="button"
            onClick={() => handleOpenModal()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-interactive-default px-6 py-3 text-xs font-medium uppercase tracking-wider text-on-interactive transition-all hover:bg-interactive-hover sm:w-auto sm:text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlusIcon className="h-5 w-5" />
            Create Code
          </motion.button>
        )}
      />

      {/* Search */}
      <div>
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={hasActiveFilters ? resetFilters : undefined}
          placeholder="Search promo codes..."
          label="Search promo codes"
          resultsCount={filteredPromoCodes.length}
          resultsLabel="codes"
        />
      </div>

      {/* Promo Codes List */}
      {isLoading ? (
        <LoadingState message="Loading promo codes..." />
      ) : filteredPromoCodes.length === 0 ? (
        <EmptyState
          icon={<TagIcon className="h-12 w-12" />}
          title={searchQuery ? 'No promo codes found' : 'No promo codes yet'}
          description={searchQuery ? 'Try adjusting your search.' : 'Create your first promo code to get started.'}
          action={
            !searchQuery
              ? {
                  label: 'Create promo code',
                  onClick: () => handleOpenModal()
                }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPromoCodes.map((promo, index) => (
              <PromoCodeCard
                key={promo.id}
                promo={promo}
                index={index}
                onEdit={() => handleOpenModal(promo)}
                onDelete={() => setShowDeleteConfirm(promo.id)}
                onViewStats={() => setViewingStats(promo.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <PromoCodeModal
            promo={editingPromo}
            onClose={handleCloseModal}
            onSubmit={(data) => {
              if (editingPromo) {
                updateMutation.mutate({ id: editingPromo.id, data });
              } else {
                createMutation.mutate(data);
              }
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <DeleteConfirmModal
            onConfirm={() => deleteMutation.mutate(showDeleteConfirm)}
            onCancel={() => setShowDeleteConfirm(null)}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Stats Modal */}
      <AnimatePresence>
        {viewingStats && stats && (
          <StatsModal stats={stats} onClose={() => setViewingStats(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

interface PromoCodeCardProps {
  promo: PromoCode;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onViewStats: () => void;
}

const PromoCodeCard = React.forwardRef<HTMLDivElement, PromoCodeCardProps>(
  ({ promo, index, onEdit, onDelete, onViewStats }, ref) => {
    const isExpired = promo.validUntil && new Date(promo.validUntil) < new Date();
    const isMaxedOut = promo.maxUsageCount && promo.usageCount >= promo.maxUsageCount;

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: index * 0.05 }}
        className="group rounded-3xl border border-border-default bg-bg-elevated p-6 backdrop-blur"
      >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-2xl uppercase tracking-wider text-primary">
              {promo.code}
            </h3>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${
                promo.isActive && !isExpired && !isMaxedOut
                  ? 'bg-primary/20 text-primary'
                  : 'bg-text-secondary/20 text-text-secondary'
              }`}
            >
              {isExpired ? 'Expired' : isMaxedOut ? 'Maxed Out' : promo.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-text-secondary">Discount</p>
              <p className="mt-1 font-semibold text-text-primary">
                {promo.discountType === 'PERCENTAGE'
                  ? `${promo.discountValue}%`
                  : promo.discountType === 'FREE_SHIPPING'
                  ? 'Free Shipping'
                  : `$${promo.discountValue.toFixed(2)}`}
              </p>
            </div>

            {promo.minimumPurchase && (
              <div>
                <p className="text-xs uppercase tracking-wider text-text-secondary">Min Purchase</p>
                <p className="mt-1 font-semibold text-text-primary">
                  ${promo.minimumPurchase.toFixed(2)}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs uppercase tracking-wider text-text-secondary">Usage</p>
              <p className="mt-1 font-semibold text-text-primary">
                {promo.usageCount}
                {promo.maxUsageCount ? ` / ${promo.maxUsageCount}` : ' uses'}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-text-secondary">Valid Until</p>
              <p className="mt-1 font-semibold text-text-primary">
                {promo.validUntil
                  ? new Date(promo.validUntil).toLocaleDateString()
                  : 'No expiration'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <motion.button
            type="button"
            onClick={onViewStats}
            className="rounded-full p-2 text-text-secondary transition-colors hover:bg-primary/20 hover:text-primary"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChartBarIcon className="h-5 w-5" />
          </motion.button>
          <motion.button
            type="button"
            onClick={onEdit}
            className="rounded-full p-2 text-text-secondary transition-colors hover:bg-primary/20 hover:text-primary"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <PencilIcon className="h-5 w-5" />
          </motion.button>
          <motion.button
            type="button"
            onClick={onDelete}
            className="rounded-full p-2 text-text-secondary transition-colors hover:bg-red-500/20 hover:text-red-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <TrashIcon className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
    );
  }
);

PromoCodeCard.displayName = 'PromoCodeCard';

interface PromoCodeModalProps {
  promo: PromoCode | null;
  onClose: () => void;
  onSubmit: (data: CreatePromoCodePayload) => void;
  isSubmitting: boolean;
}

function PromoCodeModal({ promo, onClose, onSubmit, isSubmitting }: PromoCodeModalProps) {
  const [formData, setFormData] = useState<CreatePromoCodePayload>({
    code: promo?.code || '',
    discountType: promo?.discountType || 'PERCENTAGE',
    discountValue: promo?.discountValue || 0,
    minimumPurchase: promo?.minimumPurchase || undefined,
    maxUsageCount: promo?.maxUsageCount || undefined,
    isActive: promo?.isActive ?? true,
    validFrom: promo?.validFrom
      ? new Date(promo.validFrom).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    validUntil: promo?.validUntil
      ? new Date(promo.validUntil).toISOString().slice(0, 16)
      : undefined
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-2xl rounded-3xl border border-border-default bg-bg-elevated p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase tracking-[0.3em] text-text-primary">
            {promo ? 'Edit' : 'Create'} Promo Code
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-text-secondary transition-colors hover:bg-bg-secondary"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium uppercase tracking-wider text-text-primary">
              Code
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              className="mt-2 w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 uppercase text-text-primary focus:border-primary focus:outline-none transition-colors"
              placeholder="SUMMER2025"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-text-primary">
                Discount Type
              </label>
              <select
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({ ...formData, discountType: e.target.value as DiscountType })
                }
                className="mt-2 w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary focus:border-primary focus:outline-none transition-colors"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED_AMOUNT">Fixed Amount</option>
                <option value="FREE_SHIPPING">Free Shipping</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-text-primary">
                Discount Value
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({ ...formData, discountValue: parseFloat(e.target.value) })
                }
                className="mt-2 w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-text-primary">
                Min Purchase (Optional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minimumPurchase || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimumPurchase: e.target.value ? parseFloat(e.target.value) : undefined
                  })
                }
                className="mt-2 w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary focus:border-primary focus:outline-none transition-colors"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-text-primary">
                Max Usage (Optional)
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxUsageCount || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxUsageCount: e.target.value ? parseInt(e.target.value) : undefined
                  })
                }
                className="mt-2 w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary focus:border-primary focus:outline-none transition-colors"
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-text-primary">
                Valid From
              </label>
              <input
                type="datetime-local"
                required
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                className="mt-2 w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-text-primary">
                Valid Until (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.validUntil || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    validUntil: e.target.value || undefined
                  })
                }
                className="mt-2 w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-5 w-5 rounded border-border-default bg-bg-elevated text-primary focus:ring-primary/20"
            />
            <label htmlFor="isActive" className="text-sm text-text-primary">
              Active (visible to customers)
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-border-default py-3 text-sm font-medium uppercase tracking-wider text-text-primary transition-colors hover:bg-bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-full bg-interactive-default py-3 text-sm font-medium uppercase tracking-wider text-on-interactive transition-colors hover:bg-interactive-hover disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : promo ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteConfirmModal({ onConfirm, onCancel, isDeleting }: DeleteConfirmModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="w-full max-w-md rounded-3xl border border-border-default bg-bg-elevated p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-display text-xl uppercase tracking-[0.3em] text-text-primary">Delete Promo Code</h2>
        <p className="mb-8 text-sm text-text-secondary">
          Are you sure you want to delete this promo code? This action cannot be undone.
        </p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-border-default py-3 text-sm font-medium uppercase tracking-wider text-text-primary transition-colors hover:bg-bg-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-full bg-red-500 py-3 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface StatsModalProps {
  stats: {
    id: number;
    code: string;
    usageCount: number;
    totalDiscountGiven: number;
    averageOrderValue: number;
  };
  onClose: () => void;
}

function StatsModal({ stats, onClose }: StatsModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="w-full max-w-md rounded-3xl border border-border-default bg-bg-elevated p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl uppercase tracking-[0.3em] text-text-primary">
            {stats.code} Stats
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-text-secondary transition-colors hover:bg-bg-secondary"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border-default bg-bg-secondary p-6">
            <p className="text-xs uppercase tracking-wider text-text-secondary">Total Uses</p>
            <p className="mt-2 font-display text-3xl text-primary">{stats.usageCount}</p>
          </div>

          <div className="rounded-2xl border border-border-default bg-bg-secondary p-6">
            <p className="text-xs uppercase tracking-wider text-text-secondary">
              Total Discount Given
            </p>
            <p className="mt-2 font-display text-3xl text-primary">
              ${stats.totalDiscountGiven.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl border border-border-default bg-bg-secondary p-6">
            <p className="text-xs uppercase tracking-wider text-text-secondary">
              Average Order Value
            </p>
            <p className="mt-2 font-display text-3xl text-primary">
              ${stats.averageOrderValue.toFixed(2)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full rounded-full bg-interactive-default py-3 text-sm font-medium uppercase tracking-wider text-on-interactive transition-colors hover:bg-interactive-hover"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

export default AdminPromoCodes;
