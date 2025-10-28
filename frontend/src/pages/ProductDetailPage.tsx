import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { fetchProduct } from '../api/products';
import { useCart } from '../context/CartContext';
import { useI18n } from '../context/I18nContext';

function ProductDetailPage() {
  const { id } = useParams();
  const productId = Number(id);
  const { addItem } = useCart();
  const { t } = useI18n();
  const prefersReducedMotion = useReducedMotion();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId),
    enabled: Number.isFinite(productId)
  });

  if (!productId || Number.isNaN(productId)) {
    return <p className="p-8 text-center">{t('productDetail.notFound')}</p>;
  }

  if (isLoading || !product) {
    return (
      <div className="p-8" role="status">
        {t('productDetail.loading')}
      </div>
    );
  }

  const fadeIn = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
      };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <Helmet>
        <title>
          {product.name} — {t('common.brand')}
        </title>
      </Helmet>
      <motion.div className="grid gap-10 md:grid-cols-2" {...fadeIn}>
        <motion.div
          className="overflow-hidden rounded-3xl bg-champagne"
          whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
          transition={{ duration: 0.6 }}
        >
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        </motion.div>
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.6em] text-jade">{product.categories.join(' • ')}</p>
            <h1 className="font-display text-3xl text-midnight">{product.name}</h1>
            <p className="mt-3 text-midnight/70">{product.shortDescription}</p>
          </div>
          <p className="text-lg font-semibold text-jade">${product.price.toFixed(2)}</p>
          <p className="text-sm leading-relaxed text-midnight/70">{product.description}</p>
          {product.highlights && (
            <div>
              <h2 className="font-semibold uppercase tracking-[0.4em] text-xs text-midnight/60">{t('productDetail.highlights')}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-midnight/70">
                {product.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </div>
          )}
          {product.usage && (
            <div>
              <h2 className="font-semibold uppercase tracking-[0.4em] text-xs text-midnight/60">{t('productDetail.usage')}</h2>
              <p className="mt-3 text-sm text-midnight/70">{product.usage}</p>
            </div>
          )}
          <button type="button" className="btn-primary" onClick={() => addItem(product)}>
            {t('productDetail.addToCart')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ProductDetailPage;
