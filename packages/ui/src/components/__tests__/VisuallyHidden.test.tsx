/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { VisuallyHidden } from '../VisuallyHidden';

afterEach(() => {
  cleanup();
});

describe('VisuallyHidden Component Primitive', () => {
  it('1. renders span element with sr-only class by default', () => {
    render(<VisuallyHidden data-testid="hidden">Screen reader only title</VisuallyHidden>);
    const element = screen.getByTestId('hidden');
    expect(element.tagName.toLowerCase()).toBe('span');
    expect(element.className).toContain('sr-only');
    expect(element.textContent).toBe('Screen reader only title');
  });

  it('2. supports polymorphic as prop (e.g. as="div")', () => {
    render(
      <VisuallyHidden as="div" data-testid="hidden">
        Hidden section
      </VisuallyHidden>
    );
    const element = screen.getByTestId('hidden');
    expect(element.tagName.toLowerCase()).toBe('div');
    expect(element.className).toContain('sr-only');
  });

  it('3. forwards ref to the underlying element', () => {
    const hiddenRef = React.createRef<HTMLSpanElement>();
    render(<VisuallyHidden ref={hiddenRef}>Ref test</VisuallyHidden>);
    expect(hiddenRef.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('4. merges custom className', () => {
    render(
      <VisuallyHidden className="custom-sr-override" data-testid="hidden">
        Custom
      </VisuallyHidden>
    );
    const element = screen.getByTestId('hidden');
    expect(element.className).toContain('sr-only');
    expect(element.className).toContain('custom-sr-override');
  });
});
