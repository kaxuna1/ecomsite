import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon
} from '@heroicons/react/24/outline';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortAccessor?: (item: T) => string | number | Date | boolean | null | undefined;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  sortable?: boolean;
  defaultSort?: {
    key: string;
    direction: 'asc' | 'desc';
  };
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyState,
  onRowClick,
  rowClassName,
  sortable = true,
  defaultSort
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(defaultSort || null);

  const handleSort = (key: string) => {
    if (!sortable) return;

    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const sortColumn = sortConfig ? columns.find((column) => column.key === sortConfig.key) : null;

  const normalizeValue = (value: any) => {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return value;
    return value?.toString?.() ?? '';
  };

  const compareValues = (a: any, b: any) => {
    if (a === b) return 0;
    if (a === null || a === undefined) return 1;
    if (b === null || b === undefined) return -1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'string' && typeof b === 'string') return collator.compare(a, b);
    return a > b ? 1 : -1;
  };

  const sortedData = sortConfig
    ? [...data].sort((a, b) => {
        const aRaw = sortColumn?.sortAccessor ? sortColumn.sortAccessor(a) : a[sortConfig.key];
        const bRaw = sortColumn?.sortAccessor ? sortColumn.sortAccessor(b) : b[sortConfig.key];
        const comparison = compareValues(normalizeValue(aRaw), normalizeValue(bRaw));
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      })
    : data;

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronUpDownIcon className="h-4 w-4 text-champagne/30" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 text-jade" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-jade" />
    );
  };

  const alignClasses: Record<'left' | 'center' | 'right', string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white/5 border border-white/10 sm:rounded-3xl">
      <div className="overflow-x-auto -mx-3 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-3 sm:px-0">
          <table className="min-w-full divide-y divide-white/10" aria-busy={loading || undefined}>
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      sortConfig && sortConfig.key === column.key
                        ? sortConfig.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider text-champagne/60 sm:px-4 sm:py-4 lg:px-6 ${alignClasses[column.align || 'left']}`}
                    style={{ width: column.width }}
                  >
                    {column.sortable !== false && sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column.key)}
                        className="flex items-center gap-1.5 hover:text-champagne sm:gap-2"
                        aria-label={`Sort by ${column.label}`}
                      >
                        <span className="truncate">{column.label}</span>
                        {getSortIcon(column.key)}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="truncate">{column.label}</span>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-bg-elevated">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-12 text-center sm:px-6">
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-jade border-t-transparent" />
                      <span className="text-sm text-champagne/60">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-12 sm:px-6">
                    {emptyState || (
                      <div className="text-center text-champagne/60">No data available</div>
                    )}
                  </td>
                </tr>
              ) : (
                sortedData.map((item, index) => (
                  <motion.tr
                    key={keyExtractor(item)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`transition-colors hover:bg-white/5 ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${rowClassName ? rowClassName(item) : ''}`}
                    onClick={() => onRowClick?.(item)}
                    tabIndex={onRowClick ? 0 : -1}
                    role={onRowClick ? 'button' : undefined}
                    onKeyDown={(event) => {
                      if (!onRowClick) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onRowClick(item);
                      }
                    }}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-3 py-3 text-sm text-champagne sm:px-4 sm:py-4 lg:px-6 ${alignClasses[column.align || 'left']}`}
                      >
                        {column.render ? column.render(item) : item[column.key]}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
