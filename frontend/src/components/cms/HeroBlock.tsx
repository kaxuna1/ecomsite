import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  CheckBadgeIcon,
  HeartIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type { HeroContent } from '../../types/cms';

interface HeroBlockProps {
  content: HeroContent;
}

export default function HeroBlock({ content }: HeroBlockProps) {
  const prefersReducedMotion = useReducedMotion();
  const {
    headline,
    subheadline,
    description,
    ctaText,
    ctaLink,
    textAlignment = 'center'
  } = content;

  const alignmentClass = {
    left: 'text-left lg:text-left',
    center: 'text-center lg:text-left',
    right: 'text-right lg:text-right'
  }[textAlignment];

  return (
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
            className={`flex flex-col justify-center ${alignmentClass}`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
          >
            {/* Main Headline */}
            <motion.h1
              className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl xl:text-7xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {headline}
            </motion.h1>

            <motion.p
              className="mt-6 text-base text-champagne/80 sm:text-lg lg:text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {subheadline}
            </motion.p>

            {description && (
              <motion.p
                className="mt-4 text-base text-champagne/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {description}
              </motion.p>
            )}

            {/* Star Rating & Reviews */}
            <motion.div
              className="mt-6 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-champagne">24k+</span>
                <span className="text-champagne/60">Five-Star Reviews</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-jade">92%</span>
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
                to={ctaLink}
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-jade px-8 py-4 text-base font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
              >
                <span>{ctaText}</span>
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
  );
}
