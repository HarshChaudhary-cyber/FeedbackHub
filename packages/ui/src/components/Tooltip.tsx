import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../utils';

// -----------------------------------------------------------------------------
// TooltipProvider
// -----------------------------------------------------------------------------

export type TooltipProviderProps = React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Provider
>;

/**
 * TooltipProvider Component
 * Wraps tooltip groups to synchronize delays, skip delays, and hoverable behavior.
 */
export const TooltipProvider: React.FC<TooltipProviderProps> = ({
  delayDuration = 300,
  skipDelayDuration = 300,
  disableHoverableContent = false,
  children,
  ...props
}) => {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      disableHoverableContent={disableHoverableContent}
      {...props}
    >
      {children}
    </TooltipPrimitive.Provider>
  );
};
TooltipProvider.displayName = TooltipPrimitive.Provider.displayName;

// -----------------------------------------------------------------------------
// Tooltip Root
// -----------------------------------------------------------------------------

export type TooltipProps = React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Root
>;

/**
 * Tooltip Root Component
 * Manages open/close state (controlled and uncontrolled).
 */
export const Tooltip = TooltipPrimitive.Root;

// -----------------------------------------------------------------------------
// TooltipTrigger
// -----------------------------------------------------------------------------

export type TooltipTriggerProps = React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Trigger
>;

/**
 * TooltipTrigger Component
 * Interactive element opening the tooltip on pointer hover or keyboard focus.
 */
export const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  TooltipTriggerProps
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Trigger ref={ref} className={className} {...props} />
));
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;

// -----------------------------------------------------------------------------
// TooltipContent
// -----------------------------------------------------------------------------

export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  container?: HTMLElement | null;
}

/**
 * TooltipContent Component
 * Portaled contextual overlay presenting informative guidance.
 */
export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 6, container, children, ...props }, ref) => (
  <TooltipPrimitive.Portal container={container}>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // Positioning & stacking
        'z-50 overflow-hidden select-none',
        // Geometry & design tokens: 8px rounded corners, neutral surface card, border, text
        'rounded-lg border border-border bg-surface-card px-3 py-1.5 text-xs font-medium text-content-main shadow-soft-md',
        // Motion and transitions
        'transition-smooth duration-150',
        'data-[state=closed]:opacity-0 data-[state=delayed-open]:opacity-100 data-[state=instant-open]:opacity-100',
        'data-[side=bottom]:translate-y-0.5 data-[side=top]:-translate-y-0.5 data-[side=left]:-translate-x-0.5 data-[side=right]:translate-x-0.5',
        // Focus Visible
        'focus-visible:outline-none',
        className
      )}
      {...props}
    >
      {children}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// -----------------------------------------------------------------------------
// TooltipArrow
// -----------------------------------------------------------------------------

export type TooltipArrowProps = React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Arrow
>;

/**
 * TooltipArrow Component
 * Contextual pointing triangle seamlessly styled to match tooltip surface tokens.
 */
export const TooltipArrow = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Arrow>,
  TooltipArrowProps
>(({ className, width = 10, height = 5, ...props }, ref) => (
  <TooltipPrimitive.Arrow
    ref={ref}
    width={width}
    height={height}
    className={cn('fill-surface-card', className)}
    {...props}
  />
));
TooltipArrow.displayName = TooltipPrimitive.Arrow.displayName;
