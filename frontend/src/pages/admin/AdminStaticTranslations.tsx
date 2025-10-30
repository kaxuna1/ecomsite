import { useState, useEffect, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, Transition } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  LanguageIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import * as staticTranslationsApi from '../../api/staticTranslations';
import { fetchLanguages } from '../../api/languages';
import SaveButton from '../../components/admin/SaveButton';
import { toast } from 'react-hot-toast';

export default function AdminStaticTranslations() {
  const queryClient = useQueryClient();
  const [selectedNamespace, setSelectedNamespace] = useState('common');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'browse' | 'stats' | 'missing'>('browse');

  // Bulk translation state
  const [showBulkTranslateModal, setShowBulkTranslateModal] = useState(false);
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<string>('');
  const [bulkTranslations, setBulkTranslations] = useState<Array<{
    key: string;
    sourceText: string;
    translatedText: string;
  }>>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });

  // Fetch languages
  const { data: languages = [] } = useQuery({
    queryKey: ['languages'],
    queryFn: () => fetchLanguages(false)
  });

  // Fetch namespaces
  const { data: namespaces = [] } = useQuery({
    queryKey: ['static-translations-namespaces'],
    queryFn: staticTranslationsApi.getNamespaces
  });

  // Fetch translation keys for selected namespace
  const { data: translationKeys = [], isLoading: keysLoading } = useQuery({
    queryKey: ['static-translations-keys', selectedNamespace],
    queryFn: () => staticTranslationsApi.getTranslationKeys(selectedNamespace),
    enabled: !!selectedNamespace
  });

  // Fetch translations for selected key
  const { data: keyTranslations = [], refetch: refetchKeyTranslations } = useQuery({
    queryKey: ['static-translations-for-key', selectedKey, selectedNamespace],
    queryFn: () => staticTranslationsApi.getTranslationsForKey(selectedKey!, selectedNamespace),
    enabled: !!selectedKey
  });

  // Fetch statistics
  const { data: stats = [] } = useQuery({
    queryKey: ['static-translations-stats'],
    queryFn: staticTranslationsApi.getTranslationStats,
    enabled: activeTab === 'stats'
  });

  // Fetch missing translations
  const { data: missingTranslations = [] } = useQuery({
    queryKey: ['static-translations-missing'],
    queryFn: async () => {
      const allMissing = [];
      for (const lang of languages.filter(l => l.code !== 'en')) {
        const missing = await staticTranslationsApi.findMissingTranslations(lang.code);
        allMissing.push({ language: lang.code, missing });
      }
      return allMissing;
    },
    enabled: activeTab === 'missing' && languages.length > 0
  });

  // Load translations into form when key is selected
  useEffect(() => {
    if (keyTranslations.length > 0) {
      const translationsMap: Record<string, string> = {};
      keyTranslations.forEach(t => {
        translationsMap[t.language_code] = t.translation_value;
      });
      setTranslations(translationsMap);
    } else {
      setTranslations({});
    }
  }, [keyTranslations]);

  // Save translation mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(translations).map(([langCode, value]) => ({
        translationKey: selectedKey!,
        languageCode: langCode,
        translationValue: value,
        namespace: selectedNamespace
      }));

      return staticTranslationsApi.bulkUpsertTranslations(updates);
    },
    onSuccess: () => {
      toast.success('Translations saved successfully');
      queryClient.invalidateQueries({ queryKey: ['static-translations-stats'] });
      queryClient.invalidateQueries({ queryKey: ['static-translations-missing'] });
      refetchKeyTranslations();
    },
    onError: () => {
      toast.error('Failed to save translations');
    }
  });

  // Add new key mutation
  const addKeyMutation = useMutation({
    mutationFn: async () => {
      return staticTranslationsApi.upsertTranslation({
        translationKey: newKey,
        languageCode: 'en',
        translationValue: '',
        namespace: selectedNamespace
      });
    },
    onSuccess: () => {
      toast.success('Translation key added');
      setNewKey('');
      setShowAddKey(false);
      setSelectedKey(newKey);
      queryClient.invalidateQueries({ queryKey: ['static-translations-keys'] });
    },
    onError: () => {
      toast.error('Failed to add translation key');
    }
  });

  // Delete key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: async (key: string) => {
      // Delete for all languages
      for (const lang of languages) {
        await staticTranslationsApi.deleteTranslation(key, lang.code, selectedNamespace);
      }
    },
    onSuccess: () => {
      toast.success('Translation key deleted');
      setSelectedKey(null);
      queryClient.invalidateQueries({ queryKey: ['static-translations-keys'] });
      queryClient.invalidateQueries({ queryKey: ['static-translations-stats'] });
    },
    onError: () => {
      toast.error('Failed to delete translation key');
    }
  });

  // AI Translation mutation
  const aiTranslateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedKey) throw new Error('No key selected');

      const sourceText = translations['en'] || '';
      if (!sourceText.trim()) {
        throw new Error('No English (source) text to translate');
      }

      const results: Array<{ lang: string; result: staticTranslationsApi.AITranslationResult }> = [];

      // Translate for all languages except English
      for (const lang of languages.filter(l => l.code !== 'en')) {
        // Skip if translation already exists
        if (translations[lang.code]?.trim()) {
          continue;
        }

        const result = await staticTranslationsApi.translateStaticText(
          sourceText,
          lang.code,
          {
            key: selectedKey,
            namespace: selectedNamespace,
            sourceLanguage: 'en',
            context: `UI text in ${selectedNamespace} section`
          }
        );

        results.push({ lang: lang.code, result });
      }

      return results;
    },
    onSuccess: (results) => {
      if (results.length === 0) {
        toast.info('All translations already exist');
        return;
      }

      // Update translations state with AI results
      const newTranslations = { ...translations };
      let totalCost = 0;
      let totalTokens = 0;

      results.forEach(({ lang, result }) => {
        newTranslations[lang] = result.translatedText;
        totalCost += result.cost;
        totalTokens += result.tokensUsed;
      });

      setTranslations(newTranslations);

      toast.success(
        `AI translated ${results.length} language(s) • Cost: $${totalCost.toFixed(4)} • Tokens: ${totalTokens}`,
        { duration: 5000 }
      );
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to translate with AI');
    }
  });

  // Fetch all translations for namespace (for bulk translate)
  const { data: allNamespaceTranslations = [] } = useQuery({
    queryKey: ['static-translations-all', selectedNamespace, 'en'],
    queryFn: async () => {
      const allTranslations = await staticTranslationsApi.getTranslationsByNamespace('en', selectedNamespace);
      return Object.entries(allTranslations).map(([key, value]) => ({
        translation_key: key,
        translation_value: value as string,
        language_code: 'en',
        namespace: selectedNamespace
      }));
    },
    enabled: !!selectedNamespace
  });

  // Bulk AI translation mutation
  const bulkTranslateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTargetLanguage) throw new Error('No target language selected');

      // Get all English translations for this namespace
      const sourceTranslations = allNamespaceTranslations.filter(t => t.translation_value?.trim());

      // Check which keys already have translations in target language
      const existingTranslations = await staticTranslationsApi.getTranslationsByNamespace(
        selectedTargetLanguage,
        selectedNamespace
      );

      // Filter out keys that already have translations
      const keysToTranslate = sourceTranslations.filter(
        t => !existingTranslations[t.translation_key]?.trim()
      );

      if (keysToTranslate.length === 0) {
        throw new Error('All keys already have translations');
      }

      // Initialize progress
      setTranslationProgress({ current: 0, total: keysToTranslate.length });

      // Initialize empty translations that will be populated one by one
      const initialTranslations = keysToTranslate.map(item => ({
        key: item.translation_key,
        sourceText: item.translation_value,
        translatedText: '' // Start empty, will fill as we go
      }));

      setBulkTranslations(initialTranslations);
      setShowBulkTranslateModal(false);
      setShowPreviewModal(true);

      const results = [];
      let totalCost = 0;
      let totalTokens = 0;

      // Translate each key one by one and update progress
      for (let i = 0; i < keysToTranslate.length; i++) {
        const item = keysToTranslate[i];

        try {
          const result = await staticTranslationsApi.translateStaticText(
            item.translation_value,
            selectedTargetLanguage,
            {
              key: item.translation_key,
              namespace: selectedNamespace,
              sourceLanguage: 'en',
              context: `UI text in ${selectedNamespace} section`
            }
          );

          const translatedItem = {
            key: item.translation_key,
            sourceText: item.translation_value,
            translatedText: result.translatedText
          };

          results.push(translatedItem);

          // Update the specific item in the preview modal
          setBulkTranslations(prev =>
            prev.map(t => t.key === item.translation_key ? translatedItem : t)
          );

          totalCost += result.cost;
          totalTokens += result.tokensUsed;

          // Update progress
          setTranslationProgress({ current: i + 1, total: keysToTranslate.length });
        } catch (error) {
          console.error(`Failed to translate key ${item.translation_key}:`, error);
          // Keep the empty translation if it fails
        }
      }

      return { results, totalCost, totalTokens };
    },
    onSuccess: ({ results, totalCost, totalTokens }) => {
      // Modal is already open and translations already populated
      // Just show final success message
      toast.success(
        `Completed ${results.length} translation(s) • Cost: $${totalCost.toFixed(4)} • Tokens: ${totalTokens}`,
        { duration: 5000 }
      );
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to bulk translate');
    }
  });

  // Save bulk translations mutation
  const saveBulkTranslationsMutation = useMutation({
    mutationFn: async () => {
      const updates = bulkTranslations.map(item => ({
        translationKey: item.key,
        languageCode: selectedTargetLanguage,
        translationValue: item.translatedText,
        namespace: selectedNamespace
      }));

      return staticTranslationsApi.bulkUpsertTranslations(updates);
    },
    onSuccess: () => {
      toast.success(`Saved ${bulkTranslations.length} translations`);
      setShowPreviewModal(false);
      setBulkTranslations([]);
      setSelectedTargetLanguage('');
      queryClient.invalidateQueries({ queryKey: ['static-translations'] });
    },
    onError: () => {
      toast.error('Failed to save translations');
    }
  });

  const filteredKeys = translationKeys.filter(key =>
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    if (!selectedKey) return;
    saveMutation.mutate();
  };

  const handleAddKey = () => {
    if (!newKey.trim()) return;
    addKeyMutation.mutate();
  };

  const handleDeleteKey = (key: string) => {
    if (confirm(`Are you sure you want to delete the key "${key}" for all languages?`)) {
      deleteKeyMutation.mutate(key);
    }
  };

  const handleAITranslate = () => {
    if (!selectedKey) return;

    const sourceText = translations['en'];
    if (!sourceText?.trim()) {
      toast.error('Please add English (source) text first');
      return;
    }

    const missingCount = languages.filter(l => l.code !== 'en' && !translations[l.code]?.trim()).length;
    if (missingCount === 0) {
      toast.info('All translations already exist');
      return;
    }

    if (confirm(`AI will translate to ${missingCount} language(s). This will use AI credits. Continue?`)) {
      aiTranslateMutation.mutate();
    }
  };

  const handleBulkTranslate = () => {
    const nonEnglishLanguages = languages.filter(l => l.code !== 'en');

    if (nonEnglishLanguages.length === 0) {
      toast.error('No target languages available');
      return;
    }

    // If more than one language, show modal to select
    if (nonEnglishLanguages.length > 1) {
      setShowBulkTranslateModal(true);
    } else {
      // Only one language, translate directly
      setSelectedTargetLanguage(nonEnglishLanguages[0].code);
      setTimeout(() => bulkTranslateMutation.mutate(), 100);
    }
  };

  const handleStartBulkTranslate = () => {
    if (!selectedTargetLanguage) {
      toast.error('Please select a target language');
      return;
    }

    const keysWithEnglish = allNamespaceTranslations.filter(t => t.translation_value.trim()).length;

    if (keysWithEnglish === 0) {
      toast.error('No English translations found in this namespace');
      return;
    }

    bulkTranslateMutation.mutate();
  };

  const handleUpdateBulkTranslation = (key: string, newValue: string) => {
    setBulkTranslations(prev =>
      prev.map(item => item.key === key ? { ...item, translatedText: newValue } : item)
    );
  };

  const handleSaveBulkTranslations = () => {
    saveBulkTranslationsMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display uppercase tracking-wider text-champagne">
            Static Translations
          </h1>
          <p className="mt-1 text-sm text-champagne/60">
            Manage UI text translations across all languages
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleBulkTranslate}
            disabled={bulkTranslateMutation.isPending}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
          >
            <SparklesIcon className={`h-4 w-4 ${bulkTranslateMutation.isPending ? 'animate-spin' : ''}`} />
            {bulkTranslateMutation.isPending ? 'Translating...' : 'Bulk AI Translate'}
          </button>

          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['static-translations'] });
              toast.success('Translations reloaded');
            }}
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-champagne hover:bg-white/20"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Reload
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'browse'
                ? 'border-blush text-blush'
                : 'border-transparent text-champagne/60 hover:border-champagne/30 hover:text-champagne'
            }`}
          >
            <LanguageIcon className="h-5 w-5" />
            Browse & Edit
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'stats'
                ? 'border-blush text-blush'
                : 'border-transparent text-champagne/60 hover:border-champagne/30 hover:text-champagne'
            }`}
          >
            <ChartBarIcon className="h-5 w-5" />
            Statistics
          </button>

          <button
            onClick={() => setActiveTab('missing')}
            className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'missing'
                ? 'border-blush text-blush'
                : 'border-transparent text-champagne/60 hover:border-champagne/30 hover:text-champagne'
            }`}
          >
            <ExclamationTriangleIcon className="h-5 w-5" />
            Missing Translations
          </button>
        </nav>
      </div>

      {/* Browse & Edit Tab */}
      {activeTab === 'browse' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar: Namespace & Keys */}
          <div className="col-span-4 space-y-4">
            {/* Namespace Selector */}
            <div>
              <label className="block text-sm font-medium text-champagne mb-2">
                Namespace
              </label>
              <select
                value={selectedNamespace}
                onChange={(e) => {
                  setSelectedNamespace(e.target.value);
                  setSelectedKey(null);
                }}
                className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-champagne focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/50"
              >
                {namespaces.map(ns => (
                  <option key={ns} value={ns}>{ns}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-champagne/60" />
              <input
                type="text"
                placeholder="Search keys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-white/20 bg-white/5 pl-12 pr-4 py-2 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/50"
              />
            </div>

            {/* Add New Key */}
            <button
              onClick={() => setShowAddKey(!showAddKey)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-champagne hover:bg-white/10"
            >
              <PlusIcon className="h-5 w-5" />
              Add New Key
            </button>

            {showAddKey && (
              <div className="space-y-2 rounded-2xl border border-white/20 bg-white/5 p-4">
                <input
                  type="text"
                  placeholder="translation.key.name"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddKey}
                    disabled={!newKey.trim() || addKeyMutation.isPending}
                    className="flex-1 rounded-xl bg-blush px-3 py-2 text-sm font-semibold text-midnight hover:bg-champagne disabled:opacity-50"
                  >
                    {addKeyMutation.isPending ? 'Adding...' : 'Add'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddKey(false);
                      setNewKey('');
                    }}
                    className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-champagne hover:bg-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Translation Keys List */}
            <div className="space-y-1 max-h-[600px] overflow-y-auto rounded-2xl border border-white/20 bg-white/5 p-2">
              {keysLoading ? (
                <div className="p-4 text-center text-champagne/60">Loading keys...</div>
              ) : filteredKeys.length === 0 ? (
                <div className="p-4 text-center text-champagne/60">No keys found</div>
              ) : (
                filteredKeys.map(key => (
                  <div
                    key={key}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm cursor-pointer transition-colors ${
                      selectedKey === key
                        ? 'bg-blush text-midnight'
                        : 'text-champagne hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedKey(key)}
                  >
                    <span className="truncate font-mono text-xs">{key}</span>
                    {selectedKey === key && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteKey(key);
                        }}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Main Content: Translation Editor */}
          <div className="col-span-8">
            {selectedKey ? (
              <div className="space-y-6 rounded-2xl border border-white/20 bg-white/5 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-champagne">
                      Edit Translation
                    </h2>
                    <p className="text-sm text-champagne/60 font-mono">{selectedKey}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleAITranslate}
                      disabled={!selectedKey || !translations['en']?.trim() || aiTranslateMutation.isPending}
                    >
                      <SparklesIcon className={`h-4 w-4 ${aiTranslateMutation.isPending ? 'animate-spin' : ''}`} />
                      {aiTranslateMutation.isPending ? 'Translating...' : 'AI Translate'}
                    </button>

                    <SaveButton
                      onClick={handleSave}
                      isLoading={saveMutation.isPending}
                      isSuccess={saveMutation.isSuccess}
                      disabled={!selectedKey}
                    >
                      Save Translations
                    </SaveButton>
                  </div>
                </div>

                {/* Language Translations */}
                <div className="space-y-4">
                  {languages.map(lang => (
                    <div key={lang.code}>
                      <label className="block text-sm font-medium text-champagne mb-2">
                        {lang.nativeName} ({lang.code.toUpperCase()})
                        {lang.code === 'en' && (
                          <span className="ml-2 text-xs text-blush">(Source Language)</span>
                        )}
                      </label>
                      <textarea
                        value={translations[lang.code] || ''}
                        onChange={(e) => setTranslations(prev => ({
                          ...prev,
                          [lang.code]: e.target.value
                        }))}
                        rows={3}
                        className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/50"
                        placeholder={`Enter ${lang.nativeName} translation...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 p-12">
                <div className="text-center">
                  <LanguageIcon className="mx-auto h-12 w-12 text-champagne/40" />
                  <h3 className="mt-4 text-lg font-semibold text-champagne/60">
                    Select a translation key
                  </h3>
                  <p className="mt-2 text-sm text-champagne/40">
                    Choose a key from the list to edit its translations
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/20 bg-white/5 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-champagne/60">{stat.namespace}</p>
                    <p className="text-2xl font-bold text-champagne mt-1">
                      {stat.translation_count}
                    </p>
                    <p className="text-xs text-champagne/40 mt-1">
                      {stat.language_code.toUpperCase()} • {stat.unique_keys} unique keys
                    </p>
                  </div>
                  <ChartBarIcon className="h-8 w-8 text-blush/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Translations Tab */}
      {activeTab === 'missing' && (
        <div className="space-y-6">
          {missingTranslations.map((item, index) => (
            <div key={index} className="rounded-2xl border border-white/20 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-champagne mb-4">
                Missing in {item.language.toUpperCase()}: {item.missing.length} keys
              </h3>

              {item.missing.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {item.missing.slice(0, 20).map((missing, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-white/5 px-3 py-2 text-sm text-champagne/80 font-mono cursor-pointer hover:bg-white/10"
                      onClick={() => {
                        setActiveTab('browse');
                        setSelectedNamespace(missing.namespace);
                        setSelectedKey(missing.translation_key);
                      }}
                    >
                      {missing.namespace}.{missing.translation_key}
                    </div>
                  ))}
                  {item.missing.length > 20 && (
                    <div className="text-sm text-champagne/60 px-3 py-2">
                      +{item.missing.length - 20} more...
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-champagne/60">All keys translated!</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bulk Translate Language Selection Modal */}
      <Transition appear show={showBulkTranslateModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowBulkTranslateModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl border border-white/20 bg-midnight p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-champagne mb-4">
                    Select Target Language
                  </Dialog.Title>

                  <p className="text-sm text-champagne/60 mb-6">
                    Choose which language to translate all keys in the <strong>{selectedNamespace}</strong> namespace to.
                    Only keys with English text that don't already have translations will be translated.
                  </p>

                  <div className="space-y-2 mb-6">
                    {languages.filter(l => l.code !== 'en').map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => setSelectedTargetLanguage(lang.code)}
                        className={`w-full rounded-xl px-4 py-3 text-left transition-colors ${
                          selectedTargetLanguage === lang.code
                            ? 'bg-blush text-midnight'
                            : 'bg-white/5 text-champagne hover:bg-white/10'
                        }`}
                      >
                        <div className="font-semibold">{lang.nativeName}</div>
                        <div className="text-xs opacity-70">{lang.name} ({lang.code.toUpperCase()})</div>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowBulkTranslateModal(false)}
                      className="flex-1 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-champagne hover:bg-white/20"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStartBulkTranslate}
                      disabled={!selectedTargetLanguage || bulkTranslateMutation.isPending}
                      className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                    >
                      {bulkTranslateMutation.isPending ? 'Translating...' : 'Start Translation'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Preview & Edit Translations Modal */}
      <Transition appear show={showPreviewModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowPreviewModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl border border-white/20 bg-midnight shadow-xl transition-all">
                  <div className="border-b border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-champagne">
                          Review AI Translations
                        </Dialog.Title>
                        <p className="mt-1 text-sm text-champagne/60">
                          {bulkTranslations.length} translations to {languages.find(l => l.code === selectedTargetLanguage)?.nativeName}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPreviewModal(false)}
                        className="rounded-full p-2 text-champagne/60 hover:bg-white/10 hover:text-champagne"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    {bulkTranslateMutation.isPending && translationProgress.total > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-champagne/70">
                            Translating {translationProgress.current} of {translationProgress.total}...
                          </span>
                          <span className="text-blush font-semibold">
                            {Math.round((translationProgress.current / translationProgress.total) * 100)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                            style={{ width: `${(translationProgress.current / translationProgress.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {!bulkTranslateMutation.isPending && translationProgress.total > 0 && translationProgress.current === translationProgress.total && (
                      <div className="flex items-center gap-2 text-sm text-jade">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-semibold">All translations completed! Review and save below.</span>
                      </div>
                    )}
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
                    {bulkTranslations.map((item, index) => (
                      <div key={item.key} className="rounded-2xl border border-white/20 bg-white/5 p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <span className="text-xs font-mono text-champagne/60">{item.key}</span>
                          <span className="text-xs text-champagne/40">#{index + 1}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-champagne/60 mb-2">
                              English (Source)
                            </label>
                            <div className="rounded-xl bg-white/5 px-3 py-2 text-sm text-champagne/80">
                              {item.sourceText}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-champagne/60 mb-2">
                              {languages.find(l => l.code === selectedTargetLanguage)?.nativeName} (Translation)
                            </label>
                            <textarea
                              value={item.translatedText}
                              onChange={(e) => handleUpdateBulkTranslation(item.key, e.target.value)}
                              rows={2}
                              className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-champagne focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/50"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 p-6">
                    <button
                      onClick={() => {
                        setShowPreviewModal(false);
                        setBulkTranslations([]);
                        setSelectedTargetLanguage('');
                      }}
                      className="rounded-xl bg-white/10 px-6 py-2 text-sm font-semibold text-champagne hover:bg-white/20"
                    >
                      Cancel
                    </button>
                    <SaveButton
                      onClick={handleSaveBulkTranslations}
                      isLoading={saveBulkTranslationsMutation.isPending}
                      isSuccess={saveBulkTranslationsMutation.isSuccess}
                    >
                      Save All {bulkTranslations.length} Translations
                    </SaveButton>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
