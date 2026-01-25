import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { fetchCMSPages, fetchPageBlocks } from '../../api/cmsAdmin';
import type { CMSPage, CMSBlock } from '../../api/cmsAdmin';
import { fetchLanguages } from '../../api/languages';
import { translateCMSPage } from '../../api/ai';
import BlockTranslationEditor from '../../components/admin/BlockTranslationEditor';
import SaveButton from '../../components/admin/SaveButton';
import PageHeader from '../../components/admin/PageHeader';

interface PageTranslation {
  id: number;
  page_id: number;
  language_code: string;
  title: string;
  slug: string;
  meta_title?: string;
  meta_description?: string;
}

interface BlockTranslation {
  id: number;
  block_id: number;
  language_code: string;
  content: any;
}

type TabType = 'pages' | 'blocks';

export default function AdminCMSTranslations() {
  const queryClient = useQueryClient();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('pages');

  // Page translations state
  const [selectedPage, setSelectedPage] = useState<CMSPage | null>(null);
  const [pageLanguage, setPageLanguage] = useState('');
  const [pageFormData, setPageFormData] = useState({
    title: '',
    slug: '',
    metaTitle: '',
    metaDescription: ''
  });

  // Block translations state
  const [selectedBlockPage, setSelectedBlockPage] = useState<CMSPage | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<CMSBlock | null>(null);
  const [blockLanguage, setBlockLanguage] = useState('');
  const [blockContent, setBlockContent] = useState<any>({});

  // Fetch all enabled languages
  const { data: languages = [], isLoading: languagesLoading } = useQuery({
    queryKey: ['languages'],
    queryFn: () => fetchLanguages(false)
  });

  // Set default language when languages are loaded
  useEffect(() => {
    if (languages.length > 0 && !pageLanguage) {
      const nonDefaultLang = languages.find(lang => !lang.isDefault);
      const defaultLangCode = nonDefaultLang?.code || languages[0].code;
      setPageLanguage(defaultLangCode);
      setBlockLanguage(defaultLangCode);
    }
  }, [languages, pageLanguage]);

  // Fetch all CMS pages
  const { data: pages, isLoading: pagesLoading } = useQuery({
    queryKey: ['cms-pages'],
    queryFn: fetchCMSPages
  });

  // Fetch page translation
  const { data: pageTranslation, isLoading: pageTranslationLoading } = useQuery<PageTranslation>({
    queryKey: ['page-translation', selectedPage?.id, pageLanguage],
    queryFn: async () => {
      const res = await api.get(`/cms/pages/${selectedPage!.id}/translations/${pageLanguage}`);
      return res.data;
    },
    enabled: !!selectedPage && activeTab === 'pages',
    retry: false
  });

  // Fetch blocks for selected page (for AI translation on pages tab)
  const { data: pageBlocks } = useQuery({
    queryKey: ['cms-blocks-for-translation', selectedPage?.id],
    queryFn: () => fetchPageBlocks(selectedPage!.id),
    enabled: !!selectedPage && activeTab === 'pages'
  });

  // Fetch blocks for selected page (block tab)
  const { data: blocks, isLoading: blocksLoading } = useQuery({
    queryKey: ['cms-blocks', selectedBlockPage?.id],
    queryFn: () => fetchPageBlocks(selectedBlockPage!.id),
    enabled: !!selectedBlockPage && activeTab === 'blocks'
  });

  // Fetch block translation
  const { data: blockTranslation, isLoading: blockTranslationLoading } = useQuery<BlockTranslation>({
    queryKey: ['block-translation', selectedBlock?.id, blockLanguage],
    queryFn: async () => {
      const res = await api.get(`/cms/blocks/${selectedBlock!.id}/translations/${blockLanguage}`);
      return res.data;
    },
    enabled: !!selectedBlock && activeTab === 'blocks',
    retry: false
  });

  // Update page form when translation loads
  useEffect(() => {
    if (pageTranslation) {
      setPageFormData({
        title: pageTranslation.title || '',
        slug: pageTranslation.slug || '',
        metaTitle: pageTranslation.metaTitle || pageTranslation.meta_title || '',
        metaDescription: pageTranslation.metaDescription || pageTranslation.meta_description || ''
      });
    } else if (selectedPage) {
      // No translation exists, start with empty form
      setPageFormData({
        title: '',
        slug: '',
        metaTitle: '',
        metaDescription: ''
      });
    }
  }, [pageTranslation, selectedPage]);

  // Update block content when translation loads
  useEffect(() => {
    if (blockTranslation) {
      setBlockContent(blockTranslation.content || {});
    } else if (selectedBlock) {
      // No translation exists, start with empty content
      setBlockContent({});
    }
  }, [blockTranslation, selectedBlock]);

  // Save page translation mutation
  const savePageMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(
        `/cms/pages/${selectedPage!.id}/translations/${pageLanguage}`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-translation'] });
      toast.success('Page translation saved successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save page translation');
    }
  });

  // Save block translation mutation
  const saveBlockMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(
        `/cms/blocks/${selectedBlock!.id}/translations/${blockLanguage}`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['block-translation'] });
      toast.success('Block translation saved successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save block translation');
    }
  });

  // AI Translation mutation for pages
  const translatePageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPage) throw new Error('No page selected');

      // Only send page metadata for translation, not blocks
      // Blocks should be translated individually in the Blocks tab
      const result = await translateCMSPage({
        title: selectedPage.title,
        metaTitle: selectedPage.metaTitle || undefined,
        metaDescription: selectedPage.metaDescription || undefined,
        blocks: [], // Empty - only translating page metadata
        targetLanguage: pageLanguage,
        sourceLanguage: 'en'
      });

      return result;
    },
    onSuccess: (data) => {
      // Update the page form with translated data
      setPageFormData({
        title: data.translatedFields.title,
        slug: selectedPage?.slug || '',
        metaTitle: data.translatedFields.metaTitle || '',
        metaDescription: data.translatedFields.metaDescription || ''
      });

      // Show success message with cost information
      const costDisplay = data.cost < 0.01
        ? `$${data.cost.toFixed(4)}`
        : `$${data.cost.toFixed(2)}`;

      toast.success(
        `Translation completed! Cost: ${costDisplay} (${data.tokensUsed.toLocaleString()} tokens)`,
        { duration: 5000 }
      );
    },
    onError: (error: any) => {
      console.error('Translation error:', error);
      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Failed to translate page. Please check your API keys in Settings.'
      );
    }
  });

  // AI Translation mutation for individual blocks
  const translateBlockMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBlock) throw new Error('No block selected');

      const result = await translateCMSPage({
        title: '', // Not needed for single block
        blocks: [{
          id: selectedBlock.id,
          type: selectedBlock.blockType,
          content: selectedBlock.content
        }],
        targetLanguage: blockLanguage,
        sourceLanguage: 'en'
      });

      return result;
    },
    onSuccess: (data) => {
      // Update the block content with translated data
      if (data.translatedBlocks && data.translatedBlocks.length > 0) {
        setBlockContent(data.translatedBlocks[0].content);
      }

      // Show success message with cost information
      const costDisplay = data.cost < 0.01
        ? `$${data.cost.toFixed(4)}`
        : `$${data.cost.toFixed(2)}`;

      toast.success(
        `Block translated! Cost: ${costDisplay} (${data.tokensUsed.toLocaleString()} tokens)`,
        { duration: 5000 }
      );
    },
    onError: (error: any) => {
      console.error('Translation error:', error);
      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Failed to translate block. Please check your API keys in Settings.'
      );
    }
  });

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    savePageMutation.mutate({
      title: pageFormData.title,
      slug: pageFormData.slug,
      metaTitle: pageFormData.metaTitle || null,
      metaDescription: pageFormData.metaDescription || null
    });
  };

  const handleBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveBlockMutation.mutate({ content: blockContent });
  };

  const handleAITranslate = () => {
    if (!selectedPage) {
      toast.error('Please select a page first');
      return;
    }
    if (!pageBlocks || pageBlocks.length === 0) {
      toast.error('No content to translate');
      return;
    }
    translatePageMutation.mutate();
  };

  const handleBlockAITranslate = () => {
    if (!selectedBlock) {
      toast.error('Please select a block first');
      return;
    }
    translateBlockMutation.mutate();
  };

  // Check if AI translation is available (page selected with source content)
  const canTranslate = !!selectedPage && !!pageBlocks && pageBlocks.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="CMS Translations"
        description="Manage translations for CMS pages and blocks"
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border-default">
        <button
          type="button"
          onClick={() => setActiveTab('pages')}
          className={`px-6 py-3 font-semibold text-sm uppercase tracking-wider transition-colors ${
            activeTab === 'pages'
              ? 'text-primary border-b-2 border-blush'
              : 'text-text-primary/60 hover:text-text-primary'
          }`}
        >
          Page Translations
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('blocks')}
          className={`px-6 py-3 font-semibold text-sm uppercase tracking-wider transition-colors ${
            activeTab === 'blocks'
              ? 'text-primary border-b-2 border-blush'
              : 'text-text-primary/60 hover:text-text-primary'
          }`}
        >
          Block Translations
        </button>
      </div>

      {/* Page Translations Tab */}
      {activeTab === 'pages' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Pages Sidebar */}
          <aside className="col-span-3">
            <div className="rounded-3xl bg-bg-elevated border border-border-default p-6">
              <h2 className="font-display text-lg text-text-primary mb-4">CMS Pages</h2>
              {pagesLoading ? (
                <p className="text-text-primary/60">Loading...</p>
              ) : (
                <div className="space-y-2">
                  {pages?.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => setSelectedPage(page)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-colors text-sm ${
                        selectedPage?.id === page.id
                          ? 'bg-interactive-default text-on-interactive font-semibold'
                          : 'text-text-primary hover:bg-bg-elevated'
                      }`}
                    >
                      {page.title}
                      <div className="text-xs opacity-60 mt-1">/{page.slug}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Page Translation Editor */}
          <main className="col-span-9">
            {selectedPage ? (
              <div className="rounded-3xl bg-bg-elevated border border-border-default p-6">
                {/* Language Selector & AI Translate Button */}
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <label className="font-semibold text-sm text-text-primary">
                      Target Language:
                    </label>
                    {languagesLoading ? (
                      <p className="text-text-primary/60">Loading languages...</p>
                    ) : (
                      <select
                        value={pageLanguage}
                        onChange={(e) => setPageLanguage(e.target.value)}
                        className="bg-bg-secondary border border-border-default rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {languages.map((lang) => (
                          <option key={lang.code} value={lang.code} className="bg-bg-primary">
                            {lang.name} ({lang.nativeName})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* AI Translate Button */}
                  <motion.button
                    type="button"
                    onClick={handleAITranslate}
                    disabled={!canTranslate || translatePageMutation.isPending}
                    whileHover={canTranslate && !translatePageMutation.isPending ? { scale: 1.02 } : {}}
                    whileTap={canTranslate && !translatePageMutation.isPending ? { scale: 0.98 } : {}}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all ${
                      canTranslate && !translatePageMutation.isPending
                        ? 'bg-gradient-to-r from-primary to-primary text-on-interactive hover:shadow-lg hover:shadow-primary/20'
                        : 'bg-bg-secondary text-text-primary/40 cursor-not-allowed'
                    }`}
                  >
                    {translatePageMutation.isPending ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Translating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4" />
                        Translate with AI
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Translation Form */}
                <form onSubmit={handlePageSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Original Column */}
                    <div>
                      <h3 className="font-display text-lg mb-4 text-text-primary">
                        Original (English)
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-text-primary/70 mb-2 uppercase tracking-wider">
                            Title
                          </label>
                          <p className="p-3 bg-bg-elevated rounded-xl border border-border-default text-text-primary">
                            {selectedPage.title}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-text-primary/70 mb-2 uppercase tracking-wider">
                            Slug
                          </label>
                          <p className="p-3 bg-bg-elevated rounded-xl border border-border-default text-text-primary text-sm">
                            {selectedPage.slug}
                          </p>
                        </div>
                        {selectedPage.metaDescription && (
                          <div>
                            <label className="block text-xs font-semibold text-text-primary/70 mb-2 uppercase tracking-wider">
                              Meta Description
                            </label>
                            <p className="p-3 bg-bg-elevated rounded-xl border border-border-default text-text-primary text-sm">
                              {selectedPage.metaDescription}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Translation Column */}
                    <div>
                      <h3 className="font-display text-lg mb-4 text-text-primary">
                        Translation ({pageLanguage.toUpperCase()})
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-text-primary/70 mb-2 uppercase tracking-wider">
                            Title *
                          </label>
                          <input
                            type="text"
                            value={pageFormData.title}
                            onChange={(e) => setPageFormData({ ...pageFormData, title: e.target.value })}
                            className="w-full bg-bg-secondary border border-border-default rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-text-primary/70 mb-2 uppercase tracking-wider">
                            Slug *
                          </label>
                          <input
                            type="text"
                            value={pageFormData.slug}
                            onChange={(e) => setPageFormData({ ...pageFormData, slug: e.target.value })}
                            className="w-full bg-bg-secondary border border-border-default rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-text-primary/70 mb-2 uppercase tracking-wider">
                            Meta Title
                          </label>
                          <input
                            type="text"
                            value={pageFormData.metaTitle}
                            onChange={(e) => setPageFormData({ ...pageFormData, metaTitle: e.target.value })}
                            className="w-full bg-bg-secondary border border-border-default rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="SEO title for this page"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-text-primary/70 mb-2 uppercase tracking-wider">
                            Meta Description
                          </label>
                          <textarea
                            value={pageFormData.metaDescription}
                            onChange={(e) => setPageFormData({ ...pageFormData, metaDescription: e.target.value })}
                            className="w-full bg-bg-secondary border border-border-default rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            rows={3}
                            placeholder="SEO description for this page"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-border-default">
                    <button
                      type="button"
                      onClick={() => setSelectedPage(null)}
                      className="px-6 py-2.5 rounded-full border border-border-default text-text-primary hover:bg-bg-elevated transition-colors"
                    >
                      Cancel
                    </button>
                    <SaveButton
                      type="submit"
                      isLoading={savePageMutation.isPending}
                      isSuccess={savePageMutation.isSuccess}
                      loadingText="Saving..."
                      successText="Saved!"
                    >
                      Save Translation
                    </SaveButton>
                  </div>
                </form>
              </div>
            ) : (
              <div className="rounded-3xl bg-bg-elevated border border-border-default p-12 text-center">
                <p className="text-text-primary/70 text-lg">
                  Select a page from the left to manage translations
                </p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Block Translations Tab */}
      {activeTab === 'blocks' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Pages & Blocks Sidebar */}
          <aside className="col-span-3 space-y-4">
            {/* Page Selection */}
            <div className="rounded-3xl bg-bg-elevated border border-border-default p-6">
              <h2 className="font-display text-lg text-text-primary mb-4">Select Page</h2>
              {pagesLoading ? (
                <p className="text-text-primary/60">Loading...</p>
              ) : (
                <div className="space-y-2">
                  {pages?.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        setSelectedBlockPage(page);
                        setSelectedBlock(null);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-colors text-sm ${
                        selectedBlockPage?.id === page.id
                          ? 'bg-interactive-default text-on-interactive font-semibold'
                          : 'text-text-primary hover:bg-bg-elevated'
                      }`}
                    >
                      {page.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Block Selection */}
            {selectedBlockPage && (
              <div className="rounded-3xl bg-bg-elevated border border-border-default p-6">
                <h2 className="font-display text-lg text-text-primary mb-4">Blocks</h2>
                {blocksLoading ? (
                  <p className="text-text-primary/60">Loading...</p>
                ) : blocks && blocks.length > 0 ? (
                  <div className="space-y-2">
                    {blocks.map((block) => (
                      <button
                        key={block.id}
                        onClick={() => setSelectedBlock(block)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-colors text-sm ${
                          selectedBlock?.id === block.id
                            ? 'bg-interactive-default text-on-interactive font-semibold'
                            : 'text-text-primary hover:bg-bg-elevated'
                        }`}
                      >
                        <div>{block.blockKey}</div>
                        <div className="text-xs opacity-60 mt-1">{block.blockType}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-primary/60 text-sm">No blocks found</p>
                )}
              </div>
            )}
          </aside>

          {/* Block Translation Editor */}
          <main className="col-span-9">
            {selectedBlock ? (
              <div className="rounded-3xl bg-bg-elevated border border-border-default p-6">
                {/* Language Selector */}
                <div className="mb-6 flex items-center gap-4">
                  <label className="font-semibold text-sm text-text-primary">
                    Target Language:
                  </label>
                  {languagesLoading ? (
                    <p className="text-text-primary/60">Loading languages...</p>
                  ) : (
                    <select
                      value={blockLanguage}
                      onChange={(e) => setBlockLanguage(e.target.value)}
                      className="bg-bg-secondary border border-border-default rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-bg-primary">
                          {lang.name} ({lang.nativeName})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Translation Form */}
                <form onSubmit={handleBlockSubmit} className="space-y-6">
                  <BlockTranslationEditor
                    blockType={selectedBlock.blockType}
                    sourceContent={selectedBlock.content}
                    translationContent={blockContent}
                    sourceLanguage="en"
                    targetLanguage={blockLanguage}
                    onChange={setBlockContent}
                    onAITranslate={handleBlockAITranslate}
                    isTranslating={translateBlockMutation.isPending}
                  />

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-border-default">
                    <button
                      type="button"
                      onClick={() => setSelectedBlock(null)}
                      className="px-6 py-2.5 rounded-full border border-border-default text-text-primary hover:bg-bg-elevated transition-colors"
                    >
                      Cancel
                    </button>
                    <SaveButton
                      type="submit"
                      isLoading={saveBlockMutation.isPending}
                      isSuccess={saveBlockMutation.isSuccess}
                      loadingText="Saving..."
                      successText="Saved!"
                    >
                      Save Translation
                    </SaveButton>
                  </div>
                </form>
              </div>
            ) : (
              <div className="rounded-3xl bg-bg-elevated border border-border-default p-12 text-center">
                <p className="text-text-primary/70 text-lg">
                  {selectedBlockPage
                    ? 'Select a block from the left to manage translations'
                    : 'Select a page first, then choose a block to translate'
                  }
                </p>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
