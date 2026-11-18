/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { Spinner, type SpinnerSize, type SpinnerVariant } from '../Spinner';

afterEach(() => {
  cleanup();
});

describe('Spinner Component Primitive', () => {
  it('1. renders SVG element with role="status" and default accessible label', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status', { name: 'Loading...' });
    expect(spinner).toBeTruthy();
    expect(screen.getByText('Loading...').className).toContain('sr-only');
  });

  it('2. supports custom accessible label', () => {
    render(<Spinner label="Submitting feedback..." />);
    const spinner = screen.getByRole('status', { name: 'Submitting feedback...' });
    expect(spinner).toBeTruthy();
    expect(screen.getByText('Submitting feedback...')).toBeTruthy();
  });

  it('3. applies motion-reduce:animate-none for accessibility', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    const classAttr = spinner.getAttribute('class') || '';
    expect(classAttr).toContain('motion-reduce:animate-none');
    expect(classAttr).toContain('animate-spin');
  });

  it('4. supports size variants (xs, sm, md, lg, xl)', () => {
    const sizes: Record<SpinnerSize, string> = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-7 w-7',
      xl: 'h-9 w-9',
    };

    for (const [size, expectedClass] of Object.entries(sizes)) {
      const { unmount } = render(<Spinner size={size as SpinnerSize} />);
      const spinner = screen.getByRole('status');
      expect(spinner.getAttribute('class')).toContain(expectedClass);
      unmount();
    }
  });

  it('5. supports color variants (primary, default, white, muted)', () => {
    const variants: Record<SpinnerVariant, string> = {
      primary: 'text-brand-primary',
      default: 'text-content-main',
      white: 'text-white',
      muted: 'text-content-muted',
    };

    for (const [variant, expectedClass] of Object.entries(variants)) {
      const { unmount } = render(<Spinner variant={variant as SpinnerVariant} />);
      const spinner = screen.getByRole('status');
      expect(spinner.getAttribute('class')).toContain(expectedClass);
      unmount();
    }
  });

  it('6. forwards ref to SVGSVGElement', () => {
    const spinnerRef = React.createRef<SVGSVGElement>();
    render(<Spinner ref={spinnerRef} />);
    expect(spinnerRef.current).toBeInstanceOf(SVGSVGElement);
  });

  it('7. merges custom className', () => {
    render(<Spinner className="custom-spin-class" />);
    const spinner = screen.getByRole('status');
    expect(spinner.getAttribute('class')).toContain('custom-spin-class');
  });
});
