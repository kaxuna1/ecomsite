import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  TruckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
  StarIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { fetchProducts } from '../api/products';
import { useI18n } from '../context/I18nContext';
import { useCart } from '../context/CartContext';
import Toast from '../components/Toast';

function HomePage() {
  const { t } = useI18n();
  const { addItem } = useCart();
  const prefersReducedMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Fetch real products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  // Animated counter for stats
  const [statsVisible, setStatsVisible] = useState(false);
  const [customerCount, setCustomerCount] = useState(0);
  const [satisfactionRate, setSatisfactionRate] = useState(0);

  useEffect(() => {
    if (statsVisible) {
      // Animate customer count
      const customerInterval = setInterval(() => {
        setCustomerCount((prev) => {
          if (prev < 24000) return prev + 500;
          clearInterval(customerInterval);
          return 24000;
        });
      }, 20);

      // Animate satisfaction rate
      const satisfactionInterval = setInterval(() => {
        setSatisfactionRate((prev) => {
          if (prev < 92) return prev + 2;
          clearInterval(satisfactionInterval);
          return 92;
        });
      }, 30);

      return () => {
        clearInterval(customerInterval);
        clearInterval(satisfactionInterval);
      };
    }
  }, [statsVisible]);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setNewsletterSubmitted(true);
      setToastMessage('Welcome! Check your email for your 10% discount code.');
      setShowToast(true);
      setTimeout(() => {
        setEmail('');
        setNewsletterSubmitted(false);
      }, 3000);
    }
  };

  const handleQuickAdd = (product: any) => {
    addItem(product);
    setToastMessage(`${product.name} added to cart!`);
    setShowToast(true);
  };

  // Get featured products (first 4)
  const featuredProducts = products.slice(0, 4);

  // Benefits data
  const benefits = [
    {
      icon: TruckIcon,
      title: 'Free Shipping',
      description: 'On orders over $50'
    },
    {
      icon: ShieldCheckIcon,
      title: '30-Day Returns',
      description: 'Money-back guarantee'
    },
    {
      icon: HeartIcon,
      title: 'Cruelty-Free',
      description: '100% vegan & ethical'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Expert Support',
      description: '24/7 consultation'
    },
    {
      icon: LockClosedIcon,
      title: 'Secure Checkout',
      description: 'SSL encrypted'
    },
    {
      icon: CheckBadgeIcon,
      title: 'Verified Reviews',
      description: 'Real customer feedback'
    }
  ];

  // Social proof data
  const socialProof = [
    { brand: 'Vogue', logo: '✨' },
    { brand: 'Elle', logo: '💫' },
    { brand: 'Allure', logo: '⭐' },
    { brand: "Harper's Bazaar", logo: '✦' }
  ];

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7 }
      };

  return (
    <div className="overflow-hidden">
      <Helmet>
        <title>{t('common.brandTagline')}</title>
        <meta name="description" content={t('hero.description')} />
      </Helmet>

      <Toast
        message={toastMessage}
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Free Shipping Banner */}
      <motion.div
        className="bg-jade py-3 text-center text-sm font-semibold text-white"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-2 px-4">
          <TruckIcon className="h-5 w-5 flex-shrink-0" />
          <span className="text-xs sm:text-sm">
            FREE SHIPPING ON ORDERS OVER $50 • 10% OFF FOR NEW SUBSCRIBERS
          </span>
        </div>
      </motion.div>

      {/* Hero Section */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-midnight via-midnight to-midnight/90 text-champagne">
        {/* Animated background elements */}
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(232,199,200,0.25),_transparent_50%)]"
          animate={prefersReducedMotion ? undefined : { opacity: [0.4, 0.7, 0.4] }}
          transition={{ repeat: Infinity, duration: 8 }}
        />
        <motion.div
          className="absolute -top-40 right-10 h-96 w-96 rounded-full bg-gradient-to-br from-jade/20 to-transparent blur-3xl"
          aria-hidden="true"
          animate={prefersReducedMotion ? undefined : { y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 12 }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:py-28 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Column - Content */}
            <motion.div
              className="flex flex-col justify-center text-center lg:text-left"
              {...fadeInUp}
            >
              {/* Social Proof - As Featured In */}
              <motion.div
                className="mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="mb-3 text-xs uppercase tracking-widest text-champagne/60">As Featured In</p>
                <div className="flex flex-wrap items-center justify-center gap-6 lg:justify-start">
                  {socialProof.map((item, index) => (
                    <motion.div
                      key={item.brand}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <span className="text-2xl">{item.logo}</span>
                      <span className="text-sm font-medium text-champagne/80">{item.brand}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl xl:text-7xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {t('hero.title')}
              </motion.h1>

              <motion.p
                className="mt-6 text-base text-champagne/80 sm:text-lg lg:text-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {t('hero.description')}
              </motion.p>

              {/* Star Rating & Reviews */}
              <motion.div
                className="mt-6 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onViewportEnter={() => setStatsVisible(true)}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-champagne">{customerCount > 0 ? `${(customerCount / 1000).toFixed(1)}k+` : '24k+'}</span>
                  <span className="text-champagne/60">Five-Star Reviews</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-jade">{satisfactionRate > 0 ? `${satisfactionRate}%` : '92%'}</span>
                  <span className="text-champagne/60">Satisfaction Rate</span>
                </div>
              </motion.div>

              {/* CTAs */}
              <motion.div
                className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Link
                  to="/products"
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-jade px-8 py-4 text-base font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                >
                  <span>Shop Collection</span>
                  <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/products"
                  className="group inline-flex items-center justify-center gap-2 rounded-full border-2 border-champagne/30 bg-white/5 px-8 py-4 text-base font-semibold text-champagne backdrop-blur transition-all hover:border-champagne/50 hover:bg-white/10"
                >
                  <span>Learn More</span>
                </Link>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-champagne/70 lg:justify-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center gap-2">
                  <CheckBadgeIcon className="h-5 w-5 text-jade" />
                  <span>Clinically Tested</span>
                </div>
                <div className="flex items-center gap-2">
                  <HeartIcon className="h-5 w-5 text-jade" />
                  <span>Cruelty-Free</span>
                </div>
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-jade" />
                  <span>Sustainably Sourced</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Hero Image */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="relative overflow-hidden rounded-[2.5rem] border border-champagne/15 bg-white/5 p-6 shadow-2xl backdrop-blur">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-12 top-6 h-64 rounded-full bg-gradient-to-b from-champagne/20 to-transparent blur-3xl"
                />
                <motion.div
                  className="relative overflow-hidden rounded-3xl"
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80"
                    alt="Luxury Hair Care Products"
                    className="aspect-[3/4] w-full object-cover"
                    loading="eager"
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-champagne/20 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div className="text-center" {...fadeInUp}>
            <h2 className="font-display text-3xl text-midnight md:text-4xl">Why Choose Luxia</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-midnight/70">
              Experience the perfect blend of luxury, science, and sustainability
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
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
                  <h3 className="font-display text-xl text-midnight">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-midnight/70">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div className="text-center" {...fadeInUp}>
            <p className="text-xs uppercase tracking-[0.6em] text-jade">Best Sellers</p>
            <h2 className="mt-2 font-display text-3xl text-midnight md:text-4xl">Featured Collection</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-midnight/70">
              Discover our most-loved luxury hair care essentials, trusted by thousands
            </p>
          </motion.div>

          {isLoading ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-96 animate-pulse rounded-3xl bg-champagne/30" />
              ))}
            </div>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product, index) => (
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
                      <ShoppingBagIcon className="h-5 w-5" />
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
                      {product.categories.slice(0, 2).map((category) => (
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
              to="/products"
              className="inline-flex items-center gap-2 rounded-full bg-midnight px-8 py-4 text-base font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
            >
              <span>View All Products</span>
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-gradient-to-br from-jade via-jade/90 to-midnight py-16 text-white md:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div className="text-center" {...fadeInUp}>
            <SparklesIcon className="mx-auto h-12 w-12 text-white/80" />
            <h2 className="mt-4 font-display text-3xl md:text-4xl">Join the Luxia Community</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/80">
              Subscribe to our newsletter and get <strong>10% off your first order</strong>, plus exclusive tips,
              product launches, and member-only offers.
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleNewsletterSubmit}
            className="mx-auto mt-10 max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col gap-4 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={newsletterSubmitted}
                className="flex-1 rounded-full border-2 border-white/30 bg-white/10 px-6 py-4 text-white placeholder-white/60 backdrop-blur transition-all focus:border-white focus:bg-white/20 focus:outline-none disabled:opacity-50"
              />
              <motion.button
                type="submit"
                disabled={newsletterSubmitted}
                className="rounded-full bg-white px-8 py-4 font-semibold text-jade shadow-xl transition-all hover:bg-champagne hover:shadow-2xl disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {newsletterSubmitted ? 'Subscribed!' : 'Get 10% Off'}
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

      {/* Testimonials Section */}
      <section className="bg-champagne/10 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div className="text-center" {...fadeInUp}>
            <p className="text-xs uppercase tracking-[0.6em] text-jade">Testimonials</p>
            <h2 className="mt-2 font-display text-3xl text-midnight md:text-4xl">Loved by Thousands</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-midnight/70">
              See what our customers are saying about their Luxia experience
            </p>
          </motion.div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                quote:
                  'Absolutely transformative! My hair has never felt so soft and healthy. The Luminescent Elixir is pure magic.',
                name: 'Sarah M.',
                verified: true
              },
              {
                quote:
                  "I've tried countless products, but nothing compares to Luxia. Professional salon results from home!",
                name: 'Jessica L.',
                verified: true
              },
              {
                quote:
                  'Finally found products that work for my curls. The science-backed formulas really make a difference.',
                name: 'Maya R.',
                verified: true
              }
            ].map((testimonial, index) => (
              <motion.blockquote
                key={testimonial.name}
                className="flex flex-col gap-6 rounded-3xl border-2 border-champagne/40 bg-white p-8 shadow-lg"
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 30 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Star Rating */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
                  ))}
                </div>

                <p className="text-base leading-relaxed text-midnight/80">{testimonial.quote}</p>

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
    </div>
  );
}

export default HomePage;
