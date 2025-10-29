import { Helmet } from 'react-helmet-async';
import type { Product } from '../types/product';

interface SEOHeadProps {
  product: Product;
}

export function SEOHead({ product }: SEOHeadProps) {
  const baseUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

  // Use SEO metadata if available, otherwise fall back to product data
  const metaTitle = product.seo?.metaTitle || product.metaTitle || `${product.name} | Luxia Products`;
  const metaDescription = product.seo?.metaDescription || product.metaDescription || product.shortDescription;
  const metaKeywords = product.seo?.metaKeywords || product.metaKeywords || product.categories;
  const ogImageUrl = product.seo?.ogImageUrl || product.ogImageUrl || product.imageUrl;
  const canonicalUrl = product.seo?.canonicalUrl || product.canonicalUrl || `${baseUrl}/products/${product.slug || product.id}`;

  // Construct full image URL if it's a relative path
  const fullImageUrl = ogImageUrl.startsWith('http')
    ? ogImageUrl
    : `${baseUrl}${ogImageUrl}`;

  // Generate JSON-LD structured data for rich snippets
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: fullImageUrl,
    offers: {
      '@type': 'Offer',
      price: product.salePrice || product.price,
      priceCurrency: 'USD',
      availability: product.inventory > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: canonicalUrl
    },
    brand: {
      '@type': 'Brand',
      name: 'Luxia'
    }
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      {metaKeywords && Array.isArray(metaKeywords) && (
        <meta name="keywords" content={metaKeywords.join(', ')} />
      )}
      <link rel="canonical" href={canonicalUrl} />

      {/* OpenGraph Tags for Facebook, LinkedIn */}
      <meta property="og:type" content="product" />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Luxia Products" />
      <meta property="product:price:amount" content={String(product.salePrice || product.price)} />
      <meta property="product:price:currency" content="USD" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(productJsonLd)}
      </script>
    </Helmet>
  );
}
