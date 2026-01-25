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
import { AIVariantOptionsGenerator } from '../../components/admin/AIVariantOptionsGenerator';
import { AIVariantOptionsTypeGenerator } from '../../components/admin/AIVariantOptionsTypeGenerator';
import type { GeneratedVariantValue, GeneratedVariantOptionType } from '../../api/ai';
import PageHeader from '../../components/admin/PageHeader';
import LoadingState from '../../components/admin/LoadingState';
import EmptyState from '../../components/admin/EmptyState';

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
    createValueMutation.mutate(
      {
        optionId: selectedOption.id,
        value: valueInput,
        displayOrder: valueDisplayOrder
      },
      {
        onSuccess: () => {
          setShowValueModal(false);
          setValueInput('');
          setValueDisplayOrder(0);
          setSelectedOption(null);
        }
      }
    );
  };

  const handleAddValue = (option: VariantOption) => {
    setSelectedOption(option);
    setShowValueModal(true);
  };

  const handleAIValuesGenerated = async (option: VariantOption, values: GeneratedVariantValue[]) => {
    const optionId = option.id;
    const optionName = option.name;

    console.log(`📦 Adding ${values.length} AI-generated values to ${optionName}`);

    let successCount = 0;
    let failCount = 0;

    // Add each generated value sequentially
    for (const value of values) {
      try {
        await createValueMutation.mutateAsync({
          optionId: optionId,
          value: value.displayName,
          displayOrder: value.sortOrder
        });
        successCount++;
        console.log(`✅ Added: ${value.displayName}`);
      } catch (error) {
        failCount++;
        console.error(`❌ Failed to add value: ${value.displayName}`, error);
      }
    }

    console.log(`✅ Complete: ${successCount} added, ${failCount} failed`);

    // Final refetch to ensure UI is in sync
    await queryClient.invalidateQueries({ queryKey: ['variant-option-values'] });
  };

  const handleAIOptionsGenerated = async (generatedOptions: GeneratedVariantOptionType[]) => {
    console.log(`📦 Adding ${generatedOptions.length} AI-generated option types`);

    let successCount = 0;
    let failCount = 0;

    // Add each generated option type sequentially
    for (const option of generatedOptions) {
      try {
        await createOptionMutation.mutateAsync({
          name: option.name,
          displayOrder: option.displayOrder
        });
        successCount++;
        console.log(`✅ Added: ${option.name}`);
      } catch (error) {
        failCount++;
        console.error(`❌ Failed to add option type: ${option.name}`, error);
      }
    }

    console.log(`✅ Complete: ${successCount} added, ${failCount} failed`);

    // Final refetch to ensure UI is in sync
    await queryClient.invalidateQueries({ queryKey: ['variant-options'] });
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
    return <LoadingState message="Loading variant options..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Variant Options"
        description="Manage product variant option types (Size, Color, etc.) and their values"
        actions={(
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <AIVariantOptionsTypeGenerator
              existingOptions={options.map(o => o.name)}
              onOptionsGenerated={handleAIOptionsGenerated}
            />
            <motion.button
              type="button"
              onClick={() => setShowOptionModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-interactive-default px-6 py-3 text-xs font-medium uppercase tracking-wider text-on-interactive transition-all hover:bg-interactive-hover sm:w-auto sm:text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <PlusIcon className="h-5 w-5" />
              Add Option Type
            </motion.button>
          </div>
        )}
      />

      {/* Options List */}
      {options.length === 0 ? (
        <EmptyState
          icon={<Squares2X2Icon className="h-12 w-12" />}
          title="No variant options yet"
          description="Create your first option type to start adding sizes, colors, and other variants."
          action={{
            label: 'Create option type',
            onClick: () => setShowOptionModal(true)
          }}
        />
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
                className="rounded-2xl border border-border-default bg-bg-elevated p-6 backdrop-blur-sm"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary">{option.name}</h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      Display Order: {option.displayOrder}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AIVariantOptionsGenerator
                      optionName={option.name}
                      existingValues={values.map(v => v.value)}
                      onValuesGenerated={(generatedValues) => {
                        handleAIValuesGenerated(option, generatedValues);
                      }}
                    />
                    <button
                      onClick={() => handleAddValue(option)}
                      className="flex items-center gap-2 rounded-lg bg-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/30"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Value
                    </button>
                  </div>
                </div>

                {/* Values */}
                {values.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {values.map((value) => (
                      <div
                        key={value.id}
                        className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-secondary px-3 py-1.5"
                      >
                        <TagIcon className="h-4 w-4 text-text-secondary" />
                        <span className="text-sm font-medium text-text-primary">{value.value}</span>
                        <span className="text-xs text-text-tertiary">#{value.displayOrder}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-tertiary">No values yet</p>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm"
            onClick={() => setShowOptionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-border-default bg-bg-elevated p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl uppercase tracking-wider text-text-primary">
                  Create Option Type
                </h2>
                <button
                  type="button"
                  onClick={() => setShowOptionModal(false)}
                  className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-text-primary">Name *</label>
                  <input
                    type="text"
                    value={optionNameInput}
                    onChange={(e) => setOptionNameInput(e.target.value)}
                    placeholder="e.g., Material, Scent, Bundle"
                    className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-text-primary">Display Order</label>
                  <input
                    type="number"
                    value={optionDisplayOrder}
                    onChange={(e) => setOptionDisplayOrder(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2 text-text-primary focus:border-primary focus:outline-none transition-colors"
                  />
                  <p className="mt-1 text-xs text-text-tertiary">Lower numbers appear first</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCreateOption}
                    disabled={!optionNameInput.trim() || createOptionMutation.isPending}
                    className="flex-1 rounded-full bg-interactive-default px-6 py-3 font-medium uppercase tracking-wider text-on-interactive transition-all hover:bg-interactive-hover disabled:opacity-50"
                  >
                    {createOptionMutation.isPending ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOptionModal(false)}
                    className="rounded-full border border-border-default px-6 py-3 font-medium uppercase tracking-wider text-text-primary transition-all hover:bg-bg-secondary"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm"
            onClick={() => {
              setShowValueModal(false);
              setSelectedOption(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-border-default bg-bg-elevated p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl uppercase tracking-wider text-text-primary">
                    Add Value
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">for {selectedOption.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowValueModal(false);
                    setSelectedOption(null);
                  }}
                  className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-text-primary">Value *</label>
                  <input
                    type="text"
                    value={valueInput}
                    onChange={(e) => setValueInput(e.target.value)}
                    placeholder="e.g., Gold, Lavender, 3-Pack"
                    className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-text-primary">Display Order</label>
                  <input
                    type="number"
                    value={valueDisplayOrder}
                    onChange={(e) => setValueDisplayOrder(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2 text-text-primary focus:border-primary focus:outline-none transition-colors"
                  />
                  <p className="mt-1 text-xs text-text-tertiary">Lower numbers appear first</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCreateValue}
                    disabled={!valueInput.trim() || createValueMutation.isPending}
                    className="flex-1 rounded-full bg-interactive-default px-6 py-3 font-medium uppercase tracking-wider text-on-interactive transition-all hover:bg-interactive-hover disabled:opacity-50"
                  >
                    {createValueMutation.isPending ? 'Adding...' : 'Add Value'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowValueModal(false);
                      setSelectedOption(null);
                    }}
                    className="rounded-full border border-border-default px-6 py-3 font-medium uppercase tracking-wider text-text-primary transition-all hover:bg-bg-secondary"
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
