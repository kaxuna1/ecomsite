import { useMemo } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from './Navbar';
import Footer from './Footer';
import HreflangTags from './HreflangTags';
import AnnouncementBlock from './cms/AnnouncementBlock';
import { fetchGlobalBlocks } from '../api/cms';
import { useI18n } from '../context/I18nContext';
import type { PageType, AnnouncementContent } from '../types/cms';

/**
 * Determine page type from current route for announcement targeting
 */
function getPageType(pathname: string): PageType {
  // Remove language prefix for analysis
  const path = pathname.replace(/^\/(en|ka)\//, '/').replace(/^\/(en|ka)$/, '/');

  if (path === '/' || path === '') {
    return 'home';
  }
  if (path.startsWith('/products/')) {
    return 'productDetail';
  }
  if (path.startsWith('/products')) {
    return 'products';
  }
  if (path.startsWith('/cart')) {
    return 'cart';
  }
  if (path.startsWith('/checkout')) {
    return 'checkout';
  }
  if (path.startsWith('/account') || path.startsWith('/profile') || path.startsWith('/orders') || path.startsWith('/favorites')) {
    return 'account';
  }
  // Default to CMS for other pages (e.g., /about, /contact)
  return 'cms';
}

/**
 * Extract CMS slug from pathname
 */
function getCmsSlug(pathname: string, pageType: PageType): string | undefined {
  if (pageType !== 'cms') {
    return undefined;
  }
  // Remove language prefix and get slug
  const path = pathname.replace(/^\/(en|ka)\//, '/').replace(/^\/(en|ka)$/, '/');
  // Remove leading slash
  return path.replace(/^\//, '') || undefined;
}

function Layout() {
  const location = useLocation();
  const { language } = useI18n();
  const params = useParams();

  // Determine page context for targeting
  const pageType = useMemo(() => getPageType(location.pathname), [location.pathname]);
  const cmsSlug = useMemo(() => {
    // If we have a slug param (from CMS page routes), use it
    if (params.slug) return params.slug;
    return getCmsSlug(location.pathname, pageType);
  }, [location.pathname, pageType, params.slug]);

  // Fetch global header blocks
  const { data: headerBlocks = [] } = useQuery({
    queryKey: ['global-blocks', 'header', language, location.pathname, pageType, cmsSlug],
    queryFn: () => fetchGlobalBlocks('header', language, {
      path: location.pathname,
      pageType,
      cmsSlug,
    }),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once on failure
  });

  // Filter to only announcement blocks
  const announcementBlocks = headerBlocks.filter(
    (block) => block.blockType === 'announcement'
  );

  // Determine if we should show CMS blocks (hide Navbar's fallback)
  const hasAnnouncementBlocks = announcementBlocks.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-bg-secondary via-bg-primary to-secondary">
      <HreflangTags />

      {/* CMS-managed announcement blocks */}
      {hasAnnouncementBlocks && (
        <>
          {announcementBlocks.map((block) => (
            <AnnouncementBlock
              key={block.id}
              content={block.content as AnnouncementContent}
              blockId={block.id}
            />
          ))}
        </>
      )}

      {/* Navbar - hide its fallback announcement if we have CMS blocks */}
      <Navbar hideAnnouncement={hasAnnouncementBlocks} />

      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
