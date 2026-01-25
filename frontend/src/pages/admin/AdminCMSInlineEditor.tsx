// Inline CMS Page Editor - Edit blocks directly on the page with slide-out panel
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
  fetchCMSPage,
  fetchPageBlocks,
  updateCMSPage,
  updateCMSBlock,
  deleteCMSBlock,
  reorderCMSBlocks,
  createCMSBlock,
  type CMSPage,
  type CMSBlock
} from '../../api/cmsAdmin';
import EditableBlock from '../../components/cms/EditableBlock';
import VisualBlockEditor from '../../components/cms/editors/VisualBlockEditor';
import { getBlockTemplate, getBlockTemplateJSON } from '../../utils/blockTemplates';

export default function AdminCMSInlineEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pageId = parseInt(id!);

  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  // Fetch page and blocks
  const { data: page, isLoading: pageLoading } = useQuery({
    queryKey: ['cms-page', pageId],
    queryFn: () => fetchCMSPage(pageId),
    enabled: !!pageId
  });

  const { data: blocks = [], isLoading: blocksLoading } = useQuery({
    queryKey: ['cms-blocks', pageId],
    queryFn: () => fetchPageBlocks(pageId),
    enabled: !!pageId
  });

  // Mutations
  const updateBlockMutation = useMutation({
    mutationFn: ({ blockId, data }: { blockId: number; data: any }) =>
      updateCMSBlock(blockId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-blocks', pageId] });
      setEditingBlockId(null);
    }
  });

  const deleteBlockMutation = useMutation({
    mutationFn: deleteCMSBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-blocks', pageId] });
    }
  });

  const reorderMutation = useMutation({
    mutationFn: (blockOrders: Array<{ blockId: number; displayOrder: number }>) =>
      reorderCMSBlocks(pageId, blockOrders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-blocks', pageId] });
    }
  });

  const createBlockMutation = useMutation({
    mutationFn: createCMSBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-blocks', pageId] });
      setIsAddingBlock(false);
    }
  });

  const updatePageMutation = useMutation({
    mutationFn: (data: any) => updateCMSPage(pageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-page', pageId] });
    }
  });

  const handleMoveBlock = (blockId: number, direction: 'up' | 'down') => {
    const currentIndex = blocks.findIndex((b) => b.id === blockId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === blocks.length - 1)
    ) {
      return;
    }

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    [newBlocks[currentIndex], newBlocks[targetIndex]] = [
      newBlocks[targetIndex],
      newBlocks[currentIndex]
    ];

    const blockOrders = newBlocks.map((block, index) => ({
      blockId: block.id,
      displayOrder: index
    }));

    reorderMutation.mutate(blockOrders);
  };

  const handleDeleteBlock = (blockId: number) => {
    if (confirm('Are you sure you want to delete this block?')) {
      deleteBlockMutation.mutate(blockId);
    }
  };

  const handleTogglePublish = () => {
    if (page) {
      updatePageMutation.mutate({ isPublished: !page.isPublished });
    }
  };

  const editingBlock = blocks.find(b => b.id === editingBlockId);

  if (pageLoading || blocksLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jade"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-display text-text-primary mb-4">Page not found</h2>
          <Link to="/admin/cms" className="text-primary hover:underline">
            Back to CMS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary relative">
      {/* Fixed Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/95 backdrop-blur-xl border-b border-primary/30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              to="/admin/cms"
              className="flex items-center gap-2 text-text-primary/70 hover:text-text-primary transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to CMS</span>
            </Link>
            <div className="hidden h-6 w-px bg-text-secondary/20 sm:block" />
            <div>
              <h1 className="font-display text-xl text-text-primary">{page.title}</h1>
              <p className="text-xs text-text-primary/60">/{page.slug}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsAddingBlock(true)}
              className="flex items-center gap-2 px-4 py-2 bg-interactive-default/20 text-primary hover:bg-primary/30 rounded-lg transition-colors font-medium text-sm"
            >
              <PlusIcon className="h-4 w-4" />
              Add Block
            </button>
            <button
              type="button"
              onClick={handleTogglePublish}
              aria-pressed={page.isPublished}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                page.isPublished
                  ? 'bg-text-secondary/20 text-text-primary hover:bg-bg-elevated'
                  : 'bg-interactive-default text-on-interactive hover:bg-interactive-default/90'
              }`}
            >
              {page.isPublished ? 'Published' : 'Draft'}
            </button>
            <Link
              to={`/en/${page.slug}`}
              target="_blank"
              className="px-4 py-2 bg-bg-secondary text-text-primary rounded-lg hover:bg-bg-elevated transition-colors font-medium text-sm"
            >
              View Live
            </Link>
          </div>
        </div>
      </div>

      {/* Page Content with Editable Blocks */}
      <div className="cms-page pt-20">
        {blocks.length === 0 ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <p className="text-text-tertiary mb-4">No blocks yet. Add your first block to get started!</p>
              <button
                type="button"
                onClick={() => setIsAddingBlock(true)}
                className="px-6 py-3 bg-interactive-default text-on-interactive rounded-lg hover:bg-interactive-default/90 transition-colors font-semibold"
              >
                Add First Block
              </button>
            </div>
          </div>
        ) : (
          blocks.map((block, index) => (
            <EditableBlock
              key={block.id}
              block={block}
              isEditMode={true}
              isFirst={index === 0}
              isLast={index === blocks.length - 1}
              onEdit={() => setEditingBlockId(block.id)}
              onDelete={() => handleDeleteBlock(block.id)}
              onMoveUp={() => handleMoveBlock(block.id, 'up')}
              onMoveDown={() => handleMoveBlock(block.id, 'down')}
              onToggleEnabled={() =>
                updateBlockMutation.mutate({
                  blockId: block.id,
                  data: { isEnabled: !block.isEnabled }
                })
              }
            />
          ))
        )}
      </div>

      {/* Slide-out Editor Panel */}
      <AnimatePresence>
        {(editingBlockId !== null || isAddingBlock) && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditingBlockId(null);
                setIsAddingBlock(false);
              }}
              className="fixed inset-0 bg-bg-primary/80 backdrop-blur-sm z-[60]"
            />

            {/* Editor Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-3xl bg-bg-primary border-l border-primary/30 shadow-2xl z-[70] overflow-hidden flex flex-col"
            >
              {/* Panel Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border-default bg-bg-primary/50 backdrop-blur-xl">
                <div>
                  <h2 className="font-display text-xl text-text-primary">
                    {isAddingBlock ? 'Add New Block' : 'Edit Block'}
                  </h2>
                  {editingBlock && (
                    <p className="text-sm text-text-primary/60 mt-1">
                      {editingBlock.blockKey} • {editingBlock.blockType}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setEditingBlockId(null);
                    setIsAddingBlock(false);
                  }}
                  className="p-2 text-text-primary/70 hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-all"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {editingBlock && (
                  <VisualBlockEditor
                    blockType={editingBlock.blockType}
                    content={editingBlock.content}
                    onSave={(content) =>
                      updateBlockMutation.mutate({ blockId: editingBlock.id, data: { content } })
                    }
                    onCancel={() => setEditingBlockId(null)}
                  />
                )}

                {isAddingBlock && (
                  <NewBlockForm
                    pageId={pageId}
                    displayOrder={blocks.length}
                    onSubmit={(data) => createBlockMutation.mutate(data)}
                    onCancel={() => setIsAddingBlock(false)}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// New Block Form Component
function NewBlockForm({
  pageId,
  displayOrder,
  onSubmit,
  onCancel
}: {
  pageId: number;
  displayOrder: number;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [blockType, setBlockType] = useState('hero');
  const [blockKey, setBlockKey] = useState('');
  const [content, setContent] = useState(getBlockTemplateJSON('hero'));
  const [useTemplate, setUseTemplate] = useState(true);

  const blockTypes = ['hero', 'features', 'products', 'testimonials', 'newsletter', 'text_image', 'stats', 'cta', 'faq', 'announcement'];

  // Update content when block type changes and template is enabled
  const handleBlockTypeChange = (newType: string) => {
    setBlockType(newType);
    if (useTemplate) {
      setContent(getBlockTemplateJSON(newType));
    }
  };

  // Toggle between template and empty JSON
  const handleTemplateToggle = (enabled: boolean) => {
    setUseTemplate(enabled);
    if (enabled) {
      setContent(getBlockTemplateJSON(blockType));
    } else {
      setContent('{}');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Parse the content, handling empty strings and whitespace
      const trimmedContent = content.trim();
      let parsedContent;

      if (trimmedContent === '' || trimmedContent === '{}') {
        // If empty or just {}, use the template
        parsedContent = getBlockTemplate(blockType);
      } else {
        parsedContent = JSON.parse(trimmedContent);
      }

      onSubmit({
        pageId,
        blockType,
        blockKey,
        displayOrder,
        content: parsedContent,
        isEnabled: true
      });
    } catch (error) {
      alert('Invalid JSON format. Please check your JSON syntax or use the template.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-interactive-default/10 border border-primary/30 rounded-lg p-4">
        <p className="text-sm text-text-primary/80">
          Select a block type to add to your page. A template will be loaded automatically with sample content.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Block Type</label>
          <select
            value={blockType}
            onChange={(e) => handleBlockTypeChange(e.target.value)}
            className="w-full px-4 py-3 bg-bg-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-primary"
          >
            {blockTypes.map((type) => (
              <option key={type} value={type} className="bg-bg-primary">
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Block Key</label>
          <input
            type="text"
            value={blockKey}
            onChange={(e) => setBlockKey(e.target.value)}
            placeholder="e.g., hero-main"
            required
            className="w-full px-4 py-3 bg-bg-elevated border border-border-default rounded-lg text-text-primary placeholder:text-text-tertiary/30 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-text-primary">Initial Content</label>
          <button
            type="button"
            onClick={() => handleTemplateToggle(!useTemplate)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              useTemplate
                ? 'bg-interactive-default/20 text-primary border border-jade/40'
                : 'bg-bg-elevated text-text-primary/70 border border-border-default hover:bg-bg-secondary'
            }`}
          >
            {useTemplate ? '✓ Using Template' : 'Use Template'}
          </button>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 bg-bg-elevated border border-border-default rounded-lg text-text-primary font-mono text-sm focus:outline-none focus:border-primary"
          placeholder='{}'
        />
        <p className="text-xs text-text-primary/50">
          {useTemplate
            ? 'Template loaded with sample content. You can edit it or customize after creation.'
            : 'Enter custom JSON or leave empty to use the default template.'}
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-interactive-default text-on-interactive rounded-lg hover:bg-interactive-default/90 transition-colors font-semibold"
        >
          Create Block
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-bg-secondary text-text-primary rounded-lg hover:bg-bg-elevated transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
