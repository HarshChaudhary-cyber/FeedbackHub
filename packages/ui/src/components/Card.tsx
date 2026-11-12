import React, { forwardRef } from 'react';
import { cn } from '../utils';

export type CardVariant = 'default' | 'small';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
}

/**
 * Main Card Container
 * - default: 20px corner radius (rounded-card-lg / rounded-[20px])
 * - small: 16px corner radius (rounded-card-sm / rounded-2xl)
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', interactive = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-surface-card text-content-main border border-border shadow-soft-sm transition-smooth',
          // Corner radii matching design token specification
          variant === 'default' ? 'rounded-[20px]' : 'rounded-2xl',
          // Optional interactive hover elevation
          interactive &&
            'cursor-pointer hover:shadow-soft-md hover:-translate-y-0.5 hover:border-slate-300',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'default' | 'compact';
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ spacing = 'default', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5',
          spacing === 'default' ? 'p-6' : 'p-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'div';
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ as: Component = 'h3', className, children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn('text-lg font-semibold leading-tight text-content-main', className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
CardTitle.displayName = 'CardTitle';

export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-xs text-content-secondary leading-relaxed', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);
CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'default' | 'compact';
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ spacing = 'default', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          spacing === 'default' ? 'p-6 pt-0' : 'p-4 pt-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'default' | 'compact';
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ spacing = 'default', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          spacing === 'default' ? 'p-6 pt-0' : 'p-4 pt-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardFooter.displayName = 'CardFooter';
