import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/10 bg-white/5 px-8 py-16 text-center"
    >
      {icon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="mb-6 text-champagne/40"
        >
          {icon}
        </motion.div>
      )}
      <h3 className="font-display text-xl text-champagne">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-champagne/60">{description}</p>
      )}
      {action && (
        <motion.button
          type="button"
          onClick={action.onClick}
          className="mt-6 flex items-center gap-2 rounded-full bg-blush px-6 py-3 text-sm font-semibold text-midnight transition-colors hover:bg-champagne"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {action.icon}
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
