import * as React from 'react';
import { cn } from '../utils';

// -----------------------------------------------------------------------------
// Alert Variants & Types
// -----------------------------------------------------------------------------

export type AlertVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

const alertVariantStyles: Record<AlertVariant, string> = {
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

const variantIconColorStyles: Record<AlertVariant, string> = {
  default: 'text-content-secondary',
  success: 'text-semantic-success',
  error: 'text-semantic-error',
  warning: 'text-semantic-warning',
  info: 'text-semantic-info',
};

// -----------------------------------------------------------------------------
// Alert Root Component
// -----------------------------------------------------------------------------

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual intent and styling variant */
  variant?: AlertVariant;
  /** Optional leading icon element */
  icon?: React.ReactNode;
  /** Optional supplementary action element */
  action?: React.ReactNode;
  /** Optional callback when dismiss button is clicked */
  onClose?: () => void;
  /** Accessible label for the dismiss button */
  closeLabel?: string;
}

/**
 * Alert Component
 * In-page, persistent callout displaying critical feedback, status updates,
 * system warnings, or contextual messages across dashboards, forms, and settings.
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'default',
      icon,
      action,
      onClose,
      closeLabel = 'Dismiss alert',
      role,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Urgent error messages use assertive alert; routine messages use polite status
    const resolvedRole =
      role !== undefined ? role : variant === 'error' ? 'alert' : 'status';

    const renderIcon = () => {
      if (!icon) return null;

      // Preserve accessible names for informative icons; mark decorative icons aria-hidden
      const isInformative =
        React.isValidElement(icon) &&
        Boolean(
          (icon.props as Record<string, unknown>)['aria-label'] ||
            (icon.props as Record<string, unknown>)['aria-labelledby'] ||
            ((icon.props as Record<string, unknown>)['role'] === 'img' &&
              !(icon.props as Record<string, unknown>)['aria-hidden'])
        );

      return (
        <div
          className={cn(
            'shrink-0 mt-0.5',
            variantIconColorStyles[variant] || variantIconColorStyles.default
          )}
          aria-hidden={isInformative ? undefined : 'true'}
        >
          {icon}
        </div>
      );
    };

    return (
      <div
        ref={ref}
        role={resolvedRole}
        className={cn(
          // Base layout & container
          'relative flex w-full items-start gap-3 rounded-xl border p-4 shadow-soft-sm transition-smooth motion-reduce:transition-none',
          // Variant styling
          alertVariantStyles[variant] || alertVariantStyles.default,
          className
        )}
        {...props}
      >
        {renderIcon()}
        <div className="flex-1 min-w-0 space-y-1">{children}</div>
        {action && (
          <div className="shrink-0 flex items-center">{action}</div>
        )}
        {onClose && (
          <AlertClose onClick={onClose} aria-label={closeLabel} />
        )}
      </div>
    );
  }
);
Alert.displayName = 'Alert';

// -----------------------------------------------------------------------------
// AlertTitle Component
// -----------------------------------------------------------------------------

export type AlertTitleElement =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'div'
  | 'p';

export type AlertTitleRef<T extends AlertTitleElement> = T extends 'div'
  ? HTMLDivElement
  : T extends 'p'
  ? HTMLParagraphElement
  : HTMLHeadingElement;

type AlertTitleOwnProps<T extends AlertTitleElement = 'h5'> = {
  /** Semantic HTML heading or container tag to render */
  as?: T;
};

export type AlertTitleProps<T extends AlertTitleElement = 'h5'> =
  AlertTitleOwnProps<T> &
    Omit<React.ComponentPropsWithoutRef<T>, keyof AlertTitleOwnProps<T>>;

export interface AlertTitleComponent {
  <T extends AlertTitleElement = 'h5'>(
    props: AlertTitleProps<T> & {
      ref?: React.Ref<NoInfer<AlertTitleRef<T>>>;
    }
  ): React.ReactElement | null;
  displayName?: string;
}

const AlertTitleRender = <T extends AlertTitleElement = 'h5'>(
  { as, className, children, ...props }: AlertTitleProps<T>,
  ref: React.Ref<AlertTitleRef<T>>
) => {
  const Component = as || 'h5';

  return React.createElement(
    Component,
    {
      ref,
      className: cn(
        'text-sm font-semibold text-content-main leading-tight tracking-tight',
        className
      ),
      ...props,
    },
    children
  );
};

/**
 * AlertTitle Component
 * High-contrast semantic heading for the inline alert.
 * Supports polymorphic rendering (h1-h6, div, p) with type-safe element-specific refs.
 */
export const AlertTitle: AlertTitleComponent = React.forwardRef(
  AlertTitleRender
) as unknown as AlertTitleComponent;
AlertTitle.displayName = 'AlertTitle';

// -----------------------------------------------------------------------------
// AlertDescription Component
// -----------------------------------------------------------------------------

export type AlertDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * AlertDescription Component
 * Explanatory body text rendered with secondary content tokens and comfortable line height.
 */
export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  AlertDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-xs sm:text-sm text-content-secondary leading-relaxed',
      className
    )}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

// -----------------------------------------------------------------------------
// AlertAction Component
// -----------------------------------------------------------------------------

export type AlertActionElement = 'button' | 'a';

export interface AlertActionBaseProps {
  className?: string;
  children?: React.ReactNode;
}

export type AlertActionButtonProps = AlertActionBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: 'button';
  };

export type AlertActionLinkProps = AlertActionBaseProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as: 'a';
  };

export type AlertActionProps = AlertActionButtonProps | AlertActionLinkProps;

/**
 * AlertAction Component
 * Supplementary call-to-action button or link associated with the alert message.
 * Supports both button and anchor elements with full keyboard accessibility.
 */
export const AlertAction = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  AlertActionProps
>(({ as = 'button', className, children, ...props }, ref) => {
  const commonClasses = cn(
    'inline-flex items-center justify-center font-medium text-xs sm:text-sm rounded-lg border border-border bg-transparent px-3 py-1 text-content-main transition-smooth',
    'hover:bg-surface-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1',
    'disabled:pointer-events-none disabled:opacity-50 cursor-pointer motion-reduce:transition-none',
    className
  );

  if (as === 'a') {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={commonClasses}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  const { type = 'button', ...buttonProps } =
    props as React.ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      className={commonClasses}
      {...buttonProps}
    >
      {children}
    </button>
  );
});
AlertAction.displayName = 'AlertAction';

// -----------------------------------------------------------------------------
// AlertClose Component
// -----------------------------------------------------------------------------

export interface AlertCloseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label'?: string;
}

/**
 * AlertClose Component
 * Accessible dismiss trigger with default SVG icon and screen reader label.
 */
export const AlertClose = React.forwardRef<HTMLButtonElement, AlertCloseProps>(
  (
    {
      className,
      children,
      'aria-label': ariaLabel = 'Dismiss alert',
      type = 'button',
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      aria-label={ariaLabel}
      className={cn(
        'shrink-0 rounded-lg p-1 text-content-secondary hover:text-content-main hover:bg-surface-main transition-smooth',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 cursor-pointer',
        'motion-reduce:transition-none',
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </button>
  )
);
AlertClose.displayName = 'AlertClose';
