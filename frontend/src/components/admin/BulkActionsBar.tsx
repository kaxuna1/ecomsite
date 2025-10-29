import { motion, AnimatePresence } from 'framer-motion';
import {
  TrashIcon,
  TagIcon,
  SparklesIcon,
  FireIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkSetNew: (value: boolean) => void;
  onBulkSetFeatured: (value: boolean) => void;
  onBulkSetActive: (value: boolean) => void;
}

export default function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkSetNew,
  onBulkSetFeatured,
  onBulkSetActive
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="rounded-2xl border border-white/20 bg-midnight/95 px-6 py-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-6">
              {/* Selection Info */}
              <div className="flex items-center gap-3 border-r border-white/20 pr-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blush/20 text-sm font-bold text-blush">
                  {selectedCount}
                </div>
                <span className="text-sm font-medium text-champagne">
                  {selectedCount === 1 ? '1 product selected' : `${selectedCount} products selected`}
                </span>
                <button
                  onClick={onClearSelection}
                  className="rounded-full p-1 text-champagne/60 transition-colors hover:bg-white/10 hover:text-champagne"
                  title="Clear selection"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Bulk Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onBulkSetNew(true)}
                  className="flex items-center gap-2 rounded-lg bg-jade/20 px-3 py-2 text-sm font-medium text-jade transition-colors hover:bg-jade/30"
                  title="Mark as New"
                >
                  <SparklesIcon className="h-4 w-4" />
                  Mark as New
                </button>

                <button
                  onClick={() => onBulkSetFeatured(true)}
                  className="flex items-center gap-2 rounded-lg bg-blue-500/20 px-3 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/30"
                  title="Mark as Featured"
                >
                  <FireIcon className="h-4 w-4" />
                  Mark as Featured
                </button>

                <button
                  onClick={() => onBulkSetActive(false)}
                  className="flex items-center gap-2 rounded-lg bg-amber-500/20 px-3 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/30"
                  title="Set Inactive"
                >
                  <EyeSlashIcon className="h-4 w-4" />
                  Set Inactive
                </button>

                <div className="h-6 w-px bg-white/20" />

                <button
                  onClick={onBulkDelete}
                  className="flex items-center gap-2 rounded-lg bg-rose-500/20 px-3 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/30"
                  title="Delete selected"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
