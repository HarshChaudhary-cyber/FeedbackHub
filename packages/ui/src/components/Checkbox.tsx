import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cn } from '../utils';

export type CheckedState = CheckboxPrimitive.CheckedState;

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  error?: boolean | string;
}

/**
 * Checkbox Component
 * Fully accessible, composable checkbox supporting controlled, uncontrolled,
 * and indeterminate states adhering to FeedbackHub design tokens.
 */
export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(
  (
    {
      className,
      checked: controlledChecked,
      defaultChecked,
      onCheckedChange,
      disabled,
      required,
      error,
      'aria-invalid': customAriaInvalid,
      ...props
    },
    ref
  ) => {
    const isControlled = controlledChecked !== undefined;
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState<CheckedState>(
      defaultChecked ?? false
    );

    const currentChecked = isControlled ? controlledChecked : uncontrolledChecked;

    const handleCheckedChange = (nextChecked: CheckedState) => {
      if (!isControlled) {
        setUncontrolledChecked(nextChecked);
      }
      onCheckedChange?.(nextChecked);
    };

    const hasError = Boolean(error);
    const resolvedAriaInvalid = customAriaInvalid ?? (hasError ? 'true' : undefined);

    return (
      <CheckboxPrimitive.Root
        ref={ref}
        checked={currentChecked}
        onCheckedChange={handleCheckedChange}
        disabled={disabled}
        required={required}
        aria-invalid={resolvedAriaInvalid}
        className={cn(
          // Base geometry & surfaces: 16px square, 5px rounded corners, card background
          'peer h-4 w-4 shrink-0 rounded-[5px] border bg-surface-card shadow-soft-sm transition-smooth cursor-pointer',
          // State colors & borders
          'border-border hover:border-border',
          'data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary data-[state=checked]:text-white',
          'data-[state=indeterminate]:bg-brand-primary data-[state=indeterminate]:border-brand-primary data-[state=indeterminate]:text-white',
          // Focus ring styling using semantic focus ring token
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1',
          // Disabled state handling
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-transparent',
          'data-[state=checked]:disabled:bg-brand-primary/50 data-[state=checked]:disabled:border-brand-primary/50',
          'data-[state=indeterminate]:disabled:bg-brand-primary/50 data-[state=indeterminate]:disabled:border-brand-primary/50',
          // Error styling
          hasError && 'border-semantic-error focus-visible:ring-semantic-error',
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          className={cn('flex items-center justify-center text-current')}
        >
          {currentChecked === 'indeterminate' ? (
            <svg
              data-testid="checkbox-indeterminate-icon"
              className="h-3 w-3 stroke-[3]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          ) : (
            <svg
              data-testid="checkbox-check-icon"
              className="h-3.5 w-3.5 stroke-[3]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  }
);

Checkbox.displayName = CheckboxPrimitive.Root.displayName;
