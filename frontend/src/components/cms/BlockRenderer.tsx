// BlockRenderer Component
// Dynamically renders CMS blocks based on type

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  TruckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type { CMSBlock } from '../../types/cms';
import HeroBlock from './HeroBlock';
import { fetchRandomProducts } from '../../api/products';
import { useCart } from '../../context/CartContext';
import { useI18n } from '../../context/I18nContext';

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

    case 'text_image':
      return <TextImageBlock content={content as any} />;

    case 'stats':
      return <StatsBlock content={content as any} />;

    case 'cta':
      return <CTABlock content={content as any} />;

    case 'faq':
      return <FAQBlock content={content as any} />;

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
  const { language } = useI18n();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['random-products'],
    queryFn: () => fetchRandomProducts(8)
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
                <Link to={`/${language}/products/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-champagne">
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

                  <Link to={`/${language}/products/${product.id}`}>
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
            to={ctaLink || `/${language}/products`}
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

// Inline Text + Image Block Component
function TextImageBlock({ content }: { content: any }) {
  const prefersReducedMotion = useReducedMotion();
  const { title, content: bodyContent, image, imagePosition = 'right', imageAlt } = content;

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7 }
      };

  const isImageLeft = imagePosition === 'left';

  // Parse markdown-style content (basic support for **bold** and line breaks)
  const renderContent = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Handle bold text
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const rendered = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-midnight">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      });

      return (
        <p key={idx} className={idx > 0 ? 'mt-4' : ''}>
          {rendered}
        </p>
      );
    });
  };

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className={`grid gap-12 items-center lg:grid-cols-2 ${isImageLeft ? 'lg:grid-flow-dense' : ''}`}>
          {/* Text Content */}
          <motion.div
            className={isImageLeft ? 'lg:col-start-2' : ''}
            {...fadeInUp}
          >
            <h2 className="font-display text-3xl text-midnight md:text-4xl lg:text-5xl">
              {title}
            </h2>
            <div className="mt-6 text-base leading-relaxed text-midnight/70 md:text-lg">
              {renderContent(bodyContent)}
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            className={isImageLeft ? 'lg:col-start-1 lg:row-start-1' : ''}
            initial={prefersReducedMotion ? {} : { opacity: 0, x: isImageLeft ? -30 : 30 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border-2 border-champagne/40 shadow-2xl">
              <img
                src={image || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80"}
                alt={imageAlt || title}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Inline Stats Block Component
function StatsBlock({ content }: { content: any }) {
  const prefersReducedMotion = useReducedMotion();
  const { title, subtitle, stats, columns = 4 } = content;

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7 }
      };

  return (
    <section className="bg-gradient-to-br from-midnight via-midnight/95 to-jade/20 py-16 text-white md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        {title && (
          <motion.div className="text-center" {...fadeInUp}>
            <h2 className="font-display text-3xl md:text-4xl">{title}</h2>
            {subtitle && (
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/70">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}

        <div className={`mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-${columns}`}>
          {stats.map((stat: any, index: number) => (
            <motion.div
              key={stat.id}
              className="group relative overflow-hidden rounded-3xl border-2 border-white/10 bg-white/5 p-8 text-center backdrop-blur transition-all hover:border-jade/40 hover:bg-white/10"
              initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-jade/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative z-10">
                {stat.icon && (
                  <div className="mb-4 text-4xl">{stat.icon}</div>
                )}
                <motion.div
                  className="font-display text-4xl font-bold md:text-5xl lg:text-6xl text-jade"
                  initial={prefersReducedMotion ? {} : { opacity: 0 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                >
                  {stat.value}
                </motion.div>
                <p className="mt-3 text-base font-medium text-white/80">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Inline CTA Block Component
function CTABlock({ content }: { content: any }) {
  const prefersReducedMotion = useReducedMotion();
  const {
    title,
    description,
    primaryButtonText,
    primaryButtonLink,
    secondaryButtonText,
    secondaryButtonLink,
    backgroundImage,
    backgroundImageAlt
  } = content;

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7 }
      };

  return (
    <section className="relative overflow-hidden bg-jade py-20 md:py-32">
      {/* Background Image */}
      {backgroundImage && (
        <>
          <div className="absolute inset-0">
            <img
              src={backgroundImage}
              alt={backgroundImageAlt || "CTA Background"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-jade/90 via-midnight/80 to-midnight/90" />
        </>
      )}

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-1/4 -top-1/4 h-96 w-96 rounded-full bg-champagne/10 blur-3xl"
          animate={prefersReducedMotion ? undefined : {
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ repeat: Infinity, duration: 8 }}
        />
        <motion.div
          className="absolute -bottom-1/4 -left-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl"
          animate={prefersReducedMotion ? undefined : {
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ repeat: Infinity, duration: 10 }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <motion.div {...fadeInUp}>
          <h2 className="font-display text-3xl text-white md:text-4xl lg:text-5xl">
            {title}
          </h2>
          {description && (
            <p className="mx-auto mt-6 max-w-2xl text-base text-white/90 md:text-lg">
              {description}
            </p>
          )}
        </motion.div>

        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          {primaryButtonText && primaryButtonLink && (
            <Link
              to={primaryButtonLink}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-midnight shadow-2xl transition-all hover:scale-105 hover:bg-champagne"
            >
              <span>{primaryButtonText}</span>
              <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          )}

          {secondaryButtonText && secondaryButtonLink && (
            <Link
              to={secondaryButtonLink}
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur transition-all hover:scale-105 hover:border-white hover:bg-white/20"
            >
              <span>{secondaryButtonText}</span>
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// Inline FAQ Block Component (2025 Best Practices)
function FAQBlock({ content }: { content: any }) {
  const prefersReducedMotion = useReducedMotion();
  const { title, subtitle, faqs, categories = [], enableSearch = true, enableCategories = true } = content;

  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter FAQs based on search and category
  const filteredFAQs = faqs.filter((faq: any) => {
    const matchesSearch = !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Toggle individual FAQ
  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  // Expand all FAQs
  const expandAll = () => {
    setOpenItems(new Set(filteredFAQs.map((faq: any) => faq.id)));
  };

  // Collapse all FAQs
  const collapseAll = () => {
    setOpenItems(new Set());
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleItem(id);
    }
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
    <section className="bg-champagne/10 py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <motion.div className="text-center mb-12" {...fadeInUp}>
          {title && (
            <h2 className="font-display text-3xl text-midnight md:text-4xl">{title}</h2>
          )}
          {subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-base text-midnight/70">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Controls Bar */}
        {(enableSearch || enableCategories) && (
          <motion.div
            className="mb-8 space-y-4"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {/* Search Bar */}
            {enableSearch && (
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-midnight/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search FAQs..."
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-midnight/10 rounded-xl text-midnight placeholder-midnight/40 focus:outline-none focus:border-jade transition-colors"
                  aria-label="Search frequently asked questions"
                />
              </div>
            )}

            {/* Category Filters + Expand/Collapse */}
            <div className="flex flex-wrap items-center gap-3">
              {enableCategories && categories.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-jade text-white shadow-lg'
                        : 'bg-white text-midnight/70 hover:bg-midnight/5'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category: string) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-jade text-white shadow-lg'
                          : 'bg-white text-midnight/70 hover:bg-midnight/5'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                  <div className="h-6 w-px bg-midnight/10 mx-2" />
                </>
              )}

              {/* Expand/Collapse All */}
              <button
                type="button"
                onClick={expandAll}
                className="px-3 py-2 text-sm text-jade hover:text-jade/80 font-medium transition-colors"
                aria-label="Expand all questions"
              >
                Expand All
              </button>
              <span className="text-midnight/20">|</span>
              <button
                type="button"
                onClick={collapseAll}
                className="px-3 py-2 text-sm text-jade hover:text-jade/80 font-medium transition-colors"
                aria-label="Collapse all questions"
              >
                Collapse All
              </button>
            </div>
          </motion.div>
        )}

        {/* FAQ List */}
        {filteredFAQs.length === 0 ? (
          <motion.div
            className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-midnight/10"
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={prefersReducedMotion ? {} : { opacity: 1 }}
          >
            <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-midnight/20 mb-3" />
            <p className="text-midnight/50">No FAQs found matching your search.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredFAQs.map((faq: any, index: number) => {
              const isOpen = openItems.has(faq.id);

              return (
                <motion.div
                  key={faq.id}
                  className="bg-white rounded-xl border-2 border-midnight/10 overflow-hidden transition-all hover:border-jade/40 hover:shadow-lg"
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Question Header - 44px minimum touch target */}
                  <button
                    type="button"
                    onClick={() => toggleItem(faq.id)}
                    onKeyDown={(e) => handleKeyDown(e, faq.id)}
                    className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left group min-h-[44px]"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                  >
                    <h3 className="font-semibold text-midnight text-base md:text-lg group-hover:text-jade transition-colors flex-1">
                      {faq.question}
                    </h3>

                    {/* Caret Icon - Down when collapsed, Up when expanded */}
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="flex-shrink-0"
                    >
                      <ChevronDownIcon className="h-6 w-6 text-jade" aria-hidden="true" />
                    </motion.div>
                  </button>

                  {/* Answer Content - Smooth 300ms animation */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${faq.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                        role="region"
                        aria-labelledby={`faq-question-${faq.id}`}
                      >
                        <div className="px-6 pb-5 pt-2 text-midnight/70 leading-relaxed border-t border-midnight/5">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
