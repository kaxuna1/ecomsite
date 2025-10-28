import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  fetchCMSPages,
  fetchPageBlocks,
  updateCMSPage,
  deleteCMSPage,
  fetchFooterSettings,
  updateFooterSettings,
  type CMSPage,
  type CMSBlock,
  type FooterSettings
} from '../../api/cmsAdmin';
import FooterEditor from '../../components/cms/editors/FooterEditor';

export default function AdminCMS() {
  const queryClient = useQueryClient();
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [showFooterEditor, setShowFooterEditor] = useState(false);

  const { data: pages, isLoading } = useQuery({
    queryKey: ['cms-pages'],
    queryFn: fetchCMSPages
  });

  const { data: blocks } = useQuery({
    queryKey: ['cms-blocks', selectedPageId],
    queryFn: () => fetchPageBlocks(selectedPageId!),
    enabled: !!selectedPageId
  });

  const { data: footerSettings } = useQuery({
    queryKey: ['footer-settings'],
    queryFn: fetchFooterSettings,
    enabled: showFooterEditor
  });

  const statusMutation = useMutation({
    mutationFn: ({ pageId, isPublished }: { pageId: number; isPublished: boolean }) =>
      updateCMSPage(pageId, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCMSPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
      setSelectedPageId(null);
    }
  });

  const footerMutation = useMutation({
    mutationFn: updateFooterSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-settings'] });
    }
  });

  const handleToggleStatus = (page: CMSPage) => {
    const newStatus = !page.isPublished;
    statusMutation.mutate({ pageId: page.id, isPublished: newStatus });
  };

  const handleDeletePage = (pageId: number) => {
    if (confirm('Are you sure you want to delete this page?')) {
      deleteMutation.mutate(pageId);
    }
  };

  const handleFooterChange = (updates: Partial<FooterSettings>) => {
    footerMutation.mutate(updates);
  };

  const handleFooterSave = () => {
    setShowFooterEditor(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jade"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl uppercase tracking-wider">CMS Management</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFooterEditor(true)}
            className="px-4 py-2 bg-champagne/20 text-champagne rounded-lg hover:bg-champagne/30 transition-colors font-semibold"
          >
            Edit Footer
          </button>
          <Link
            to="/admin/cms/new"
            className="px-4 py-2 bg-jade text-midnight rounded-lg hover:bg-jade/90 transition-colors font-semibold"
          >
            Create New Page
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pages List */}
        <div className="bg-midnight/50 rounded-xl border border-white/10 overflow-hidden">
          <div className="border-b border-white/10 px-6 py-4">
            <h2 className="font-display text-xl uppercase tracking-wide">Pages</h2>
          </div>
          <div className="divide-y divide-white/10">
            {pages?.map((page) => (
              <div
                key={page.id}
                className={`p-6 cursor-pointer transition-colors ${
                  selectedPageId === page.id ? 'bg-jade/10' : 'hover:bg-white/5'
                }`}
                onClick={() => setSelectedPageId(page.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-champagne">{page.title}</h3>
                    <p className="text-sm text-champagne/60 mt-1">/{page.slug}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      page.isPublished
                        ? 'bg-jade/20 text-jade'
                        : 'bg-champagne/20 text-champagne'
                    }`}
                  >
                    {page.isPublished ? 'published' : 'draft'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(page);
                    }}
                    className="px-3 py-1 bg-jade/20 text-jade rounded hover:bg-jade/30 transition-colors text-sm"
                  >
                    {page.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <Link
                    to={`/admin/cms/inline-edit/${page.id}`}
                    className="px-3 py-1 bg-jade text-midnight rounded hover:bg-jade/90 transition-colors text-sm font-semibold"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ✨ Inline Edit
                  </Link>
                  <Link
                    to={`/admin/cms/edit/${page.id}`}
                    className="px-3 py-1 bg-champagne/20 text-champagne rounded hover:bg-champagne/30 transition-colors text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Advanced Edit
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePage(page.id);
                    }}
                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {pages?.length === 0 && (
              <div className="p-12 text-center text-champagne/50">
                No pages yet. Create your first page!
              </div>
            )}
          </div>
        </div>

        {/* Blocks Preview */}
        <div className="bg-midnight/50 rounded-xl border border-white/10 overflow-hidden">
          <div className="border-b border-white/10 px-6 py-4">
            <h2 className="font-display text-xl uppercase tracking-wide">Page Blocks</h2>
          </div>
          {selectedPageId ? (
            <div className="p-6">
              {blocks && blocks.length > 0 ? (
                <div className="space-y-3">
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      className="p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-champagne">{block.blockKey}</p>
                          <p className="text-sm text-champagne/60 mt-1">Type: {block.blockType}</p>
                        </div>
                        <span className="text-xs text-champagne/50">Position: {block.displayOrder}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-champagne/50 text-center py-12">No blocks in this page</p>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-champagne/50">
              Select a page to view its blocks
            </div>
          )}
        </div>
      </div>

      {/* Footer Editor Modal */}
      <AnimatePresence>
        {showFooterEditor && footerSettings && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFooterEditor(false)}
              className="fixed inset-0 bg-midnight/80 backdrop-blur-sm z-40"
            />

            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-3xl bg-midnight border-l border-white/10 z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-midnight/95 backdrop-blur-sm">
                <div>
                  <h2 className="font-display text-2xl text-champagne">Footer Editor</h2>
                  <p className="text-sm text-champagne/60 mt-1">Customize your site footer</p>
                </div>
                <button
                  onClick={() => setShowFooterEditor(false)}
                  className="p-2 text-champagne/60 hover:text-champagne hover:bg-white/5 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <FooterEditor
                  footer={footerSettings}
                  onChange={handleFooterChange}
                  onSave={handleFooterSave}
                  isSaving={footerMutation.isPending}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
