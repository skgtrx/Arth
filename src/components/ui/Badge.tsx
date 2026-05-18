import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'accent' | 'credit' | 'debit' | 'warning' | 'success' | 'info' | 'danger';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-overlay text-text-secondary',
  accent: 'bg-accent-muted text-accent',
  credit: 'bg-accent-muted text-credit',
  debit: 'bg-red-950 text-debit',
  warning: 'bg-amber-950 text-warning',
  success: 'bg-emerald-950 text-emerald-400',
  info: 'bg-blue-950 text-blue-400',
  danger: 'bg-red-950 text-red-400',
};

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
