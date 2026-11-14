/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import {
  Switch,
  SwitchLabel,
  SwitchDescription,
  SwitchThumb,
} from '../Switch';

afterEach(() => {
  cleanup();
});

describe('Switch Component Primitive', () => {
  it('1. renders basic switch button element', () => {
    render(<Switch aria-label="Basic switch" />);
    const sw = screen.getByRole('switch', { name: /basic switch/i });
    expect(sw).toBeTruthy();
    expect(sw.tagName).toBe('BUTTON');
  });

  it('2. emits correct switch role and button type', () => {
    render(<Switch aria-label="Notifications toggle" />);
    const sw = screen.getByRole('switch', { name: /notifications toggle/i });
    expect(sw.getAttribute('role')).toBe('switch');
    expect(sw.getAttribute('type')).toBe('button');
  });

  it('3. starts in unchecked state by default with aria-checked="false"', () => {
    render(<Switch aria-label="Unchecked by default" />);
    const sw = screen.getByRole('switch', { name: /unchecked by default/i });
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.getAttribute('data-state')).toBe('unchecked');
    const thumb = screen.getByTestId('switch-thumb');
    expect(thumb.getAttribute('data-state')).toBe('unchecked');
  });

  it('4. supports defaultChecked to start in checked state with aria-checked="true"', () => {
    render(<Switch defaultChecked aria-label="Checked by default" />);
    const sw = screen.getByRole('switch', { name: /checked by default/i });
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(sw.getAttribute('data-state')).toBe('checked');
    const thumb = screen.getByTestId('switch-thumb');
    expect(thumb.getAttribute('data-state')).toBe('checked');
  });

  it('5. operates as a controlled component with checked and onCheckedChange', async () => {
    const user = userEvent.setup();
    const Controlled = () => {
      const [checked, setChecked] = useState(false);
      return (
        <div>
          <Switch
            checked={checked}
            onCheckedChange={setChecked}
            aria-label="Controlled switch"
          />
          <button onClick={() => setChecked(true)}>External Turn On</button>
        </div>
      );
    };

    render(<Controlled />);
    const sw = screen.getByRole('switch', { name: /controlled switch/i });
    expect(sw.getAttribute('aria-checked')).toBe('false');

    await user.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('true');

    await user.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('false');

    await user.click(screen.getByRole('button', { name: /external turn on/i }));
    expect(sw.getAttribute('aria-checked')).toBe('true');
  });

  it('6. operates as an uncontrolled component managing its own state', async () => {
    const user = userEvent.setup();
    render(<Switch defaultChecked={false} aria-label="Uncontrolled switch" />);
    const sw = screen.getByRole('switch', { name: /uncontrolled switch/i });

    expect(sw.getAttribute('aria-checked')).toBe('false');
    await user.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(sw.getAttribute('data-state')).toBe('checked');
  });

  it('7. clicking unchecked switch toggles it ON', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Toggle ON test" />);
    const sw = screen.getByRole('switch', { name: /toggle on test/i });

    expect(sw.getAttribute('aria-checked')).toBe('false');
    await user.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(sw.getAttribute('data-state')).toBe('checked');
  });

  it('8. clicking checked switch toggles it OFF', async () => {
    const user = userEvent.setup();
    render(<Switch defaultChecked aria-label="Toggle OFF test" />);
    const sw = screen.getByRole('switch', { name: /toggle off test/i });

    expect(sw.getAttribute('aria-checked')).toBe('true');
    await user.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.getAttribute('data-state')).toBe('unchecked');
  });

  it('9. invokes onCheckedChange callback with the correct next boolean state', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();
    render(
      <Switch
        onCheckedChange={handleCheckedChange}
        aria-label="Callback verification"
      />
    );
    const sw = screen.getByRole('switch', { name: /callback verification/i });

    await user.click(sw);
    expect(handleCheckedChange).toHaveBeenCalledTimes(1);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);

    await user.click(sw);
    expect(handleCheckedChange).toHaveBeenCalledTimes(2);
    expect(handleCheckedChange).toHaveBeenCalledWith(false);
  });

  it('10. renders disabled switch with disabled attribute and data-disabled', () => {
    render(<Switch disabled aria-label="Disabled switch" />);
    const sw = screen.getByRole('switch', { name: /disabled switch/i });

    expect((sw as HTMLButtonElement).disabled).toBe(true);
    expect(sw.hasAttribute('disabled')).toBe(true);
    expect(sw.getAttribute('data-disabled')).toBe('');
    expect(sw.className).toContain('disabled:cursor-not-allowed');
    expect(sw.className).toContain('disabled:opacity-50');
  });

  it('11. prevents state changes when switch is disabled', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();
    render(
      <Switch
        disabled
        onCheckedChange={handleCheckedChange}
        aria-label="Disabled immutable"
      />
    );
    const sw = screen.getByRole('switch', { name: /disabled immutable/i });

    await user.click(sw);
    expect(handleCheckedChange).not.toHaveBeenCalled();
    expect(sw.getAttribute('aria-checked')).toBe('false');

    act(() => {
      sw.focus();
    });
    await user.keyboard(' ');
    expect(handleCheckedChange).not.toHaveBeenCalled();
    expect(sw.getAttribute('aria-checked')).toBe('false');
  });

  it('12. associates accessible label via SwitchLabel and toggles on label click', async () => {
    const user = userEvent.setup();
    render(
      <div className="flex items-center gap-3">
        <Switch id="anonymous-mode" />
        <SwitchLabel htmlFor="anonymous-mode">Allow anonymous submissions</SwitchLabel>
      </div>
    );

    const sw = screen.getByRole('switch', { name: /allow anonymous submissions/i });
    expect(sw).toBeTruthy();
    expect(sw.getAttribute('aria-checked')).toBe('false');

    const label = screen.getByText('Allow anonymous submissions');
    await user.click(label);

    expect(sw.getAttribute('aria-checked')).toBe('true');
  });

  it('13. supports accessible description via aria-describedby and SwitchDescription', () => {
    render(
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Switch id="notif-toggle" aria-describedby="notif-desc" />
          <SwitchLabel htmlFor="notif-toggle">Email Notifications</SwitchLabel>
        </div>
        <SwitchDescription id="notif-desc">
          Receive a daily digest of all new customer feedback responses.
        </SwitchDescription>
      </div>
    );

    const sw = screen.getByRole('switch', { name: /email notifications/i });
    expect(sw.getAttribute('aria-describedby')).toBe('notif-desc');

    const desc = screen.getByText(
      /receive a daily digest of all new customer feedback responses/i
    );
    expect(desc.id).toBe('notif-desc');
    expect(desc.className).toContain('text-content-secondary');
  });

  it('14. supports required semantics and error state validation', () => {
    const { rerender } = render(
      <Switch required aria-label="Consent toggle" />
    );
    const sw = screen.getByRole('switch', { name: /consent toggle/i });
    expect(sw.getAttribute('aria-required')).toBe('true');
    expect(sw.getAttribute('aria-invalid')).toBeNull();

    rerender(
      <Switch
        required
        error="You must enable this setting"
        aria-label="Consent toggle"
      />
    );
    expect(sw.getAttribute('aria-invalid')).toBe('true');
    expect(sw.className).toContain('border-semantic-error');
    expect(sw.className).toContain('focus-visible:ring-semantic-error');
  });

  it('15. renders hidden input with name and value for HTML form submission', () => {
    render(
      <form data-testid="settings-form">
        <Switch name="enableSurveys" value="active" defaultChecked />
      </form>
    );

    const form = screen.getByTestId('settings-form');
    const input = form.querySelector('input[name="enableSurveys"]') as HTMLInputElement;

    expect(input).toBeTruthy();
    expect(input.type).toBe('checkbox');
    expect(input.name).toBe('enableSurveys');
    expect(input.value).toBe('active');
    expect(input.checked).toBe(true);
  });

  it('16. merges custom classNames on Switch, SwitchLabel, and SwitchDescription', () => {
    render(
      <div>
        <Switch
          id="custom-sw"
          className="custom-switch-root"
          aria-label="Custom class"
        >
          <SwitchThumb className="custom-thumb" />
        </Switch>
        <SwitchLabel htmlFor="custom-sw" className="custom-label" disabled>
          Custom Label
        </SwitchLabel>
        <SwitchDescription className="custom-desc">
          Custom Description
        </SwitchDescription>
      </div>
    );

    const sw = screen.getByRole('switch', { name: /custom class/i });
    expect(sw.className).toContain('custom-switch-root');

    const thumb = screen.getByTestId('switch-thumb');
    expect(thumb.className).toContain('custom-thumb');

    const label = screen.getByText('Custom Label');
    expect(label.className).toContain('custom-label');
    expect(label.className).toContain('opacity-50');

    const desc = screen.getByText('Custom Description');
    expect(desc.className).toContain('custom-desc');
  });

  it('17. forwards refs to underlying DOM elements', () => {
    const switchRef = React.createRef<HTMLButtonElement>();
    const labelRef = React.createRef<HTMLLabelElement>();
    const descRef = React.createRef<HTMLParagraphElement>();

    render(
      <div>
        <Switch ref={switchRef} id="ref-sw" aria-label="Ref switch" />
        <SwitchLabel ref={labelRef} htmlFor="ref-sw">
          Ref Label
        </SwitchLabel>
        <SwitchDescription ref={descRef}>Ref Description</SwitchDescription>
      </div>
    );

    expect(switchRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(labelRef.current).toBeInstanceOf(HTMLLabelElement);
    expect(descRef.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it('18. toggles switch state using Space key via user-event', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Space key toggle" />);
    const sw = screen.getByRole('switch', { name: /space key toggle/i });

    act(() => {
      sw.focus();
    });
    expect(document.activeElement).toBe(sw);
    expect(sw.getAttribute('aria-checked')).toBe('false');

    await user.keyboard(' ');
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(sw.getAttribute('data-state')).toBe('checked');

    await user.keyboard(' ');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.getAttribute('data-state')).toBe('unchecked');
  });

  it('19. updates aria-checked and data-state attributes synchronously across interactions', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Interaction state test" />);
    const sw = screen.getByRole('switch', { name: /interaction state test/i });
    const thumb = screen.getByTestId('switch-thumb');

    // Initial unchecked
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.getAttribute('data-state')).toBe('unchecked');
    expect(thumb.getAttribute('data-state')).toBe('unchecked');

    // First click: checked
    await user.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(sw.getAttribute('data-state')).toBe('checked');
    expect(thumb.getAttribute('data-state')).toBe('checked');

    // Second click: unchecked
    await user.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.getAttribute('data-state')).toBe('unchecked');
    expect(thumb.getAttribute('data-state')).toBe('unchecked');
  });

  it('20. enforces focus-visible styling and design-token contracts without hardcoded slate colors', () => {
    render(<Switch data-testid="token-switch" aria-label="Token contract switch" />);
    const sw = screen.getByTestId('token-switch');
    const thumb = screen.getByTestId('switch-thumb');

    // Pill geometry and surfaces
    expect(sw.className).toContain('rounded-full');
    expect(sw.className).toContain('bg-surface-card');
    expect(sw.className).toContain('border-border');

    // Brand primary tokens for active state
    expect(sw.className).toContain('data-[state=checked]:bg-brand-primary');
    expect(sw.className).toContain('data-[state=checked]:border-brand-primary');

    // Focus ring token
    expect(sw.className).toContain('focus-visible:ring-brand-primary');
    expect(sw.className).toContain('focus-visible:ring-offset-2');

    // Disabled token styling
    expect(sw.className).toContain('disabled:cursor-not-allowed');
    expect(sw.className).toContain('disabled:opacity-50');

    // Thumb token styling
    expect(thumb.className).toContain('rounded-full');
    expect(thumb.className).toContain('data-[state=checked]:bg-white');
    expect(thumb.className).toContain('data-[state=unchecked]:bg-content-muted');
    expect(thumb.className).toContain('data-[state=checked]:translate-x-5');
    expect(thumb.className).toContain('data-[state=unchecked]:translate-x-0');

    // Strict absence of arbitrary hardcoded slate colors
    expect(sw.className).not.toContain('bg-slate-50');
    expect(sw.className).not.toContain('bg-slate-100');
    expect(sw.className).not.toContain('border-slate-300');
  });
});
