import React from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-inset bg-card p-10 text-center shadow-soft flex flex-col items-center justify-center max-w-lg mx-auto',
        className
      )}
    >
      <div className="w-14 h-14 rounded-full bg-forest-900 flex items-center justify-center text-page mb-4 shadow-sm">
        <Icon className="w-7 h-7 text-page" />
      </div>
      <h3 className="text-lg font-bold text-title tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-body max-w-sm leading-relaxed mb-6">{description}</p>

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action && (
            <Button
              variant="primary"
              onClick={action.onClick}
              leftIcon={action.icon}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="secondary"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
