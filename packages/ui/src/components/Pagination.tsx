import * as React from 'react';
import { cn } from '../utils';

export type PaginationProps = React.ComponentPropsWithoutRef<'nav'>;

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  ({ className, ...props }, ref) => (
    <nav
      ref={ref}
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
);
Pagination.displayName = 'Pagination';

export type PaginationContentProps = React.ComponentPropsWithoutRef<'ul'>;

export const PaginationContent = React.forwardRef<
  HTMLUListElement,
  PaginationContentProps
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-1.5', className)}
    {...props}
  />
));
PaginationContent.displayName = 'PaginationContent';

export type PaginationItemProps = React.ComponentPropsWithoutRef<'li'>;

export const PaginationItem = React.forwardRef<
  HTMLLIElement,
  PaginationItemProps
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('list-none', className)} {...props} />
));
PaginationItem.displayName = 'PaginationItem';

export interface PaginationLinkProps
  extends React.ComponentPropsWithoutRef<'a'> {
  isActive?: boolean;
  asChild?: boolean;
}

export const PaginationLink = React.forwardRef<
  HTMLAnchorElement,
  PaginationLinkProps
>(({ className, isActive = false, asChild = false, children, ...props }, ref) => {
  const activeClasses = isActive
    ? 'bg-brand-primary text-white font-semibold shadow-soft-sm hover:bg-brand-primary'
    : 'text-content-secondary hover:bg-neutral-mainBackground hover:text-content-main border border-transparent';

  const baseClasses = cn(
    'inline-flex items-center justify-center rounded-xl text-xs sm:text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary h-9 min-w-9 px-3 select-none',
    activeClasses,
    className
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      className: cn(baseClasses, (children.props as { className?: string }).className),
      'aria-current': isActive ? 'page' : undefined,
      ref,
      ...props,
    });
  }

  return (
    <a
      ref={ref}
      aria-current={isActive ? 'page' : undefined}
      className={baseClasses}
      {...props}
    >
      {children}
    </a>
  );
});
PaginationLink.displayName = 'PaginationLink';

export type PaginationPreviousProps = PaginationLinkProps;

export const PaginationPrevious = React.forwardRef<
  HTMLAnchorElement,
  PaginationPreviousProps
>(({ className, children, ...props }, ref) => (
  <PaginationLink
    ref={ref}
    aria-label="Go to previous page"
    className={cn('gap-1 pl-2.5', className)}
    {...props}
  >
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
    <span>{children || 'Previous'}</span>
  </PaginationLink>
));
PaginationPrevious.displayName = 'PaginationPrevious';

export type PaginationNextProps = PaginationLinkProps;

export const PaginationNext = React.forwardRef<
  HTMLAnchorElement,
  PaginationNextProps
>(({ className, children, ...props }, ref) => (
  <PaginationLink
    ref={ref}
    aria-label="Go to next page"
    className={cn('gap-1 pr-2.5', className)}
    {...props}
  >
    <span>{children || 'Next'}</span>
    <svg
      className="h-4 w-4"
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
  </PaginationLink>
));
PaginationNext.displayName = 'PaginationNext';

export type PaginationEllipsisProps = React.ComponentPropsWithoutRef<'span'>;

export const PaginationEllipsis = React.forwardRef<
  HTMLSpanElement,
  PaginationEllipsisProps
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn('flex h-9 w-9 items-center justify-center text-content-secondary', className)}
    {...props}
  >
    <span aria-hidden="true" className="flex items-center justify-center">
      <svg
        className="h-4 w-4"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
      </svg>
    </span>
    <span className="sr-only">More pages</span>
  </span>
));
PaginationEllipsis.displayName = 'PaginationEllipsis';
