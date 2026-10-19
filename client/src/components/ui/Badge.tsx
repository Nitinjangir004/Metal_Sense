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
    'inline-flex items-center font-medium rounded-full border tracking-wide transition-colors select-none';

  const variants = {
    default: 'bg-slate-800 text-slate-200 border-slate-700/80',
    outline: 'bg-transparent text-slate-300 border-slate-700',
    safe: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80',
    moderate: 'bg-amber-950/70 text-amber-300 border-amber-800/80',
    high: 'bg-rose-950/70 text-rose-300 border-rose-800/80',
    unverified: 'bg-slate-800/70 text-slate-400 border-slate-700/60 border-dashed',
    cyan: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/80',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}
