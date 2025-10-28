// Editable Block Wrapper - Shows edit controls when in edit mode
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import type { CMSBlock } from '../../types/cms';
import BlockRenderer from './BlockRenderer';

interface EditableBlockProps {
  block: CMSBlock & { id: number; displayOrder: number; isEnabled: boolean };
  isEditMode: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleEnabled: () => void;
}

export default function EditableBlock({
  block,
  isEditMode,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleEnabled
}: EditableBlockProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!isEditMode) {
    return <BlockRenderer block={block} />;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Edit Overlay */}
      <AnimatePresence>
        {isHovered && (
          <>
            {/* Outline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 border-4 border-jade rounded-lg pointer-events-none z-40"
              style={{ boxShadow: '0 0 0 4px rgba(139, 186, 156, 0.1)' }}
            />

            {/* Toolbar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-midnight/95 backdrop-blur-xl border border-jade/50 rounded-lg shadow-2xl p-2"
            >
              {/* Block Type Badge */}
              <div className="px-3 py-1.5 bg-jade/20 text-jade rounded-md text-xs font-semibold uppercase tracking-wider border border-jade/30">
                {block.blockType}
              </div>

              {/* Separator */}
              <div className="w-px h-6 bg-champagne/20" />

              {/* Move Up */}
              <button
                onClick={onMoveUp}
                disabled={isFirst}
                className="p-2 text-champagne hover:text-jade hover:bg-jade/10 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-champagne"
                title="Move up"
              >
                <ArrowUpIcon className="h-4 w-4" />
              </button>

              {/* Move Down */}
              <button
                onClick={onMoveDown}
                disabled={isLast}
                className="p-2 text-champagne hover:text-jade hover:bg-jade/10 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-champagne"
                title="Move down"
              >
                <ArrowDownIcon className="h-4 w-4" />
              </button>

              {/* Separator */}
              <div className="w-px h-6 bg-champagne/20" />

              {/* Edit Button */}
              <button
                onClick={onEdit}
                className="px-3 py-2 text-champagne hover:text-jade hover:bg-jade/10 rounded-md transition-all font-medium text-sm flex items-center gap-2"
                title="Edit block"
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </button>

              {/* Enable/Disable Toggle */}
              <button
                onClick={onToggleEnabled}
                className={`px-3 py-2 rounded-md transition-all font-medium text-sm ${
                  block.isEnabled
                    ? 'text-champagne hover:text-amber-400 hover:bg-amber-400/10'
                    : 'text-amber-400 hover:text-champagne hover:bg-jade/10'
                }`}
                title={block.isEnabled ? 'Disable block' : 'Enable block'}
              >
                {block.isEnabled ? 'Hide' : 'Show'}
              </button>

              {/* Delete Button */}
              <button
                onClick={onDelete}
                className="p-2 text-champagne hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all"
                title="Delete block"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </motion.div>

            {/* Disabled Overlay */}
            {!block.isEnabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-midnight/60 backdrop-blur-sm z-30 flex items-center justify-center rounded-lg"
              >
                <div className="px-6 py-3 bg-amber-500/90 text-midnight rounded-full font-semibold text-sm shadow-xl">
                  Block Hidden - Not visible on live site
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Block Content */}
      <div className={!block.isEnabled ? 'opacity-40' : ''}>
        <BlockRenderer block={block} />
      </div>
    </div>
  );
}
