/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { Button } from '../Button';

afterEach(() => {
  cleanup();
});

describe('Button Primitive', () => {
  it('renders button with children correctly', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Click Me');
  });

  it('renders variants and size styles according to design tokens', () => {
    const { rerender } = render(
      <Button variant="primary" size="md">
        Primary Pill
      </Button>
    );
    let button = screen.getByRole('button');
    // Primary buttons must be pill-shaped
    expect(button.className).toContain('rounded-full');
    expect(button.className).toContain('bg-brand-primary');

    // Secondary buttons must use 12px radius (rounded-xl)
    rerender(
      <Button variant="secondary" size="sm">
        Secondary
      </Button>
    );
    button = screen.getByRole('button');
    expect(button.className).toContain('rounded-xl');
    expect(button.className).toContain('bg-surface-card');

    // Destructive
    rerender(<Button variant="destructive">Delete</Button>);
    button = screen.getByRole('button');
    expect(button.className).toContain('bg-semantic-error');

    // Link
    rerender(<Button variant="link">Link</Button>);
    button = screen.getByRole('button');
    expect(button.className).toContain('underline-offset-4');
  });

  it('handles click behavior and calls onClick handler', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    const button = screen.getByRole('button', { name: /submit/i });

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('prevents click behavior when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled Action
      </Button>
    );
    const button = screen.getByRole('button', { name: /disabled action/i }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders loading state with aria-busy, spinner and prevents click submission', () => {
    const handleClick = vi.fn();
    render(
      <Button loading onClick={handleClick}>
        Saving
      </Button>
    );
    const button = screen.getByRole('button') as HTMLButtonElement;

    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.disabled).toBe(true);

    // Verify SVG spinner exists
    const spinner = button.querySelector('svg');
    expect(spinner).toBeTruthy();
    expect(spinner?.classList.contains('animate-spin')).toBe(true);

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders left and right icons appropriately', () => {
    render(
      <Button
        leftIcon={<span data-testid="left-icon">←</span>}
        rightIcon={<span data-testid="right-icon">→</span>}
      >
        Navigate
      </Button>
    );
    expect(screen.getByTestId('left-icon')).toBeTruthy();
    expect(screen.getByTestId('right-icon')).toBeTruthy();
  });

  it('forwards ref properly to HTMLButtonElement', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
