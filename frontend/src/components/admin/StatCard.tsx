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
    gradient: 'from-blue-500/20 to-blush/10',
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
      className={`rounded-3xl bg-gradient-to-br ${colors.gradient} border ${colors.border} p-6 shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02]`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-champagne/70">
            {title}
          </p>
          <p className="mt-3 font-display text-3xl text-champagne">{value}</p>
          {subtitle && (
            <p className="mt-2 text-xs text-champagne/60">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-3 flex items-center gap-1.5">
              {trend.value >= 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-400" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-rose-400" />
              )}
              <span
                className={`text-xs font-semibold ${
                  trend.value >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {trend.value >= 0 ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-xs text-champagne/50">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`rounded-full ${colors.iconBg} p-3`}>
          <div className={`h-6 w-6 ${colors.iconColor}`}>{icon}</div>
        </div>
      </div>
    </motion.div>
  );
}
