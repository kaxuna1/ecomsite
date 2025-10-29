import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export default function UnsavedChangesModal({
  isOpen,
  onSave,
  onDiscard,
  onCancel
}: UnsavedChangesModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-midnight/90 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-midnight p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-champagne">
                  Unsaved Changes
                </h3>
                <p className="mt-2 text-sm text-champagne/70">
                  You have unsaved changes. What would you like to do?
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
              <button
                onClick={onSave}
                className="rounded-full bg-blush px-6 py-3 text-sm font-semibold text-midnight transition-colors hover:bg-champagne"
              >
                Save & Leave
              </button>
              <button
                onClick={onDiscard}
                className="rounded-full border border-rose-500/50 bg-rose-500/10 px-6 py-3 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-500/20"
              >
                Discard Changes
              </button>
              <button
                onClick={onCancel}
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-champagne transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
