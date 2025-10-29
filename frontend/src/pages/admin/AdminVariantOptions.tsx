import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  Squares2X2Icon,
  TagIcon
} from '@heroicons/react/24/outline';
import {
  getVariantOptions,
  getAllVariantOptionValues,
  createVariantOption,
  createVariantOptionValue
} from '../../api/variants';
import type { VariantOption, VariantOptionValue } from '../../types/product';

function AdminVariantOptions() {
  const queryClient = useQueryClient();
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState<VariantOption | null>(null);
  const [optionNameInput, setOptionNameInput] = useState('');
  const [optionDisplayOrder, setOptionDisplayOrder] = useState(0);
  const [valueInput, setValueInput] = useState('');
  const [valueDisplayOrder, setValueDisplayOrder] = useState(0);

  const { data: options = [], isLoading: optionsLoading } = useQuery({
    queryKey: ['variant-options'],
    queryFn: getVariantOptions
  });

  const { data: allValues = [], isLoading: valuesLoading } = useQuery({
    queryKey: ['variant-option-values'],
    queryFn: getAllVariantOptionValues
  });

  const createOptionMutation = useMutation({
    mutationFn: (data: { name: string; displayOrder: number }) =>
      createVariantOption(data.name, data.displayOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variant-options'] });
      setShowOptionModal(false);
      setOptionNameInput('');
      setOptionDisplayOrder(0);
    }
  });

  const createValueMutation = useMutation({
    mutationFn: (data: { optionId: number; value: string; displayOrder: number }) =>
      createVariantOptionValue(data.optionId, data.value, data.displayOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variant-option-values'] });
      setShowValueModal(false);
      setValueInput('');
      setValueDisplayOrder(0);
      setSelectedOption(null);
    }
  });

  const handleCreateOption = () => {
    if (!optionNameInput.trim()) return;
    createOptionMutation.mutate({
      name: optionNameInput,
      displayOrder: optionDisplayOrder
    });
  };

  const handleCreateValue = () => {
    if (!selectedOption || !valueInput.trim()) return;
    createValueMutation.mutate({
      optionId: selectedOption.id,
      value: valueInput,
      displayOrder: valueDisplayOrder
    });
  };

  const handleAddValue = (option: VariantOption) => {
    setSelectedOption(option);
    setShowValueModal(true);
  };

  // Group values by option
  const valuesByOption = allValues.reduce((acc, value) => {
    if (!acc[value.optionId]) {
      acc[value.optionId] = [];
    }
    acc[value.optionId].push(value);
    return acc;
  }, {} as Record<number, VariantOptionValue[]>);

  if (optionsLoading || valuesLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blush border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-[0.3em] text-champagne">
            Variant Options
          </h1>
          <p className="mt-2 text-sm text-champagne/60">
            Manage product variant option types (Size, Color, etc.) and their values
          </p>
        </div>
        <motion.button
          type="button"
          onClick={() => setShowOptionModal(true)}
          className="flex items-center gap-2 rounded-full bg-blush px-6 py-3 text-sm font-medium uppercase tracking-wider text-midnight transition-all hover:bg-blush/90"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PlusIcon className="h-5 w-5" />
          Add Option Type
        </motion.button>
      </div>

      {/* Options List */}
      {options.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/10"
        >
          <Squares2X2Icon className="mb-4 h-16 w-16 text-champagne/40" />
          <p className="text-lg text-champagne/60">No variant options yet</p>
          <button
            type="button"
            onClick={() => setShowOptionModal(true)}
            className="mt-4 text-sm text-blush hover:underline"
          >
            Create your first option type
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-6">
          {options.map((option, index) => {
            const values = valuesByOption[option.id] || [];
            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-champagne">{option.name}</h3>
                    <p className="mt-1 text-sm text-champagne/60">
                      Display Order: {option.displayOrder}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddValue(option)}
                    className="flex items-center gap-2 rounded-lg bg-blush/20 px-4 py-2 text-sm font-medium text-blush transition-colors hover:bg-blush/30"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Value
                  </button>
                </div>

                {/* Values */}
                {values.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {values.map((value) => (
                      <div
                        key={value.id}
                        className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5"
                      >
                        <TagIcon className="h-4 w-4 text-champagne/60" />
                        <span className="text-sm font-medium text-champagne">{value.value}</span>
                        <span className="text-xs text-champagne/40">#{value.displayOrder}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-champagne/40">No values yet</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Option Modal */}
      <AnimatePresence>
        {showOptionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/80 p-4 backdrop-blur-sm"
            onClick={() => setShowOptionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-midnight p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl uppercase tracking-wider text-champagne">
                  Create Option Type
                </h2>
                <button
                  type="button"
                  onClick={() => setShowOptionModal(false)}
                  className="rounded-lg p-2 text-champagne/60 transition-colors hover:bg-white/5 hover:text-champagne"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-champagne/80">Name *</label>
                  <input
                    type="text"
                    value={optionNameInput}
                    onChange={(e) => setOptionNameInput(e.target.value)}
                    placeholder="e.g., Material, Scent, Bundle"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-champagne placeholder:text-champagne/40 focus:border-blush focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-champagne/80">Display Order</label>
                  <input
                    type="number"
                    value={optionDisplayOrder}
                    onChange={(e) => setOptionDisplayOrder(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-champagne focus:border-blush focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-champagne/40">Lower numbers appear first</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCreateOption}
                    disabled={!optionNameInput.trim() || createOptionMutation.isPending}
                    className="flex-1 rounded-full bg-blush px-6 py-3 font-medium uppercase tracking-wider text-midnight transition-all hover:bg-blush/90 disabled:opacity-50"
                  >
                    {createOptionMutation.isPending ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOptionModal(false)}
                    className="rounded-full border border-white/10 px-6 py-3 font-medium uppercase tracking-wider text-champagne transition-all hover:bg-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Value Modal */}
      <AnimatePresence>
        {showValueModal && selectedOption && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/80 p-4 backdrop-blur-sm"
            onClick={() => {
              setShowValueModal(false);
              setSelectedOption(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-midnight p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl uppercase tracking-wider text-champagne">
                    Add Value
                  </h2>
                  <p className="mt-1 text-sm text-champagne/60">for {selectedOption.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowValueModal(false);
                    setSelectedOption(null);
                  }}
                  className="rounded-lg p-2 text-champagne/60 transition-colors hover:bg-white/5 hover:text-champagne"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-champagne/80">Value *</label>
                  <input
                    type="text"
                    value={valueInput}
                    onChange={(e) => setValueInput(e.target.value)}
                    placeholder="e.g., Gold, Lavender, 3-Pack"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-champagne placeholder:text-champagne/40 focus:border-blush focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-champagne/80">Display Order</label>
                  <input
                    type="number"
                    value={valueDisplayOrder}
                    onChange={(e) => setValueDisplayOrder(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-champagne focus:border-blush focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-champagne/40">Lower numbers appear first</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCreateValue}
                    disabled={!valueInput.trim() || createValueMutation.isPending}
                    className="flex-1 rounded-full bg-blush px-6 py-3 font-medium uppercase tracking-wider text-midnight transition-all hover:bg-blush/90 disabled:opacity-50"
                  >
                    {createValueMutation.isPending ? 'Adding...' : 'Add Value'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowValueModal(false);
                      setSelectedOption(null);
                    }}
                    className="rounded-full border border-white/10 px-6 py-3 font-medium uppercase tracking-wider text-champagne transition-all hover:bg-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminVariantOptions;
