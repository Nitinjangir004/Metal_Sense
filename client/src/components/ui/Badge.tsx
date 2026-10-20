import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'safe' | 'moderate' | 'high' | 'unverified' | 'cyan';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center font-semibold rounded-full border tracking-wide transition-colors select-none';

  const variants = {
    default: 'bg-raised text-forest-900 border-inset shadow-sm',
    outline: 'bg-transparent text-forest-900 border-inset',
    safe: 'bg-status-safe-bg text-status-safe-text border-status-safe-border',
    moderate: 'bg-status-warning-bg text-status-warning-text border-status-warning-border',
    high: 'bg-status-critical-bg text-status-critical-text border-status-critical-border',
    unverified: 'bg-raised text-caption border-inset border-dashed',
    cyan: 'bg-pill-unselected text-forest-900 border-inset shadow-sm font-bold',
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}
