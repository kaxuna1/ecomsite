import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { fetchCMSPages, fetchPageBlocks } from '../../api/cmsAdmin';
import type { CMSPage, CMSBlock } from '../../api/cmsAdmin';
import { fetchLanguages } from '../../api/languages';

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
  const [blockContent, setBlockContent] = useState('');

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
        metaTitle: pageTranslation.meta_title || '',
        metaDescription: pageTranslation.meta_description || ''
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
      setBlockContent(JSON.stringify(blockTranslation.content, null, 2));
    } else if (selectedBlock) {
      // No translation exists, start with empty content
      setBlockContent('{}');
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
    try {
      const parsedContent = JSON.parse(blockContent);
      saveBlockMutation.mutate({ content: parsedContent });
    } catch (err) {
      toast.error('Invalid JSON format. Please check your content.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-champagne">CMS Translations</h1>
        <p className="mt-1 text-sm text-champagne/70">
          Manage translations for CMS pages and blocks
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('pages')}
          className={`px-6 py-3 font-semibold text-sm uppercase tracking-wider transition-colors ${
            activeTab === 'pages'
              ? 'text-blush border-b-2 border-blush'
              : 'text-champagne/60 hover:text-champagne'
          }`}
        >
          Page Translations
        </button>
        <button
          onClick={() => setActiveTab('blocks')}
          className={`px-6 py-3 font-semibold text-sm uppercase tracking-wider transition-colors ${
            activeTab === 'blocks'
              ? 'text-blush border-b-2 border-blush'
              : 'text-champagne/60 hover:text-champagne'
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
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
              <h2 className="font-display text-lg text-champagne mb-4">CMS Pages</h2>
              {pagesLoading ? (
                <p className="text-champagne/60">Loading...</p>
              ) : (
                <div className="space-y-2">
                  {pages?.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => setSelectedPage(page)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-colors text-sm ${
                        selectedPage?.id === page.id
                          ? 'bg-blush text-midnight font-semibold'
                          : 'text-champagne hover:bg-white/10'
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
              <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
                {/* Language Selector */}
                <div className="mb-6 flex items-center gap-4">
                  <label className="font-semibold text-sm text-champagne">
                    Target Language:
                  </label>
                  {languagesLoading ? (
                    <p className="text-champagne/60">Loading languages...</p>
                  ) : (
                    <select
                      value={pageLanguage}
                      onChange={(e) => setPageLanguage(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-champagne focus:outline-none focus:ring-2 focus:ring-blush"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-midnight">
                          {lang.name} ({lang.nativeName})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Translation Form */}
                <form onSubmit={handlePageSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Original Column */}
                    <div>
                      <h3 className="font-display text-lg mb-4 text-champagne">
                        Original (English)
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                            Title
                          </label>
                          <p className="p-3 bg-white/5 rounded-xl border border-white/10 text-champagne">
                            {selectedPage.title}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                            Slug
                          </label>
                          <p className="p-3 bg-white/5 rounded-xl border border-white/10 text-champagne text-sm">
                            {selectedPage.slug}
                          </p>
                        </div>
                        {selectedPage.metaDescription && (
                          <div>
                            <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                              Meta Description
                            </label>
                            <p className="p-3 bg-white/5 rounded-xl border border-white/10 text-champagne text-sm">
                              {selectedPage.metaDescription}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Translation Column */}
                    <div>
                      <h3 className="font-display text-lg mb-4 text-champagne">
                        Translation ({pageLanguage.toUpperCase()})
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                            Title *
                          </label>
                          <input
                            type="text"
                            value={pageFormData.title}
                            onChange={(e) => setPageFormData({ ...pageFormData, title: e.target.value })}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-champagne focus:outline-none focus:ring-2 focus:ring-blush"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                            Slug *
                          </label>
                          <input
                            type="text"
                            value={pageFormData.slug}
                            onChange={(e) => setPageFormData({ ...pageFormData, slug: e.target.value })}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-champagne text-sm focus:outline-none focus:ring-2 focus:ring-blush font-mono"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                            Meta Title
                          </label>
                          <input
                            type="text"
                            value={pageFormData.metaTitle}
                            onChange={(e) => setPageFormData({ ...pageFormData, metaTitle: e.target.value })}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-champagne text-sm focus:outline-none focus:ring-2 focus:ring-blush"
                            placeholder="SEO title for this page"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                            Meta Description
                          </label>
                          <textarea
                            value={pageFormData.metaDescription}
                            onChange={(e) => setPageFormData({ ...pageFormData, metaDescription: e.target.value })}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-champagne text-sm focus:outline-none focus:ring-2 focus:ring-blush"
                            rows={3}
                            placeholder="SEO description for this page"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setSelectedPage(null)}
                      className="px-6 py-2.5 rounded-full border border-white/20 text-champagne hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savePageMutation.isPending}
                      className="px-6 py-2.5 rounded-full bg-blush text-midnight font-semibold hover:bg-champagne transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savePageMutation.isPending ? 'Saving...' : 'Save Translation'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="rounded-3xl bg-white/5 border border-white/10 p-12 text-center">
                <p className="text-champagne/70 text-lg">
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
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
              <h2 className="font-display text-lg text-champagne mb-4">Select Page</h2>
              {pagesLoading ? (
                <p className="text-champagne/60">Loading...</p>
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
                          ? 'bg-blush text-midnight font-semibold'
                          : 'text-champagne hover:bg-white/10'
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
              <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
                <h2 className="font-display text-lg text-champagne mb-4">Blocks</h2>
                {blocksLoading ? (
                  <p className="text-champagne/60">Loading...</p>
                ) : blocks && blocks.length > 0 ? (
                  <div className="space-y-2">
                    {blocks.map((block) => (
                      <button
                        key={block.id}
                        onClick={() => setSelectedBlock(block)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-colors text-sm ${
                          selectedBlock?.id === block.id
                            ? 'bg-blush text-midnight font-semibold'
                            : 'text-champagne hover:bg-white/10'
                        }`}
                      >
                        <div>{block.blockKey}</div>
                        <div className="text-xs opacity-60 mt-1">{block.blockType}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-champagne/60 text-sm">No blocks found</p>
                )}
              </div>
            )}
          </aside>

          {/* Block Translation Editor */}
          <main className="col-span-9">
            {selectedBlock ? (
              <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
                {/* Language Selector */}
                <div className="mb-6 flex items-center gap-4">
                  <label className="font-semibold text-sm text-champagne">
                    Target Language:
                  </label>
                  {languagesLoading ? (
                    <p className="text-champagne/60">Loading languages...</p>
                  ) : (
                    <select
                      value={blockLanguage}
                      onChange={(e) => setBlockLanguage(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-champagne focus:outline-none focus:ring-2 focus:ring-blush"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-midnight">
                          {lang.name} ({lang.nativeName})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Translation Form */}
                <form onSubmit={handleBlockSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Original Column */}
                    <div>
                      <h3 className="font-display text-lg mb-4 text-champagne">
                        Original Content (English)
                      </h3>
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                          Block: {selectedBlock.blockKey} ({selectedBlock.blockType})
                        </label>
                        <pre className="p-4 bg-white/5 rounded-xl border border-white/10 text-champagne text-xs overflow-auto max-h-96 font-mono">
                          {JSON.stringify(selectedBlock.content, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Translation Column */}
                    <div>
                      <h3 className="font-display text-lg mb-4 text-champagne">
                        Translation ({blockLanguage.toUpperCase()})
                      </h3>
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                          Translated Content (JSON) *
                        </label>
                        <textarea
                          value={blockContent}
                          onChange={(e) => setBlockContent(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-champagne text-xs focus:outline-none focus:ring-2 focus:ring-blush font-mono"
                          rows={16}
                          required
                          placeholder='{"key": "translated value"}'
                        />
                        <p className="text-xs text-champagne/50">
                          Provide the translated content as valid JSON. You can copy the original structure and translate the values.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setSelectedBlock(null)}
                      className="px-6 py-2.5 rounded-full border border-white/20 text-champagne hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveBlockMutation.isPending}
                      className="px-6 py-2.5 rounded-full bg-blush text-midnight font-semibold hover:bg-champagne transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saveBlockMutation.isPending ? 'Saving...' : 'Save Translation'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="rounded-3xl bg-white/5 border border-white/10 p-12 text-center">
                <p className="text-champagne/70 text-lg">
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
