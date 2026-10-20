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
    info: 'bg-[#F0FCEF] border-[#BED4BC] text-[#002F18]',
    success: 'bg-[#DDF3E6] border-[#A6E1BE] text-[#1F8A5B]',
    warning: 'bg-[#FBF0D6] border-[#F5DC9A] text-[#B7791F]',
    danger: 'bg-[#FBE3E1] border-[#F6BDB8] text-[#C2413B]',
  };

  const icons = {
    info: <Info className="w-5 h-5 text-[#2E7D55] shrink-0 mt-0.5" />,
    success: <CheckCircle className="w-5 h-5 text-[#1F8A5B] shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#B7791F] shrink-0 mt-0.5" />,
    danger: <AlertCircle className="w-5 h-5 text-[#C2413B] shrink-0 mt-0.5" />,
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
