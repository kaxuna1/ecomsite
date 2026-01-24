import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PencilIcon,
  TrashIcon,
  Squares2X2Icon,
  CheckIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  EyeSlashIcon,
  PhotoIcon,
  EllipsisVerticalIcon,
  CurrencyDollarIcon,
  CubeIcon,
  TagIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import type { Product } from '../../types/product';
import Badge from './Badge';

// Helper function to get the display image for a product
// Prioritizes: Featured media image > First media image > Legacy imageUrl
const getProductDisplayImage = (product: Product): string | null => {
  if (product.images && product.images.length > 0) {
    // Find featured image
    const featuredImage = product.images.find(img => img.isFeatured);
    if (featuredImage?.url) {
      return featuredImage.url;
    }
    // Return first image
    if (product.images[0]?.url) {
      return product.images[0].url;
    }
  }
  // Fallback to legacy imageUrl
  return product.imageUrl || null;
};

interface ProductTableProps {
  products: Product[];
  isLoading?: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onManageVariants: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
  onUpdateField?: (productId: number, field: string, value: any) => Promise<void>;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
}

interface EditingCell {
  productId: number;
  field: string;
  value: any;
}

export default function ProductTable({
  products,
  isLoading = false,
  onEdit,
  onDelete,
  onManageVariants,
  onDuplicate,
  onUpdateField,
  selectedIds = [],
  onSelectionChange
}: ProductTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [sortColumn, setSortColumn] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Handle sorting
  const sortedProducts = useMemo(() => {
    if (!sortColumn) return products;

    return [...products].sort((a, b) => {
      let aVal = a[sortColumn as keyof Product];
      let bVal = b[sortColumn as keyof Product];

      // Handle different data types
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [products, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const startEditing = (productId: number, field: string, currentValue: any) => {
    if (!onUpdateField) return;
    setEditingCell({ productId, field, value: currentValue });
    setEditValue(currentValue);
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingCell || !onUpdateField) return;

    try {
      await onUpdateField(editingCell.productId, editingCell.field, editValue);
      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Failed to update field:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;

    if (selectedIds.length === products.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(products.map(p => p.id));
    }
  };

  const toggleSelect = (productId: number) => {
    if (!onSelectionChange) return;

    if (selectedIds.includes(productId)) {
      onSelectionChange(selectedIds.filter(id => id !== productId));
    } else {
      onSelectionChange([...selectedIds, productId]);
    }
  };

  const isEditing = (productId: number, field: string) => {
    return editingCell?.productId === productId && editingCell?.field === field;
  };

  const getStockStatus = (inventory: number): { variant: 'success' | 'warning' | 'error'; label: string } => {
    if (inventory === 0) return { variant: 'error', label: 'Out of Stock' };
    if (inventory <= 10) return { variant: 'warning', label: 'Low Stock' };
    return { variant: 'success', label: 'In Stock' };
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
                        className="h-24 animate-pulse rounded-2xl bg-bg-elevated border border-border-default"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-border-default bg-bg-elevated p-12 text-center">
        <p className="text-text-secondary">No products found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop: Sort & Selection Controls */}
      <div className="hidden md:flex items-center justify-between mb-4 px-2 flex-wrap gap-3">
        <div className="flex items-center gap-4 min-w-0">
          {onSelectionChange && selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <input
                type="checkbox"
                checked={selectedIds.length === products.length}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-border-default bg-bg-elevated text-primary focus:ring-2 focus:ring-primary/20 flex-shrink-0"
              />
              <span className="text-sm text-text-secondary whitespace-nowrap">
                {selectedIds.length} selected
              </span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleSort('name')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary whitespace-nowrap"
          >
            Name
            <ChevronUpDownIcon className="h-3.5 w-3.5 flex-shrink-0" />
          </button>
          <button
            onClick={() => handleSort('price')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary whitespace-nowrap"
          >
            Price
            <ChevronUpDownIcon className="h-3.5 w-3.5 flex-shrink-0" />
          </button>
          <button
            onClick={() => handleSort('inventory')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary whitespace-nowrap"
          >
            Stock
            <ChevronUpDownIcon className="h-3.5 w-3.5 flex-shrink-0" />
          </button>
        </div>
      </div>

      {/* Product Grid/List */}
      <div className="space-y-3">
        <AnimatePresence>
          {sortedProducts.map((product, index) => {
            const status = getStockStatus(product.inventory);
            const isSelected = selectedIds.includes(product.id);
            const isHovered = hoveredRow === product.id;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                {/* Unified Card Layout - Stacked structure for all screen sizes */}
                <motion.div
                  className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isSelected
                      ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/10'
                      : 'border-border-default bg-bg-elevated hover:border-border-strong hover:bg-bg-secondary hover:shadow-xl'
                  }`}
                  onMouseEnter={() => setHoveredRow(product.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  whileHover={{ y: -2 }}
                >
                  {/* Status Indicator Strip */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      status.variant === 'success'
                        ? 'bg-emerald-500'
                        : status.variant === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />

                  <div className="p-4 sm:p-5 pl-5 sm:pl-6 space-y-4">
                    {/* Row 1: Product Info */}
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Checkbox */}
                      {onSelectionChange && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(product.id)}
                          title="Select product"
                          className="mt-1 h-5 w-5 rounded border-border-default bg-bg-elevated text-primary focus:ring-2 focus:ring-primary/20 flex-shrink-0"
                        />
                      )}

                      {/* Product Image */}
                      {getProductDisplayImage(product) ? (
                        <div className="relative overflow-hidden rounded-xl ring-1 ring-border-default flex-shrink-0">
                          <img
                            src={getProductDisplayImage(product)!}
                            alt={product.name}
                            className="h-16 w-16 sm:h-20 sm:w-20 object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-xl bg-bg-secondary ring-1 ring-border-default flex-shrink-0">
                          <PhotoIcon className="h-6 w-6 sm:h-8 sm:w-8 text-text-tertiary" />
                        </div>
                      )}

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-semibold text-base sm:text-lg text-text-primary group-hover:text-primary transition-colors line-clamp-2 flex-1 min-w-0">
                            {product.name}
                          </h3>
                          <Badge variant={status.variant} size="sm" className="flex-shrink-0">
                            {status.label}
                          </Badge>
                        </div>
                        
                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {product.isNew && (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                              <StarSolidIcon className="h-3 w-3" />
                              NEW
                            </span>
                          )}
                          {product.isFeatured && (
                            <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                              <TagIcon className="h-3 w-3" />
                              FEATURED
                            </span>
                          )}
                        </div>

                        {/* Short Description */}
                        <p className="text-xs sm:text-sm text-text-secondary line-clamp-1 mb-2">
                          {product.shortDescription}
                        </p>

                        {/* Categories */}
                        <div className="flex flex-wrap gap-1.5">
                          {product.categories.slice(0, 3).map((cat, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-bg-secondary px-2 py-0.5 text-xs text-text-secondary"
                            >
                              {cat}
                            </span>
                          ))}
                          {product.categories.length > 3 && (
                            <span className="rounded-md bg-bg-secondary px-2 py-0.5 text-xs text-text-tertiary">
                              +{product.categories.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 bg-bg-secondary/50 rounded-xl p-3 sm:p-4">
                      {/* Price */}
                      <div>
                        <p className="text-xs text-text-tertiary mb-1 font-medium flex items-center gap-1">
                          <CurrencyDollarIcon className="h-3.5 w-3.5" />
                          Price
                        </p>
                        {product.salePrice ? (
                          <div>
                            <p className="font-bold text-base sm:text-lg text-rose-400">
                              ${product.salePrice.toFixed(2)}
                            </p>
                            <p className="text-xs text-text-tertiary line-through">
                              ${product.price.toFixed(2)}
                            </p>
                          </div>
                        ) : (
                          <p className="font-bold text-base sm:text-lg text-text-primary">
                            ${product.price.toFixed(2)}
                          </p>
                        )}
                      </div>

                      {/* Stock */}
                      <div>
                        <p className="text-xs text-text-tertiary mb-1 font-medium flex items-center gap-1">
                          <CubeIcon className="h-3.5 w-3.5" />
                          Stock
                        </p>
                        <p className="font-bold text-base sm:text-lg text-text-primary">
                          {product.inventory}
                        </p>
                        <p className="text-xs text-text-tertiary">units</p>
                      </div>

                      {/* Sales - visible on sm+ */}
                      <div className="hidden sm:block">
                        <p className="text-xs text-text-tertiary mb-1 font-medium flex items-center gap-1">
                          <ChartBarIcon className="h-3.5 w-3.5" />
                          Sales
                        </p>
                        <p className="font-bold text-base sm:text-lg text-text-primary">
                          {product.salesCount || 0}
                        </p>
                        <p className="text-xs text-text-tertiary">sold</p>
                      </div>

                      {/* Created - visible on lg+ */}
                      <div className="hidden lg:block">
                        <p className="text-xs text-text-tertiary mb-1 font-medium flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          Created
                        </p>
                        <p className="font-bold text-sm text-text-primary">
                          {product.createdAt 
                            ? new Date(product.createdAt).toLocaleDateString() 
                            : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Row 3: Actions */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-default">
                      <button
                        onClick={() => onEdit(product)}
                        className="group/edit flex items-center gap-2 rounded-lg px-3 py-2 text-text-secondary transition-all hover:bg-primary/10 hover:text-primary active:scale-95"
                        title="Edit Product"
                        aria-label="Edit Product"
                      >
                        <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-sm font-medium hidden sm:inline">Edit</span>
                      </button>

                      <button
                        onClick={() => onManageVariants(product)}
                        className="group/variants flex items-center gap-2 rounded-lg px-3 py-2 text-text-secondary transition-all hover:bg-emerald-500/10 hover:text-emerald-400 active:scale-95"
                        title="Manage Variants"
                        aria-label="Manage Variants"
                      >
                        <Squares2X2Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-sm font-medium hidden sm:inline">Variants</span>
                      </button>

                      {onDuplicate && (
                        <button
                          onClick={() => onDuplicate(product)}
                          className="group/duplicate flex items-center gap-2 rounded-lg px-3 py-2 text-text-secondary transition-all hover:bg-blue-500/10 hover:text-blue-400 active:scale-95"
                          title="Duplicate Product"
                          aria-label="Duplicate Product"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="text-sm font-medium hidden md:inline">Duplicate</span>
                        </button>
                      )}

                      <button
                        onClick={() => onDelete(product)}
                        className="group/delete flex items-center gap-2 rounded-lg px-3 py-2 text-text-secondary transition-all hover:bg-rose-500/10 hover:text-rose-400 active:scale-95"
                        title="Delete Product"
                        aria-label="Delete Product"
                      >
                        <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-sm font-medium hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
