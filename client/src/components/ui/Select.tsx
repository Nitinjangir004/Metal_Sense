import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, icon, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-body pointer-events-none">
            {icon}
          </div>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-5 py-2.5 rounded-full bg-raised border border-inset text-title text-xs sm:text-sm font-medium transition-all appearance-none pr-10 shadow-sm cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            icon && 'pl-11',
            error && 'border-status-critical focus:ring-status-critical',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="w-4 h-4 text-body absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        {error && <p className="mt-1 text-xs text-status-critical font-medium ml-2">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
