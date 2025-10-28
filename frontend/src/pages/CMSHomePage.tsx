// CMS-Powered Dynamic Homepage
// Renders content from CMS backend

import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { fetchHomePage } from '../api/cms';
import BlockRenderer from '../components/cms/BlockRenderer';

export default function CMSHomePage() {
  const { i18n } = useTranslation();

  // Fetch CMS homepage content with current language
  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ['cms-home', i18n.language],
    queryFn: () => fetchHomePage(i18n.language),
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jade"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-display text-midnight mb-4">
            Unable to load page content
          </h2>
          <p className="text-midnight/70">
            Please try refreshing the page or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }

  // Success state - render CMS blocks
  const { page, blocks } = pageData!;

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
      </Helmet>

      <div className="cms-page">
        {blocks.map((block, index) => (
          <BlockRenderer key={`${block.blockKey}-${index}`} block={block} />
        ))}
      </div>
    </>
  );
}
