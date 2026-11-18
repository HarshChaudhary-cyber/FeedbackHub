import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../utils';

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  /**
   * If true, renders a red asterisk indicator indicating the associated input is required.
   */
  required?: boolean;
}

/**
 * Label Component
 * Accessible label built on Radix UI Label primitive.
 * Supports peer-disabled styling, required indicators, and ref forwarding.
 */
export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, children, required, ...props }, ref) => {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        'text-xs sm:text-sm font-medium leading-none text-content-main select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1',
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {required && (
        <span className="text-semantic-error ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </LabelPrimitive.Root>
  );
});

Label.displayName = 'Label';
