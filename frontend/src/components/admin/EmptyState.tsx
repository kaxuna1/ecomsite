import { ReactNode, ComponentType } from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }> | ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ComponentType<{ className?: string }> | ReactNode;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const renderIcon = (iconProp?: ComponentType<{ className?: string }> | ReactNode) => {
    if (!iconProp) return null;
    if (typeof iconProp === 'function') {
      const IconComponent = iconProp as ComponentType<{ className?: string }>;
      return <IconComponent className="h-12 w-12" />;
    }
    return iconProp;
  };

  const renderActionIcon = (iconProp?: ComponentType<{ className?: string }> | ReactNode) => {
    if (!iconProp) return null;
    if (typeof iconProp === 'function') {
      const IconComponent = iconProp as ComponentType<{ className?: string }>;
      return <IconComponent className="h-5 w-5" />;
    }
    return iconProp;
  };

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
          {renderIcon(icon)}
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
          {renderActionIcon(action.icon)}
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
