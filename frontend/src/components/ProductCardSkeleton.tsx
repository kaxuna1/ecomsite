import { motion } from 'framer-motion';

export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-champagne/40 bg-white shadow-lg">
      {/* Image Skeleton */}
      <div className="aspect-[4/5] bg-champagne/30 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          animate={{
            x: ['-100%', '200%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </div>

      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col gap-3 p-6">
        {/* Title */}
        <div className="h-6 w-3/4 bg-champagne/40 rounded-lg relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.1
            }}
          />
        </div>

        {/* Description Lines */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-champagne/30 rounded relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
              animate={{
                x: ['-100%', '200%']
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.2
              }}
            />
          </div>
          <div className="h-4 w-5/6 bg-champagne/30 rounded relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
              animate={{
                x: ['-100%', '200%']
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.3
              }}
            />
          </div>
        </div>

        {/* Price */}
        <div className="h-5 w-20 bg-jade/20 rounded-full mt-auto relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.4
            }}
          />
        </div>

        {/* Tags */}
        <div className="flex gap-1.5 pt-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-6 w-16 bg-champagne/30 rounded-full relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                animate={{
                  x: ['-100%', '200%']
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5 + i * 0.1
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
