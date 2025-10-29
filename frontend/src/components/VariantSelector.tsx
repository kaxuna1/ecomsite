import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/outline';
import { getProductVariants, getVariantOptions, getAllVariantOptionValues } from '../api/variants';
import type { ProductVariant, VariantOption, VariantOptionValue } from '../types/product';

interface VariantSelectorProps {
  productId: number;
  onVariantChange?: (variant: ProductVariant | null) => void;
  className?: string;
}

export default function VariantSelector({ productId, onVariantChange, className = '' }: VariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const hasAutoSelectedRef = useRef(false);

  // Reset auto-selection flag when product changes
  useEffect(() => {
    hasAutoSelectedRef.current = false;
    setSelectedOptions({});
    setSelectedVariant(null);
  }, [productId]);

  const { data: variants = [], isLoading: variantsLoading } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: () => getProductVariants(productId)
  });

  const { data: variantOptions = [], isLoading: optionsLoading } = useQuery({
    queryKey: ['variant-options'],
    queryFn: getVariantOptions
  });

  const { data: allOptionValues = [], isLoading: valuesLoading } = useQuery({
    queryKey: ['variant-option-values'],
    queryFn: getAllVariantOptionValues
  });

  // Group option values by option ID
  const optionValuesMap = useMemo(() => {
    return allOptionValues.reduce((acc, value) => {
      if (!acc[value.optionId]) {
        acc[value.optionId] = [];
      }
      acc[value.optionId].push(value);
      return acc;
    }, {} as Record<number, VariantOptionValue[]>);
  }, [allOptionValues]);

  // Get available option values for this product's variants
  const availableOptionValues = useMemo(() => {
    const available = new Set<number>();
    variants.forEach(variant => {
      variant.options.forEach(opt => {
        available.add(opt.valueId);
      });
    });
    return available;
  }, [variants]);

  // Filter to only show options that have values used in variants
  const relevantOptions = useMemo(() => {
    return variantOptions.filter(option => {
      const values = optionValuesMap[option.id] || [];
      return values.some(value => availableOptionValues.has(value.id));
    });
  }, [variantOptions, optionValuesMap, availableOptionValues]);

  // Auto-select default variant on initial load
  useEffect(() => {
    if (variants.length > 0 && !hasAutoSelectedRef.current) {
      hasAutoSelectedRef.current = true;
      // Select default variant or first variant if no options selected
      const defaultVariant = variants.find(v => v.isDefault) || variants[0];
      if (defaultVariant) {
        // Build selectedOptions from the default variant's options
        const initialOptions: Record<number, number> = {};
        defaultVariant.options.forEach(opt => {
          initialOptions[opt.optionId] = opt.valueId;
        });
        setSelectedOptions(initialOptions);
        setSelectedVariant(defaultVariant);
        onVariantChange?.(defaultVariant);
      }
    }
  }, [variants, onVariantChange]); // Only run when variants load

  // Find matching variant based on selected options
  useEffect(() => {
    if (Object.keys(selectedOptions).length === 0) {
      return; // Let the auto-select effect handle initial selection
    }

    const matchingVariant = variants.find(variant => {
      return variant.options.every(opt => {
        const selected = selectedOptions[opt.optionId];
        return selected === opt.valueId;
      });
    });

    setSelectedVariant(matchingVariant || null);
    onVariantChange?.(matchingVariant || null);
  }, [selectedOptions, variants, onVariantChange]);

  // Check if an option value would result in an available variant
  const isOptionValueAvailable = (optionId: number, valueId: number) => {
    const testSelection = { ...selectedOptions, [optionId]: valueId };

    return variants.some(variant => {
      return Object.entries(testSelection).every(([optId, valId]) => {
        return variant.options.some(opt =>
          opt.optionId === Number(optId) && opt.valueId === valId
        );
      });
    });
  };

  const handleOptionChange = (optionId: number, valueId: number) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: valueId
    }));
  };

  if (variantsLoading || optionsLoading || valuesLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (variants.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {relevantOptions.map(option => {
        const values = (optionValuesMap[option.id] || []).filter(v =>
          availableOptionValues.has(v.id)
        );

        if (values.length === 0) return null;

        const selectedValue = selectedOptions[option.id];

        return (
          <div key={option.id}>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              {option.name}
              {selectedValue && (
                <span className="ml-2 text-gray-600 dark:text-gray-400 font-normal">
                  {values.find(v => v.id === selectedValue)?.value}
                </span>
              )}
            </label>

            <div className="flex flex-wrap gap-2">
              {values.map(value => {
                const isSelected = selectedValue === value.id;
                const isAvailable = isOptionValueAvailable(option.id, value.id);
                const isDisabled = !isAvailable;

                return (
                  <button
                    key={value.id}
                    type="button"
                    onClick={() => handleOptionChange(option.id, value.id)}
                    disabled={isDisabled}
                    className={`
                      relative px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all
                      ${isSelected
                        ? 'border-blush bg-blush text-white shadow-md'
                        : isDisabled
                        ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed line-through'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-blush hover:shadow-sm'
                      }
                    `}
                  >
                    {value.value}
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-jade rounded-full p-0.5"
                      >
                        <CheckIcon className="w-3 h-3 text-white" />
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Selected Variant Info */}
      {selectedVariant && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">SKU:</span>
              <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                {selectedVariant.sku}
              </span>
            </div>
            <div>
              {selectedVariant.inventory > 0 ? (
                <span className="text-jade font-medium">
                  {selectedVariant.inventory} in stock
                </span>
              ) : (
                <span className="text-rose-500 font-medium">
                  Out of stock
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
