/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '../Pagination';

afterEach(() => {
  cleanup();
});

describe('Pagination Component Primitives', () => {
  it('1. renders navigation with role="navigation" and aria-label="pagination"', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="/page/1" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="/page/1">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="/page/2" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="/page/3" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );

    const nav = screen.getByRole('navigation', { name: 'pagination' });
    expect(nav).toBeTruthy();

    const activePage = screen.getByText('2');
    expect(activePage.getAttribute('aria-current')).toBe('page');
    expect(activePage.className).toContain('bg-brand-primary');

    const prev = screen.getByRole('link', { name: 'Go to previous page' });
    expect(prev.getAttribute('href')).toBe('/page/1');

    const next = screen.getByRole('link', { name: 'Go to next page' });
    expect(next.getAttribute('href')).toBe('/page/3');
  });

  it('2. supports PaginationLink asChild composition', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink asChild isActive>
              <button type="button">Page 1</button>
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );

    const button = screen.getByRole('button', { name: 'Page 1' });
    expect(button).toBeTruthy();
    expect(button.getAttribute('aria-current')).toBe('page');
    expect(button.className).toContain('bg-brand-primary');
  });

  it('3. renders PaginationEllipsis with sr-only text', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );

    expect(screen.getByText('More pages')).toBeTruthy();
  });

  it('4. forwards refs to all pagination primitives', () => {
    const navRef = React.createRef<HTMLElement>();
    const contentRef = React.createRef<HTMLUListElement>();
    const itemRef = React.createRef<HTMLLIElement>();
    const linkRef = React.createRef<HTMLAnchorElement>();
    const prevRef = React.createRef<HTMLAnchorElement>();
    const nextRef = React.createRef<HTMLAnchorElement>();
    const ellipsisRef = React.createRef<HTMLSpanElement>();

    render(
      <Pagination ref={navRef}>
        <PaginationContent ref={contentRef}>
          <PaginationItem ref={itemRef}>
            <PaginationPrevious ref={prevRef} href="/prev" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink ref={linkRef} href="/1">
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis ref={ellipsisRef} />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext ref={nextRef} href="/next" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );

    expect(navRef.current).toBeInstanceOf(HTMLElement);
    expect(contentRef.current).toBeInstanceOf(HTMLUListElement);
    expect(itemRef.current).toBeInstanceOf(HTMLLIElement);
    expect(linkRef.current).toBeInstanceOf(HTMLAnchorElement);
    expect(prevRef.current).toBeInstanceOf(HTMLAnchorElement);
    expect(nextRef.current).toBeInstanceOf(HTMLAnchorElement);
    expect(ellipsisRef.current).toBeInstanceOf(HTMLSpanElement);
  });
});
