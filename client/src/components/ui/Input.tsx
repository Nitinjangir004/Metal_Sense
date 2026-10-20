import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-body pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-5 py-2.5 rounded-full bg-raised border border-inset text-title placeholder-placeholder text-xs sm:text-sm font-medium transition-all shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            icon && 'pl-11',
            error && 'border-status-critical focus:ring-status-critical',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-status-critical font-medium ml-2">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
