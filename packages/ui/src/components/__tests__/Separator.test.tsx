/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { Separator } from '../Separator';

afterEach(() => {
  cleanup();
});

describe('Separator Component Primitive', () => {
  it('1. renders horizontal separator by default with bg-border and h-[1px]', () => {
    const { container } = render(<Separator data-testid="sep" />);
    const sep = container.querySelector('[data-testid="sep"]');
    expect(sep).toBeTruthy();
    expect(sep?.className).toContain('bg-border');
    expect(sep?.className).toContain('h-[1px]');
    expect(sep?.className).toContain('w-full');
  });

  it('2. renders vertical separator when orientation="vertical"', () => {
    const { container } = render(<Separator orientation="vertical" data-testid="sep" />);
    const sep = container.querySelector('[data-testid="sep"]');
    expect(sep?.className).toContain('w-[1px]');
    expect(sep?.className).toContain('h-full');
  });

  it('3. renders role="none" when decorative is true', () => {
    const { container } = render(<Separator decorative={true} data-testid="sep" />);
    const sep = container.querySelector('[data-testid="sep"]');
    expect(sep?.getAttribute('role')).toBe('none');
  });

  it('4. exposes role="separator" and aria-orientation when decorative is false', () => {
    render(<Separator decorative={false} orientation="vertical" />);
    const sep = screen.getByRole('separator');
    expect(sep).toBeTruthy();
    expect(sep.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('5. forwards ref to the DOM element', () => {
    const sepRef = React.createRef<HTMLDivElement>();
    render(<Separator ref={sepRef} decorative={false} />);
    expect(sepRef.current).toBeInstanceOf(HTMLDivElement);
    expect(sepRef.current?.getAttribute('role')).toBe('separator');
  });

  it('6. merges custom className', () => {
    const { container } = render(<Separator className="my-4 bg-red-500" data-testid="sep" />);
    const sep = container.querySelector('[data-testid="sep"]');
    expect(sep?.className).toContain('my-4');
  });
});
