import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import {
  getProductVariants,
  getVariantOptions,
  getAllVariantOptionValues,
  createVariant,
  updateVariant,
  deleteVariant,
  setDefaultVariant
} from '../../api/variants';
import type { ProductVariant, CreateVariantPayload, UpdateVariantPayload, VariantOption, VariantOptionValue } from '../../types/product';
import Button from './Button';
import Badge from './Badge';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

interface VariantManagerProps {
  productId: number;
  productName: string;
}

interface VariantForm {
  sku: string;
  price?: number;
  salePrice?: number;
  inventory: number;
  weight?: number;
  dimensionsLength?: number;
  dimensionsWidth?: number;
  dimensionsHeight?: number;
  isActive: boolean;
  isDefault: boolean;
  imageUrl?: string;
  selectedOptions: Record<number, number>; // optionId -> valueId
}

export default function VariantManager({ productId, productName }: VariantManagerProps) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);

  const { data: variants = [], isLoading: variantsLoading } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: () => getProductVariants(productId)
  });

  const { data: variantOptions = [], isLoading: optionsLoading } = useQuery({
    queryKey: ['variant-options'],
    queryFn: getVariantOptions
  });

  const { data: variantOptionValues = [], isLoading: valuesLoading } = useQuery({
    queryKey: ['variant-option-values'],
    queryFn: getAllVariantOptionValues
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<VariantForm>({
    defaultValues: {
      sku: '',
      inventory: 0,
      isActive: true,
      isDefault: false,
      selectedOptions: {}
    }
  });

  const selectedOptions = watch('selectedOptions');

  // Group option values by option ID
  const optionValuesMap = variantOptionValues.reduce((acc, value) => {
    if (!acc[value.optionId]) {
      acc[value.optionId] = [];
    }
    acc[value.optionId].push(value);
    return acc;
  }, {} as Record<number, VariantOptionValue[]>);

  const createVariantMutation = useMutation({
    mutationFn: (data: CreateVariantPayload) => createVariant(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      setIsFormOpen(false);
      reset();
    }
  });

  const updateVariantMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateVariantPayload }) => updateVariant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      setIsFormOpen(false);
      setEditingVariant(null);
      reset();
    }
  });

  const deleteVariantMutation = useMutation({
    mutationFn: deleteVariant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultVariant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
    }
  });

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setIsFormOpen(true);

    // Convert options array to selectedOptions map
    const optionsMap = variant.options.reduce((acc, opt) => {
      acc[opt.optionId] = opt.valueId;
      return acc;
    }, {} as Record<number, number>);

    reset({
      sku: variant.sku,
      price: variant.price ?? undefined,
      salePrice: variant.salePrice ?? undefined,
      inventory: variant.inventory,
      weight: variant.weight ?? undefined,
      dimensionsLength: variant.dimensionsLength ?? undefined,
      dimensionsWidth: variant.dimensionsWidth ?? undefined,
      dimensionsHeight: variant.dimensionsHeight ?? undefined,
      isActive: variant.isActive,
      isDefault: variant.isDefault,
      imageUrl: variant.imageUrl ?? undefined,
      selectedOptions: optionsMap
    });
  };

  const handleDelete = async (variantId: number) => {
    if (window.confirm('Are you sure you want to delete this variant?')) {
      deleteVariantMutation.mutate(variantId);
    }
  };

  const handleSetDefault = (variantId: number) => {
    setDefaultMutation.mutate(variantId);
  };

  const onSubmit = (data: VariantForm) => {
    const optionValueIds = Object.values(data.selectedOptions).filter(Boolean);

    if (optionValueIds.length === 0) {
      alert('Please select at least one variant option');
      return;
    }

    const payload = {
      sku: data.sku,
      price: data.price,
      salePrice: data.salePrice,
      inventory: data.inventory,
      weight: data.weight,
      dimensionsLength: data.dimensionsLength,
      dimensionsWidth: data.dimensionsWidth,
      dimensionsHeight: data.dimensionsHeight,
      isActive: data.isActive,
      isDefault: data.isDefault,
      imageUrl: data.imageUrl,
      optionValueIds
    };

    if (editingVariant) {
      updateVariantMutation.mutate({ id: editingVariant.id, data: payload });
    } else {
      createVariantMutation.mutate(payload);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingVariant(null);
    reset();
  };

  // Auto-generate SKU from selected options
  useEffect(() => {
    if (Object.keys(selectedOptions).length > 0 && !editingVariant) {
      const optionLabels = variantOptions
        .map(option => {
          const valueId = selectedOptions[option.id];
          if (!valueId) return null;
          const value = variantOptionValues.find(v => v.id === valueId);
          return value ? value.value : null;
        })
        .filter(Boolean);

      if (optionLabels.length > 0) {
        const sku = `${productName.substring(0, 3).toUpperCase()}-${optionLabels.join('-').toUpperCase()}`;
        setValue('sku', sku.replace(/\s+/g, '-'));
      }
    }
  }, [selectedOptions, variantOptions, variantOptionValues, productName, editingVariant, setValue]);

  if (variantsLoading || optionsLoading || valuesLoading) {
    return <LoadingState message="Loading variants..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-champagne">Product Variants</h3>
          <p className="text-sm text-champagne/60 mt-1">
            Manage size, color, and other variations for {productName}
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          variant="primary"
          size="sm"
        >
          <PlusIcon className="w-4 h-4" />
          Add Variant
        </Button>
      </div>

      {/* Variants List */}
      {variants.length === 0 ? (
        <EmptyState
          icon={<PlusIcon className="w-12 h-12" />}
          title="No variants yet"
          description="Create your first product variant with different options like size or color"
          action={
            <Button onClick={() => setIsFormOpen(true)} variant="primary">
              <PlusIcon className="w-4 h-4" />
              Add First Variant
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {variants.map(variant => (
            <motion.div
              key={variant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-midnight/50 border border-white/10 rounded-2xl p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-champagne">{variant.sku}</h4>
                    {variant.isDefault && (
                      <Badge variant="success">
                        <StarSolidIcon className="w-3 h-3" />
                        Default
                      </Badge>
                    )}
                    {!variant.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {variant.inventory === 0 && (
                      <Badge variant="danger">Out of Stock</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {variant.options.map(opt => (
                      <Badge key={opt.valueId} variant="info">
                        {opt.optionName}: {opt.value}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                    {variant.price !== null && (
                      <div>
                        <span className="text-champagne/60">Price:</span>
                        <span className="ml-2 text-champagne font-medium">
                          ${variant.salePrice ?? variant.price}
                          {variant.salePrice && (
                            <span className="ml-1 line-through text-champagne/40 text-xs">
                              ${variant.price}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-champagne/60">Stock:</span>
                      <span className="ml-2 text-champagne font-medium">{variant.inventory}</span>
                    </div>
                    {variant.weight && (
                      <div>
                        <span className="text-champagne/60">Weight:</span>
                        <span className="ml-2 text-champagne font-medium">{variant.weight}g</span>
                      </div>
                    )}
                    <div>
                      <span className="text-champagne/60">Sales:</span>
                      <span className="ml-2 text-champagne font-medium">{variant.salesCount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {!variant.isDefault && (
                    <button
                      onClick={() => handleSetDefault(variant.id)}
                      className="p-2 text-champagne/60 hover:text-jade hover:bg-white/5 rounded-lg transition-colors"
                      title="Set as default"
                    >
                      <StarIcon className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(variant)}
                    className="p-2 text-champagne/60 hover:text-blush hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(variant.id)}
                    className="p-2 text-champagne/60 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
                    disabled={variants.length === 1}
                    title={variants.length === 1 ? 'Cannot delete the only variant' : 'Delete variant'}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Variant Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-midnight/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-midnight border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-champagne">
                  {editingVariant ? 'Edit Variant' : 'Add New Variant'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-2 text-champagne/60 hover:text-champagne hover:bg-white/5 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Variant Options */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-champagne">
                    Variant Options *
                  </label>
                  {variantOptions.map(option => (
                    <div key={option.id}>
                      <label className="block text-sm text-champagne/80 mb-2">
                        {option.name}
                      </label>
                      <select
                        {...register(`selectedOptions.${option.id}` as const, {
                          required: 'Please select an option'
                        })}
                        className="w-full px-4 py-2 bg-midnight/50 border border-white/10 rounded-lg text-champagne focus:outline-none focus:ring-2 focus:ring-blush"
                      >
                        <option value="">Select {option.name}</option>
                        {(optionValuesMap[option.id] || []).map(value => (
                          <option key={value.id} value={value.id}>
                            {value.value}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-champagne mb-2">
                    SKU *
                  </label>
                  <input
                    type="text"
                    {...register('sku', { required: 'SKU is required' })}
                    className="w-full px-4 py-2 bg-midnight/50 border border-white/10 rounded-lg text-champagne placeholder-champagne/40 focus:outline-none focus:ring-2 focus:ring-blush"
                    placeholder="e.g., PROD-L-RED"
                  />
                  {errors.sku && (
                    <p className="mt-1 text-sm text-rose-400">{errors.sku.message}</p>
                  )}
                </div>

                {/* Price & Sale Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-champagne mb-2">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('price', { min: 0, valueAsNumber: true })}
                      className="w-full px-4 py-2 bg-midnight/50 border border-white/10 rounded-lg text-champagne placeholder-champagne/40 focus:outline-none focus:ring-2 focus:ring-blush"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-champagne mb-2">
                      Sale Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('salePrice', { min: 0, valueAsNumber: true })}
                      className="w-full px-4 py-2 bg-midnight/50 border border-white/10 rounded-lg text-champagne placeholder-champagne/40 focus:outline-none focus:ring-2 focus:ring-blush"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Inventory */}
                <div>
                  <label className="block text-sm font-medium text-champagne mb-2">
                    Inventory *
                  </label>
                  <input
                    type="number"
                    {...register('inventory', {
                      required: 'Inventory is required',
                      min: 0,
                      valueAsNumber: true
                    })}
                    className="w-full px-4 py-2 bg-midnight/50 border border-white/10 rounded-lg text-champagne placeholder-champagne/40 focus:outline-none focus:ring-2 focus:ring-blush"
                    placeholder="0"
                  />
                  {errors.inventory && (
                    <p className="mt-1 text-sm text-rose-400">{errors.inventory.message}</p>
                  )}
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-champagne mb-2">
                    Weight (grams)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('weight', { min: 0, valueAsNumber: true })}
                    className="w-full px-4 py-2 bg-midnight/50 border border-white/10 rounded-lg text-champagne placeholder-champagne/40 focus:outline-none focus:ring-2 focus:ring-blush"
                    placeholder="0.00"
                  />
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-champagne mb-2">
                      Length (cm)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('dimensionsLength', { min: 0, valueAsNumber: true })}
                      className="w-full px-4 py-2 bg-midnight/50 border border-white/10 rounded-lg text-champagne placeholder-champagne/40 focus:outline-none focus:ring-2 focus:ring-blush"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-champagne mb-2">
                      Width (cm)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('dimensionsWidth', { min: 0, valueAsNumber: true })}
                      className="w-full px-4 py-2 bg-midnight/50 border border-white/10 rounded-lg text-champagne placeholder-champagne/40 focus:outline-none focus:ring-2 focus:ring-blush"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-champagne mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('dimensionsHeight', { min: 0, valueAsNumber: true })}
                      className="w-full px-4 py-2 bg-midnight/50 border border-white/10 rounded-lg text-champagne placeholder-champagne/40 focus:outline-none focus:ring-2 focus:ring-blush"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-champagne mb-2">
                    Image URL
                  </label>
                  <input
                    type="text"
                    {...register('imageUrl')}
                    className="w-full px-4 py-2 bg-midnight/50 border border-white/10 rounded-lg text-champagne placeholder-champagne/40 focus:outline-none focus:ring-2 focus:ring-blush"
                    placeholder="https://..."
                  />
                </div>

                {/* Flags */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      {...register('isActive')}
                      className="w-5 h-5 rounded border-white/20 bg-midnight/50 text-blush focus:ring-blush focus:ring-offset-0"
                    />
                    <span className="text-sm text-champagne">Active</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      {...register('isDefault')}
                      className="w-5 h-5 rounded border-white/20 bg-midnight/50 text-blush focus:ring-blush focus:ring-offset-0"
                    />
                    <span className="text-sm text-champagne">Set as default variant</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={createVariantMutation.isPending || updateVariantMutation.isPending}
                  >
                    {editingVariant ? 'Update Variant' : 'Create Variant'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
