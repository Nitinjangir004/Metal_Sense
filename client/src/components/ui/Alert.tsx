import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
}

export function Alert({
  variant = 'info',
  title,
  className,
  children,
  ...props
}: AlertProps) {
  const variants = {
    info: 'bg-status-info-bg border-status-info-border text-forest-900',
    success: 'bg-status-safe-bg border-status-safe-border text-status-safe',
    warning: 'bg-status-warning-bg border-status-warning-border text-status-warning',
    danger: 'bg-status-critical-bg border-status-critical-border text-status-critical',
  };

  const icons = {
    info: <Info className="w-5 h-5 text-forest-500 shrink-0 mt-0.5" />,
    success: <CheckCircle className="w-5 h-5 text-status-safe shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />,
    danger: <AlertCircle className="w-5 h-5 text-status-critical shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-[20px] border p-4 text-sm shadow-card',
        variants[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-bold leading-tight">{title}</h5>}
        <div className="text-xs sm:text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
