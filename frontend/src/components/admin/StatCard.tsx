import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose';
  delay?: number;
}

const colorClasses = {
  emerald: {
    gradient: 'from-emerald-500/20 to-jade/10',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400'
  },
  blue: {
    gradient: 'from-blue-500/20 to-blue-500/10',
    border: 'border-blue-500/20',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400'
  },
  amber: {
    gradient: 'from-amber-500/20 to-amber-500/10',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400'
  },
  purple: {
    gradient: 'from-purple-500/20 to-purple-500/10',
    border: 'border-purple-500/20',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400'
  },
  rose: {
    gradient: 'from-rose-500/20 to-rose-500/10',
    border: 'border-rose-500/20',
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-400'
  }
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'emerald',
  delay = 0
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative rounded-3xl bg-gradient-to-br ${colors.gradient} border ${colors.border} p-4 sm:p-6 shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02] overflow-hidden`}
    >
      {/* Icon positioned absolutely in top-right, well within bounds */}
      <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 rounded-full ${colors.iconBg} p-1.5 sm:p-2 flex-shrink-0`}>
        <div className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.iconColor} flex items-center justify-center`}>{icon}</div>
      </div>
      
      {/* Content area with padding to avoid icon overlap */}
      <div className="pr-14 sm:pr-18 lg:pr-20 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {title}
        </p>
        <p className="mt-2 sm:mt-3 font-display text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-text-primary leading-tight whitespace-nowrap overflow-visible">
          {typeof value === 'number' 
            ? value.toLocaleString('en-US', { maximumFractionDigits: 2 })
            : String(value)}
        </p>
        {subtitle && (
          <p className="mt-1.5 sm:mt-2 text-xs text-text-secondary break-normal">{subtitle}</p>
        )}
        {trend && (
          <div className="mt-2 sm:mt-3 flex items-center gap-1.5 flex-wrap">
            {trend.value >= 0 ? (
              <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 text-rose-400 flex-shrink-0" />
            )}
            <span
              className={`text-xs font-semibold whitespace-nowrap ${
                trend.value >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-xs text-text-tertiary line-clamp-1">{trend.label}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
