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
  TagIcon
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
      <div className="hidden md:flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-4">
          {onSelectionChange && selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <input
                type="checkbox"
                checked={selectedIds.length === products.length}
                onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-border-default bg-bg-elevated text-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-sm text-text-secondary">
                {selectedIds.length} selected
              </span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSort('name')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
          >
            Name
            <ChevronUpDownIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleSort('price')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
          >
            Price
            <ChevronUpDownIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleSort('inventory')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
          >
            Stock
            <ChevronUpDownIcon className="h-3.5 w-3.5" />
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
                {/* Desktop Card Layout */}
                <div
                  className="hidden md:block"
                  onMouseEnter={() => setHoveredRow(product.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <motion.div
                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                      isSelected
                        ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/10'
                        : 'border-border-default bg-bg-elevated hover:border-border-strong hover:bg-bg-secondary hover:shadow-xl'
                    }`}
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

                    <div className="p-5 pl-7">
                      <div className="flex items-center gap-5">
                        {/* Checkbox */}
                        {onSelectionChange && (
                          <div className="flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(product.id)}
                              className="h-5 w-5 rounded-lg border-border-default bg-bg-elevated text-primary transition-all focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        )}

                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {getProductDisplayImage(product) ? (
                            <div className="relative overflow-hidden rounded-xl ring-1 ring-border-default">
                              <img
                                src={getProductDisplayImage(product)!}
                                alt={product.name}
                                className="h-20 w-20 object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            </div>
                          ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-bg-secondary ring-1 ring-border-default">
                              <PhotoIcon className="h-8 w-8 text-text-tertiary" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <h3 className="mb-1 truncate text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                                {product.name}
                              </h3>
                              <p className="truncate text-sm text-text-secondary">
                                {product.shortDescription}
                              </p>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                              {product.isNew && (
                                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                                  <StarSolidIcon className="h-3 w-3" />
                                  NEW
                                </span>
                              )}
                              {product.isFeatured && (
                                <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
                                  <TagIcon className="h-3 w-3" />
                                  FEATURED
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Categories */}
                          <div className="flex flex-wrap gap-1.5">
                            {product.categories.map((cat, i) => (
                              <span
                                key={i}
                                className="rounded-md bg-bg-secondary px-2 py-0.5 text-xs text-text-secondary"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="flex flex-shrink-0 items-center gap-6">
                          {/* Price */}
                          <div className="text-center">
                            <div className="mb-1 flex items-center justify-center gap-1 text-xs text-text-tertiary">
                              <CurrencyDollarIcon className="h-3.5 w-3.5" />
                              Price
                            </div>
                            {product.salePrice ? (
                              <div className="text-center">
                                <p className="text-lg font-bold text-rose-400">
                                  ${product.salePrice.toFixed(2)}
                                </p>
                                <p className="text-xs text-text-tertiary line-through">
                                  ${product.price.toFixed(2)}
                                </p>
                              </div>
                            ) : (
                              <p className="text-lg font-bold text-text-primary">
                                ${product.price.toFixed(2)}
                              </p>
                            )}
                          </div>

                          {/* Stock */}
                          <div className="text-center">
                            <div className="mb-1 flex items-center justify-center gap-1 text-xs text-text-tertiary">
                              <CubeIcon className="h-3.5 w-3.5" />
                              Stock
                            </div>
                            <p className="text-lg font-bold text-text-primary">
                              {product.inventory}
                            </p>
                            <p className="text-xs text-text-tertiary">units</p>
                          </div>

                          {/* Status */}
                          <div className="text-center">
                            <div className="mb-1 text-xs text-text-tertiary">Status</div>
                            <Badge variant={status.variant} size="sm">
                              {status.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions - Always Visible */}
                        <div className="flex flex-shrink-0 items-center gap-1.5 pl-4 border-l border-border-default">
                          <button
                            onClick={() => onEdit(product)}
                            className="group/btn relative flex h-10 w-10 items-center justify-center rounded-lg bg-bg-secondary text-text-secondary transition-all hover:bg-primary/20 hover:text-primary hover:scale-110"
                          >
                            <PencilIcon className="h-5 w-5" />
                            {/* Tooltip */}
                            <div className="invisible absolute right-full top-1/2 z-50 mr-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary shadow-lg ring-1 ring-border-default opacity-0 transition-all group-hover/btn:visible group-hover/btn:opacity-100">
                              Edit Product
                              <div className="absolute left-full top-1/2 -ml-1 h-2 w-2 -translate-y-1/2 rotate-45 bg-bg-elevated ring-1 ring-border-default ring-l-0 ring-t-0"></div>
                            </div>
                          </button>

                          <button
                            onClick={() => onManageVariants(product)}
                            className="group/variants relative flex h-10 w-10 items-center justify-center rounded-lg bg-bg-secondary text-text-secondary transition-all hover:bg-emerald-500/20 hover:text-emerald-400 hover:scale-110"
                          >
                            <Squares2X2Icon className="h-5 w-5" />
                            {/* Tooltip */}
                            <div className="invisible absolute right-full top-1/2 z-50 mr-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary shadow-lg ring-1 ring-border-default opacity-0 transition-all group-hover/variants:visible group-hover/variants:opacity-100">
                              Manage Variants & SKUs
                              <div className="absolute left-full top-1/2 -ml-1 h-2 w-2 -translate-y-1/2 rotate-45 bg-bg-elevated ring-1 ring-border-default ring-l-0 ring-t-0"></div>
                            </div>
                          </button>

                          {onDuplicate && (
                            <button
                              onClick={() => onDuplicate(product)}
                              className="group/duplicate relative flex h-10 w-10 items-center justify-center rounded-lg bg-bg-secondary text-text-secondary transition-all hover:bg-blue-500/20 hover:text-blue-400 hover:scale-110"
                            >
                              <DocumentDuplicateIcon className="h-5 w-5" />
                              {/* Tooltip */}
                              <div className="invisible absolute right-full top-1/2 z-50 mr-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary shadow-lg ring-1 ring-border-default opacity-0 transition-all group-hover/duplicate:visible group-hover/duplicate:opacity-100">
                                Duplicate Product
                                <div className="absolute left-full top-1/2 -ml-1 h-2 w-2 -translate-y-1/2 rotate-45 bg-bg-elevated ring-1 ring-border-default ring-l-0 ring-t-0"></div>
                              </div>
                            </button>
                          )}

                          <button
                            onClick={() => onDelete(product)}
                            className="group/delete relative flex h-10 w-10 items-center justify-center rounded-lg bg-bg-secondary text-text-secondary transition-all hover:bg-rose-500/20 hover:text-rose-400 hover:scale-110"
                          >
                            <TrashIcon className="h-5 w-5" />
                            {/* Tooltip */}
                            <div className="invisible absolute right-full top-1/2 z-50 mr-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary shadow-lg ring-1 ring-border-default opacity-0 transition-all group-hover/delete:visible group-hover/delete:opacity-100">
                              Delete Product
                              <div className="absolute left-full top-1/2 -ml-1 h-2 w-2 -translate-y-1/2 rotate-45 bg-bg-elevated ring-1 ring-border-default ring-l-0 ring-t-0"></div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden rounded-2xl border border-border-default bg-bg-elevated p-4">
                  <div className="space-y-4">
                    {/* Header with Image and Selection */}
                    <div className="flex items-start gap-3">
                    {onSelectionChange && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(product.id)}
                        className="mt-1 h-4 w-4 rounded border-border-default bg-bg-elevated text-primary focus:ring-2 focus:ring-primary/20"
                      />
                    )}
                    
                    {getProductDisplayImage(product) ? (
                      <img
                        src={getProductDisplayImage(product)!}
                        alt={product.name}
                        className="h-20 w-20 rounded-lg object-cover ring-1 ring-border-default"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-bg-secondary ring-1 ring-border-default">
                        <PhotoIcon className="h-8 w-8 text-text-tertiary" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-text-primary line-clamp-2">{product.name}</p>
                        <Badge variant={status.variant} size="sm">{status.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {product.isNew && <Badge variant="success" size="sm">NEW</Badge>}
                        {product.isFeatured && <Badge variant="info" size="sm">FEATURED</Badge>}
                      </div>
                      <p className="text-xs text-text-tertiary line-clamp-1">{product.categories.join(' • ')}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {/* Price */}
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Price</p>
                      {product.salePrice ? (
                        <div>
                          <p className="font-semibold text-rose-400">${product.salePrice.toFixed(2)}</p>
                          <p className="text-xs text-text-tertiary line-through">${product.price.toFixed(2)}</p>
                        </div>
                      ) : (
                        <p className="font-semibold text-text-primary">${product.price.toFixed(2)}</p>
                      )}
                    </div>

                    {/* Stock */}
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Stock</p>
                      <p className="font-semibold text-text-primary">{product.inventory} units</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-default">
                    <button
                      onClick={() => onEdit(product)}
                      className="group/edit-mobile relative rounded-lg p-2 text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <PencilIcon className="h-5 w-5" />
                      {/* Tooltip */}
                      <div className="invisible absolute bottom-full right-0 z-50 mb-2 whitespace-nowrap rounded-lg bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary shadow-lg ring-1 ring-border-default opacity-0 transition-all group-hover/edit-mobile:visible group-hover/edit-mobile:opacity-100">
                        Edit Product
                        <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-1 h-2 w-2 rotate-45 bg-bg-elevated ring-1 ring-border-default ring-l-0 ring-t-0"></div>
                      </div>
                    </button>

                    <button
                      onClick={() => onManageVariants(product)}
                      className="group/variants-mobile relative rounded-lg p-2 text-text-secondary transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
                    >
                      <Squares2X2Icon className="h-5 w-5" />
                      {/* Tooltip */}
                      <div className="invisible absolute bottom-full right-0 z-50 mb-2 whitespace-nowrap rounded-lg bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary shadow-lg ring-1 ring-border-default opacity-0 transition-all group-hover/variants-mobile:visible group-hover/variants-mobile:opacity-100">
                        Manage Variants & SKUs
                        <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-1 h-2 w-2 rotate-45 bg-bg-elevated ring-1 ring-border-default ring-l-0 ring-t-0"></div>
                      </div>
                    </button>

                    {onDuplicate && (
                      <button
                        onClick={() => onDuplicate(product)}
                        className="group/duplicate-mobile relative rounded-lg p-2 text-text-secondary transition-colors hover:bg-blue-500/10 hover:text-blue-400"
                      >
                        <DocumentDuplicateIcon className="h-5 w-5" />
                        {/* Tooltip */}
                        <div className="invisible absolute bottom-full right-0 z-50 mb-2 whitespace-nowrap rounded-lg bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary shadow-lg ring-1 ring-border-default opacity-0 transition-all group-hover/duplicate-mobile:visible group-hover/duplicate-mobile:opacity-100">
                          Duplicate Product
                          <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-1 h-2 w-2 rotate-45 bg-bg-elevated ring-1 ring-border-default ring-l-0 ring-t-0"></div>
                        </div>
                      </button>
                    )}

                    <button
                      onClick={() => onDelete(product)}
                      className="group/delete-mobile relative rounded-lg p-2 text-text-secondary transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <TrashIcon className="h-5 w-5" />
                      {/* Tooltip */}
                      <div className="invisible absolute bottom-full right-0 z-50 mb-2 whitespace-nowrap rounded-lg bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary shadow-lg ring-1 ring-border-default opacity-0 transition-all group-hover/delete-mobile:visible group-hover/delete-mobile:opacity-100">
                        Delete Product
                        <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-1 h-2 w-2 rotate-45 bg-bg-elevated ring-1 ring-border-default ring-l-0 ring-t-0"></div>
                      </div>
                    </button>
                  </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
