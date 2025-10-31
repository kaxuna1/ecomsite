import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, EyeIcon, GlobeAltIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import {
  fetchCMSPages,
  fetchPageBlocks,
  createCMSPageWithBlocks,
  updateCMSPage,
  deleteCMSPage,
  fetchFooterSettings,
  updateFooterSettings,
  createFooterTranslation,
  type CMSPage,
  type CMSBlock,
  type FooterSettings,
  type CreatePagePayload
} from '../../api/cmsAdmin';
import FooterEditor from '../../components/cms/editors/FooterEditor';
import { PAGE_TEMPLATES, type PageTemplate } from '../../config/pageTemplates';

export default function AdminCMS() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [showFooterEditor, setShowFooterEditor] = useState(false);
  const [footerLanguage, setFooterLanguage] = useState('en');

  // Debug logging for language changes
  console.log('🌍 AdminCMS render - footerLanguage:', footerLanguage);
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PageTemplate>(PAGE_TEMPLATES[0]);
  const [newPageData, setNewPageData] = useState({
    title: '',
    slug: '',
    metaDescription: '',
    metaKeywords: '',
    isPublished: false
  });

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
    queryKey: ['footer-settings', footerLanguage],
    queryFn: () => {
      console.log('⚡ React Query: Fetching footer with language:', footerLanguage);
      return fetchFooterSettings(footerLanguage);
    },
    enabled: showFooterEditor,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache in memory or localStorage
    refetchOnMount: true,
    refetchOnWindowFocus: false
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

  const footerTranslationMutation = useMutation({
    mutationFn: ({ languageCode, payload }: { languageCode: string; payload: any }) =>
      createFooterTranslation(languageCode, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-settings'] });
    }
  });

  const createPageMutation = useMutation({
    mutationFn: ({ pagePayload, blocks }: {
      pagePayload: CreatePagePayload;
      blocks: Array<{ blockType: string; blockKey: string; content: any; displayOrder: number }>
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
      // Redirect to inline editor for the new page
      navigate(`/admin/cms/inline-edit/${newPage.id}`);
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
    console.log('=== FRONTEND handleFooterChange ===');
    console.log('Language:', footerLanguage);
    console.log('Updates received:', updates);

    if (footerLanguage === 'en') {
      console.log('>>> Calling English mutation');
      // Update base footer settings for English
      footerMutation.mutate(updates);
    } else {
      // Extract only translatable fields for non-English languages
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

      console.log('>>> Translatable fields extracted:', translatableFields);
      console.log('>>> Field count:', Object.keys(translatableFields).length);

      // Only mutate if there are translatable fields
      if (Object.keys(translatableFields).length > 0) {
        console.log('>>> Calling translation mutation with:', {
          languageCode: footerLanguage,
          payload: translatableFields
        });
        footerTranslationMutation.mutate({
          languageCode: footerLanguage,
          payload: translatableFields
        });
      } else {
        console.log('>>> No translatable fields, skipping mutation');
      }
    }
  };

  const handleFooterSave = () => {
    setShowFooterEditor(false);
  };

  const handleOpenFooterEditor = () => {
    setFooterLanguage('en'); // Reset to English when opening editor
    setShowFooterEditor(true);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  };

  const handleTemplateSelect = (template: PageTemplate) => {
    setSelectedTemplate(template);
    // Auto-fill fields if blank
    if (template.id !== 'blank') {
      setNewPageData(prev => ({
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

  const handleViewLive = (slug: string) => {
    const url = `/en/${slug}`;
    window.open(url, '_blank');
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
            onClick={handleOpenFooterEditor}
            className="px-4 py-2 bg-champagne/20 text-champagne rounded-lg hover:bg-champagne/30 transition-colors font-semibold"
          >
            Edit Footer
          </button>
          <button
            onClick={() => setShowNewPageModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-jade text-midnight rounded-lg hover:bg-jade/90 transition-colors font-semibold"
          >
            <PlusIcon className="h-5 w-5" />
            New Page
          </button>
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
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-champagne">{page.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <GlobeAltIcon className="h-4 w-4 text-jade" />
                      <p className="text-sm text-champagne/70 font-mono">/{page.slug}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      page.isPublished
                        ? 'bg-jade/20 text-jade'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {page.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {page.isPublished && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewLive(page.slug);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 bg-jade text-midnight rounded hover:bg-jade/90 transition-colors text-sm font-semibold"
                    >
                      <EyeIcon className="h-4 w-4" />
                      View Live
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(page);
                    }}
                    className={`px-3 py-1 rounded hover:bg-opacity-80 transition-colors text-sm ${
                      page.isPublished
                        ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                        : 'bg-jade/20 text-jade hover:bg-jade/30'
                    }`}
                  >
                    {page.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <Link
                    to={`/admin/cms/inline-edit/${page.id}`}
                    className="px-3 py-1 bg-champagne/20 text-champagne rounded hover:bg-champagne/30 transition-colors text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Inline Edit
                  </Link>
                  <Link
                    to={`/admin/cms/edit/${page.id}`}
                    className="px-3 py-1 bg-white/10 text-champagne rounded hover:bg-white/20 transition-colors text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Advanced
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
                <div className="flex items-center gap-3">
                  {/* Language Switcher */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                    <GlobeAltIcon className="h-4 w-4 text-champagne/60" />
                    <select
                      value={footerLanguage}
                      onChange={(e) => {
                        console.log('🔄 Language dropdown changed from', footerLanguage, 'to', e.target.value);
                        setFooterLanguage(e.target.value);
                      }}
                      className="bg-transparent text-sm text-champagne border-none focus:outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="en" className="bg-midnight">English</option>
                      <option value="ka" className="bg-midnight">ქართული</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setShowFooterEditor(false)}
                    className="p-2 text-champagne/60 hover:text-champagne hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
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
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewPageModal(false)}
              className="fixed inset-0 bg-midnight/80 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-midnight border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-jade/10 to-champagne/10 flex-shrink-0">
                  <div>
                    <h2 className="font-display text-2xl text-champagne">Create New Page</h2>
                    <p className="text-sm text-champagne/60 mt-1">Add a new page to your site</p>
                  </div>
                  <button
                    onClick={() => setShowNewPageModal(false)}
                    className="p-2 text-champagne/60 hover:text-champagne hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Content - Scrollable */}
                <div className="px-6 py-6 space-y-5 overflow-y-auto flex-1">
                  {/* Template Selector */}
                  <div>
                    <label className="block text-sm font-semibold text-champagne mb-3">
                      Start with Template
                    </label>
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                      {PAGE_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleTemplateSelect(template)}
                          className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                            selectedTemplate.id === template.id
                              ? 'border-jade bg-jade/10 shadow-lg'
                              : 'border-white/10 bg-white/5 hover:border-jade/50 hover:bg-white/10'
                          }`}
                        >
                          {selectedTemplate.id === template.id && (
                            <div className="absolute top-2 right-2 p-1 bg-jade rounded-full">
                              <CheckIcon className="h-3 w-3 text-midnight" />
                            </div>
                          )}
                          <div className="text-3xl mb-2">{template.icon}</div>
                          <h4 className="font-semibold text-champagne text-sm mb-1">
                            {template.name}
                          </h4>
                          <p className="text-xs text-champagne/60 line-clamp-2">
                            {template.description}
                          </p>
                          {template.blocks.length > 0 && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-jade">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                              </svg>
                              {template.blocks.length} blocks
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-champagne/50">
                      {selectedTemplate.id === 'blank'
                        ? 'You can add blocks after creating the page'
                        : `This template includes ${selectedTemplate.blocks.length} pre-configured blocks`
                      }
                    </p>
                  </div>

                  {/* Page Title */}
                  <div>
                    <label className="block text-sm font-semibold text-champagne mb-2">
                      Page Title *
                    </label>
                    <input
                      type="text"
                      value={newPageData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g., About Us, Contact, Services"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/40 focus:outline-none focus:ring-2 focus:ring-jade focus:border-transparent transition-all"
                      autoFocus
                    />
                    <p className="mt-1.5 text-xs text-champagne/50">
                      This will be displayed in the browser tab and search results
                    </p>
                  </div>

                  {/* URL Slug */}
                  <div>
                    <label className="block text-sm font-semibold text-champagne mb-2">
                      URL Slug *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-champagne/60 font-mono text-sm">/</span>
                      <input
                        type="text"
                        value={newPageData.slug}
                        onChange={(e) => setNewPageData({ ...newPageData, slug: e.target.value })}
                        placeholder="about-us"
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/40 focus:outline-none focus:ring-2 focus:ring-jade focus:border-transparent transition-all font-mono"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-champagne/50">
                      Auto-generated from title. Only lowercase letters, numbers, and hyphens.
                    </p>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-sm font-semibold text-champagne mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={newPageData.metaDescription}
                      onChange={(e) => setNewPageData({ ...newPageData, metaDescription: e.target.value })}
                      placeholder="A brief description for search engines (150-160 characters recommended)"
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/40 focus:outline-none focus:ring-2 focus:ring-jade focus:border-transparent transition-all resize-none"
                    />
                    <p className="mt-1.5 text-xs text-champagne/50">
                      {newPageData.metaDescription.length} characters
                    </p>
                  </div>

                  {/* Meta Keywords */}
                  <div>
                    <label className="block text-sm font-semibold text-champagne mb-2">
                      Meta Keywords
                    </label>
                    <input
                      type="text"
                      value={newPageData.metaKeywords}
                      onChange={(e) => setNewPageData({ ...newPageData, metaKeywords: e.target.value })}
                      placeholder="keyword1, keyword2, keyword3"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/40 focus:outline-none focus:ring-2 focus:ring-jade focus:border-transparent transition-all"
                    />
                    <p className="mt-1.5 text-xs text-champagne/50">
                      Comma-separated keywords for SEO (optional)
                    </p>
                  </div>

                  {/* Publish Status */}
                  <div className="flex items-center gap-3 p-4 bg-jade/5 border border-jade/20 rounded-lg">
                    <input
                      type="checkbox"
                      id="publishStatus"
                      checked={newPageData.isPublished}
                      onChange={(e) => setNewPageData({ ...newPageData, isPublished: e.target.checked })}
                      className="h-5 w-5 rounded border-jade/40 text-jade focus:ring-jade focus:ring-offset-0"
                    />
                    <label htmlFor="publishStatus" className="text-sm text-champagne cursor-pointer">
                      <span className="font-semibold">Publish immediately</span>
                      <p className="text-xs text-champagne/60 mt-0.5">
                        Uncheck to save as draft and publish later
                      </p>
                    </label>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/5 flex-shrink-0">
                  <button
                    onClick={() => setShowNewPageModal(false)}
                    className="px-5 py-2.5 text-champagne hover:bg-white/5 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePage}
                    disabled={createPageMutation.isPending || !newPageData.title || !newPageData.slug}
                    className="px-6 py-2.5 bg-jade text-midnight rounded-lg hover:bg-jade/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {createPageMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-midnight"></div>
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
    </div>
  );
}
