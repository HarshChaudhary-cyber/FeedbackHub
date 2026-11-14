import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../utils';

export type TabsProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Root
>;

/**
 * Tabs Root Component
 * Manages active tab state, orientation, and keyboard activation behavior.
 */
export const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ className, orientation = 'horizontal', ...props }, ref) => {
  return (
    <TabsPrimitive.Root
      ref={ref}
      orientation={orientation}
      className={cn(
        'flex flex-col',
        orientation === 'vertical' && 'flex-row gap-6',
        className
      )}
      {...props}
    />
  );
});
Tabs.displayName = TabsPrimitive.Root.displayName;

export type TabsListProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.List
>;

/**
 * TabsList Component
 * Container for tab triggers with segmented pill styling and accessible tablist semantics.
 */
export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, ...props }, ref) => {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        // Base geometry: segmented pill container with 12px rounded corners and border
        'inline-flex items-center justify-center rounded-xl bg-surface-main p-1 text-content-secondary border border-border transition-smooth',
        // Vertical layout adaptation
        'data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch data-[orientation=vertical]:h-fit',
        className
      )}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

export type TabsTriggerProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Trigger
>;

/**
 * TabsTrigger Component
 * Interactive tab trigger supporting selected, unselected, and disabled visual states.
 */
export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, ...props }, ref) => {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        // Base geometry & typography: 10px rounded corners inside 12px list, medium text
        'inline-flex items-center justify-center whitespace-nowrap rounded-[10px] px-3.5 py-1.5 text-sm font-medium transition-smooth select-none cursor-pointer',
        // Inactive state
        'text-content-secondary hover:text-content-main',
        // Active state: elevated card surface, main text, soft elevation shadow
        'data-[state=active]:bg-surface-card data-[state=active]:text-content-main data-[state=active]:shadow-soft-sm',
        // Focus ring styling using semantic Primary Purple token
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1',
        // Disabled state handling
        'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export type TabsContentProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Content
>;

/**
 * TabsContent Component
 * Content panel associated with a specific tab trigger, supporting full ARIA tabpanel semantics.
 */
export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, ...props }, ref) => {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        // Focus visible ring and spacing
        'mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 transition-smooth',
        // Inactive state hiding
        'data-[state=inactive]:hidden',
        // Vertical layout adaptation
        'data-[orientation=vertical]:mt-0 data-[orientation=vertical]:flex-1',
        className
      )}
      {...props}
    />
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;
