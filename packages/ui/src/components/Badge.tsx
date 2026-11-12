import React, { forwardRef } from 'react';
import { cn } from '../utils';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'outline';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { badge: string; dot: string }> = {
  default: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
  },
  primary: {
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-brand-primary',
  },
  secondary: {
    badge: 'bg-pink-50 text-pink-700 border-pink-200',
    dot: 'bg-brand-secondary',
  },
  success: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-semantic-success',
  },
  warning: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-semantic-warning',
  },
  error: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-semantic-error',
  },
  info: {
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-semantic-info',
  },
  outline: {
    badge: 'bg-transparent text-content-main border-border',
    dot: 'bg-content-secondary',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
  md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const config = variantStyles[variant] || variantStyles.default;

    return (
      <span
        ref={ref}
        className={cn(
          // Strict pill-shaped design token
          'inline-flex items-center rounded-full border transition-smooth select-none leading-none shrink-0',
          config.badge,
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)}
            aria-hidden="true"
          />
        )}
        <span>{children}</span>
      </span>
    );
  }
);

Badge.displayName = 'Badge';
