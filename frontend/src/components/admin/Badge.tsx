import { ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  neutral: 'bg-white/10 text-champagne border-white/20'
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base'
};

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = ''
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wider ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}
