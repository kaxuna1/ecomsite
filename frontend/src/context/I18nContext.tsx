import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '../i18n/translations';

type Language = keyof typeof translations;

interface TranslateOptions {
  values?: Record<string, string | number>;
}

interface I18nContextValue {
  language: Language;
  availableLanguages: { code: Language; label: string }[];
  setLanguage: (language: Language) => void;
  t: (key: string, options?: TranslateOptions) => string;
}

const STORAGE_KEY = 'luxia-language';

const I18nContext = createContext<I18nContextValue | null>(null);

const languageLabels: Record<Language, string> = {
  en: 'English',
  ka: 'ქართული'
};

function getNestedTranslation(language: Language, key: string): string | undefined {
  const segments = key.split('.');
  let current: unknown = translations[language];

  for (const segment of segments) {
    if (typeof current !== 'object' || current === null || !(segment in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === 'string' ? current : undefined;
}

function formatMessage(message: string, values?: Record<string, string | number>) {
  if (!values) return message;
  return Object.entries(values).reduce((accumulator, [token, value]) => {
    return accumulator.replace(new RegExp(`{${token}}`, 'g'), String(value));
  }, message);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
    return stored && stored in translations ? stored : 'en';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
  }, []);

  const translate = useCallback(
    (key: string, options?: TranslateOptions) => {
      const message = getNestedTranslation(language, key) ?? getNestedTranslation('en', key) ?? key;
      return formatMessage(message, options?.values);
    },
    [language]
  );

  const value = useMemo<I18nContextValue>(() => {
    return {
      language,
      availableLanguages: (Object.keys(translations) as Language[]).map((code) => ({
        code,
        label: languageLabels[code]
      })),
      setLanguage,
      t: translate
    };
  }, [language, setLanguage, translate]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export type { Language };
