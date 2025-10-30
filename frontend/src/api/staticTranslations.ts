import api from './client';

export interface StaticTranslation {
  id: number;
  translation_key: string;
  language_code: string;
  translation_value: string;
  namespace: string;
  created_at: string;
  updated_at: string;
}

export interface TranslationStats {
  namespace: string;
  language_code: string;
  translation_count: string;
  unique_keys: string;
}

export interface MissingTranslation {
  namespace: string;
  translation_key: string;
}

// Get all translations for a language (public)
export const getTranslationsByLanguage = async (languageCode: string) => {
  const response = await api.get(`/static-translations/${languageCode}`);
  return response.data;
};

// Get translations for specific namespace (public)
export const getTranslationsByNamespace = async (languageCode: string, namespace: string) => {
  const response = await api.get(`/static-translations/${languageCode}/${namespace}`);
  return response.data;
};

// Get all translation keys (admin)
export const getTranslationKeys = async (namespace?: string) => {
  const response = await api.get('/static-translations/admin/keys', {
    params: { namespace }
  });
  return response.data.keys as string[];
};

// Get all namespaces (admin)
export const getNamespaces = async () => {
  const response = await api.get('/static-translations/admin/namespaces');
  return response.data.namespaces as string[];
};

// Get translations for a specific key (admin)
export const getTranslationsForKey = async (key: string, namespace?: string) => {
  const response = await api.get(`/static-translations/admin/key/${encodeURIComponent(key)}`, {
    params: { namespace }
  });
  return response.data.translations as StaticTranslation[];
};

// Upsert single translation (admin)
export const upsertTranslation = async (data: {
  translationKey: string;
  languageCode: string;
  translationValue: string;
  namespace?: string;
}) => {
  const response = await api.post('/static-translations/admin', data);
  return response.data.translation as StaticTranslation;
};

// Bulk upsert translations (admin)
export const bulkUpsertTranslations = async (translations: Array<{
  translationKey: string;
  languageCode: string;
  translationValue: string;
  namespace: string;
}>) => {
  const response = await api.post('/static-translations/admin/bulk', { translations });
  return response.data;
};

// Delete translation (admin)
export const deleteTranslation = async (
  translationKey: string,
  languageCode: string,
  namespace?: string
) => {
  const response = await api.delete('/static-translations/admin', {
    data: { translationKey, languageCode, namespace }
  });
  return response.data;
};

// Search translations (admin)
export const searchTranslations = async (
  query: string,
  languageCode?: string,
  namespace?: string
) => {
  const response = await api.get('/static-translations/admin/search', {
    params: { q: query, languageCode, namespace }
  });
  return response.data.results as StaticTranslation[];
};

// Get translation statistics (admin)
export const getTranslationStats = async () => {
  const response = await api.get('/static-translations/admin/stats');
  return response.data.stats as TranslationStats[];
};

// Find missing translations (admin)
export const findMissingTranslations = async (
  targetLanguage: string,
  sourceLanguage: string = 'en'
) => {
  const response = await api.get('/static-translations/admin/missing', {
    params: { sourceLanguage, targetLanguage }
  });
  return response.data.missing as MissingTranslation[];
};

// AI Translation
export interface AITranslationResult {
  translatedText: string;
  cost: number;
  tokensUsed: number;
  provider: string;
}

export const translateStaticText = async (
  text: string,
  targetLanguage: string,
  options?: {
    key?: string;
    namespace?: string;
    sourceLanguage?: string;
    preserveTerms?: string[];
    context?: string;
  }
): Promise<AITranslationResult> => {
  const response = await api.post('/admin/ai/translate-static-text', {
    text,
    targetLanguage,
    ...options
  });
  return response.data.data as AITranslationResult;
};
