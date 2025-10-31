import { useTranslation } from 'react-i18next';

/**
 * Hook to generate language-prefixed paths
 * Example: useLocalizedPath()('/products') => '/en/products' or '/ka/products'
 */
export function useLocalizedPath() {
  const { i18n } = useTranslation();

  return (path: string) => {
    const lang = i18n.language || 'en';
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${lang}${cleanPath}`;
  };
}

/**
 * Hook to get current language
 */
export function useLanguage() {
  const { i18n } = useTranslation();
  return i18n.language || 'en';
}

/**
 * Hook to change language and update URL
 */
export function useChangeLanguage() {
  const { i18n } = useTranslation();

  return (newLanguage: string) => {
    // Update URL path
    const currentPath = window.location.pathname;
    // Remove any language prefix (matches /xx/ or /xxx/ at the start)
    // This regex matches: slash + 2-3 lowercase letters + slash (or end of string)
    const pathWithoutLang = currentPath.replace(/^\/[a-z]{2,3}(\/|$)/, '/');
    const newPath = `/${newLanguage}${pathWithoutLang === '/' ? '' : pathWithoutLang}`;

    // Change language in i18n
    i18n.changeLanguage(newLanguage);

    // Reload the page to ensure all content updates
    window.location.href = newPath;
  };
}
