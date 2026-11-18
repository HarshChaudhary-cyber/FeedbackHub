import * as React from 'react';
import { cn } from '../utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Corner radius variant for the skeleton placeholder.
   * - default: rounded-md (12px-ish standard)
   * - card: rounded-card-sm (16px) or rounded-card-lg (20px)
   * - circular: rounded-full (for avatars, badges, circular buttons)
   */
  variant?: 'default' | 'card' | 'circular';
}

const variantRadiusStyles: Record<NonNullable<SkeletonProps['variant']>, string> = {
  default: 'rounded-md',
  card: 'rounded-[16px]',
  circular: 'rounded-full',
};

/**
 * Skeleton Component
 * Visual placeholder for loading states. Includes pulse animation and
 * motion-reduce accessibility support.
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        data-testid="skeleton"
        className={cn(
          'animate-pulse bg-border/60 motion-reduce:animate-none',
          variantRadiusStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
