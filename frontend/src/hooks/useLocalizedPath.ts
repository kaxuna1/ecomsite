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
    i18n.changeLanguage(newLanguage);

    // Update URL path
    const currentPath = window.location.pathname;
    const pathWithoutLang = currentPath.replace(/^\/(en|ka)/, '');
    const newPath = `/${newLanguage}${pathWithoutLang}`;

    // Navigate to new language path
    window.history.pushState({}, '', newPath);
  };
}
