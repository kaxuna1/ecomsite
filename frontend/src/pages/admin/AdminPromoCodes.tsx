import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  MagnifyingGlassIcon,
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

function AdminPromoCodes() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-[0.3em]">Promo Codes</h1>
          <p className="mt-2 text-sm text-champagne/60">
            Manage discount codes for your customers
          </p>
        </div>
        <motion.button
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-full bg-blush px-6 py-3 text-sm font-medium uppercase tracking-wider text-midnight transition-all hover:bg-blush/90"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PlusIcon className="h-5 w-5" />
          Create Code
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-champagne/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search promo codes..."
          className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-champagne placeholder:text-champagne/40 focus:border-blush focus:outline-none"
        />
      </div>

      {/* Promo Codes List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blush border-t-transparent" />
        </div>
      ) : filteredPromoCodes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/10"
        >
          <TagIcon className="mb-4 h-16 w-16 text-champagne/40" />
          <p className="text-lg text-champagne/60">
            {searchQuery ? 'No promo codes found' : 'No promo codes yet'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="mt-4 text-sm text-blush hover:underline"
            >
              Create your first promo code
            </button>
          )}
        </motion.div>
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
        className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
      >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-2xl uppercase tracking-wider text-blush">
              {promo.code}
            </h3>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${
                promo.isActive && !isExpired && !isMaxedOut
                  ? 'bg-jade/20 text-jade'
                  : 'bg-champagne/20 text-champagne/60'
              }`}
            >
              {isExpired ? 'Expired' : isMaxedOut ? 'Maxed Out' : promo.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-champagne/60">Discount</p>
              <p className="mt-1 font-semibold text-champagne">
                {promo.discountType === 'percentage'
                  ? `${promo.discountValue}%`
                  : `$${promo.discountValue.toFixed(2)}`}
              </p>
            </div>

            {promo.minimumPurchase && (
              <div>
                <p className="text-xs uppercase tracking-wider text-champagne/60">Min Purchase</p>
                <p className="mt-1 font-semibold text-champagne">
                  ${promo.minimumPurchase.toFixed(2)}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs uppercase tracking-wider text-champagne/60">Usage</p>
              <p className="mt-1 font-semibold text-champagne">
                {promo.usageCount}
                {promo.maxUsageCount ? ` / ${promo.maxUsageCount}` : ' uses'}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-champagne/60">Valid Until</p>
              <p className="mt-1 font-semibold text-champagne">
                {promo.validUntil
                  ? new Date(promo.validUntil).toLocaleDateString()
                  : 'No expiration'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <motion.button
            type="button"
            onClick={onViewStats}
            className="rounded-full p-2 text-champagne/60 transition-colors hover:bg-blush/20 hover:text-blush"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChartBarIcon className="h-5 w-5" />
          </motion.button>
          <motion.button
            type="button"
            onClick={onEdit}
            className="rounded-full p-2 text-champagne/60 transition-colors hover:bg-blush/20 hover:text-blush"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <PencilIcon className="h-5 w-5" />
          </motion.button>
          <motion.button
            type="button"
            onClick={onDelete}
            className="rounded-full p-2 text-champagne/60 transition-colors hover:bg-red-500/20 hover:text-red-400"
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
    discountType: promo?.discountType || 'percentage',
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-midnight p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase tracking-[0.3em]">
            {promo ? 'Edit' : 'Create'} Promo Code
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-champagne/60 transition-colors hover:bg-white/10"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium uppercase tracking-wider text-champagne/80">
              Code
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              className="mt-2 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 uppercase text-champagne focus:border-blush focus:outline-none"
              placeholder="SUMMER2025"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-champagne/80">
                Discount Type
              </label>
              <select
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({ ...formData, discountType: e.target.value as DiscountType })
                }
                className="mt-2 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-champagne focus:border-blush focus:outline-none"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-champagne/80">
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
                className="mt-2 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-champagne focus:border-blush focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-champagne/80">
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
                className="mt-2 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-champagne focus:border-blush focus:outline-none"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-champagne/80">
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
                className="mt-2 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-champagne focus:border-blush focus:outline-none"
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-champagne/80">
                Valid From
              </label>
              <input
                type="datetime-local"
                required
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                className="mt-2 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-champagne focus:border-blush focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-champagne/80">
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
                className="mt-2 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-champagne focus:border-blush focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-5 w-5 rounded border-white/10 bg-white/5 text-blush focus:ring-blush"
            />
            <label htmlFor="isActive" className="text-sm text-champagne/80">
              Active (visible to customers)
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-white/10 py-3 text-sm font-medium uppercase tracking-wider text-champagne transition-colors hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-full bg-blush py-3 text-sm font-medium uppercase tracking-wider text-midnight transition-colors hover:bg-blush/90 disabled:opacity-50"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/80 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-midnight p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-display text-xl uppercase tracking-[0.3em]">Delete Promo Code</h2>
        <p className="mb-8 text-sm text-champagne/70">
          Are you sure you want to delete this promo code? This action cannot be undone.
        </p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-white/10 py-3 text-sm font-medium uppercase tracking-wider text-champagne transition-colors hover:bg-white/5"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-midnight p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl uppercase tracking-[0.3em]">
            {stats.code} Stats
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-champagne/60 transition-colors hover:bg-white/10"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-wider text-champagne/60">Total Uses</p>
            <p className="mt-2 font-display text-3xl text-blush">{stats.usageCount}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-wider text-champagne/60">
              Total Discount Given
            </p>
            <p className="mt-2 font-display text-3xl text-blush">
              ${stats.totalDiscountGiven.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-wider text-champagne/60">
              Average Order Value
            </p>
            <p className="mt-2 font-display text-3xl text-blush">
              ${stats.averageOrderValue.toFixed(2)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full rounded-full bg-blush py-3 text-sm font-medium uppercase tracking-wider text-midnight transition-colors hover:bg-blush/90"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

export default AdminPromoCodes;
