import * as React from 'react';
import { cn } from '../utils';

export interface VisuallyHiddenProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * The underlying element type to render. Defaults to 'span'.
   */
  as?: React.ElementType;
}

/**
 * VisuallyHidden Component
 * Hides content visually while keeping it fully accessible to screen readers.
 * Standard Tailwind `sr-only` implementation.
 */
export const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  VisuallyHiddenProps
>(({ as: Component = 'span', className, children, ...props }, ref) => {
  return (
    <Component
      ref={ref}
      className={cn('sr-only', className)}
      {...props}
    >
      {children}
    </Component>
  );
});

VisuallyHidden.displayName = 'VisuallyHidden';
