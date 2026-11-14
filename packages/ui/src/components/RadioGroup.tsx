import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '../utils';

export type RadioGroupProps = React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
>;

/**
 * RadioGroup Root Component
 * Manages single-selection state across a group of radio options.
 */
export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, orientation = 'vertical', ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      orientation={orientation}
      className={cn(
        'grid gap-2.5',
        orientation === 'horizontal' && 'flex flex-row flex-wrap gap-4',
        className
      )}
      {...props}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  error?: boolean | string;
}

/**
 * RadioGroupItem Component
 * Circular radio button with semantic border, soft shadow and focus ring.
 */
export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, children, error, 'aria-invalid': customAriaInvalid, ...props }, ref) => {
  const hasError = Boolean(error);
  const resolvedAriaInvalid = customAriaInvalid ?? (hasError ? 'true' : undefined);

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      aria-invalid={resolvedAriaInvalid}
      className={cn(
        // Base geometry: 16px circular button, surface card background, soft shadow
        'peer relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border bg-surface-card shadow-soft-sm transition-smooth cursor-pointer',
        // State borders & colors
        'border-border hover:border-border',
        'data-[state=checked]:border-brand-primary data-[state=checked]:bg-surface-card text-brand-primary',
        // Semantic focus ring
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1',
        // Disabled state handling
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-transparent',
        'data-[state=checked]:disabled:border-brand-primary/50',
        // Error styling
        hasError && 'border-semantic-error focus-visible:ring-semantic-error',
        className
      )}
      {...props}
    >
      {children ?? <RadioGroupIndicator />}
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export type RadioGroupIndicatorProps = React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Indicator
>;

/**
 * RadioGroupIndicator Component
 * Renders the active selection dot in Primary Purple.
 */
export const RadioGroupIndicator = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Indicator>,
  RadioGroupIndicatorProps
>(({ className, children, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Indicator
      ref={ref}
      className={cn('flex items-center justify-center', className)}
      {...props}
    >
      {children ?? (
        <span
          data-testid="radio-group-indicator-dot"
          className="h-2 w-2 rounded-full bg-brand-primary"
        />
      )}
    </RadioGroupPrimitive.Indicator>
  );
});
RadioGroupIndicator.displayName = RadioGroupPrimitive.Indicator.displayName;

export interface RadioGroupLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  disabled?: boolean;
}

/**
 * RadioGroupLabel Component
 * Accessible label for radio group or individual radio items.
 */
export const RadioGroupLabel = React.forwardRef<
  HTMLLabelElement,
  RadioGroupLabelProps
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
RadioGroupLabel.displayName = 'RadioGroupLabel';

export type RadioGroupDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * RadioGroupDescription Component
 * Accessible helper description text for radio groups or options.
 */
export const RadioGroupDescription = React.forwardRef<
  HTMLParagraphElement,
  RadioGroupDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-xs text-content-secondary', className)}
      {...props}
    />
  );
});
RadioGroupDescription.displayName = 'RadioGroupDescription';
