import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '../utils';

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  error?: boolean | string;
  thumbClassName?: string;
}

/**
 * Switch Root Component
 * Accessible, pill-shaped toggle switch adhering to FeedbackHub design tokens.
 */
export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(
  (
    {
      className,
      thumbClassName,
      disabled,
      required,
      error,
      'aria-invalid': customAriaInvalid,
      children,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);
    const resolvedAriaInvalid = customAriaInvalid ?? (hasError ? 'true' : undefined);

    return (
      <SwitchPrimitive.Root
        ref={ref}
        disabled={disabled}
        required={required}
        aria-invalid={resolvedAriaInvalid}
        className={cn(
          // Base geometry: 44px x 24px pill track, 2px border, transition
          'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-smooth',
          // Surfaces & borders: surface card background, neutral semantic border
          'bg-surface-card border-border',
          // Checked state: brand primary background & border
          'data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary',
          // Focus ring styling using semantic focus ring token
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
          // Disabled state handling
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-card',
          'data-[state=checked]:disabled:bg-brand-primary/50 data-[state=checked]:disabled:border-brand-primary/50',
          // Error styling
          hasError && 'border-semantic-error focus-visible:ring-semantic-error',
          className
        )}
        {...props}
      >
        {children ?? <SwitchThumb className={thumbClassName} />}
      </SwitchPrimitive.Root>
    );
  }
);
Switch.displayName = SwitchPrimitive.Root.displayName;

export type SwitchThumbProps = React.ComponentPropsWithoutRef<
  typeof SwitchPrimitive.Thumb
>;

/**
 * SwitchThumb Component
 * Circular thumb indicator that smoothly slides across the switch track.
 */
export const SwitchThumb = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Thumb>,
  SwitchThumbProps
>(({ className, ...props }, ref) => {
  return (
    <SwitchPrimitive.Thumb
      ref={ref}
      data-testid="switch-thumb"
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full shadow-soft-sm ring-0 transition-transform',
        'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        'data-[state=checked]:bg-white data-[state=unchecked]:bg-content-muted',
        className
      )}
      {...props}
    />
  );
});
SwitchThumb.displayName = SwitchPrimitive.Thumb.displayName;

export interface SwitchLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  disabled?: boolean;
}

/**
 * SwitchLabel Component
 * Accessible label associated with a Switch control.
 */
export const SwitchLabel = React.forwardRef<
  HTMLLabelElement,
  SwitchLabelProps
>(({ className, disabled, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium text-content-main select-none cursor-pointer leading-none',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      {...props}
    />
  );
});
SwitchLabel.displayName = 'SwitchLabel';

export type SwitchDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * SwitchDescription Component
 * Accessible helper/description text associated with a Switch control.
 */
export const SwitchDescription = React.forwardRef<
  HTMLParagraphElement,
  SwitchDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-xs text-content-secondary', className)}
      {...props}
    />
  );
});
SwitchDescription.displayName = 'SwitchDescription';
