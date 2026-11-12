/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import React, { useState } from 'react';
import { Checkbox, type CheckedState } from '../Checkbox';

afterEach(() => {
  cleanup();
});

describe('Checkbox Component Primitive', () => {
  it('1. renders the basic checkbox element with role="checkbox"', () => {
    render(<Checkbox aria-label="Subscribe to newsletter" />);
    const checkbox = screen.getByRole('checkbox', { name: /subscribe to newsletter/i });
    expect(checkbox).toBeTruthy();
    expect(checkbox.tagName).toBe('BUTTON');
    expect(checkbox.getAttribute('type')).toBe('button');
  });

  it('2. renders unchecked initial state by default', () => {
    render(<Checkbox aria-label="Terms of service" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('aria-checked')).toBe('false');
    expect(checkbox.getAttribute('data-state')).toBe('unchecked');
    expect(screen.queryByTestId('checkbox-check-icon')).toBeNull();
    expect(screen.queryByTestId('checkbox-indeterminate-icon')).toBeNull();
  });

  it('3. renders controlled checked state correctly', () => {
    const Controlled = () => {
      const [checked, setChecked] = useState<CheckedState>(true);
      return (
        <Checkbox
          aria-label="Controlled Checkbox"
          checked={checked}
          onCheckedChange={setChecked}
        />
      );
    };

    render(<Controlled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
    expect(checkbox.getAttribute('data-state')).toBe('checked');
    expect(screen.getByTestId('checkbox-check-icon')).toBeTruthy();
  });

  it('4. supports uncontrolled initial state using defaultChecked', () => {
    render(<Checkbox aria-label="Default Checked" defaultChecked={true} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
    expect(checkbox.getAttribute('data-state')).toBe('checked');
    expect(screen.getByTestId('checkbox-check-icon')).toBeTruthy();
  });

  it('5. clicking an unchecked checkbox toggles it to checked', () => {
    const handleCheckedChange = vi.fn();
    render(
      <Checkbox
        aria-label="Click to check"
        onCheckedChange={handleCheckedChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('aria-checked')).toBe('false');

    act(() => {
      fireEvent.click(checkbox);
    });

    expect(checkbox.getAttribute('aria-checked')).toBe('true');
    expect(checkbox.getAttribute('data-state')).toBe('checked');
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('checkbox-check-icon')).toBeTruthy();
  });

  it('6. clicking a checked checkbox toggles it to unchecked', () => {
    const handleCheckedChange = vi.fn();
    render(
      <Checkbox
        aria-label="Click to uncheck"
        defaultChecked={true}
        onCheckedChange={handleCheckedChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('aria-checked')).toBe('true');

    act(() => {
      fireEvent.click(checkbox);
    });

    expect(checkbox.getAttribute('aria-checked')).toBe('false');
    expect(checkbox.getAttribute('data-state')).toBe('unchecked');
    expect(handleCheckedChange).toHaveBeenCalledWith(false);
    expect(screen.queryByTestId('checkbox-check-icon')).toBeNull();
  });

  it('7. supports keyboard operation using Space key', () => {
    const handleCheckedChange = vi.fn();
    render(
      <Checkbox
        aria-label="Keyboard Space Checkbox"
        onCheckedChange={handleCheckedChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    checkbox.focus();
    expect(document.activeElement).toBe(checkbox);

    // Press Space key to toggle
    act(() => {
      fireEvent.keyDown(checkbox, { key: ' ', code: 'Space' });
      fireEvent.click(checkbox);
    });

    expect(checkbox.getAttribute('aria-checked')).toBe('true');
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it('8. disabled state prevents state changes and clicks', () => {
    const handleCheckedChange = vi.fn();
    render(
      <Checkbox
        disabled
        aria-label="Disabled Checkbox"
        onCheckedChange={handleCheckedChange}
      />
    );

    const checkbox = screen.getByRole('checkbox') as HTMLButtonElement;
    expect(checkbox.disabled).toBe(true);
    expect(checkbox.getAttribute('data-disabled')).toBe('');
    expect(checkbox.className).toContain('disabled:cursor-not-allowed');
    expect(checkbox.className).toContain('disabled:opacity-50');

    act(() => {
      fireEvent.click(checkbox);
    });

    expect(handleCheckedChange).not.toHaveBeenCalled();
    expect(checkbox.getAttribute('aria-checked')).toBe('false');
  });

  it('9. supports indeterminate state with aria-checked="mixed" and dash indicator', () => {
    render(<Checkbox aria-label="Select All Items" checked="indeterminate" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('aria-checked')).toBe('mixed');
    expect(checkbox.getAttribute('data-state')).toBe('indeterminate');
    expect(screen.getByTestId('checkbox-indeterminate-icon')).toBeTruthy();
    expect(screen.queryByTestId('checkbox-check-icon')).toBeNull();
  });

  it('10. applies required attribute and aria-required semantics', () => {
    render(<Checkbox required aria-label="Mandatory Consent" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('aria-required')).toBe('true');
  });

  it('11. connects with an accessible external label via htmlFor/id', () => {
    render(
      <div>
        <Checkbox id="terms-consent" />
        <label htmlFor="terms-consent">I agree to the privacy policy</label>
      </div>
    );

    const checkbox = screen.getByRole('checkbox', {
      name: /i agree to the privacy policy/i,
    });
    expect(checkbox).toBeTruthy();
    expect(checkbox.getAttribute('id')).toBe('terms-consent');
  });

  it('12. connects with accessible descriptions via aria-describedby', () => {
    render(
      <div>
        <Checkbox
          aria-label="Marketing emails"
          aria-describedby="marketing-helptext"
        />
        <p id="marketing-helptext">We send at most one summary per week</p>
      </div>
    );

    const checkbox = screen.getByRole('checkbox', { name: /marketing emails/i });
    expect(checkbox.getAttribute('aria-describedby')).toBe('marketing-helptext');
  });

  it('13. applies custom className seamlessly via cn', () => {
    render(
      <Checkbox
        aria-label="Custom Style"
        className="my-custom-checkbox-class scale-125"
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.className).toContain('my-custom-checkbox-class');
    expect(checkbox.className).toContain('scale-125');
    // Ensure base classes are preserved
    expect(checkbox.className).toContain('rounded-[5px]');
    expect(checkbox.className).toContain('border-border');
  });

  it('14. forwards React refs to the underlying HTMLButtonElement', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Checkbox ref={ref} aria-label="Ref target" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.getAttribute('role')).toBe('checkbox');
  });

  it('15. callback receives the correct checked boolean on change', () => {
    const handleCheckedChange = vi.fn();
    render(
      <Checkbox
        aria-label="Feedback Notification"
        onCheckedChange={handleCheckedChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');

    act(() => {
      fireEvent.click(checkbox);
    });
    expect(handleCheckedChange).toHaveBeenLastCalledWith(true);

    act(() => {
      fireEvent.click(checkbox);
    });
    expect(handleCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it('16. supports form integration with name and value attributes', () => {
    render(
      <form data-testid="survey-form">
        <Checkbox
          name="feedbackConsent"
          value="consented"
          defaultChecked={true}
          aria-label="Consent"
        />
      </form>
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeTruthy();

    // Radix mounts an input[type="checkbox"] for form serialization
    const form = screen.getByTestId('survey-form');
    const input = form.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.name).toBe('feedbackConsent');
    expect(input.value).toBe('consented');
    expect(input.checked).toBe(true);
  });

  it('17. enforces focus-visible class contract with semantic focus ring token', () => {
    render(<Checkbox aria-label="Focus Contract Checkbox" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.className).toContain('focus-visible:ring-2');
    expect(checkbox.className).toContain('focus-visible:ring-brand-primary');
    expect(checkbox.className).toContain('focus-visible:ring-offset-1');
  });

  it('18. supports error state and reflects aria-invalid', () => {
    render(
      <Checkbox
        aria-label="Error Checkbox"
        error="This agreement is mandatory"
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('aria-invalid')).toBe('true');
    expect(checkbox.className).toContain('border-semantic-error');
    expect(checkbox.className).toContain('focus-visible:ring-semantic-error');
  });

  it('19. transitions from indeterminate to checked when clicked by user', () => {
    const handleCheckedChange = vi.fn();
    render(
      <Checkbox
        aria-label="Parent Category Checkbox"
        defaultChecked="indeterminate"
        onCheckedChange={handleCheckedChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('data-state')).toBe('indeterminate');

    act(() => {
      fireEvent.click(checkbox);
    });

    expect(checkbox.getAttribute('data-state')).toBe('checked');
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('checkbox-check-icon')).toBeTruthy();
  });

  it('20. strictly adheres to FeedbackHub design tokens without arbitrary slate colors', () => {
    render(
      <Checkbox
        disabled
        aria-label="Design Token Checkbox"
        data-testid="token-checkbox"
      />
    );

    const checkbox = screen.getByTestId('token-checkbox');
    // Design system tokens
    expect(checkbox.className).toContain('bg-surface-card');
    expect(checkbox.className).toContain('border-border');
    expect(checkbox.className).toContain('data-[state=checked]:bg-brand-primary');
    expect(checkbox.className).toContain('focus-visible:ring-brand-primary');
    // Neutral transparent disabled state
    expect(checkbox.className).toContain('disabled:bg-transparent');
    expect(checkbox.className).not.toContain('disabled:bg-slate-50');
    expect(checkbox.className).not.toContain('bg-slate-100');
  });
});
