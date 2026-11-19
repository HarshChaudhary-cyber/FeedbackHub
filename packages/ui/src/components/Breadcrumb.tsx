import * as React from 'react';
import { cn } from '../utils';

export type BreadcrumbProps = React.ComponentPropsWithoutRef<'nav'>;

export const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="breadcrumb"
      className={cn('relative', className)}
      {...props}
    />
  )
);
Breadcrumb.displayName = 'Breadcrumb';

export type BreadcrumbListProps = React.ComponentPropsWithoutRef<'ol'>;

export const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  BreadcrumbListProps
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      'flex flex-wrap items-center gap-1.5 break-words text-xs sm:text-sm text-content-secondary sm:gap-2',
      className
    )}
    {...props}
  />
));
BreadcrumbList.displayName = 'BreadcrumbList';

export type BreadcrumbItemProps = React.ComponentPropsWithoutRef<'li'>;

export const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  BreadcrumbItemProps
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn('inline-flex items-center gap-1.5', className)}
    {...props}
  />
));
BreadcrumbItem.displayName = 'BreadcrumbItem';

export interface BreadcrumbLinkProps
  extends React.ComponentPropsWithoutRef<'a'> {
  asChild?: boolean;
}

export const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  BreadcrumbLinkProps
>(({ className, asChild = false, children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      className: cn(
        'transition-colors hover:text-content-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded',
        (children.props as { className?: string }).className,
        className
      ),
      ref,
      ...props,
    });
  }

  return (
    <a
      ref={ref}
      className={cn(
        'transition-colors hover:text-content-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded',
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
});
BreadcrumbLink.displayName = 'BreadcrumbLink';

export type BreadcrumbPageProps = React.ComponentPropsWithoutRef<'span'>;

export const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  BreadcrumbPageProps
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    aria-current="page"
    className={cn('font-medium text-content-main', className)}
    {...props}
  />
));
BreadcrumbPage.displayName = 'BreadcrumbPage';

export type BreadcrumbSeparatorProps = React.ComponentPropsWithoutRef<'li'>;

export const BreadcrumbSeparator = React.forwardRef<
  HTMLLIElement,
  BreadcrumbSeparatorProps
>(({ children, className, ...props }, ref) => (
  <li
    ref={ref}
    role="presentation"
    aria-hidden="true"
    className={cn('text-content-muted text-xs select-none', className)}
    {...props}
  >
    {children || (
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    )}
  </li>
));
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

export type BreadcrumbEllipsisProps = React.ComponentPropsWithoutRef<'span'>;

export const BreadcrumbEllipsis = React.forwardRef<
  HTMLSpanElement,
  BreadcrumbEllipsisProps
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="presentation"
    aria-hidden="true"
    className={cn('flex h-6 w-6 items-center justify-center text-content-secondary', className)}
    {...props}
  >
    <svg
      className="h-4 w-4"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
    <span className="sr-only">More pages</span>
  </span>
));
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';
