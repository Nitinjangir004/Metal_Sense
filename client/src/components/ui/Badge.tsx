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
    default: 'bg-white text-[#002F18] border-[#DFEADD] shadow-sm',
    outline: 'bg-transparent text-[#002F18] border-[#BED4BC]',
    safe: 'bg-[#DDF3E6] text-[#1F8A5B] border-[#A6E1BE]',
    moderate: 'bg-[#FBF0D6] text-[#B7791F] border-[#F5DC9A]',
    high: 'bg-[#FBE3E1] text-[#C2413B] border-[#F6BDB8]',
    unverified: 'bg-[#F0FCEF] text-[#7C8F84] border-[#DFEADD] border-dashed',
    cyan: 'bg-white text-[#002F18] border-[#DFEADD] shadow-sm font-bold',
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
