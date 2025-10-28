import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { fetchProduct } from '../api/products';
import { useCart } from '../context/CartContext';
import { useI18n } from '../context/I18nContext';
import { useEffect, useState } from 'react';

function ProductDetailPage() {
  const { id } = useParams();
  const productId = Number(id);
  const { addItem } = useCart();
  const { t } = useI18n();
  const prefersReducedMotion = useReducedMotion();
  const [showAddedConfirmation, setShowAddedConfirmation] = useState(false);

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

  const addedConfirmationContent = (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm4.28 7.97a.75.75 0 0 0-1.06-1.06l-4.724 4.724-1.716-1.716a.75.75 0 1 0-1.06 1.06l2.246 2.247a.75.75 0 0 0 1.06 0l5.254-5.255Z"
          clipRule="evenodd"
        />
      </svg>
      <span className="font-medium uppercase tracking-[0.3em]">{t('productDetail.addedToCart')}</span>
    </>
  );

  const handleAddToCart = () => {
    addItem(product);
    setShowAddedConfirmation(true);
  };

  useEffect(() => {
    if (!showAddedConfirmation) return;
    if (typeof window === 'undefined') return;
    const timeout = window.setTimeout(() => setShowAddedConfirmation(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [showAddedConfirmation]);

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
          <motion.button
            type="button"
            className="btn-primary relative overflow-hidden"
            onClick={handleAddToCart}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
            animate={
              prefersReducedMotion ? undefined : showAddedConfirmation ? { scale: [1, 1.06, 1] } : { scale: 1 }
            }
            transition={
              prefersReducedMotion
                ? undefined
                : ({ type: 'spring', stiffness: 320, damping: 22 } as const)
            }
          >
            <span
              className={`transition-opacity duration-200 ${
                showAddedConfirmation ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {t('productDetail.addToCart')}
            </span>
            {prefersReducedMotion ? (
              showAddedConfirmation && (
                <span
                  className="absolute inset-0 flex items-center justify-center gap-2"
                  role="status"
                  aria-live="polite"
                >
                  {addedConfirmationContent}
                </span>
              )
            ) : (
              <AnimatePresence>
                {showAddedConfirmation && (
                  <motion.span
                    key="added"
                    className="absolute inset-0 flex items-center justify-center gap-2"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35 }}
                    role="status"
                    aria-live="polite"
                  >
                    {addedConfirmationContent}
                  </motion.span>
                )}
              </AnimatePresence>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export default ProductDetailPage;
