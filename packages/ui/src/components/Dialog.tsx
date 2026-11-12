import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../utils';

/**
 * Dialog Root Component
 * Manages open/closed state (controlled and uncontrolled)
 */
export const Dialog = DialogPrimitive.Root;

/**
 * Dialog Trigger Component
 * Opens the dialog on interaction
 */
export const DialogTrigger = DialogPrimitive.Trigger;

/**
 * Dialog Portal Component
 * Portals dialog children into document.body or custom container
 */
export const DialogPortal = DialogPrimitive.Portal;

/**
 * Dialog Close Action Component
 * Closes the dialog when clicked
 */
export const DialogClose = DialogPrimitive.Close;

export type DialogOverlayProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Overlay
>;

/**
 * Dialog Overlay Component
 * Semi-transparent backdrop with subtle blur and smooth transition
 */
export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200',
      'data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  hideCloseButton?: boolean;
}

/**
 * Dialog Content Component
 * Main modal container adhering strictly to the 24px corner radius token
 */
export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, hideCloseButton = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      aria-modal="true"
      className={cn(
        // Positioning & stacking
        'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
        // Responsive dimensions
        'w-[calc(100%-2rem)] max-w-lg max-h-[85vh] overflow-y-auto',
        // Visual design: strict 24px modal radius (rounded-modal / rounded-[24px])
        'rounded-[24px] bg-surface-card p-6 sm:p-7 text-content-main border border-border shadow-soft-lg',
        // Focus ring styling
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
        // Transitions
        'duration-200 transition-smooth',
        className
      )}
      {...props}
    >
      {children}
      {!hideCloseButton && (
        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1.5 text-content-secondary hover:text-content-main hover:bg-slate-100 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Dialog Header Component
 * Contains the dialog title and description
 */
export const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 text-left pb-3', className)}
      {...props}
    />
  )
);
DialogHeader.displayName = 'DialogHeader';

export type DialogTitleProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Title
>;

/**
 * Dialog Title Component
 * Accessible heading associated with aria-labelledby
 */
export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  DialogTitleProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg sm:text-xl font-semibold leading-tight text-content-main tracking-tight',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export type DialogDescriptionProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Description
>;

/**
 * Dialog Description Component
 * Accessible descriptive text associated with aria-describedby
 */
export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  DialogDescriptionProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-content-secondary leading-relaxed', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export type DialogFooterProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Dialog Footer Component
 * Action button container with responsive stacking
 */
export const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 gap-2 pt-5 mt-2 border-t border-slate-100',
        className
      )}
      {...props}
    />
  )
);
DialogFooter.displayName = 'DialogFooter';
