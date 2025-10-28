// Hero Section Templates - World-class designs based on 2025 trends
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  CheckBadgeIcon,
  HeartIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type { HeroContent } from '../../types/cms';

interface HeroTemplateProps {
  content: HeroContent & { template?: string };
}

// Style utility functions
const getHeadlineSizeClass = (size?: string) => {
  const sizeMap = {
    sm: 'text-3xl sm:text-4xl lg:text-5xl',
    md: 'text-4xl sm:text-5xl lg:text-6xl',
    lg: 'text-4xl sm:text-5xl lg:text-6xl xl:text-7xl',
    xl: 'text-5xl sm:text-6xl lg:text-7xl xl:text-8xl',
    '2xl': 'text-6xl sm:text-7xl lg:text-8xl xl:text-9xl'
  };
  return sizeMap[size as keyof typeof sizeMap] || sizeMap.lg;
};

const getPaddingClass = (padding?: string, position?: 'top' | 'bottom') => {
  const paddingMap = {
    none: position === 'top' ? 'pt-0' : 'pb-0',
    sm: position === 'top' ? 'pt-8 sm:pt-12' : 'pb-8 sm:pb-12',
    md: position === 'top' ? 'pt-12 sm:pt-16 lg:pt-20' : 'pb-12 sm:pb-16 lg:pb-20',
    lg: position === 'top' ? 'pt-20 sm:pt-28 lg:pt-32' : 'pb-20 sm:pb-28 lg:pb-32',
    xl: position === 'top' ? 'pt-28 sm:pt-36 lg:pt-44' : 'pb-28 sm:pb-36 lg:pb-44'
  };
  return paddingMap[padding as keyof typeof paddingMap] || paddingMap.md;
};

const getMinHeightClass = (height?: string) => {
  const heightMap = {
    auto: '',
    '50vh': 'min-h-[50vh]',
    '75vh': 'min-h-[75vh]',
    screen: 'min-h-screen'
  };
  return heightMap[height as keyof typeof heightMap] || '';
};

const getInlineStyles = (style?: HeroContent['style']) => {
  if (!style) return {};
  return {
    backgroundColor: style.backgroundColor,
    color: style.textColor
  };
};

export default function HeroTemplates({ content }: HeroTemplateProps) {
  const template = content.template || 'split-screen';

  switch (template) {
    case 'split-screen':
      return <SplitScreenHero content={content} />;
    case 'centered-minimal':
      return <CenteredMinimalHero content={content} />;
    case 'full-width-overlay':
      return <FullWidthOverlayHero content={content} />;
    case 'asymmetric-bold':
      return <AsymmetricBoldHero content={content} />;
    case 'luxury-minimal':
      return <LuxuryMinimalHero content={content} />;
    case 'gradient-modern':
      return <GradientModernHero content={content} />;
    default:
      return <SplitScreenHero content={content} />;
  }
}

// Template 1: Split-Screen Hero (Current Default)
function SplitScreenHero({ content }: HeroTemplateProps) {
  const prefersReducedMotion = useReducedMotion();
  const { headline, subheadline, description, ctaText, ctaLink, style, backgroundImage, backgroundImageAlt } = content;
  const enableAnimations = style?.enableAnimations !== false;

  const sectionClasses = [
    'relative isolate overflow-hidden',
    getPaddingClass(style?.paddingTop, 'top'),
    getPaddingClass(style?.paddingBottom, 'bottom'),
    getMinHeightClass(style?.minHeight)
  ].filter(Boolean).join(' ');

  const inlineStyles = getInlineStyles(style);
  const accentColor = style?.accentColor || '#8bba9c';
  const secondaryColor = style?.secondaryColor || '#e8c7c8';

  return (
    <section className={sectionClasses} style={inlineStyles}>
      {enableAnimations && (
        <>
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 opacity-25"
            style={{ background: `radial-gradient(circle at top right, ${secondaryColor}40, transparent 50%)` }}
            animate={prefersReducedMotion ? undefined : { opacity: [0.2, 0.4, 0.2] }}
            transition={{ repeat: Infinity, duration: 8 }}
          />
          <motion.div
            className="absolute -top-40 right-10 h-96 w-96 rounded-full blur-3xl"
            style={{ background: `linear-gradient(to bottom right, ${accentColor}30, transparent)` }}
            aria-hidden="true"
            animate={prefersReducedMotion ? undefined : { y: [0, 30, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 12 }}
          />
        </>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            className="flex flex-col justify-center text-center lg:text-left"
            initial={enableAnimations ? { opacity: 0, y: 40 } : {}}
            animate={enableAnimations ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <h1 className={`font-display leading-tight ${getHeadlineSizeClass(style?.headlineSize)}`}>
              {headline}
            </h1>
            <p className="mt-6 text-base text-champagne/80 sm:text-lg lg:text-xl">
              {subheadline}
            </p>
            {description && (
              <p className="mt-4 text-base text-champagne/70">{description}</p>
            )}

            <div className="mt-6 flex items-center gap-2 justify-center lg:justify-start">
              {[...Array(5)].map((_, i) => (
                <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
              ))}
              <span className="ml-2 text-sm text-champagne/60">24k+ Five-Star Reviews</span>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center justify-center lg:justify-start">
              <Link
                to={ctaLink}
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-8 py-4 text-base font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                style={{ backgroundColor: accentColor }}
              >
                <span>{ctaText}</span>
                <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative overflow-hidden rounded-[2.5rem] border border-champagne/15 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <motion.div
                className="relative overflow-hidden rounded-3xl"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                transition={{ duration: 0.4 }}
              >
                <img
                  src={backgroundImage || "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80"}
                  alt={backgroundImageAlt || "Luxury Product"}
                  className="aspect-[3/4] w-full object-cover"
                  loading="eager"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Template 2: Centered Minimal (Apple-style)
function CenteredMinimalHero({ content }: HeroTemplateProps) {
  const { headline, subheadline, ctaText, ctaLink, backgroundImage, backgroundImageAlt } = content;

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-white text-midnight overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-champagne/20 to-transparent" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <motion.h1
          className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-tight tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {headline}
        </motion.h1>

        <motion.p
          className="mt-8 text-lg sm:text-xl lg:text-2xl text-midnight/70 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {subheadline}
        </motion.p>

        <motion.div
          className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link
            to={ctaLink}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-midnight px-10 py-5 text-lg font-semibold text-champagne shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          >
            {ctaText}
          </Link>
        </motion.div>

        {backgroundImage && (
          <motion.div
            className="mt-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <img
              src={backgroundImage}
              alt={backgroundImageAlt || "Product Showcase"}
              className="rounded-3xl shadow-2xl mx-auto max-w-4xl w-full"
              loading="eager"
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}

// Template 3: Full-Width Overlay (Dramatic)
function FullWidthOverlayHero({ content }: HeroTemplateProps) {
  const { headline, subheadline, ctaText, ctaLink, backgroundImage, backgroundImageAlt, overlayOpacity } = content;
  const opacity = (overlayOpacity ?? 50) / 100;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={backgroundImage || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=2000&q=80"}
          alt={backgroundImageAlt || "Background"}
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-midnight via-midnight/80 to-midnight/50"
          style={{ opacity }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 text-white">
        <div className="max-w-3xl">
          <motion.h1
            className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-tight"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {headline}
          </motion.h1>

          <motion.p
            className="mt-8 text-xl lg:text-2xl text-white/90"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {subheadline}
          </motion.p>

          <motion.div
            className="mt-12 flex gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link
              to={ctaLink}
              className="inline-flex items-center gap-2 rounded-full bg-jade px-8 py-4 text-lg font-semibold text-midnight shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
            >
              <span>{ctaText}</span>
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <button className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur transition-all hover:bg-white/20">
              <PlayIcon className="h-5 w-5" />
              <span>Watch Video</span>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Template 4: Asymmetric Bold (Modern Magazine-style)
function AsymmetricBoldHero({ content }: HeroTemplateProps) {
  const { headline, subheadline, ctaText, ctaLink, backgroundImage, backgroundImageAlt } = content;

  return (
    <section className="relative min-h-screen bg-champagne text-midnight overflow-hidden">
      {backgroundImage && (
        <div className="absolute top-0 right-0 w-1/2 h-full">
          <img
            src={backgroundImage}
            alt={backgroundImageAlt || "Hero Image"}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 lg:py-32">
        <div className="max-w-2xl">
          <motion.div
            className="inline-block px-4 py-2 bg-jade/20 text-jade rounded-full text-sm font-semibold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            NEW COLLECTION 2025
          </motion.div>

          <motion.h1
            className="font-display text-6xl sm:text-7xl lg:text-8xl leading-[0.9] tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            {headline}
          </motion.h1>

          <motion.p
            className="mt-8 text-xl lg:text-2xl text-midnight/70 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {subheadline}
          </motion.p>

          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Link
              to={ctaLink}
              className="inline-flex items-center gap-3 rounded-full bg-midnight px-10 py-5 text-lg font-semibold text-champagne shadow-xl transition-all hover:scale-105"
            >
              <span>{ctaText}</span>
              <ArrowRightIcon className="h-6 w-6" />
            </Link>
          </motion.div>

          <motion.div
            className="mt-16 flex items-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full bg-jade/20 border-2 border-champagne" />
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold">Join 50,000+ happy customers</p>
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <StarIconSolid key={i} className="h-4 w-4 text-yellow-500" />
                ))}
                <span className="ml-2 text-xs text-midnight/60">4.9/5.0</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Template 5: Luxury Minimal (High-end Brand)
function LuxuryMinimalHero({ content }: HeroTemplateProps) {
  const { headline, subheadline, ctaText, ctaLink, backgroundImage, backgroundImageAlt } = content;

  return (
    <section className="relative min-h-screen bg-white text-midnight flex items-center">
      <div className="mx-auto max-w-7xl px-4 w-full">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <motion.div
            className="lg:col-span-5 space-y-8"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-16 h-0.5 bg-jade" />

            <h1 className="font-display text-5xl lg:text-6xl xl:text-7xl leading-tight tracking-tight">
              {headline}
            </h1>

            <p className="text-lg text-midnight/70 leading-relaxed max-w-lg">
              {subheadline}
            </p>

            <div className="flex items-center gap-4 pt-4">
              <Link
                to={ctaLink}
                className="inline-flex items-center gap-2 text-midnight font-semibold text-lg group"
              >
                <span>{ctaText}</span>
                <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-2" />
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-8 border-t border-midnight/10">
              <div className="flex items-center gap-2">
                <CheckBadgeIcon className="h-5 w-5 text-jade" />
                <span className="text-sm text-midnight/70">Clinically Tested</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartIcon className="h-5 w-5 text-jade" />
                <span className="text-sm text-midnight/70">Cruelty-Free</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative">
              <img
                src={backgroundImage || "https://images.unsplash.com/photo-1571380401583-72ca84994796?auto=format&fit=crop&w=1200&q=80"}
                alt={backgroundImageAlt || "Luxury Product"}
                className="w-full rounded-2xl shadow-2xl"
                loading="eager"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Template 6: Gradient Modern (Futuristic)
function GradientModernHero({ content }: HeroTemplateProps) {
  const prefersReducedMotion = useReducedMotion();
  const { headline, subheadline, ctaText, ctaLink, backgroundImage, backgroundImageAlt, overlayOpacity } = content;
  const opacity = backgroundImage ? (overlayOpacity ?? 70) / 100 : 1;

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-jade via-midnight to-midnight text-white flex items-center overflow-hidden">
      {backgroundImage && (
        <>
          <div className="absolute inset-0">
            <img
              src={backgroundImage}
              alt={backgroundImageAlt || "Background"}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
          <div
            className="absolute inset-0 bg-gradient-to-br from-jade via-midnight to-midnight"
            style={{ opacity }}
          />
        </>
      )}
      <motion.div
        className="absolute top-20 left-20 w-96 h-96 bg-jade/30 rounded-full blur-3xl"
        animate={prefersReducedMotion ? undefined : {
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-96 h-96 bg-champagne/20 rounded-full blur-3xl"
        animate={prefersReducedMotion ? undefined : {
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-sm font-semibold mb-8">
            <SparklesIcon className="h-4 w-4" />
            <span>Powered by Science</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-tight max-w-5xl mx-auto">
            {headline}
          </h1>

          <p className="mt-8 text-xl lg:text-2xl text-white/80 max-w-3xl mx-auto">
            {subheadline}
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={ctaLink}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-10 py-5 text-lg font-semibold text-midnight shadow-xl transition-all hover:scale-105"
            >
              <span>{ctaText}</span>
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>

          <div className="mt-16 flex items-center justify-center gap-12">
            <div className="text-center">
              <p className="text-4xl font-bold">24k+</p>
              <p className="text-sm text-white/60 mt-1">Happy Customers</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-4xl font-bold">4.9</p>
              <p className="text-sm text-white/60 mt-1">Average Rating</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-4xl font-bold">98%</p>
              <p className="text-sm text-white/60 mt-1">Satisfaction</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
