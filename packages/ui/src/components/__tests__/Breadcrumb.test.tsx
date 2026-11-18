/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '../Breadcrumb';

afterEach(() => {
  cleanup();
});

describe('Breadcrumb Component Primitives', () => {
  it('1. renders navigation with aria-label="breadcrumb" and items', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/surveys">Surveys</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Customer Satisfaction 2026</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );

    const nav = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(nav).toBeTruthy();

    const current = screen.getByText('Customer Satisfaction 2026');
    expect(current.getAttribute('aria-current')).toBe('page');

    const link = screen.getByRole('link', { name: 'Dashboard' });
    expect(link.getAttribute('href')).toBe('/dashboard');
  });

  it('2. renders BreadcrumbSeparator with role="presentation" and aria-hidden="true"', () => {
    const { container } = render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator data-testid="sep" />
          <BreadcrumbItem>
            <BreadcrumbPage>Current</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );

    const sep = container.querySelector('[data-testid="sep"]');
    expect(sep?.getAttribute('role')).toBe('presentation');
    expect(sep?.getAttribute('aria-hidden')).toBe('true');
  });

  it('3. renders BreadcrumbEllipsis with sr-only description', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );

    expect(screen.getByText('More pages')).toBeTruthy();
  });

  it('4. supports BreadcrumbLink asChild composition', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button type="button">Custom Trigger</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );

    const button = screen.getByRole('button', { name: 'Custom Trigger' });
    expect(button).toBeTruthy();
    expect(button.className).toContain('hover:text-content-main');
  });

  it('5. forwards refs across all primitives', () => {
    const navRef = React.createRef<HTMLElement>();
    const listRef = React.createRef<HTMLOListElement>();
    const itemRef = React.createRef<HTMLLIElement>();
    const linkRef = React.createRef<HTMLAnchorElement>();
    const sepRef = React.createRef<HTMLLIElement>();
    const pageRef = React.createRef<HTMLSpanElement>();
    const ellipsisRef = React.createRef<HTMLSpanElement>();

    render(
      <Breadcrumb ref={navRef}>
        <BreadcrumbList ref={listRef}>
          <BreadcrumbItem ref={itemRef}>
            <BreadcrumbLink ref={linkRef} href="/">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator ref={sepRef} />
          <BreadcrumbItem>
            <BreadcrumbEllipsis ref={ellipsisRef} />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage ref={pageRef}>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );

    expect(navRef.current).toBeInstanceOf(HTMLElement);
    expect(listRef.current).toBeInstanceOf(HTMLOListElement);
    expect(itemRef.current).toBeInstanceOf(HTMLLIElement);
    expect(linkRef.current).toBeInstanceOf(HTMLAnchorElement);
    expect(sepRef.current).toBeInstanceOf(HTMLLIElement);
    expect(ellipsisRef.current).toBeInstanceOf(HTMLSpanElement);
    expect(pageRef.current).toBeInstanceOf(HTMLSpanElement);
  });
});
