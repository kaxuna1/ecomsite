import { useState, forwardRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  SwatchIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import {
  getAllAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  type AttributeDefinition,
  type AttributeDefinitionPayload
} from '../../api/attributes';
import { AIAttributeGenerator } from '../../components/admin/AIAttributeGenerator';
import { type GeneratedAttribute } from '../../api/ai';
import toast from 'react-hot-toast';
import PageHeader from '../../components/admin/PageHeader';
import SearchInput from '../../components/admin/SearchInput';
import LoadingState from '../../components/admin/LoadingState';
import EmptyState from '../../components/admin/EmptyState';

const dataTypeLabels: Record<AttributeDefinition['dataType'], string> = {
  text: 'Text',
  number: 'Number',
  boolean: 'Boolean',
  select: 'Select (Single)',
  multiselect: 'Multi-Select',
  date: 'Date'
};

function AdminAttributes() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<AttributeDefinition | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const { data: attributes = [], isLoading } = useQuery({
    queryKey: ['admin-attributes'],
    queryFn: getAllAttributes
  });

  const createMutation = useMutation({
    mutationFn: createAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-attributes'] });
      setShowModal(false);
      setEditingAttribute(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AttributeDefinitionPayload> }) =>
      updateAttribute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-attributes'] });
      setShowModal(false);
      setEditingAttribute(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-attributes'] });
      setShowDeleteConfirm(null);
    }
  });

  const filteredAttributes = attributes.filter((attr) =>
    attr.attributeLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attr.attributeKey.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (attr?: AttributeDefinition) => {
    setEditingAttribute(attr || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAttribute(null);
  };

  const handleAIGenerated = (generatedAttributes: GeneratedAttribute[]) => {
    // Create attributes in batch
    const promises = generatedAttributes.map(attr =>
      createAttribute({
        attributeKey: attr.attributeKey,
        attributeLabel: attr.attributeLabel,
        dataType: attr.dataType,
        isSearchable: attr.isSearchable,
        isFilterable: attr.isFilterable,
        isRequired: attr.isRequired,
        options: attr.options,
        displayOrder: 0
      })
    );

    Promise.all(promises)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['admin-attributes'] });
        toast.success(`Successfully created ${generatedAttributes.length} attributes!`, {
          duration: 4000
        });
      })
      .catch((error) => {
        console.error('Error creating attributes:', error);
        toast.error('Some attributes failed to create. Check console for details.');
      });
  };

  const existingAttributeKeys = attributes.map(attr => attr.attributeKey);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Product Attributes"
        description="Define custom attributes for product categorization and filtering"
        actions={(
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <AIAttributeGenerator
              existingAttributes={existingAttributeKeys}
              onAttributesGenerated={handleAIGenerated}
            />
            <motion.button
              type="button"
              onClick={() => handleOpenModal()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-interactive-default px-6 py-3 text-xs font-medium uppercase tracking-wider text-on-interactive transition-all hover:bg-interactive-hover sm:w-auto sm:text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <PlusIcon className="h-5 w-5" />
              Create Attribute
            </motion.button>
          </div>
        )}
      />

      {/* Search */}
      <div>
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={searchQuery ? () => setSearchQuery('') : undefined}
          placeholder="Search attributes..."
          label="Search attributes"
          resultsCount={filteredAttributes.length}
          resultsLabel="attributes"
        />
      </div>

      {/* Attributes List */}
      {isLoading ? (
        <LoadingState message="Loading attributes..." />
      ) : filteredAttributes.length === 0 ? (
        <EmptyState
          icon={<SwatchIcon className="h-12 w-12" />}
          title={searchQuery ? 'No attributes found' : 'No attributes yet'}
          description={searchQuery ? 'Try adjusting your search.' : 'Create your first attribute to get started.'}
          action={
            !searchQuery
              ? {
                  label: 'Create attribute',
                  onClick: () => handleOpenModal()
                }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredAttributes.map((attr, index) => (
              <AttributeCard
                key={attr.id}
                attribute={attr}
                index={index}
                onEdit={() => handleOpenModal(attr)}
                onDelete={() => setShowDeleteConfirm(attr.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <AttributeModal
            attribute={editingAttribute}
            onClose={handleCloseModal}
            onSubmit={(data) => {
              if (editingAttribute) {
                updateMutation.mutate({ id: editingAttribute.id, data });
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
    </div>
  );
}

// Attribute Card Component
interface AttributeCardProps {
  attribute: AttributeDefinition;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

const AttributeCard = forwardRef<HTMLDivElement, AttributeCardProps>(function AttributeCard({
  attribute,
  index,
  onEdit,
  onDelete
}, ref) {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-border-default bg-bg-elevated p-3 backdrop-blur-sm sm:p-4 lg:p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-text-primary">{attribute.attributeLabel}</h3>
            <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
              {dataTypeLabels[attribute.dataType]}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">Key: {attribute.attributeKey}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {attribute.isSearchable && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
                <CheckIcon className="h-3 w-3" />
                Searchable
              </span>
            )}
            {attribute.isFilterable && (
              <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
                <CheckIcon className="h-3 w-3" />
                Filterable
              </span>
            )}
            {attribute.isRequired && (
              <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-1 text-xs text-orange-400">
                <CheckIcon className="h-3 w-3" />
                Required
              </span>
            )}
          </div>

          {attribute.options && attribute.options.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs text-text-tertiary">Options:</p>
              <div className="flex flex-wrap gap-1">
                {attribute.options.map((opt, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-bg-secondary px-2 py-0.5 text-xs text-text-primary"
                  >
                    {opt.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg bg-bg-secondary p-2 text-text-secondary transition-all hover:bg-bg-elevated hover:text-text-primary"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg bg-bg-secondary p-2 text-red-400/60 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

AttributeCard.displayName = 'AttributeCard';

// Attribute Modal Component
function AttributeModal({
  attribute,
  onClose,
  onSubmit,
  isSubmitting
}: {
  attribute: AttributeDefinition | null;
  onClose: () => void;
  onSubmit: (data: AttributeDefinitionPayload) => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<AttributeDefinitionPayload>({
    attributeKey: attribute?.attributeKey || '',
    attributeLabel: attribute?.attributeLabel || '',
    dataType: attribute?.dataType || 'text',
    isSearchable: attribute?.isSearchable ?? false,
    isFilterable: attribute?.isFilterable ?? false,
    isRequired: attribute?.isRequired ?? false,
    validationRules: attribute?.validationRules || {},
    options: attribute?.options || [],
    categoryIds: attribute?.categoryIds || [],
    displayOrder: attribute?.displayOrder ?? 0
  });

  const [optionInput, setOptionInput] = useState({ value: '', label: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addOption = () => {
    if (optionInput.value && optionInput.label) {
      setFormData({
        ...formData,
        options: [...(formData.options || []), { ...optionInput }]
      });
      setOptionInput({ value: '', label: '' });
    }
  };

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options?.filter((_, i) => i !== index)
    });
  };

  const needsOptions = formData.dataType === 'select' || formData.dataType === 'multiselect';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 p-2 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border-default bg-bg-elevated p-4 sm:rounded-3xl sm:p-6 lg:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <h2 className="font-display text-lg uppercase tracking-wider text-text-primary sm:text-xl sm:tracking-[0.2em] lg:text-2xl truncate pr-2">
            {attribute ? 'Edit Attribute' : 'Create Attribute'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-text-primary">Attribute Key *</label>
              <input
                type="text"
                value={formData.attributeKey}
                onChange={(e) => setFormData({ ...formData, attributeKey: e.target.value })}
                disabled={!!attribute}
                placeholder="e.g., hair_type"
                required
                className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none disabled:opacity-50 transition-colors"
              />
              <p className="mt-1 text-xs text-text-tertiary">Unique identifier (cannot be changed)</p>
            </div>

            <div>
              <label className="mb-2 block text-sm text-text-primary">Label *</label>
              <input
                type="text"
                value={formData.attributeLabel}
                onChange={(e) => setFormData({ ...formData, attributeLabel: e.target.value })}
                placeholder="e.g., Hair Type"
                required
                className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-text-primary">Data Type *</label>
            <select
              value={formData.dataType}
              onChange={(e) => setFormData({ ...formData, dataType: e.target.value as any })}
              className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2 text-text-primary focus:border-primary focus:outline-none transition-colors"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="select">Select (Single)</option>
              <option value="multiselect">Multi-Select</option>
              <option value="date">Date</option>
            </select>
          </div>

          {needsOptions && (
            <div>
              <label className="mb-2 block text-sm text-text-primary">Options *</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={optionInput.value}
                    onChange={(e) => setOptionInput({ ...optionInput, value: e.target.value })}
                    placeholder="Value (e.g., dry)"
                    className="flex-1 rounded-lg border border-border-default bg-bg-elevated px-4 py-2 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none transition-colors"
                  />
                  <input
                    type="text"
                    value={optionInput.label}
                    onChange={(e) => setOptionInput({ ...optionInput, label: e.target.value })}
                    placeholder="Label (e.g., Dry)"
                    className="flex-1 rounded-lg border border-border-default bg-bg-elevated px-4 py-2 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={addOption}
                    className="rounded-lg bg-interactive-default px-4 py-2 text-on-interactive transition-colors hover:bg-interactive-hover"
                  >
                    Add
                  </button>
                </div>

                {formData.options && formData.options.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {formData.options.map((opt, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-border-default bg-bg-elevated px-3 py-2"
                      >
                        <span className="text-sm text-text-primary">
                          <span className="text-text-secondary">{opt.value}</span> → {opt.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeOption(i)}
                          className="text-red-400/60 hover:text-red-400"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isSearchable}
                onChange={(e) => setFormData({ ...formData, isSearchable: e.target.checked })}
                className="h-4 w-4 rounded border-border-default bg-bg-elevated text-primary focus:ring-primary/20"
              />
              <span className="text-sm text-text-primary">Searchable</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isFilterable}
                onChange={(e) => setFormData({ ...formData, isFilterable: e.target.checked })}
                className="h-4 w-4 rounded border-border-default bg-bg-elevated text-primary focus:ring-primary/20"
              />
              <span className="text-sm text-text-primary">Filterable</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isRequired}
                onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                className="h-4 w-4 rounded border-border-default bg-bg-elevated text-primary focus:ring-primary/20"
              />
              <span className="text-sm text-text-primary">Required</span>
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm text-text-primary">Display Order</label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2 text-text-primary focus:border-primary focus:outline-none transition-colors"
            />
            <p className="mt-1 text-xs text-text-tertiary">Lower numbers appear first</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-full bg-interactive-default px-6 py-3 font-medium uppercase tracking-wider text-on-interactive transition-all hover:bg-interactive-hover disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : attribute ? 'Update Attribute' : 'Create Attribute'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border-default px-6 py-3 font-medium uppercase tracking-wider text-text-primary transition-all hover:bg-bg-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({
  onConfirm,
  onCancel,
  isDeleting
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 p-2 backdrop-blur-sm sm:p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md rounded-2xl border border-border-default bg-bg-elevated p-4 sm:rounded-3xl sm:p-6 lg:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 font-display text-xl uppercase tracking-wider text-text-primary">
          Delete Attribute?
        </h3>
        <p className="mb-6 text-text-secondary">
          This will permanently delete this attribute definition and remove it from all products that use it.
          Products will not be deleted, only the attribute data will be removed.
        </p>
        <p className="mb-6 text-sm text-orange-400">
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-full bg-red-500 px-6 py-3 font-medium uppercase tracking-wider text-white transition-all hover:bg-red-600 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-border-default px-6 py-3 font-medium uppercase tracking-wider text-text-primary transition-all hover:bg-bg-secondary"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AdminAttributes;
