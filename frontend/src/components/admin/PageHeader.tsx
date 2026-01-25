import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}

export default function PageHeader({ title, description, actions, meta }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-xl uppercase tracking-[0.2em] text-text-primary break-words sm:text-2xl sm:tracking-[0.3em] lg:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-xs text-text-secondary sm:mt-2 sm:text-sm">
            {description}
          </p>
        )}
        {meta && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-text-tertiary sm:mt-3 sm:gap-2">
            {meta}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
