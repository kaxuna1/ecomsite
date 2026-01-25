import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  GlobeAltIcon,
  PlusIcon,
  CheckIcon,
  SparklesIcon,
  DocumentTextIcon,
  FunnelIcon,
  Bars3BottomLeftIcon
} from '@heroicons/react/24/outline';
import {
  fetchCMSPages,
  createCMSPageWithBlocks,
  updateCMSPage,
  deleteCMSPage,
  fetchFooterSettings,
  updateFooterSettings,
  createFooterTranslation,
  type CMSPage,
  type FooterSettings,
  type CreatePagePayload
} from '../../api/cmsAdmin';
import FooterEditor from '../../components/cms/editors/FooterEditor';
import AIPageBuilderModal from '../../components/admin/AIPageBuilderModal';
import { CMSPageCard } from '../../components/admin/cms';
import { PAGE_TEMPLATES, type PageTemplate } from '../../config/pageTemplates';
import PageHeader from '../../components/admin/PageHeader';
import SearchInput from '../../components/admin/SearchInput';
import LoadingState from '../../components/admin/LoadingState';
import EmptyState from '../../components/admin/EmptyState';

type StatusFilter = 'all' | 'published' | 'draft';
type SortOrder = 'updated' | 'title' | 'created';

export default function AdminCMS() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('updated');
  const [expandedPageId, setExpandedPageId] = useState<number | null>(null);
  const hasActiveFilters = Boolean(searchQuery || statusFilter !== 'all' || sortOrder !== 'updated');

  // Modal states
  const [showFooterEditor, setShowFooterEditor] = useState(false);
  const [footerLanguage, setFooterLanguage] = useState('en');
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [showAIPageBuilder, setShowAIPageBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PageTemplate>(PAGE_TEMPLATES[0]);
  const [newPageData, setNewPageData] = useState({
    title: '',
    slug: '',
    metaDescription: '',
    metaKeywords: '',
    isPublished: false
  });

  // Queries
  const { data: pages, isLoading } = useQuery({
    queryKey: ['cms-pages'],
    queryFn: fetchCMSPages
  });

  const { data: footerSettings } = useQuery({
    queryKey: ['footer-settings', footerLanguage],
    queryFn: () => fetchFooterSettings(footerLanguage),
    enabled: showFooterEditor,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // Filter and sort pages
  const filteredPages = useMemo(() => {
    if (!pages) return [];

    let result = [...pages];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (page) =>
          page.title.toLowerCase().includes(query) ||
          page.slug.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter === 'published') {
      result = result.filter((page) => page.isPublished);
    } else if (statusFilter === 'draft') {
      result = result.filter((page) => !page.isPublished);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'updated':
        default:
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      }
    });

    return result;
  }, [pages, searchQuery, statusFilter, sortOrder]);

  // Mutations
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
      setExpandedPageId(null);
    }
  });

  const footerMutation = useMutation({
    mutationFn: updateFooterSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-settings'] });
    }
  });

  const footerTranslationMutation = useMutation({
    mutationFn: ({ languageCode, payload }: { languageCode: string; payload: Partial<FooterSettings> }) =>
      createFooterTranslation(languageCode, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-settings'] });
    }
  });

  const createPageMutation = useMutation({
    mutationFn: ({ pagePayload, blocks }: {
      pagePayload: CreatePagePayload;
      blocks: Array<{ blockType: string; blockKey: string; content: Record<string, unknown>; displayOrder: number }>
    }) => createCMSPageWithBlocks(pagePayload, blocks),
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
      setShowNewPageModal(false);
      setNewPageData({
        title: '',
        slug: '',
        metaDescription: '',
        metaKeywords: '',
        isPublished: false
      });
      setSelectedTemplate(PAGE_TEMPLATES[0]);
      navigate(`/admin/cms/inline-edit/${newPage.id}`);
    }
  });

  // Handlers
  const handleToggleStatus = (page: CMSPage) => {
    statusMutation.mutate({ pageId: page.id, isPublished: !page.isPublished });
  };

  const handleDeletePage = (pageId: number) => {
    if (confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      deleteMutation.mutate(pageId);
    }
  };

  const handleToggleExpand = (pageId: number) => {
    setExpandedPageId(expandedPageId === pageId ? null : pageId);
  };

  const handleFooterChange = (updates: Partial<FooterSettings>) => {
    if (footerLanguage === 'en') {
      footerMutation.mutate(updates);
    } else {
      const translatableFields = {
        ...(updates.brandName !== undefined && { brandName: updates.brandName }),
        ...(updates.brandTagline !== undefined && { brandTagline: updates.brandTagline }),
        ...(updates.footerColumns !== undefined && { footerColumns: updates.footerColumns }),
        ...(updates.contactInfo !== undefined && { contactInfo: updates.contactInfo }),
        ...(updates.newsletterTitle !== undefined && { newsletterTitle: updates.newsletterTitle }),
        ...(updates.newsletterDescription !== undefined && { newsletterDescription: updates.newsletterDescription }),
        ...(updates.newsletterPlaceholder !== undefined && { newsletterPlaceholder: updates.newsletterPlaceholder }),
        ...(updates.newsletterButtonText !== undefined && { newsletterButtonText: updates.newsletterButtonText }),
        ...(updates.copyrightText !== undefined && { copyrightText: updates.copyrightText }),
        ...(updates.bottomLinks !== undefined && { bottomLinks: updates.bottomLinks })
      };

      if (Object.keys(translatableFields).length > 0) {
        footerTranslationMutation.mutate({
          languageCode: footerLanguage,
          payload: translatableFields
        });
      }
    }
  };

  const handleFooterSave = () => {
    setShowFooterEditor(false);
  };

  const handleOpenFooterEditor = () => {
    setFooterLanguage('en');
    setShowFooterEditor(true);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleTemplateSelect = (template: PageTemplate) => {
    setSelectedTemplate(template);
    if (template.id !== 'blank') {
      setNewPageData((prev) => ({
        ...prev,
        title: prev.title || template.name,
        slug: prev.slug || template.suggestedSlug,
        metaDescription: prev.metaDescription || template.metaDescription
      }));
    }
  };

  const handleTitleChange = (title: string) => {
    setNewPageData({
      ...newPageData,
      title,
      slug: generateSlug(title)
    });
  };

  const handleCreatePage = () => {
    if (!newPageData.title.trim() || !newPageData.slug.trim()) {
      alert('Please enter a page title and slug');
      return;
    }

    createPageMutation.mutate({
      pagePayload: {
        title: newPageData.title,
        slug: newPageData.slug,
        metaDescription: newPageData.metaDescription || undefined,
        metaKeywords: newPageData.metaKeywords || undefined,
        isPublished: newPageData.isPublished
      },
      blocks: selectedTemplate.blocks
    });
  };

  // Stats
  const stats = useMemo(() => {
    if (!pages) return { total: 0, published: 0, draft: 0 };
    return {
      total: pages.length,
      published: pages.filter((p) => p.isPublished).length,
      draft: pages.filter((p) => !p.isPublished).length
    };
  }, [pages]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortOrder('updated');
  };

  if (isLoading) {
    return <LoadingState message="Loading CMS pages..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="CMS Management"
        description={`${stats.total} pages · ${stats.published} published · ${stats.draft} drafts`}
        actions={(
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleOpenFooterEditor}
              className="px-4 py-2 bg-primary/20 text-text-primary rounded-lg hover:bg-primary/30 transition-colors font-semibold"
            >
              Edit Footer
            </button>
            <button
              type="button"
              onClick={() => setShowAIPageBuilder(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              <SparklesIcon className="h-5 w-5" />
              AI Page Builder
            </button>
            <button
              type="button"
              onClick={() => setShowNewPageModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-interactive-default text-on-interactive rounded-lg hover:bg-interactive-hover transition-colors font-semibold"
            >
              <PlusIcon className="h-5 w-5" />
              New Page
            </button>
          </div>
        )}
      />

      {/* Filters & Search */}
      <div className="bg-bg-elevated rounded-xl border border-border-default p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={searchQuery ? () => setSearchQuery('') : undefined}
              placeholder="Search pages by title or slug..."
              label="Search CMS pages"
              resultsCount={filteredPages.length}
              resultsLabel="pages"
              className="rounded-lg px-10 py-2.5"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-text-tertiary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              aria-label="Filter pages by status"
              className="px-3 py-2.5 bg-bg-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              title="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Bars3BottomLeftIcon className="h-5 w-5 text-text-tertiary" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              aria-label="Sort pages"
              className="px-3 py-2.5 bg-bg-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              title="Sort pages"
            >
              <option value="updated">Recently Updated</option>
              <option value="created">Recently Created</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Pages Grid */}
      {filteredPages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPages.map((page) => (
            <CMSPageCard
              key={page.id}
              id={page.id}
              title={page.title}
              slug={page.slug}
              isPublished={page.isPublished}
              isExpanded={expandedPageId === page.id}
              onToggleExpand={() => handleToggleExpand(page.id)}
              onToggleStatus={() => handleToggleStatus(page)}
              onDelete={() => handleDeletePage(page.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<DocumentTextIcon className="h-12 w-12" />}
          title={searchQuery || statusFilter !== 'all' ? 'No pages match your filters' : 'No pages yet'}
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Create your first page to start building content.'
          }
          action={
            searchQuery || statusFilter !== 'all'
              ? {
                  label: 'Clear filters',
                  onClick: resetFilters
                }
              : {
                  label: 'Create page',
                  onClick: () => setShowNewPageModal(true)
                }
          }
        />
      )}

      {/* Footer Editor Modal */}
      <AnimatePresence>
        {showFooterEditor && footerSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFooterEditor(false)}
              className="fixed inset-0 bg-bg-primary/80 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-3xl bg-bg-elevated border-l border-border-default z-50 overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-bg-elevated/95 backdrop-blur-sm">
                <div>
                  <h2 className="font-display text-2xl text-text-primary">Footer Editor</h2>
                  <p className="text-sm text-text-tertiary mt-1">Customize your site footer</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-secondary rounded-lg border border-border-default">
                    <GlobeAltIcon className="h-4 w-4 text-text-tertiary" />
                    <select
                      value={footerLanguage}
                      onChange={(e) => setFooterLanguage(e.target.value)}
                      className="bg-transparent text-sm text-text-primary border-none focus:outline-none focus:ring-0 cursor-pointer"
                      title="Select language"
                    >
                      <option value="en" className="bg-bg-elevated">English</option>
                      <option value="ka" className="bg-bg-elevated">ქართული</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setShowFooterEditor(false)}
                    className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
                    title="Close footer editor"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <FooterEditor
                  footer={footerSettings}
                  language={footerLanguage}
                  onChange={handleFooterChange}
                  onSave={handleFooterSave}
                  isSaving={footerMutation.isPending || footerTranslationMutation.isPending}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Page Modal */}
      <AnimatePresence>
        {showNewPageModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewPageModal(false)}
              className="fixed inset-0 bg-bg-primary/80 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-bg-elevated border border-border-default rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-bg-secondary flex-shrink-0">
                  <div>
                    <h2 className="font-display text-2xl text-text-primary">Create New Page</h2>
                    <p className="text-sm text-text-tertiary mt-1">Add a new page to your site</p>
                  </div>
                  <button
                    onClick={() => setShowNewPageModal(false)}
                    className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors"
                    title="Close modal"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="px-6 py-6 space-y-5 overflow-y-auto flex-1">
                  {/* Template Selector */}
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      Start with Template
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                      {PAGE_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleTemplateSelect(template)}
                          className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                            selectedTemplate.id === template.id
                              ? 'border-primary bg-primary/10 shadow-lg'
                              : 'border-border-default bg-bg-secondary hover:border-primary/50 hover:bg-bg-elevated'
                          }`}
                        >
                          {selectedTemplate.id === template.id && (
                            <div className="absolute top-2 right-2 p-1 bg-interactive-default rounded-full">
                              <CheckIcon className="h-3 w-3 text-on-interactive" />
                            </div>
                          )}
                          <div className="text-3xl mb-2">{template.icon}</div>
                          <h4 className="font-semibold text-text-primary text-sm mb-1">
                            {template.name}
                          </h4>
                          <p className="text-xs text-text-tertiary line-clamp-2">
                            {template.description}
                          </p>
                          {template.blocks.length > 0 && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                              </svg>
                              {template.blocks.length} blocks
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-text-tertiary">
                      {selectedTemplate.id === 'blank'
                        ? 'You can add blocks after creating the page'
                        : `This template includes ${selectedTemplate.blocks.length} pre-configured blocks`}
                    </p>
                  </div>

                  {/* Page Title */}
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Page Title *
                    </label>
                    <input
                      type="text"
                      value={newPageData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g., About Us, Contact, Services"
                      className="w-full px-4 py-3 bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      autoFocus
                    />
                    <p className="mt-1.5 text-xs text-text-tertiary">
                      This will be displayed in the browser tab and search results
                    </p>
                  </div>

                  {/* URL Slug */}
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      URL Slug *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-text-tertiary font-mono text-sm">/</span>
                      <input
                        type="text"
                        value={newPageData.slug}
                        onChange={(e) => setNewPageData({ ...newPageData, slug: e.target.value })}
                        placeholder="about-us"
                        className="flex-1 px-4 py-3 bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-text-tertiary">
                      Auto-generated from title. Only lowercase letters, numbers, and hyphens.
                    </p>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={newPageData.metaDescription}
                      onChange={(e) => setNewPageData({ ...newPageData, metaDescription: e.target.value })}
                      placeholder="A brief description for search engines (150-160 characters recommended)"
                      rows={3}
                      className="w-full px-4 py-3 bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                    />
                    <p className="mt-1.5 text-xs text-text-tertiary">
                      {newPageData.metaDescription.length} characters
                    </p>
                  </div>

                  {/* Meta Keywords */}
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Meta Keywords
                    </label>
                    <input
                      type="text"
                      value={newPageData.metaKeywords}
                      onChange={(e) => setNewPageData({ ...newPageData, metaKeywords: e.target.value })}
                      placeholder="keyword1, keyword2, keyword3"
                      className="w-full px-4 py-3 bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <p className="mt-1.5 text-xs text-text-tertiary">
                      Comma-separated keywords for SEO (optional)
                    </p>
                  </div>

                  {/* Publish Status */}
                  <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <input
                      type="checkbox"
                      id="publishStatus"
                      checked={newPageData.isPublished}
                      onChange={(e) => setNewPageData({ ...newPageData, isPublished: e.target.checked })}
                      className="h-5 w-5 rounded border-primary/40 text-primary focus:ring-primary focus:ring-offset-0"
                    />
                    <label htmlFor="publishStatus" className="text-sm text-text-primary cursor-pointer">
                      <span className="font-semibold">Publish immediately</span>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        Uncheck to save as draft and publish later
                      </p>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default bg-bg-secondary flex-shrink-0">
                  <button
                    onClick={() => setShowNewPageModal(false)}
                    className="px-5 py-2.5 text-text-secondary hover:bg-bg-elevated rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePage}
                    disabled={createPageMutation.isPending || !newPageData.title || !newPageData.slug}
                    className="px-6 py-2.5 bg-interactive-default text-on-interactive rounded-lg hover:bg-interactive-hover transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {createPageMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-on-interactive"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-5 w-5" />
                        Create Page
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI Page Builder Modal */}
      <AIPageBuilderModal
        isOpen={showAIPageBuilder}
        onClose={() => setShowAIPageBuilder(false)}
        onSuccess={(pageId) => {
          queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
          setExpandedPageId(pageId);
          setShowAIPageBuilder(false);
        }}
      />
    </div>
  );
}
