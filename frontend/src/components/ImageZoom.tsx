import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImageZoomProps {
  src: string;
  alt: string;
}

export default function ImageZoom({ src, alt }: ImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showHint, setShowHint] = useState(true);
  const imageRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Hide hint after 3 seconds
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !isZoomed) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsZoomed(true);
    setShowHint(false);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  const handleClick = () => {
    setIsZoomed(!isZoomed);
    setShowHint(false);
  };

  return (
    <div className="relative">
      {/* Zoom Container */}
      <motion.div
        ref={imageRef}
        className="group relative overflow-hidden rounded-3xl bg-champagne cursor-zoom-in"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        {/* Main Image */}
        <motion.img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          style={{
            transformOrigin: isZoomed ? `${mousePosition.x}% ${mousePosition.y}%` : 'center'
          }}
          animate={{
            scale: isZoomed ? 2 : 1
          }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        />

        {/* Hover Overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-midnight/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          initial={false}
        />

        {/* Zoom Indicator */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm px-4 py-2 shadow-lg"
            >
              <MagnifyingGlassIcon className="h-4 w-4 text-jade" />
              <span className="text-xs font-medium text-midnight">Hover to zoom</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zoom Icon (Always visible on mobile) */}
        <motion.div
          className="absolute bottom-4 right-4 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity lg:opacity-100"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MagnifyingGlassIcon className="h-5 w-5 text-jade" />
        </motion.div>

        {/* Scanning Line Effect */}
        <AnimatePresence>
          {isZoomed && !prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 border-2 border-jade/30 rounded-3xl"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 hidden lg:flex items-center justify-center bg-midnight/95 backdrop-blur-xl p-8"
            onClick={() => setIsZoomed(false)}
          >
            <motion.button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="absolute top-6 right-6 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <XMarkIcon className="h-6 w-6" />
            </motion.button>

            <motion.img
              src={src}
              alt={alt}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30
              }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Zoom Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-6 py-3"
            >
              <span className="text-sm text-white/80">Click anywhere to close</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
