import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrashIcon,
  SparklesIcon,
  FireIcon,
  XMarkIcon,
  EyeSlashIcon,
  EllipsisVerticalIcon
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileMenu]);

  const handleAction = (action: () => void) => {
    action();
    setShowMobileMenu(false);
  };

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <>
          {/* Desktop Version - Bottom Fixed Bar */}
          <div className="hidden md:flex fixed bottom-6 left-0 right-0 z-50 justify-center pointer-events-none">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="pointer-events-auto"
            >
              <div className="rounded-2xl border border-white/20 bg-gradient-to-r from-midnight/98 to-midnight/95 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
                <div className="flex items-center gap-6 px-6 py-4">
                {/* Selection Info */}
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-blush/20 ring-2 ring-blush/30"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <span className="text-lg font-bold text-blush">{selectedCount}</span>
                  </motion.div>
                  
                  <div>
                    <p className="text-sm font-semibold text-champagne whitespace-nowrap">
                      {selectedCount === 1 ? '1 Selected' : `${selectedCount} Selected`}
                    </p>
                  </div>

                  <button
                    onClick={onClearSelection}
                    className="rounded-lg p-2 text-champagne/60 transition-all hover:bg-white/10 hover:text-champagne hover:scale-110"
                    title="Clear selection"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => onBulkSetNew(true)}
                    className="group flex items-center gap-2 rounded-xl bg-jade/10 px-4 py-2.5 text-sm font-medium text-jade transition-all hover:bg-jade/20 hover:shadow-lg hover:shadow-jade/20 hover:scale-105"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    title="Mark as New"
                  >
                    <SparklesIcon className="h-4 w-4 transition-transform group-hover:rotate-12" />
                    <span>New</span>
                  </motion.button>

                  <motion.button
                    onClick={() => onBulkSetFeatured(true)}
                    className="group flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-400 transition-all hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    title="Mark as Featured"
                  >
                    <FireIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
                    <span>Featured</span>
                  </motion.button>

                  <motion.button
                    onClick={() => onBulkSetActive(false)}
                    className="group flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-400 transition-all hover:bg-amber-500/20 hover:shadow-lg hover:shadow-amber-500/20 hover:scale-105"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    title="Set Inactive"
                  >
                    <EyeSlashIcon className="h-4 w-4" />
                    <span>Inactive</span>
                  </motion.button>

                  <div className="mx-2 h-8 w-px bg-white/20" />

                  <motion.button
                    onClick={onBulkDelete}
                    className="group flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-400 transition-all hover:bg-rose-500/20 hover:shadow-lg hover:shadow-rose-500/20 hover:scale-105"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    title="Delete selected"
                  >
                    <TrashIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
                    <span>Delete</span>
                  </motion.button>
                </div>
              </div>
              </div>
            </motion.div>
          </div>

          {/* Mobile Version - Compact Sticky Bar */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="md:hidden sticky top-0 z-50 border-b border-white/10 bg-midnight/98 backdrop-blur-xl shadow-xl"
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                {/* Selection Count */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blush/20 ring-1 ring-blush/30">
                    <span className="text-sm font-bold text-blush">{selectedCount}</span>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-champagne">
                      {selectedCount} Selected
                    </p>
                    <p className="text-xs text-champagne/60">Tap actions</p>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="flex items-center gap-2">
                  {/* Delete - Always visible on mobile */}
                  <button
                    onClick={onBulkDelete}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 transition-all hover:bg-rose-500/30 active:scale-95"
                    title="Delete"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>

                  {/* More Actions Menu */}
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setShowMobileMenu(!showMobileMenu)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-champagne transition-all hover:bg-white/20 active:scale-95"
                      title="More actions"
                    >
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {showMobileMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-xl border border-white/20 bg-midnight/98 shadow-2xl backdrop-blur-xl ring-1 ring-white/10"
                        >
                          <div className="p-2">
                            <button
                              onClick={() => handleAction(() => onBulkSetNew(true))}
                              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-champagne transition-colors hover:bg-jade/10 hover:text-jade"
                            >
                              <SparklesIcon className="h-5 w-5 text-jade" />
                              <span>Mark as New</span>
                            </button>

                            <button
                              onClick={() => handleAction(() => onBulkSetFeatured(true))}
                              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-champagne transition-colors hover:bg-blue-500/10 hover:text-blue-400"
                            >
                              <FireIcon className="h-5 w-5 text-blue-400" />
                              <span>Mark as Featured</span>
                            </button>

                            <button
                              onClick={() => handleAction(() => onBulkSetActive(false))}
                              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-champagne transition-colors hover:bg-amber-500/10 hover:text-amber-400"
                            >
                              <EyeSlashIcon className="h-5 w-5 text-amber-400" />
                              <span>Set Inactive</span>
                            </button>

                            <div className="my-2 h-px bg-white/10" />

                            <button
                              onClick={() => handleAction(onClearSelection)}
                              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-champagne/60 transition-colors hover:bg-white/5 hover:text-champagne"
                            >
                              <XMarkIcon className="h-5 w-5" />
                              <span>Clear Selection</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
