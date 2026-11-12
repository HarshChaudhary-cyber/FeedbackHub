import React, { forwardRef } from 'react';
import { cn } from '../utils';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  // Pill-shaped primary button strictly adheres to design token radius
  primary:
    'rounded-full bg-brand-primary text-white shadow-soft-sm hover:opacity-95 hover:shadow-soft-md active:scale-[0.98] border border-transparent focus-visible:ring-brand-primary',
  // Secondary button strictly uses 12px radius (rounded-xl / rounded-btn-secondary)
  secondary:
    'rounded-xl bg-surface-card text-content-main border border-border shadow-soft-sm hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] focus-visible:ring-brand-primary',
  outline:
    'rounded-xl bg-transparent text-content-main border border-border hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] focus-visible:ring-brand-primary',
  ghost:
    'rounded-xl bg-transparent text-content-secondary hover:text-content-main hover:bg-slate-100/70 border border-transparent active:scale-[0.98] focus-visible:ring-brand-primary',
  destructive:
    'rounded-xl bg-semantic-error text-white shadow-soft-sm hover:bg-red-700 active:scale-[0.98] border border-transparent focus-visible:ring-semantic-error',
  link:
    'rounded-none bg-transparent text-brand-primary underline-offset-4 hover:underline p-0 h-auto font-medium border-none shadow-none focus-visible:ring-brand-primary',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs font-medium px-3.5 py-1.5 gap-1.5 min-h-[32px]',
  md: 'text-sm font-medium px-5 py-2.5 gap-2 min-h-[40px]',
  lg: 'text-base font-semibold px-6 py-3.5 gap-2.5 min-h-[48px]',
};

/**
 * Loading Spinner Component
 */
const Spinner: React.FC<{ size?: ButtonSize; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const dimension = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <svg
      className={cn('animate-spin shrink-0', dimension, className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      type = 'button',
      onClick,
      ...props
    },
    ref
  ) => {
    const isInteractiveDisabled = disabled || loading;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isInteractiveDisabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isInteractiveDisabled}
        aria-busy={loading ? 'true' : undefined}
        onClick={handleClick}
        className={cn(
          // Base layout and typography
          'inline-flex items-center justify-center font-medium transition-smooth select-none cursor-pointer',
          // Accessible focus ring
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          // Variant and size styles
          variantStyles[variant],
          variant !== 'link' && sizeStyles[size],
          // Layout modifiers
          fullWidth && 'w-full',
          // Disabled state
          isInteractiveDisabled && 'opacity-60 cursor-not-allowed pointer-events-none active:scale-100',
          className
        )}
        {...props}
      >
        {loading ? (
          <Spinner
            size={size}
            className={variant === 'primary' || variant === 'destructive' ? 'text-white' : 'text-current'}
          />
        ) : (
          leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>
        )}

        {children && <span>{children}</span>}

        {!loading && rightIcon && (
          <span className="inline-flex shrink-0 items-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
