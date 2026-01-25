import { GlobeAltIcon } from '@heroicons/react/24/outline';
import CMSPageActionsMenu from './CMSPageActionsMenu';
import CMSPageBlocksPanel from './CMSPageBlocksPanel';

interface CMSPageCardProps {
  id: number;
  title: string;
  slug: string;
  isPublished: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

export default function CMSPageCard({
  id,
  title,
  slug,
  isPublished,
  isExpanded,
  onToggleExpand,
  onToggleStatus,
  onDelete
}: CMSPageCardProps) {
  // Detect special slugs
  const isGlobalHeader = slug === '_global-header';
  const isSpecialPage = slug.startsWith('_');

  return (
    <div className="bg-bg-elevated rounded-xl border border-border-default hover:border-primary/30 transition-colors">
      {/* Card Header */}
      <div className="flex items-start justify-between p-4 relative">
        <div className="flex-1 min-w-0">
          {/* Title and Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-text-primary truncate">
              {title}
            </h3>
            
            {/* Status Badge */}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                isPublished
                  ? 'bg-primary/20 text-primary'
                  : 'bg-warning/20 text-warning'
              }`}
            >
              {isPublished ? 'Published' : 'Draft'}
            </span>

            {/* Special Page Badge */}
            {isSpecialPage && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary/20 text-secondary whitespace-nowrap">
                {isGlobalHeader ? 'Global Header' : 'System'}
              </span>
            )}
          </div>

          {/* Slug */}
          <div className="flex items-center gap-1.5 mt-2">
            <GlobeAltIcon className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-sm text-text-secondary font-mono truncate">
              /{slug}
            </p>
          </div>
        </div>

        {/* Kebab Menu */}
        <CMSPageActionsMenu
          pageId={id}
          slug={slug}
          isPublished={isPublished}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      </div>

      {/* Blocks Panel (collapsed by default) */}
      <CMSPageBlocksPanel
        pageId={id}
        isExpanded={isExpanded}
        onToggle={onToggleExpand}
      />
    </div>
  );
}
