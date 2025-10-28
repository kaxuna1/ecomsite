import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  // Load translations using http backend
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ka'],
    debug: import.meta.env.DEV,

    // Namespace organization
    ns: ['common', 'products', 'cart', 'checkout', 'admin', 'account'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false, // React already escapes
    },

    backend: {
      // Path to load translation files
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    detection: {
      // Order of language detection methods
      order: ['path', 'querystring', 'localStorage', 'navigator'],
      // Cache user language preference
      caches: ['localStorage'],
      // localStorage key
      lookupLocalStorage: 'luxia-language',
      // Query string parameter
      lookupQuerystring: 'lang',
      // URL path index (for /:lang/ routes)
      lookupFromPathIndex: 0,
    },

    react: {
      // Wait for translations to load before rendering
      useSuspense: true,
    },
  });

export default i18n;
