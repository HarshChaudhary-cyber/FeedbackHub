import React, { forwardRef, createContext, useContext } from 'react';
import { cn } from '../utils';

export type EmptyStateVariant = 'default' | 'compact' | 'card';
export type EmptyStateSize = 'sm' | 'md' | 'lg';

export interface EmptyStateContextValue {
  variant: EmptyStateVariant;
  size: EmptyStateSize;
}

export const EmptyStateContext = createContext<EmptyStateContextValue>({
  variant: 'default',
  size: 'md',
});

// -----------------------------------------------------------------------------
// EmptyState Root Component
// -----------------------------------------------------------------------------

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: EmptyStateVariant;
  size?: EmptyStateSize;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

const variantStyles: Record<EmptyStateVariant, Record<EmptyStateSize, string>> = {
  default: {
    sm: 'p-4',
    md: 'py-10 px-6',
    lg: 'py-16 px-8',
  },
  compact: {
    sm: 'p-3',
    md: 'py-6 px-4',
    lg: 'py-8 px-6',
  },
  card: {
    sm: 'p-4 bg-surface-card border border-border shadow-soft-sm rounded-2xl',
    md: 'p-8 bg-surface-card border border-border shadow-soft-sm rounded-[20px]',
    lg: 'p-12 bg-surface-card border border-border shadow-soft-sm rounded-[20px]',
  },
};

/**
 * EmptyState Root Container
 * Centered and balanced layout for empty, zero-data, and initial onboarding states.
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      variant = 'default',
      size = 'md',
      icon,
      title,
      description,
      actions,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const currentVariant = variantStyles[variant] ? variant : 'default';
    const currentSize = variantStyles[currentVariant][size] ? size : 'md';

    const hasExplicitChildren = children !== undefined && children !== null;

    return (
      <EmptyStateContext.Provider value={{ variant: currentVariant, size: currentSize }}>
        <div
          ref={ref}
          data-variant={currentVariant}
          data-size={currentSize}
          className={cn(
            'flex flex-col items-center justify-center text-center w-full transition-smooth',
            variantStyles[currentVariant][currentSize],
            className
          )}
          {...props}
        >
          {hasExplicitChildren ? (
            children
          ) : (
            <>
              {icon && <EmptyStateIcon>{icon}</EmptyStateIcon>}
              {title && <EmptyStateTitle>{title}</EmptyStateTitle>}
              {description && <EmptyStateDescription>{description}</EmptyStateDescription>}
              {actions && <EmptyStateActions>{actions}</EmptyStateActions>}
            </>
          )}
        </div>
      </EmptyStateContext.Provider>
    );
  }
);
EmptyState.displayName = 'EmptyState';

// -----------------------------------------------------------------------------
// EmptyStateIcon Component
// -----------------------------------------------------------------------------

export interface EmptyStateIconProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: EmptyStateSize;
}

const iconSizeStyles: Record<EmptyStateSize, string> = {
  sm: 'w-10 h-10 rounded-xl mb-3 [&_svg]:w-5 [&_svg]:h-5',
  md: 'w-14 h-14 rounded-2xl mb-4 [&_svg]:w-7 [&_svg]:h-7',
  lg: 'w-20 h-20 rounded-3xl mb-5 [&_svg]:w-10 [&_svg]:h-10',
};

/**
 * EmptyStateIcon Component
 * Consistent rounded icon/illustration container styled with FeedbackHub design tokens.
 * Automatically marks decorative icons as aria-hidden="true" unless explicitly overridden.
 */
export const EmptyStateIcon = forwardRef<HTMLDivElement, EmptyStateIconProps>(
  ({ size, className, children, 'aria-hidden': ariaHidden = true, ...props }, ref) => {
    const context = useContext(EmptyStateContext);
    const resolvedSize = size ?? context.size ?? 'md';

    return (
      <div
        ref={ref}
        aria-hidden={ariaHidden}
        className={cn(
          'flex items-center justify-center shrink-0 bg-surface-main text-content-secondary border border-border shadow-soft-sm transition-smooth',
          iconSizeStyles[resolvedSize] || iconSizeStyles.md,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
EmptyStateIcon.displayName = 'EmptyStateIcon';

// -----------------------------------------------------------------------------
// EmptyStateTitle Component
// -----------------------------------------------------------------------------

export interface EmptyStateTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'p';
  size?: EmptyStateSize;
}

const titleSizeStyles: Record<EmptyStateSize, string> = {
  sm: 'text-sm font-semibold mb-1',
  md: 'text-base sm:text-lg font-semibold mb-1.5',
  lg: 'text-xl sm:text-2xl font-bold mb-2',
};

/**
 * EmptyStateTitle Component
 * High-contrast semantic heading for the empty state.
 */
export const EmptyStateTitle = forwardRef<HTMLHeadingElement, EmptyStateTitleProps>(
  ({ as: Component = 'h3', size, className, children, ...props }, ref) => {
    const context = useContext(EmptyStateContext);
    const resolvedSize = size ?? context.size ?? 'md';

    return (
      <Component
        ref={ref}
        className={cn(
          'text-content-main tracking-tight leading-tight',
          titleSizeStyles[resolvedSize] || titleSizeStyles.md,
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
EmptyStateTitle.displayName = 'EmptyStateTitle';

// -----------------------------------------------------------------------------
// EmptyStateDescription Component
// -----------------------------------------------------------------------------

export interface EmptyStateDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: EmptyStateSize;
}

const descriptionSizeStyles: Record<EmptyStateSize, string> = {
  sm: 'text-xs max-w-xs',
  md: 'text-sm max-w-sm sm:max-w-md',
  lg: 'text-base max-w-md sm:max-w-lg',
};

/**
 * EmptyStateDescription Component
 * Descriptive supporting text using secondary content tokens and comfortable reading width.
 */
export const EmptyStateDescription = forwardRef<
  HTMLParagraphElement,
  EmptyStateDescriptionProps
>(({ size, className, children, ...props }, ref) => {
  const context = useContext(EmptyStateContext);
  const resolvedSize = size ?? context.size ?? 'md';

  return (
    <p
      ref={ref}
      className={cn(
        'text-content-secondary mx-auto',
        descriptionSizeStyles[resolvedSize] || descriptionSizeStyles.md,
        'leading-relaxed',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
});
EmptyStateDescription.displayName = 'EmptyStateDescription';

// -----------------------------------------------------------------------------
// EmptyStateActions Component
// -----------------------------------------------------------------------------

export interface EmptyStateActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: EmptyStateSize;
}

const actionsSizeStyles: Record<EmptyStateSize, string> = {
  sm: 'mt-4 gap-2',
  md: 'mt-6 gap-3',
  lg: 'mt-8 gap-4',
};

/**
 * EmptyStateActions Component
 * Action slot supporting one or multiple responsive buttons/links.
 */
export const EmptyStateActions = forwardRef<HTMLDivElement, EmptyStateActionsProps>(
  ({ size, className, children, ...props }, ref) => {
    const context = useContext(EmptyStateContext);
    const resolvedSize = size ?? context.size ?? 'md';

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-wrap items-center justify-center',
          actionsSizeStyles[resolvedSize] || actionsSizeStyles.md,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
EmptyStateActions.displayName = 'EmptyStateActions';
