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
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import type { Product } from '../../types/product';
import Badge from './Badge';

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
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-midnight/50">
      {/* Table Header */}
      <div className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_auto] gap-4 border-b border-white/10 bg-white/5 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-champagne/70">
        {onSelectionChange && (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedIds.length === products.length && products.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-blush focus:ring-2 focus:ring-blush/20"
            />
          </div>
        )}

        <button
          onClick={() => handleSort('name')}
          className="flex items-center gap-2 text-left hover:text-champagne transition-colors"
        >
          Product
          <ChevronUpDownIcon className="h-4 w-4" />
        </button>

        <button
          onClick={() => handleSort('price')}
          className="flex items-center gap-2 hover:text-champagne transition-colors"
        >
          Price
          <ChevronUpDownIcon className="h-4 w-4" />
        </button>

        <button
          onClick={() => handleSort('inventory')}
          className="flex items-center gap-2 hover:text-champagne transition-colors"
        >
          Stock
          <ChevronUpDownIcon className="h-4 w-4" />
        </button>

        <div>Status</div>

        <div className="text-right">Actions</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-white/5">
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
                transition={{ duration: 0.2, delay: index * 0.03 }}
                onMouseEnter={() => setHoveredRow(product.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`grid grid-cols-[auto_2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 transition-colors ${
                  isSelected ? 'bg-blush/10' : 'hover:bg-white/5'
                }`}
              >
                {/* Checkbox */}
                {onSelectionChange && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(product.id)}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-blush focus:ring-2 focus:ring-blush/20"
                    />
                  </div>
                )}

                {/* Product Info */}
                <div className="flex items-center gap-4">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-champagne">{product.name}</p>
                      {product.isNew && <Badge variant="success" size="sm">NEW</Badge>}
                      {product.isFeatured && <Badge variant="info" size="sm">FEATURED</Badge>}
                    </div>
                    <p className="truncate text-sm text-champagne/60">{product.shortDescription}</p>
                    <p className="truncate text-xs text-champagne/40">{product.categories.join(' • ')}</p>
                  </div>
                </div>

                {/* Price - Inline Editable */}
                <div className="flex items-center">
                  {isEditing(product.id, 'price') ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(parseFloat(e.target.value))}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-24 rounded-lg border border-blush bg-white/10 px-2 py-1 text-sm text-champagne focus:outline-none focus:ring-2 focus:ring-blush/20"
                      />
                      <button
                        onClick={saveEdit}
                        className="rounded-full p-1 text-jade hover:bg-jade/10"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="rounded-full p-1 text-rose-400 hover:bg-rose-500/10"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(product.id, 'price', product.price)}
                      className="group flex items-center gap-2 text-left"
                      disabled={!onUpdateField}
                    >
                      <div>
                        {product.salePrice ? (
                          <>
                            <p className="font-semibold text-rose-400">${product.salePrice.toFixed(2)}</p>
                            <p className="text-xs text-champagne/40 line-through">${product.price.toFixed(2)}</p>
                          </>
                        ) : (
                          <p className="font-semibold text-champagne">${product.price.toFixed(2)}</p>
                        )}
                      </div>
                      {onUpdateField && (isHovered || isEditing(product.id, 'price')) && (
                        <PencilIcon className="h-3.5 w-3.5 text-champagne/40 opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </button>
                  )}
                </div>

                {/* Inventory - Inline Editable */}
                <div className="flex items-center">
                  {isEditing(product.id, 'inventory') ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(parseInt(e.target.value))}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-20 rounded-lg border border-blush bg-white/10 px-2 py-1 text-sm text-champagne focus:outline-none focus:ring-2 focus:ring-blush/20"
                      />
                      <button
                        onClick={saveEdit}
                        className="rounded-full p-1 text-jade hover:bg-jade/10"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="rounded-full p-1 text-rose-400 hover:bg-rose-500/10"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(product.id, 'inventory', product.inventory)}
                      className="group flex items-center gap-2"
                      disabled={!onUpdateField}
                    >
                      <p className="text-champagne">{product.inventory} units</p>
                      {onUpdateField && (isHovered || isEditing(product.id, 'inventory')) && (
                        <PencilIcon className="h-3.5 w-3.5 text-champagne/40 opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </button>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <AnimatePresence>
                    {isHovered && (
                      <>
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => onEdit(product)}
                          title="Edit Product"
                          className="rounded-lg p-2 text-champagne/70 transition-colors hover:bg-blush/10 hover:text-blush"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </motion.button>

                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ delay: 0.05 }}
                          onClick={() => onManageVariants(product)}
                          title="Manage Variants"
                          className="rounded-lg p-2 text-champagne/70 transition-colors hover:bg-jade/10 hover:text-jade"
                        >
                          <Squares2X2Icon className="h-4 w-4" />
                        </motion.button>

                        {onDuplicate && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ delay: 0.1 }}
                            onClick={() => onDuplicate(product)}
                            title="Duplicate Product"
                            className="rounded-lg p-2 text-champagne/70 transition-colors hover:bg-blue-500/10 hover:text-blue-400"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </motion.button>
                        )}

                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ delay: 0.15 }}
                          onClick={() => onDelete(product)}
                          title="Delete Product"
                          className="rounded-lg p-2 text-champagne/70 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </motion.button>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
