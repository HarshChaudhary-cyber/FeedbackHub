import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '../utils';

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  /**
   * Orientation of the separator line.
   * Defaults to 'horizontal'.
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Whether the separator is purely decorative.
   * If true, screen readers ignore it (role="none").
   * If false, role="separator" is exposed with aria-orientation.
   * Defaults to true.
   */
  decorative?: boolean;
}

/**
 * Separator Component
 * Visual or semantic divider between sections, items, or toolbars.
 * Built on Radix UI Separator primitive for accessibility.
 */
export const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(
  (
    {
      className,
      orientation = 'horizontal',
      decorative = true,
      ...props
    },
    ref
  ) => {
    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
          'shrink-0 bg-border',
          orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
          className
        )}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';
