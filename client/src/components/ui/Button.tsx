import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900 focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98] cursor-pointer';

    const variants = {
      primary:
        'bg-forest-900 hover:bg-forest-700 text-white shadow-soft',
      secondary:
        'bg-pill-unselected hover:bg-inset text-title border border-inset shadow-sm',
      outline:
        'border border-inset text-title bg-transparent hover:bg-inset/60',
      ghost:
        'text-title hover:bg-inset/40 active:bg-inset/70',
      danger:
        'bg-status-critical hover:bg-status-critical-hover text-white shadow-soft',
    };

    const sizes = {
      sm: 'h-8 px-3.5 text-xs gap-1.5',
      md: 'h-10 px-5 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
      icon: 'h-10 w-10 p-0 rounded-full',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
