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

  const sortedData = sortConfig
    ? [...data].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal === bVal) return 0;

        const comparison = aVal > bVal ? 1 : -1;
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

  return (
    <div className="overflow-hidden rounded-3xl bg-white/5 border border-white/10">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-${column.align || 'left'} text-xs font-semibold uppercase tracking-wider text-champagne/60 ${
                    column.sortable !== false && sortable ? 'cursor-pointer hover:text-champagne' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable !== false && sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable !== false && sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-jade border-t-transparent" />
                    <span className="text-sm text-champagne/60">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12">
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
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 text-${column.align || 'left'} text-champagne`}
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
  );
}
