import React from 'react';
import { cn } from '../../lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  workspaceName?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  workspaceName,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-2',
        className
      )}
    >
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-title">
            {title}
          </h1>
          {badge}
        </div>
        {(description || workspaceName) && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-body">
            {workspaceName && (
              <span className="font-semibold text-forest-700 bg-inset px-2.5 py-0.5 rounded-full">
                {workspaceName}
              </span>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
