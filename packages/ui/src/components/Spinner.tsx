import * as React from 'react';
import { cn } from '../utils';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'default' | 'primary' | 'white' | 'muted';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  /**
   * Size of the spinner. Defaults to 'md'.
   */
  size?: SpinnerSize;
  /**
   * Color variant of the spinner.
   * Defaults to 'primary' (brand purple #8B5CF6).
   */
  variant?: SpinnerVariant;
  /**
   * Accessible text for screen readers. Defaults to 'Loading...'.
   */
  label?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
  xl: 'h-9 w-9',
};

const variantStyles: Record<SpinnerVariant, string> = {
  default: 'text-content-main',
  primary: 'text-brand-primary',
  white: 'text-white',
  muted: 'text-content-muted',
};

/**
 * Spinner Component
 * Accessible animated loading indicator for asynchronous actions, buttons, and page loaders.
 */
export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  (
    {
      size = 'md',
      variant = 'primary',
      label = 'Loading...',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <span className="inline-flex items-center justify-center">
        <svg
          ref={ref}
          role="status"
          aria-label={label}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            'animate-spin motion-reduce:animate-none',
            sizeStyles[size] || sizeStyles.md,
            variantStyles[variant] || variantStyles.primary,
            className
          )}
          {...props}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="sr-only">{label}</span>
      </span>
    );
  }
);

Spinner.displayName = 'Spinner';
