import { ReactNode, ButtonHTMLAttributes, ComponentType } from 'react';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ComponentType<{ className?: string }> | ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blush text-midnight hover:bg-champagne',
  secondary: 'bg-white/10 text-champagne hover:bg-white/20 border border-white/20',
  danger: 'bg-rose-500 text-white hover:bg-rose-600',
  ghost: 'text-champagne hover:bg-white/10'
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base'
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  onClick,
  type = 'button',
  ...props
}: ButtonProps) {
  const MotionButton = motion.button as any;

  // Render icon helper
  const renderIcon = () => {
    if (!icon) return null;

    // If icon is a function/component, create element
    if (typeof icon === 'function') {
      const IconComponent = icon as ComponentType<{ className?: string }>;
      return <IconComponent className="h-5 w-5" />;
    }

    // Otherwise render as-is
    return icon;
  };

  return (
    <MotionButton
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      {...props}
    >
      {loading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading...
        </>
      ) : (
        <>
          {renderIcon()}
          {children}
        </>
      )}
    </MotionButton>
  );
}
