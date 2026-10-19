import React from 'react';
import { Badge } from './Badge';
import { CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';

export type PollutionClassification =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'unverified'
  | 'within_acceptable'
  | 'within_permissible'
  | 'exceeds_permissible'
  | 'not_evaluated';

interface StatusBadgeProps {
  status: PollutionClassification;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  switch (status) {
    case 'low':
    case 'within_acceptable':
      return (
        <Badge variant="safe" className={className}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{label || (status === 'low' ? 'Low Pollution' : 'Within Acceptable')}</span>
        </Badge>
      );
    case 'medium':
    case 'within_permissible':
      return (
        <Badge variant="moderate" className={className}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{label || (status === 'medium' ? 'Moderate Pollution' : 'Within Permissible')}</span>
        </Badge>
      );
    case 'high':
    case 'critical':
    case 'exceeds_permissible':
      return (
        <Badge variant="high" className={className}>
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>
            {label ||
              (status === 'critical'
                ? 'Critical Pollution'
                : status === 'high'
                ? 'High Pollution'
                : 'Exceeds Permissible Limit')}
          </span>
        </Badge>
      );
    case 'unverified':
    default:
      return (
        <Badge variant="unverified" className={className}>
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{label || 'Unverified / Not Evaluated'}</span>
        </Badge>
      );
  }
}
