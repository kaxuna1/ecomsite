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
  ArrowRightIcon
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
  const { data: products = [] } = useQuery({
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
    { brand: 'Harper\'s Bazaar', logo: '✦' }
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
        <div className="flex items-center justify-center gap-2">
          <TruckIcon className="h-5 w-5" />
          <span>FREE SHIPPING ON ALL ORDERS OVER $50 • EXCLUSIVE 10% OFF FOR NEW SUBSCRIBERS</span>
        </div>
      </motion.div>
      <section className="relative isolate overflow-hidden bg-midnight text-champagne lg:min-h-[80vh]">
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(232,199,200,0.35),_transparent_65%)]"
          animate={prefersReducedMotion ? undefined : { opacity: [0.6, 0.9, 0.6] }}
          transition={{ repeat: Infinity, duration: 8 }}
        />
        <motion.div
          className="absolute -top-40 right-10 h-64 w-64 rounded-full bg-gradient-to-br from-jade/30 to-transparent blur-3xl"
          aria-hidden="true"
          animate={prefersReducedMotion ? undefined : { y: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 10 }}
        />
        <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:py-28 lg:grid-cols-[1.05fr,0.95fr]">
          <motion.div
            className="flex flex-col items-center text-center lg:items-start lg:text-left"
            {...fadeInUp}
          >
            <p className="uppercase tracking-[0.8em] text-champagne/60">{t('hero.label')}</p>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl">{t('hero.title')}</h1>
            <p className="mt-4 max-w-2xl text-base text-champagne/80 sm:text-lg">{t('hero.description')}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.4em] text-champagne/45">{t('hero.promise')}</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link to="/products" className="btn-primary">
                {t('hero.ctaPrimary')}
              </Link>
              <Link to="/checkout" className="btn-secondary">
                {t('hero.ctaSecondary')}
              </Link>
            </div>
            <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
              {heroHighlights.map((highlight) => (
                <div
                  key={highlight.title}
                  className="rounded-2xl border border-champagne/10 bg-white/5 p-5 text-left shadow-lg backdrop-blur"
                >
                  <h2 className="font-display text-lg text-champagne">{highlight.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-champagne/70">{highlight.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div className="relative mx-auto w-full max-w-md" {...fadeInUp}>
            <div className="relative overflow-hidden rounded-[2.5rem] border border-champagne/15 bg-white/5 p-6 shadow-[0_40px_80px_-40px_rgba(5,15,25,0.7)] backdrop-blur">
              <span
                aria-hidden="true"
                className="absolute inset-x-12 top-6 h-52 rounded-full bg-gradient-to-b from-champagne/20 to-transparent blur-3xl"
              />
              <motion.div
                className="relative overflow-hidden rounded-3xl"
                animate={prefersReducedMotion ? undefined : { y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 10 }}
              >
                <motion.img
                  src="https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80"
                  alt={t('home.featuredProducts.celestialName')}
                  className="h-80 w-full object-cover"
                  loading="lazy"
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
                  transition={{ duration: 0.6 }}
                />
              </motion.div>
              <div className="relative mt-6 grid gap-4 rounded-2xl bg-midnight/70 p-5 ring-1 ring-champagne/20 sm:grid-cols-3">
                {heroMetrics.map((metric) => (
                  <div key={metric.label} className="text-center sm:text-left">
                    <p className="font-display text-2xl text-champagne sm:text-3xl">{metric.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.3em] text-champagne/60">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        {[
          { title: t('home.precisionTitle'), body: t('home.precisionBody') },
          { title: t('home.designedTitle'), body: t('home.designedBody') }
        ].map((item) => (
          <motion.article
            key={item.title}
            className="rounded-3xl bg-white/70 p-8 shadow-2xl shadow-blush/30 backdrop-blur"
            {...fadeInUp}
          >
            <h2 className="font-display text-2xl text-midnight">{item.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-midnight/80">{item.body}</p>
          </motion.article>
        ))}
      </section>
      <section className="bg-white/80 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div className="text-center" {...fadeInUp}>
            <h2 className="font-display text-3xl text-midnight">{t('home.featuredHeading')}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-midnight/70">{t('home.featuredIntro')}</p>
          </motion.div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <motion.article
                key={product.name}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-champagne/40 bg-white shadow-xl"
                whileHover={prefersReducedMotion ? undefined : { y: -8 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <div className="aspect-[4/5] w-full bg-gradient-to-br from-champagne via-blush to-white">
                  <motion.img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <h3 className="font-display text-lg text-midnight">{product.name}</h3>
                  <p className="text-sm leading-relaxed text-midnight/70">{product.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <motion.div className="mx-auto max-w-3xl text-center" {...fadeInUp}>
          <h2 className="font-display text-3xl text-midnight">{t('home.researchHeading')}</h2>
          <p className="mt-4 text-sm text-midnight/70">{t('home.researchIntro')}</p>
        </motion.div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {researchStats.map((stat) => (
            <motion.div
              key={stat.label}
              className={`rounded-3xl border border-white/60 bg-gradient-to-br ${stat.gradient} p-8 text-midnight shadow-lg backdrop-blur`}
              {...fadeInUp}
            >
              <p className="text-sm font-semibold leading-relaxed text-midnight/80">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="bg-midnight/95 py-16 text-champagne md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <motion.h2 className="font-display text-3xl" {...fadeInUp}>
            {t('home.testimonialsHeading')}
          </motion.h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.blockquote
                key={testimonial.name}
                className="flex h-full flex-col gap-6 rounded-3xl border border-champagne/10 bg-white/5 p-8 backdrop-blur"
                {...(prefersReducedMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 30 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true, amount: 0.2 },
                      transition: { duration: 0.6, delay: index * 0.1 }
                    })}
              >
                <p className="text-sm leading-relaxed text-champagne/80">{testimonial.quote}</p>
                <cite className="text-xs uppercase tracking-[0.3em] text-champagne/60">{testimonial.name}</cite>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
