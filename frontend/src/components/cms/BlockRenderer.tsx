// BlockRenderer Component
// Dynamically renders CMS blocks based on type

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  TruckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
  CheckBadgeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type { CMSBlock } from '../../types/cms';
import HeroBlock from './HeroBlock';
import { fetchProducts } from '../../api/products';
import { useCart } from '../../context/CartContext';

interface BlockRendererProps {
  block: CMSBlock;
}

export default function BlockRenderer({ block }: BlockRendererProps) {
  const { blockType, content } = block;

  // Route to appropriate block component
  switch (blockType) {
    case 'hero':
      return <HeroBlock content={content as any} />;

    case 'features':
      return <FeaturesBlock content={content as any} />;

    case 'products':
      return <ProductsBlock content={content as any} />;

    case 'testimonials':
      return <TestimonialsBlock content={content as any} />;

    case 'newsletter':
      return <NewsletterBlock content={content as any} />;

    default:
      console.warn(`Unknown block type: ${blockType}`);
      return null;
  }
}

// Inline Features Block Component
function FeaturesBlock({ content }: { content: any }) {
  const prefersReducedMotion = useReducedMotion();
  const { title, subtitle, features, columns = 3 } = content;

  // Icon mapping
  const iconMap: any = {
    truck: TruckIcon,
    shield: ShieldCheckIcon,
    sparkles: SparklesIcon,
    heart: HeartIcon,
    chat: ChatBubbleLeftRightIcon,
    lock: LockClosedIcon,
    check: CheckBadgeIcon
  };

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7 }
      };

  return (
    <section className="bg-champagne/20 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div className="text-center" {...fadeInUp}>
          <h2 className="font-display text-3xl text-midnight md:text-4xl">{title}</h2>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-base text-midnight/70">
              {subtitle}
            </p>
          )}
        </motion.div>

        <div className={`mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-${columns}`}>
          {features.map((feature: any, index: number) => {
            const Icon = iconMap[feature.icon] || SparklesIcon;
            return (
              <motion.div
                key={feature.id}
                className="group rounded-3xl border-2 border-champagne/40 bg-white p-8 shadow-lg transition-all hover:border-jade/40 hover:shadow-2xl"
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 30 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <div className="mb-4 inline-flex rounded-full bg-jade/10 p-4">
                  <Icon className="h-8 w-8 text-jade transition-transform group-hover:scale-110" />
                </div>
                <h3 className="font-display text-xl text-midnight">{feature.title}</h3>
                <p className="mt-2 text-sm text-midnight/70">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Inline Products Block Component
function ProductsBlock({ content }: { content: any }) {
  const prefersReducedMotion = useReducedMotion();
  const { title, subtitle, ctaText, ctaLink } = content;

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { addItem } = useCart();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const featuredProducts = products.slice(0, 4);

  const handleQuickAdd = (product: any) => {
    addItem(product);
    setToastMessage(`${product.name} added to cart!`);
    setShowToast(true);
  };

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7 }
      };

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div className="text-center" {...fadeInUp}>
          <p className="text-xs uppercase tracking-[0.6em] text-jade">Best Sellers</p>
          <h2 className="mt-2 font-display text-3xl text-midnight md:text-4xl">{title}</h2>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-base text-midnight/70">
              {subtitle}
            </p>
          )}
        </motion.div>

        {isLoading ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-96 animate-pulse rounded-3xl bg-champagne/30" />
            ))}
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product: any, index: number) => (
              <motion.article
                key={product.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border-2 border-champagne/40 bg-white shadow-lg transition-all hover:border-jade/40 hover:shadow-2xl"
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 30 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                {/* Product Image */}
                <Link to={`/products/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-champagne">
                  <motion.img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  />
                  {/* Quick View Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 via-midnight/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                  {/* Stock Badge */}
                  {product.inventory < 10 && product.inventory > 0 && (
                    <div className="absolute left-3 top-3 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      Only {product.inventory} left
                    </div>
                  )}

                  {/* Quick Add Button */}
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleQuickAdd(product);
                    }}
                    className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-midnight shadow-xl opacity-0 transition-opacity group-hover:opacity-100"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>Quick Add</span>
                  </motion.button>
                </Link>

                {/* Product Info */}
                <div className="flex flex-1 flex-col gap-2 p-6">
                  {/* Star Rating */}
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
                    ))}
                    <span className="ml-2 text-xs text-midnight/60">(245)</span>
                  </div>

                  <Link to={`/products/${product.id}`}>
                    <h3 className="font-display text-lg leading-tight text-midnight transition-colors hover:text-jade line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>

                  <p className="mt-1 text-sm text-midnight/60 line-clamp-2">{product.shortDescription}</p>

                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xl font-bold text-jade">${product.price.toFixed(2)}</span>
                    <span className="text-xs text-jade">Free Shipping</span>
                  </div>

                  {/* Categories */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {product.categories.slice(0, 2).map((category: string) => (
                      <span
                        key={category}
                        className="rounded-full bg-jade/10 px-2 py-0.5 text-xs font-medium text-jade capitalize"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        <motion.div className="mt-12 text-center" {...fadeInUp}>
          <Link
            to={ctaLink || '/products'}
            className="inline-flex items-center gap-2 rounded-full bg-midnight px-8 py-4 text-base font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          >
            <span>{ctaText || 'View All Products'}</span>
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// Inline Testimonials Block Component
function TestimonialsBlock({ content }: { content: any }) {
  const prefersReducedMotion = useReducedMotion();
  const { title, subtitle, testimonials } = content;

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7 }
      };

  return (
    <section className="bg-champagne/10 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div className="text-center" {...fadeInUp}>
          <p className="text-xs uppercase tracking-[0.6em] text-jade">Testimonials</p>
          <h2 className="mt-2 font-display text-3xl text-midnight md:text-4xl">{title}</h2>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-base text-midnight/70">
              {subtitle}
            </p>
          )}
        </motion.div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial: any, index: number) => (
            <motion.blockquote
              key={testimonial.id}
              className="flex flex-col gap-6 rounded-3xl border-2 border-champagne/40 bg-white p-8 shadow-lg"
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 30 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Star Rating */}
              <div className="flex items-center gap-1">
                {[...Array(testimonial.rating || 5)].map((_, i) => (
                  <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
                ))}
              </div>

              <p className="text-base leading-relaxed text-midnight/80">{testimonial.text}</p>

              <div className="flex items-center justify-between">
                <cite className="text-sm font-semibold not-italic text-midnight">{testimonial.name}</cite>
                {testimonial.verified && (
                  <span className="flex items-center gap-1 text-xs text-jade">
                    <CheckBadgeIcon className="h-4 w-4" />
                    Verified Buyer
                  </span>
                )}
              </div>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

// Inline Newsletter Block Component
function NewsletterBlock({ content }: { content: any }) {
  const prefersReducedMotion = useReducedMotion();
  const { title, description, buttonText, placeholderText = 'Enter your email' } = content;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter signup
    alert('Thank you for subscribing! Check your email for your discount code.');
  };

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7 }
      };

  return (
    <section className="bg-gradient-to-br from-jade via-jade/90 to-midnight py-16 text-white md:py-20">
      <div className="mx-auto max-w-4xl px-4">
        <motion.div className="text-center" {...fadeInUp}>
          <SparklesIcon className="mx-auto h-12 w-12 text-white/80" />
          <h2 className="mt-4 font-display text-3xl md:text-4xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/80">
            {description}
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <input
              type="email"
              placeholder={placeholderText}
              required
              className="flex-1 rounded-full border-2 border-white/30 bg-white/10 px-6 py-4 text-white placeholder-white/60 backdrop-blur transition-all focus:border-white focus:bg-white/20 focus:outline-none"
            />
            <motion.button
              type="submit"
              className="rounded-full bg-white px-8 py-4 font-semibold text-jade shadow-xl transition-all hover:bg-champagne hover:shadow-2xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {buttonText}
            </motion.button>
          </div>
          <p className="mt-4 text-center text-xs text-white/60">
            By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
          </p>
        </motion.form>

        {/* Trust Indicators */}
        <motion.div
          className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 text-white/80">
            <LockClosedIcon className="h-5 w-5" />
            <span>We protect your privacy</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <CheckBadgeIcon className="h-5 w-5" />
            <span>24k+ happy subscribers</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
