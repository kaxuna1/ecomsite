import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { fetchProducts } from '../api/products';
import { useI18n } from '../context/I18nContext';

function ProductsPage() {
  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const { t } = useI18n();
  const prefersReducedMotion = useReducedMotion();

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
      };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <Helmet>
        <title>{t('products.title')} — {t('common.brand')}</title>
      </Helmet>
      <motion.header className="space-y-4 text-center" {...fadeInUp}>
        <h1 className="font-display text-3xl text-midnight sm:text-4xl">{t('products.title')}</h1>
        <p className="mx-auto max-w-2xl text-sm text-midnight/70">{t('products.description')}</p>
      </motion.header>
      {isLoading ? (
        <p className="mt-12 text-center text-sm" role="status">
          {t('products.loading')}
        </p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {products?.map((product) => (
            <motion.article
              key={product.id}
              role="listitem"
              className="group flex flex-col overflow-hidden rounded-3xl border border-champagne/40 bg-white shadow-md"
              whileHover={prefersReducedMotion ? undefined : { y: -6 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20 }}
            >
              <Link to={`/products/${product.id}`} className="block aspect-[4/5] bg-champagne">
                <motion.img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                />
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-6">
                <h2 className="font-display text-lg text-midnight">{product.name}</h2>
                <p className="text-sm text-midnight/70">{product.shortDescription}</p>
                <p className="mt-auto text-sm font-semibold text-jade">${product.price.toFixed(2)}</p>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
