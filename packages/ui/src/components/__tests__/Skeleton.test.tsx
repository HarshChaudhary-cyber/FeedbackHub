/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { Skeleton } from '../Skeleton';

afterEach(() => {
  cleanup();
});

describe('Skeleton Component Primitive', () => {
  it('1. renders skeleton element with aria-hidden="true" and animate-pulse', () => {
    render(<Skeleton data-testid="skel" />);
    const skel = screen.getByTestId('skel');
    expect(skel).toBeTruthy();
    expect(skel.getAttribute('aria-hidden')).toBe('true');
    expect(skel.className).toContain('animate-pulse');
  });

  it('2. supports motion-reduce class to disable animation for reduced motion users', () => {
    render(<Skeleton data-testid="skel" />);
    const skel = screen.getByTestId('skel');
    expect(skel.className).toContain('motion-reduce:animate-none');
  });

  it('3. renders default variant with rounded-md', () => {
    render(<Skeleton data-testid="skel" />);
    const skel = screen.getByTestId('skel');
    expect(skel.className).toContain('rounded-md');
  });

  it('4. renders card variant with 16px radius', () => {
    render(<Skeleton variant="card" data-testid="skel" />);
    const skel = screen.getByTestId('skel');
    expect(skel.className).toContain('rounded-[16px]');
  });

  it('5. renders circular variant with rounded-full', () => {
    render(<Skeleton variant="circular" data-testid="skel" />);
    const skel = screen.getByTestId('skel');
    expect(skel.className).toContain('rounded-full');
  });

  it('6. forwards ref to HTMLDivElement', () => {
    const skelRef = React.createRef<HTMLDivElement>();
    render(<Skeleton ref={skelRef} />);
    expect(skelRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it('7. merges custom className', () => {
    render(<Skeleton className="h-6 w-32 custom-skel" data-testid="skel" />);
    const skel = screen.getByTestId('skel');
    expect(skel.className).toContain('h-6');
    expect(skel.className).toContain('w-32');
    expect(skel.className).toContain('custom-skel');
  });
});
