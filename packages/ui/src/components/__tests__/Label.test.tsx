/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { Label } from '../Label';

afterEach(() => {
  cleanup();
});

describe('Label Component Primitive', () => {
  it('1. renders label with text content', () => {
    render(<Label>Email Address</Label>);
    const label = screen.getByText('Email Address');
    expect(label).toBeTruthy();
  });

  it('2. associates with form control via htmlFor', () => {
    render(
      <div>
        <Label htmlFor="email-input">Work Email</Label>
        <input id="email-input" type="email" />
      </div>
    );
    const label = screen.getByText('Work Email').closest('label');
    expect(label).toBeTruthy();
    expect(label?.getAttribute('for')).toBe('email-input');
  });

  it('3. renders required indicator when required={true}', () => {
    render(<Label required>Password</Label>);
    const star = screen.getByText('*');
    expect(star).toBeTruthy();
    expect(star.getAttribute('aria-hidden')).toBe('true');
    expect(star.className).toContain('text-semantic-error');
  });

  it('4. does not render required indicator when required is false or undefined', () => {
    render(<Label>Bio</Label>);
    expect(screen.queryByText('*')).toBeNull();
  });

  it('5. forwards ref to label element', () => {
    const labelRef = React.createRef<HTMLLabelElement>();
    render(<Label ref={labelRef}>Full Name</Label>);
    expect(labelRef.current).toBeInstanceOf(HTMLLabelElement);
  });

  it('6. applies custom className and default styling', () => {
    render(<Label className="custom-label-style">Feedback</Label>);
    const label = screen.getByText('Feedback').closest('label');
    expect(label?.className).toContain('custom-label-style');
    expect(label?.className).toContain('text-content-main');
    expect(label?.className).toContain('peer-disabled:opacity-70');
  });
});
