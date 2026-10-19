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
    info: 'bg-cyan-950/40 border-cyan-800/80 text-cyan-200',
    success: 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200',
    warning: 'bg-amber-950/40 border-amber-800/80 text-amber-200',
    danger: 'bg-rose-950/40 border-rose-800/80 text-rose-200',
  };

  const icons = {
    info: <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
    danger: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 text-sm backdrop-blur-sm',
        variants[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-semibold leading-tight">{title}</h5>}
        <div className="text-xs sm:text-sm leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
}
