import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

/**
 * SEO component that adds hreflang tags for multilanguage support
 * This tells search engines about alternate language versions of the page
 */
export default function HreflangTags() {
  const location = useLocation();
  const baseUrl = import.meta.env.VITE_APP_URL || 'https://luxia.com';

  // Get current path without language prefix
  const pathWithoutLang = location.pathname.replace(/^\/(en|ka)/, '');

  // Supported languages
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ka', name: 'Georgian' }
  ];

  return (
    <Helmet>
      {/* hreflang tags for each language version */}
      {languages.map(lang => (
        <link
          key={lang.code}
          rel="alternate"
          hrefLang={lang.code}
          href={`${baseUrl}/${lang.code}${pathWithoutLang}`}
        />
      ))}

      {/* x-default for default language (English) */}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${baseUrl}/en${pathWithoutLang}`}
      />

      {/* Set document language */}
      <html lang={location.pathname.match(/^\/(en|ka)/)?.[1] || 'en'} />
    </Helmet>
  );
}
