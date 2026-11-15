import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '../utils';

// -----------------------------------------------------------------------------
// ToastProvider
// -----------------------------------------------------------------------------

export type ToastProviderProps = React.ComponentPropsWithoutRef<
  typeof ToastPrimitive.Provider
>;

/**
 * ToastProvider Component
 * Manages toast state, duration, and accessibility announcements.
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({
  duration = 5000,
  swipeDirection = 'right',
  label = 'Notifications',
  children,
  ...props
}) => {
  return (
    <ToastPrimitive.Provider
      duration={duration}
      swipeDirection={swipeDirection}
      label={label}
      {...props}
    >
      {children}
    </ToastPrimitive.Provider>
  );
};
ToastProvider.displayName = ToastPrimitive.Provider.displayName;

// -----------------------------------------------------------------------------
// ToastViewport
// -----------------------------------------------------------------------------

export type ToastViewportPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

export interface ToastViewportProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport> {
  position?: ToastViewportPosition;
}

const viewportPositionStyles: Record<ToastViewportPosition, string> = {
  'top-right': 'top-0 right-0 flex-col',
  'top-left': 'top-0 left-0 flex-col',
  'bottom-right': 'bottom-0 right-0 flex-col',
  'bottom-left': 'bottom-0 left-0 flex-col',
  'top-center': 'top-0 left-1/2 -translate-x-1/2 flex-col',
  'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2 flex-col',
};

/**
 * ToastViewport Component
 * Fixed-position portal container where active notifications are stacked.
 */
export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  ToastViewportProps
>(({ className, position = 'bottom-right', ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    data-position={position}
    className={cn(
      'fixed z-[100] flex max-h-screen w-full p-4 sm:max-w-[420px] outline-none gap-2 pointer-events-none',
      viewportPositionStyles[position] || viewportPositionStyles['bottom-right'],
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

// -----------------------------------------------------------------------------
// Toast Root
// -----------------------------------------------------------------------------

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> {
  variant?: ToastVariant;
}

const toastVariantStyles: Record<ToastVariant, string> = {
  default: 'bg-surface-card border-border text-content-main',
  success:
    'bg-surface-card border-border border-l-4 border-l-semantic-success text-content-main',
  error:
    'bg-surface-card border-border border-l-4 border-l-semantic-error text-content-main',
  warning:
    'bg-surface-card border-border border-l-4 border-l-semantic-warning text-content-main',
  info:
    'bg-surface-card border-border border-l-4 border-l-semantic-info text-content-main',
};

/**
 * Toast Root Component
 * Individual notification item supporting semantic variants and swipe gestures.
 */
export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({ className, variant = 'default', type, ...props }, ref) => {
  // Urgent error toasts announce assertively; routine notifications announce politely
  const resolvedType = type ?? (variant === 'error' ? 'foreground' : 'background');

  return (
    <ToastPrimitive.Root
      ref={ref}
      type={resolvedType}
      data-variant={variant}
      className={cn(
        // Base container & interaction
        'group pointer-events-auto relative flex w-full items-start justify-between space-x-3 overflow-hidden rounded-xl border p-4 shadow-soft-lg transition-smooth',
        // Swipe animations
        'data-[swipe=cancel]:translate-x-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
        // Variant styling
        toastVariantStyles[variant] || toastVariantStyles.default,
        className
      )}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitive.Root.displayName;

// -----------------------------------------------------------------------------
// ToastTitle
// -----------------------------------------------------------------------------

export type ToastTitleProps = React.ComponentPropsWithoutRef<
  typeof ToastPrimitive.Title
>;

/**
 * ToastTitle Component
 * High-contrast semantic heading for the notification.
 */
export const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  ToastTitleProps
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn('text-sm font-semibold text-content-main leading-tight', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

// -----------------------------------------------------------------------------
// ToastDescription
// -----------------------------------------------------------------------------

export type ToastDescriptionProps = React.ComponentPropsWithoutRef<
  typeof ToastPrimitive.Description
>;

/**
 * ToastDescription Component
 * Supporting explanatory copy using secondary content tokens.
 */
export const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  ToastDescriptionProps
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn('text-xs text-content-secondary leading-relaxed mt-1', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

// -----------------------------------------------------------------------------
// ToastAction
// -----------------------------------------------------------------------------

export type ToastActionProps = React.ComponentPropsWithoutRef<
  typeof ToastPrimitive.Action
>;

/**
 * ToastAction Component
 * Accessible supplementary action button associated with the toast notification.
 */
export const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  ToastActionProps
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-border bg-transparent px-3 text-xs font-medium text-content-main transition-smooth',
      'hover:bg-surface-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1',
      'disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

// -----------------------------------------------------------------------------
// ToastClose
// -----------------------------------------------------------------------------

export type ToastCloseProps = React.ComponentPropsWithoutRef<
  typeof ToastPrimitive.Close
>;

/**
 * ToastClose Component
 * Accessible close trigger with default icon and label.
 */
export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  ToastCloseProps
>(({ className, children, 'aria-label': ariaLabel = 'Close', ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    aria-label={ariaLabel}
    className={cn(
      'absolute right-2 top-2 rounded-lg p-1 text-content-secondary hover:text-content-main hover:bg-surface-main transition-smooth',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 cursor-pointer',
      className
    )}
    {...props}
  >
    {children ?? (
      <svg
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    )}
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;
