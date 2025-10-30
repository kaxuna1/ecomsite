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
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jade"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-display text-champagne mb-4">Page not found</h2>
          <Link to="/admin/cms" className="text-jade hover:underline">
            Back to CMS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Fixed Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-midnight/95 backdrop-blur-xl border-b border-jade/30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/cms"
              className="flex items-center gap-2 text-champagne/70 hover:text-champagne transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to CMS</span>
            </Link>
            <div className="w-px h-6 bg-champagne/20" />
            <div>
              <h1 className="font-display text-xl text-champagne">{page.title}</h1>
              <p className="text-xs text-champagne/60">/{page.slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddingBlock(true)}
              className="flex items-center gap-2 px-4 py-2 bg-jade/20 text-jade hover:bg-jade/30 rounded-lg transition-colors font-medium text-sm"
            >
              <PlusIcon className="h-4 w-4" />
              Add Block
            </button>
            <button
              onClick={handleTogglePublish}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                page.isPublished
                  ? 'bg-champagne/20 text-champagne hover:bg-champagne/30'
                  : 'bg-jade text-midnight hover:bg-jade/90'
              }`}
            >
              {page.isPublished ? 'Published' : 'Draft'}
            </button>
            <Link
              to={`/en/${page.slug}`}
              target="_blank"
              className="px-4 py-2 bg-white/10 text-champagne rounded-lg hover:bg-white/20 transition-colors font-medium text-sm"
            >
              View Live
            </Link>
          </div>
        </div>
      </div>

      {/* Page Content with Editable Blocks */}
      <div>
        {blocks.length === 0 ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <p className="text-midnight/50 mb-4">No blocks yet. Add your first block to get started!</p>
              <button
                onClick={() => setIsAddingBlock(true)}
                className="px-6 py-3 bg-jade text-midnight rounded-lg hover:bg-jade/90 transition-colors font-semibold"
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
              className="fixed inset-0 bg-midnight/80 backdrop-blur-sm z-[60]"
            />

            {/* Editor Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-3xl bg-midnight border-l border-jade/30 shadow-2xl z-[70] overflow-hidden flex flex-col"
            >
              {/* Panel Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-midnight/50 backdrop-blur-xl">
                <div>
                  <h2 className="font-display text-xl text-champagne">
                    {isAddingBlock ? 'Add New Block' : 'Edit Block'}
                  </h2>
                  {editingBlock && (
                    <p className="text-sm text-champagne/60 mt-1">
                      {editingBlock.blockKey} • {editingBlock.blockType}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setEditingBlockId(null);
                    setIsAddingBlock(false);
                  }}
                  className="p-2 text-champagne/70 hover:text-champagne hover:bg-white/10 rounded-lg transition-all"
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

  const blockTypes = ['hero', 'features', 'products', 'testimonials', 'newsletter', 'text_image', 'stats', 'cta', 'faq'];

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
      <div className="bg-jade/10 border border-jade/30 rounded-lg p-4">
        <p className="text-sm text-champagne/80">
          Select a block type to add to your page. A template will be loaded automatically with sample content.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-champagne mb-2">Block Type</label>
          <select
            value={blockType}
            onChange={(e) => handleBlockTypeChange(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
          >
            {blockTypes.map((type) => (
              <option key={type} value={type} className="bg-midnight">
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-champagne mb-2">Block Key</label>
          <input
            type="text"
            value={blockKey}
            onChange={(e) => setBlockKey(e.target.value)}
            placeholder="e.g., hero-main"
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-champagne">Initial Content</label>
          <button
            type="button"
            onClick={() => handleTemplateToggle(!useTemplate)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              useTemplate
                ? 'bg-jade/20 text-jade border border-jade/40'
                : 'bg-white/5 text-champagne/70 border border-white/10 hover:bg-white/10'
            }`}
          >
            {useTemplate ? '✓ Using Template' : 'Use Template'}
          </button>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne font-mono text-sm focus:outline-none focus:border-jade"
          placeholder='{}'
        />
        <p className="text-xs text-champagne/50">
          {useTemplate
            ? 'Template loaded with sample content. You can edit it or customize after creation.'
            : 'Enter custom JSON or leave empty to use the default template.'}
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-jade text-midnight rounded-lg hover:bg-jade/90 transition-colors font-semibold"
        >
          Create Block
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-white/10 text-champagne rounded-lg hover:bg-white/20 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
