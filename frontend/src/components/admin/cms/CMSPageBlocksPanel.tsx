import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, CubeIcon } from '@heroicons/react/24/outline';
import { fetchPageBlocks, type CMSBlock } from '../../../api/cmsAdmin';

interface CMSPageBlocksPanelProps {
  pageId: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function CMSPageBlocksPanel({
  pageId,
  isExpanded,
  onToggle
}: CMSPageBlocksPanelProps) {
  // Only fetch blocks when panel is expanded (lazy loading)
  const { data: blocks, isLoading } = useQuery({
    queryKey: ['cms-blocks', pageId],
    queryFn: () => fetchPageBlocks(pageId),
    enabled: isExpanded
  });

  return (
    <div className="border-t border-border-default">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <CubeIcon className="h-4 w-4" />
          View Blocks
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              ) : blocks && blocks.length > 0 ? (
                <div className="space-y-2">
                  {blocks.map((block: CMSBlock, index: number) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg border border-border-default"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary text-xs font-semibold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {block.blockKey}
                          </p>
                          <p className="text-xs text-text-tertiary">
                            {block.blockType}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          block.isEnabled !== false
                            ? 'bg-primary/10 text-primary'
                            : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {block.isEnabled !== false ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-sm text-text-tertiary">
                  No blocks in this page
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
