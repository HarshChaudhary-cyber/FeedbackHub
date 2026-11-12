/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { Input } from '../Input';

afterEach(() => {
  cleanup();
});

describe('Input Primitive', () => {
  it('renders input with accessible label and links htmlFor to id', () => {
    render(<Input label="Company Email" name="email" type="email" placeholder="you@company.com" />);
    
    const input = screen.getByLabelText(/company email/i) as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe('email');
    expect(input.placeholder).toBe('you@company.com');
    expect(input.className).toContain('rounded-[14px]');
  });

  it('handles user typing and value change events', () => {
    const handleChange = vi.fn();
    render(<Input label="Username" onChange={handleChange} />);
    
    const input = screen.getByLabelText(/username/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'johndoe' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('johndoe');
  });

  it('enforces disabled state and applies disabled styling', () => {
    render(<Input label="Disabled Field" disabled defaultValue="Fixed value" />);
    
    const input = screen.getByLabelText(/disabled field/i) as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.className).toContain('cursor-not-allowed');
  });

  it('renders error state with aria-invalid, alert role, and aria-describedby', () => {
    render(
      <Input
        label="Password"
        name="password"
        type="password"
        error="Password must be at least 8 characters long"
      />
    );

    const input = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.className).toContain('border-semantic-error');

    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toBeTruthy();
    expect(errorMessage.textContent).toBe('Password must be at least 8 characters long');
    expect(input.getAttribute('aria-describedby')).toContain(errorMessage.id);
  });

  it('renders helper text when no error is present', () => {
    render(
      <Input
        label="Portal Subdomain"
        name="subdomain"
        helperText="This will be your portal address: name.feedbackhub.com"
      />
    );

    const helper = screen.getByText(/this will be your portal address/i);
    expect(helper).toBeTruthy();

    const input = screen.getByLabelText(/portal subdomain/i);
    expect(input.getAttribute('aria-describedby')).toContain(helper.id);
  });

  it('renders leading and trailing icon slots', () => {
    render(
      <Input
        label="Search"
        leftIcon={<span data-testid="search-icon">🔍</span>}
        rightIcon={<span data-testid="clear-icon">✖</span>}
      />
    );

    expect(screen.getByTestId('search-icon')).toBeTruthy();
    expect(screen.getByTestId('clear-icon')).toBeTruthy();
  });

  it('forwards ref properly to HTMLInputElement', () => {
    const inputRef = React.createRef<HTMLInputElement>();
    render(<Input label="Ref Input" ref={inputRef} />);
    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
  });
});
