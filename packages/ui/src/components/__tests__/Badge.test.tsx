/** @vitest-environment jsdom */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { Badge } from '../Badge';

afterEach(() => {
  cleanup();
});

describe('Badge Primitive', () => {
  it('renders default badge with children and pill-shaped styling', () => {
    render(<Badge data-testid="badge">Default Tag</Badge>);

    const badge = screen.getByTestId('badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('Default Tag');
    expect(badge.className).toContain('rounded-full');
    expect(badge.className).toContain('bg-slate-100');
  });

  it('renders all semantic and brand variants accurately', () => {
    const { rerender } = render(
      <Badge variant="primary" data-testid="badge">
        Primary
      </Badge>
    );
    let badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-purple-50');
    expect(badge.className).toContain('text-purple-700');

    rerender(
      <Badge variant="secondary" data-testid="badge">
        Secondary
      </Badge>
    );
    badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-pink-50');

    rerender(
      <Badge variant="success" data-testid="badge">
        Promoter
      </Badge>
    );
    badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-emerald-50');
    expect(badge.className).toContain('text-emerald-700');

    rerender(
      <Badge variant="warning" data-testid="badge">
        Passive
      </Badge>
    );
    badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-amber-50');

    rerender(
      <Badge variant="error" data-testid="badge">
        Detractor
      </Badge>
    );
    badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-red-50');

    rerender(
      <Badge variant="info" data-testid="badge">
        Pulse
      </Badge>
    );
    badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-sky-50');

    rerender(
      <Badge variant="outline" data-testid="badge">
        Outline
      </Badge>
    );
    badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-transparent');
  });

  it('renders small and medium size options', () => {
    const { rerender } = render(
      <Badge size="sm" data-testid="badge">
        Small
      </Badge>
    );
    let badge = screen.getByTestId('badge');
    expect(badge.className).toContain('text-[11px]');

    rerender(
      <Badge size="md" data-testid="badge">
        Medium
      </Badge>
    );
    badge = screen.getByTestId('badge');
    expect(badge.className).toContain('text-xs');
  });

  it('renders status dot indicator when dot is true', () => {
    render(
      <Badge variant="success" dot data-testid="badge">
        Active
      </Badge>
    );

    const badge = screen.getByTestId('badge');
    const dot = badge.querySelector('span[aria-hidden="true"]');
    expect(dot).toBeTruthy();
    expect(dot?.className).toContain('rounded-full');
    expect(dot?.className).toContain('bg-semantic-success');
  });

  it('forwards ref properly to HTMLSpanElement', () => {
    const badgeRef = React.createRef<HTMLSpanElement>();
    render(<Badge ref={badgeRef}>Ref Badge</Badge>);
    expect(badgeRef.current).toBeInstanceOf(HTMLSpanElement);
  });
});
