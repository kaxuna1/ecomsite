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
            className="h-24 animate-pulse rounded-2xl bg-white/5 border border-white/10"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
        <p className="text-champagne/60">No products found</p>
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
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-blush focus:ring-2 focus:ring-blush/20"
              />
              <span className="text-sm text-champagne/70">
                {selectedIds.length} selected
              </span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSort('name')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-champagne/70 transition-colors hover:bg-white/5 hover:text-champagne"
          >
            Name
            <ChevronUpDownIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleSort('price')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-champagne/70 transition-colors hover:bg-white/5 hover:text-champagne"
          >
            Price
            <ChevronUpDownIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleSort('inventory')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-champagne/70 transition-colors hover:bg-white/5 hover:text-champagne"
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
                        ? 'border-blush/50 bg-blush/5 shadow-lg shadow-blush/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-xl'
                    }`}
                    whileHover={{ y: -2 }}
                  >
                    {/* Status Indicator Strip */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        status.variant === 'success'
                          ? 'bg-jade'
                          : status.variant === 'warning'
                          ? 'bg-yellow-400'
                          : 'bg-rose-400'
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
                              className="h-5 w-5 rounded-lg border-white/20 bg-white/5 text-blush transition-all focus:ring-2 focus:ring-blush/20"
                            />
                          </div>
                        )}

                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {getProductDisplayImage(product) ? (
                            <div className="relative overflow-hidden rounded-xl ring-1 ring-white/10">
                              <img
                                src={getProductDisplayImage(product)!}
                                alt={product.name}
                                className="h-20 w-20 object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            </div>
                          ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                              <PhotoIcon className="h-8 w-8 text-champagne/20" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <h3 className="mb-1 truncate text-lg font-semibold text-champagne group-hover:text-blush transition-colors">
                                {product.name}
                              </h3>
                              <p className="truncate text-sm text-champagne/60">
                                {product.shortDescription}
                              </p>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                              {product.isNew && (
                                <span className="flex items-center gap-1 rounded-full bg-jade/20 px-2.5 py-1 text-xs font-semibold text-jade">
                                  <StarSolidIcon className="h-3 w-3" />
                                  NEW
                                </span>
                              )}
                              {product.isFeatured && (
                                <span className="flex items-center gap-1 rounded-full bg-blush/20 px-2.5 py-1 text-xs font-semibold text-blush">
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
                                className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-champagne/60"
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
                            <div className="mb-1 flex items-center justify-center gap-1 text-xs text-champagne/50">
                              <CurrencyDollarIcon className="h-3.5 w-3.5" />
                              Price
                            </div>
                            {product.salePrice ? (
                              <div className="text-center">
                                <p className="text-lg font-bold text-rose-400">
                                  ${product.salePrice.toFixed(2)}
                                </p>
                                <p className="text-xs text-champagne/40 line-through">
                                  ${product.price.toFixed(2)}
                                </p>
                              </div>
                            ) : (
                              <p className="text-lg font-bold text-champagne">
                                ${product.price.toFixed(2)}
                              </p>
                            )}
                          </div>

                          {/* Stock */}
                          <div className="text-center">
                            <div className="mb-1 flex items-center justify-center gap-1 text-xs text-champagne/50">
                              <CubeIcon className="h-3.5 w-3.5" />
                              Stock
                            </div>
                            <p className="text-lg font-bold text-champagne">
                              {product.inventory}
                            </p>
                            <p className="text-xs text-champagne/50">units</p>
                          </div>

                          {/* Status */}
                          <div className="text-center">
                            <div className="mb-1 text-xs text-champagne/50">Status</div>
                            <Badge variant={status.variant} size="sm">
                              {status.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions - Always Visible */}
                        <div className="flex flex-shrink-0 items-center gap-1.5 pl-4 border-l border-white/10">
                          <button
                            onClick={() => onEdit(product)}
                            className="group/btn flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-champagne/70 transition-all hover:bg-blush/20 hover:text-blush hover:scale-110"
                            title="Edit Product"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => onManageVariants(product)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-champagne/70 transition-all hover:bg-jade/20 hover:text-jade hover:scale-110"
                            title="Manage Variants"
                          >
                            <Squares2X2Icon className="h-5 w-5" />
                          </button>

                          {onDuplicate && (
                            <button
                              onClick={() => onDuplicate(product)}
                              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-champagne/70 transition-all hover:bg-blue-400/20 hover:text-blue-400 hover:scale-110"
                              title="Duplicate"
                            >
                              <DocumentDuplicateIcon className="h-5 w-5" />
                            </button>
                          )}

                          <button
                            onClick={() => onDelete(product)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-champagne/70 transition-all hover:bg-rose-500/20 hover:text-rose-400 hover:scale-110"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="space-y-4">
                    {/* Header with Image and Selection */}
                    <div className="flex items-start gap-3">
                    {onSelectionChange && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(product.id)}
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-blush focus:ring-2 focus:ring-blush/20"
                      />
                    )}
                    
                    {getProductDisplayImage(product) ? (
                      <img
                        src={getProductDisplayImage(product)!}
                        alt={product.name}
                        className="h-20 w-20 rounded-lg object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                        <PhotoIcon className="h-8 w-8 text-champagne/20" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-champagne line-clamp-2">{product.name}</p>
                        <Badge variant={status.variant} size="sm">{status.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {product.isNew && <Badge variant="success" size="sm">NEW</Badge>}
                        {product.isFeatured && <Badge variant="info" size="sm">FEATURED</Badge>}
                      </div>
                      <p className="text-xs text-champagne/40 line-clamp-1">{product.categories.join(' • ')}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {/* Price */}
                    <div>
                      <p className="text-xs text-champagne/60 mb-1">Price</p>
                      {product.salePrice ? (
                        <div>
                          <p className="font-semibold text-rose-400">${product.salePrice.toFixed(2)}</p>
                          <p className="text-xs text-champagne/40 line-through">${product.price.toFixed(2)}</p>
                        </div>
                      ) : (
                        <p className="font-semibold text-champagne">${product.price.toFixed(2)}</p>
                      )}
                    </div>

                    {/* Stock */}
                    <div>
                      <p className="text-xs text-champagne/60 mb-1">Stock</p>
                      <p className="font-semibold text-champagne">{product.inventory} units</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => onEdit(product)}
                      className="rounded-lg p-2 text-champagne/70 transition-colors hover:bg-blush/10 hover:text-blush"
                      title="Edit Product"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => onManageVariants(product)}
                      className="rounded-lg p-2 text-champagne/70 transition-colors hover:bg-jade/10 hover:text-jade"
                      title="Manage Variants"
                    >
                      <Squares2X2Icon className="h-5 w-5" />
                    </button>

                    {onDuplicate && (
                      <button
                        onClick={() => onDuplicate(product)}
                        className="rounded-lg p-2 text-champagne/70 transition-colors hover:bg-blue-500/10 hover:text-blue-400"
                        title="Duplicate Product"
                      >
                        <DocumentDuplicateIcon className="h-5 w-5" />
                      </button>
                    )}

                    <button
                      onClick={() => onDelete(product)}
                      className="rounded-lg p-2 text-champagne/70 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                      title="Delete Product"
                    >
                      <TrashIcon className="h-5 w-5" />
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
