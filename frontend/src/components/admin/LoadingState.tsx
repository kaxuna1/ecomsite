import { motion } from 'framer-motion';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingState({ message = 'Loading...', fullScreen = false }: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative h-16 w-16">
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-jade/20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-t-jade border-r-transparent border-b-transparent border-l-transparent"
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>
      <p className="text-sm font-medium text-champagne/70">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
}
