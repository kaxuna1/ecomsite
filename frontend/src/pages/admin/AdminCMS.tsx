import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  fetchCMSPages,
  fetchPageBlocks,
  updateCMSPage,
  deleteCMSPage,
  type CMSPage,
  type CMSBlock
} from '../../api/cmsAdmin';

export default function AdminCMS() {
  const queryClient = useQueryClient();
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);

  const { data: pages, isLoading } = useQuery({
    queryKey: ['cms-pages'],
    queryFn: fetchCMSPages
  });

  const { data: blocks } = useQuery({
    queryKey: ['cms-blocks', selectedPageId],
    queryFn: () => fetchPageBlocks(selectedPageId!),
    enabled: !!selectedPageId
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

  const handleToggleStatus = (page: CMSPage) => {
    const newStatus = !page.isPublished;
    statusMutation.mutate({ pageId: page.id, isPublished: newStatus });
  };

  const handleDeletePage = (pageId: number) => {
    if (confirm('Are you sure you want to delete this page?')) {
      deleteMutation.mutate(pageId);
    }
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
        <Link
          to="/admin/cms/new"
          className="px-4 py-2 bg-jade text-midnight rounded-lg hover:bg-jade/90 transition-colors font-semibold"
        >
          Create New Page
        </Link>
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
    </div>
  );
}
