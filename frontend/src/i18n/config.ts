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
      // Load translation files from API (database-driven)
      // Falls back to static JSON files if API is unavailable
      loadPath: (lngs: string[], namespaces: string[]) => {
        const lng = lngs[0];
        const ns = namespaces[0];

        // Get API base URL from environment or use default
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

        // Try API first (database-driven translations)
        return `${apiBaseUrl}/static-translations/${lng}/${ns}`;
      },

      // Fallback to static files on error
      // This ensures app still works if database is unavailable
      parse: (data: string) => {
        try {
          return JSON.parse(data);
        } catch (e) {
          console.error('Failed to parse translation data:', e);
          return {};
        }
      },

      // Add error handling
      request: (options: any, url: string, payload: any, callback: any) => {
        fetch(url)
          .then((response) => {
            if (!response.ok) {
              // If API fails, try static files as fallback
              const [, , , lng, ns] = url.split('/');
              const fallbackUrl = `/locales/${lng}/${ns}.json`;

              console.warn(`API translation failed for ${lng}/${ns}, trying fallback:`, fallbackUrl);

              return fetch(fallbackUrl);
            }
            return response;
          })
          .then((response) => response.json())
          .then((data) => {
            callback(null, { status: 200, data });
          })
          .catch((error) => {
            console.error('Translation loading error:', error);
            callback(error, { status: 500 });
          });
      },
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
