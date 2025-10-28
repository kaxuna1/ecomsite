// Dynamic CMS Page Component
// Renders any CMS page based on URL slug

import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { fetchPage } from '../api/cms';
import BlockRenderer from '../components/cms/BlockRenderer';

export default function CMSPage() {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();

  // Fetch CMS page content by slug with current language
  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ['cms-page', slug, i18n.language],
    queryFn: () => fetchPage(slug!, i18n.language),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1 // Only retry once for 404 pages
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-champagne/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jade mx-auto"></div>
          <p className="mt-4 text-midnight/60 font-display uppercase tracking-wider text-sm">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Error state - 404 page
  if (error) {
    const is404 = error instanceof Error && error.message.includes('404');

    if (is404) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-champagne/20 via-white to-jade/5">
          <div className="text-center px-4 py-12">
            <div className="mb-8">
              <h1 className="font-display text-9xl text-jade tracking-tight">404</h1>
            </div>
            <h2 className="text-4xl font-display text-midnight mb-4 uppercase tracking-wide">
              Page Not Found
            </h2>
            <p className="text-midnight/70 mb-8 max-w-md mx-auto">
              The page you're looking for doesn't exist or hasn't been published yet.
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/"
                className="px-8 py-3 bg-jade text-white rounded-full hover:bg-jade/90 transition-colors font-semibold shadow-lg hover:shadow-xl"
              >
                Go Home
              </a>
              <a
                href="/products"
                className="px-8 py-3 bg-white text-midnight border-2 border-midnight rounded-full hover:bg-midnight hover:text-white transition-colors font-semibold shadow-lg"
              >
                Browse Products
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Generic error state
    return (
      <div className="min-h-screen flex items-center justify-center bg-champagne/10">
        <div className="text-center px-4 py-12 max-w-md">
          <h2 className="text-3xl font-display text-midnight mb-4 uppercase tracking-wide">
            Something Went Wrong
          </h2>
          <p className="text-midnight/70 mb-6">
            We encountered an error loading this page. Please try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-jade text-white rounded-full hover:bg-jade/90 transition-colors font-semibold"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Prevent rendering if no data (should not happen with proper error handling)
  if (!pageData) {
    return <Navigate to="/" replace />;
  }

  // Success state - render CMS blocks
  const { page, blocks } = pageData;

  return (
    <>
      <Helmet>
        <title>{page.title}</title>
        {page.metaDescription && (
          <meta name="description" content={page.metaDescription} />
        )}
        {page.metaKeywords && (
          <meta name="keywords" content={page.metaKeywords} />
        )}
        <meta property="og:title" content={page.title} />
        {page.metaDescription && (
          <meta property="og:description" content={page.metaDescription} />
        )}
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="cms-page">
        {blocks.length > 0 ? (
          blocks.map((block, index) => (
            <BlockRenderer key={`${block.blockKey}-${index}`} block={block} />
          ))
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-champagne/10">
            <div className="text-center px-4 py-12">
              <h2 className="text-3xl font-display text-midnight mb-4 uppercase tracking-wide">
                Page Under Construction
              </h2>
              <p className="text-midnight/70">
                This page is being built. Check back soon!
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
