import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCMSPage,
  fetchPageBlocks,
  updateCMSPage,
  createCMSBlock,
  updateCMSBlock,
  deleteCMSBlock,
  reorderCMSBlocks,
  type CMSPage,
  type CMSBlock
} from '../../api/cmsAdmin';
import VisualBlockEditor from '../../components/cms/editors/VisualBlockEditor';
import BlockRenderer from '../../components/cms/BlockRenderer';

export default function AdminCMSPageEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pageId = parseInt(id!);

  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch page data
  const { data: page, isLoading: pageLoading } = useQuery({
    queryKey: ['cms-page', pageId],
    queryFn: () => fetchCMSPage(pageId),
    enabled: !!pageId
  });

  // Fetch blocks
  const { data: blocks = [], isLoading: blocksLoading } = useQuery({
    queryKey: ['cms-blocks', pageId],
    queryFn: () => fetchPageBlocks(pageId),
    enabled: !!pageId
  });

  // Update page mutation
  const updatePageMutation = useMutation({
    mutationFn: (data: any) => updateCMSPage(pageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-page', pageId] });
      queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
    }
  });

  // Create block mutation
  const createBlockMutation = useMutation({
    mutationFn: createCMSBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-blocks', pageId] });
      setIsAddingBlock(false);
    }
  });

  // Update block mutation
  const updateBlockMutation = useMutation({
    mutationFn: ({ blockId, data }: { blockId: number; data: any }) =>
      updateCMSBlock(blockId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-blocks', pageId] });
      setEditingBlockId(null);
    }
  });

  // Delete block mutation
  const deleteBlockMutation = useMutation({
    mutationFn: deleteCMSBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-blocks', pageId] });
    }
  });

  // Reorder blocks mutation
  const reorderMutation = useMutation({
    mutationFn: (blockOrders: Array<{ blockId: number; displayOrder: number }>) =>
      reorderCMSBlocks(pageId, blockOrders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-blocks', pageId] });
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

  if (pageLoading || blocksLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jade"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-display text-champagne mb-4">Page not found</h2>
        <Link to="/admin/cms" className="text-jade hover:underline">
          Back to CMS
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/admin/cms"
            className="text-sm text-champagne/60 hover:text-champagne mb-2 inline-block"
          >
            ← Back to CMS
          </Link>
          <h1 className="font-display text-3xl uppercase tracking-wider text-champagne">
            Edit Page: {page.title}
          </h1>
          <p className="text-champagne/60 mt-1">/{page.slug}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              showPreview
                ? 'bg-jade text-midnight'
                : 'bg-white/10 text-champagne hover:bg-white/20'
            }`}
          >
            {showPreview ? '✓ Preview Mode' : 'Show Preview'}
          </button>
          <button
            onClick={handleTogglePublish}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              page.isPublished
                ? 'bg-champagne/20 text-champagne hover:bg-champagne/30'
                : 'bg-jade text-midnight hover:bg-jade/90'
            }`}
          >
            {page.isPublished ? 'Unpublish' : 'Publish'}
          </button>
          <Link
            to={`/${page.slug}`}
            target="_blank"
            className="px-4 py-2 bg-midnight/50 text-champagne rounded-lg hover:bg-midnight/70 transition-colors font-semibold"
          >
            Open Live Page
          </Link>
        </div>
      </div>

      {/* Page Info */}
      <div className="bg-midnight/50 rounded-xl border border-white/10 p-6">
        <h2 className="font-display text-xl uppercase tracking-wide text-champagne mb-4">
          Page Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-champagne/60 mb-2">Title</label>
            <input
              type="text"
              value={page.title}
              onChange={(e) => updatePageMutation.mutate({ title: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
            />
          </div>
          <div>
            <label className="block text-sm text-champagne/60 mb-2">Slug</label>
            <input
              type="text"
              value={page.slug}
              onChange={(e) => updatePageMutation.mutate({ slug: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-champagne/60 mb-2">Meta Description</label>
            <textarea
              value={page.metaDescription || ''}
              onChange={(e) => updatePageMutation.mutate({ metaDescription: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
            />
          </div>
        </div>
      </div>

      {/* Blocks */}
      <div className="bg-midnight/50 rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl uppercase tracking-wide text-champagne">
            Page Blocks ({blocks.length})
          </h2>
          <button
            onClick={() => setIsAddingBlock(true)}
            className="px-4 py-2 bg-jade text-midnight rounded-lg hover:bg-jade/90 transition-colors font-semibold"
          >
            + Add Block
          </button>
        </div>

        {blocks.length === 0 ? (
          <div className="text-center py-12 text-champagne/50">
            No blocks yet. Add your first block to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {blocks.map((block, index) => (
              <div
                key={block.id}
                className="bg-white/5 border border-white/10 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display text-lg text-champagne">{block.blockKey}</h3>
                      <span className="px-3 py-1 bg-jade/20 text-jade rounded-full text-xs font-semibold">
                        {block.blockType}
                      </span>
                      {!block.isEnabled && (
                        <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-champagne/60">Position: {block.displayOrder}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMoveBlock(block.id, 'up')}
                      disabled={index === 0}
                      className="px-3 py-1 bg-white/10 text-champagne rounded hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveBlock(block.id, 'down')}
                      disabled={index === blocks.length - 1}
                      className="px-3 py-1 bg-white/10 text-champagne rounded hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => setEditingBlockId(block.id)}
                      className="px-3 py-1 bg-jade/20 text-jade rounded hover:bg-jade/30 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        updateBlockMutation.mutate({
                          blockId: block.id,
                          data: { isEnabled: !block.isEnabled }
                        })
                      }
                      className="px-3 py-1 bg-champagne/20 text-champagne rounded hover:bg-champagne/30 transition-colors text-sm"
                    >
                      {block.isEnabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {editingBlockId === block.id && (
                  <div className="mt-4 p-4 bg-midnight/30 rounded-lg border border-white/10">
                    <BlockEditor
                      block={block}
                      onSave={(data) =>
                        updateBlockMutation.mutate({ blockId: block.id, data })
                      }
                      onCancel={() => setEditingBlockId(null)}
                    />
                  </div>
                )}

                {editingBlockId !== block.id && !showPreview && (
                  <div className="mt-4 p-4 bg-midnight/30 rounded-lg">
                    <pre className="text-xs text-champagne/60 overflow-auto">
                      {JSON.stringify(block.content, null, 2)}
                    </pre>
                  </div>
                )}

                {editingBlockId !== block.id && showPreview && (
                  <div className="mt-4 bg-white rounded-lg overflow-hidden shadow-2xl">
                    <div className="p-2 bg-midnight/90 text-champagne/60 text-xs text-center border-b border-white/10">
                      Live Preview
                    </div>
                    <div className="transform scale-90 origin-top">
                      <BlockRenderer block={block} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isAddingBlock && (
          <div className="mt-6 p-6 bg-midnight/30 rounded-lg border border-jade">
            <h3 className="font-display text-lg text-champagne mb-4">Add New Block</h3>
            <NewBlockForm
              pageId={pageId}
              displayOrder={blocks.length}
              onSubmit={(data) => createBlockMutation.mutate(data)}
              onCancel={() => setIsAddingBlock(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Block Editor Component
function BlockEditor({
  block,
  onSave,
  onCancel
}: {
  block: CMSBlock;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  return (
    <VisualBlockEditor
      blockType={block.blockType}
      content={block.content}
      onSave={(content) => onSave({ content })}
      onCancel={onCancel}
    />
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
  const [content, setContent] = useState('{}');

  const blockTypes = ['hero', 'features', 'products', 'testimonials', 'newsletter'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedContent = JSON.parse(content);
      onSubmit({
        pageId,
        blockType,
        blockKey,
        displayOrder,
        content: parsedContent,
        isEnabled: true
      });
    } catch (error) {
      alert('Invalid JSON format');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-champagne/60 mb-2">Block Type</label>
          <select
            value={blockType}
            onChange={(e) => setBlockType(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
          >
            {blockTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-champagne/60 mb-2">Block Key</label>
          <input
            type="text"
            value={blockKey}
            onChange={(e) => setBlockKey(e.target.value)}
            placeholder="e.g., hero-main"
            required
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-champagne/60 mb-2">Content (JSON)</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne font-mono text-sm focus:outline-none focus:border-jade"
          placeholder='{"title": "Example", "description": "..."}'
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-jade text-midnight rounded-lg hover:bg-jade/90 transition-colors font-semibold"
        >
          Add Block
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-white/10 text-champagne rounded-lg hover:bg-white/20 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
