/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
  AlertClose,
  type AlertVariant,
} from '../Alert';

afterEach(() => {
  cleanup();
});

describe('Alert Component Primitive', () => {
  it('1. renders alert with default variant and default status role', () => {
    render(
      <Alert>
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>General system notification.</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole('status');
    expect(alert).toBeTruthy();
    expect(alert.className).toContain('rounded-xl');
    expect(alert.className).toContain('bg-surface-card');
    expect(alert.className).toContain('border-border');
    expect(alert.className).toContain('text-content-main');
  });

  it('2. renders all five variants with appropriate semantic border and accent styles', () => {
    const variants: AlertVariant[] = ['default', 'success', 'error', 'warning', 'info'];

    for (const variant of variants) {
      const { unmount } = render(
        <Alert variant={variant} data-testid={`alert-${variant}`}>
          <AlertTitle>{variant} alert</AlertTitle>
        </Alert>
      );

      const alert = screen.getByTestId(`alert-${variant}`);
      expect(alert).toBeTruthy();
      expect(alert.className).toContain('rounded-xl');

      if (variant === 'default') {
        expect(alert.className).toContain('border-border');
      } else {
        expect(alert.className).toContain(`border-l-semantic-${variant}`);
      }

      unmount();
    }
  });

  it('3. assigns role="alert" automatically for urgent error variant', () => {
    render(
      <Alert variant="error">
        <AlertTitle>Error Alert</AlertTitle>
        <AlertDescription>Failed to process transaction.</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('4. assigns role="status" automatically for non-error variants', () => {
    const nonErrorVariants: AlertVariant[] = ['default', 'success', 'warning', 'info'];

    for (const variant of nonErrorVariants) {
      const { unmount } = render(
        <Alert variant={variant} data-testid={`alert-${variant}`}>
          <AlertTitle>{variant} Status</AlertTitle>
        </Alert>
      );

      const alert = screen.getByRole('status');
      expect(alert).toBeTruthy();
      expect(screen.queryByRole('alert')).toBeNull();

      unmount();
    }
  });

  it('5. allows overriding semantic role explicitly', () => {
    render(
      <Alert role="region" aria-label="Subscription Summary">
        <AlertTitle>Custom Role Alert</AlertTitle>
      </Alert>
    );

    const alert = screen.getByRole('region', { name: /subscription summary/i });
    expect(alert).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('6. renders AlertTitle with default h5 element and typography tokens', () => {
    render(
      <Alert>
        <AlertTitle>Survey Published</AlertTitle>
      </Alert>
    );

    const title = screen.getByRole('heading', { level: 5 });
    expect(title).toBeTruthy();
    expect(title.tagName).toBe('H5');
    expect(title.textContent).toBe('Survey Published');
    expect(title.className).toContain('font-semibold');
    expect(title.className).toContain('text-content-main');
  });

  it('7. renders AlertTitle with custom heading element via as prop', () => {
    render(
      <Alert>
        <AlertTitle as="h2">Important Announcement</AlertTitle>
      </Alert>
    );

    const title = screen.getByRole('heading', { level: 2 });
    expect(title).toBeTruthy();
    expect(title.tagName).toBe('H2');
  });

  it('8. renders AlertDescription with secondary contrast tokens and comfortable reading height', () => {
    render(
      <Alert>
        <AlertTitle>Export Ready</AlertTitle>
        <AlertDescription>Your CSV export has been generated and is ready to download.</AlertDescription>
      </Alert>
    );

    const desc = screen.getByText(/your csv export has been generated/i);
    expect(desc).toBeTruthy();
    expect(desc.tagName).toBe('P');
    expect(desc.className).toContain('text-content-secondary');
    expect(desc.className).toContain('leading-relaxed');
  });

  it('9. renders optional leading icon with correct variant token colors', () => {
    const iconElement = <span data-testid="test-icon">★</span>;

    const { rerender } = render(
      <Alert variant="success" icon={iconElement}>
        <AlertTitle>Success with Icon</AlertTitle>
      </Alert>
    );

    const iconWrapper = screen.getByTestId('test-icon').parentElement;
    expect(iconWrapper?.className).toContain('text-semantic-success');
    expect(iconWrapper?.className).toContain('shrink-0');

    rerender(
      <Alert variant="error" icon={iconElement}>
        <AlertTitle>Error with Icon</AlertTitle>
      </Alert>
    );

    expect(iconWrapper?.className).toContain('text-semantic-error');
  });

  it('10. marks decorative icons as aria-hidden="true"', () => {
    const decorativeSvg = (
      <svg data-testid="decorative-svg" viewBox="0 0 20 20">
        <path d="M0 0h20v20H0z" />
      </svg>
    );

    render(
      <Alert icon={decorativeSvg}>
        <AlertTitle>Decorative Icon Alert</AlertTitle>
      </Alert>
    );

    const wrapper = screen.getByTestId('decorative-svg').parentElement;
    expect(wrapper?.getAttribute('aria-hidden')).toBe('true');
  });

  it('11. preserves accessibility for informative icons with accessible names', () => {
    const informativeIcon = (
      <span role="img" aria-label="Critical warning icon" data-testid="informative-icon">
        ⚠️
      </span>
    );

    render(
      <Alert icon={informativeIcon}>
        <AlertTitle>Informative Icon Alert</AlertTitle>
      </Alert>
    );

    const wrapper = screen.getByTestId('informative-icon').parentElement;
    expect(wrapper?.getAttribute('aria-hidden')).toBeNull();
    expect(screen.getByLabelText('Critical warning icon')).toBeTruthy();
  });

  it('12. supports dismissible behavior via onClose prop and renders AlertClose', () => {
    const handleClose = vi.fn();

    render(
      <Alert onClose={handleClose}>
        <AlertTitle>Dismissible Alert</AlertTitle>
      </Alert>
    );

    const closeBtn = screen.getByRole('button', { name: /dismiss alert/i });
    expect(closeBtn).toBeTruthy();
  });

  it('13. invokes onClose callback when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <Alert onClose={handleClose}>
        <AlertTitle>Click Close Test</AlertTitle>
      </Alert>
    );

    const closeBtn = screen.getByRole('button', { name: /dismiss alert/i });
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('14. supports custom accessible label on dismiss button', () => {
    render(
      <Alert onClose={vi.fn()} closeLabel="Close billing notice">
        <AlertTitle>Custom Close Label</AlertTitle>
      </Alert>
    );

    expect(screen.getByRole('button', { name: 'Close billing notice' })).toBeTruthy();
  });

  it('15. supports standalone AlertClose component composed within alert', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <Alert>
        <AlertTitle>Composed Close</AlertTitle>
        <AlertClose onClick={handleClose} aria-label="Dismiss custom" />
      </Alert>
    );

    const closeBtn = screen.getByRole('button', { name: 'Dismiss custom' });
    expect(closeBtn).toBeTruthy();

    await user.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('16. renders AlertAction as a button and handles click interaction', async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();

    render(
      <Alert>
        <AlertTitle>Connection Dropped</AlertTitle>
        <AlertAction onClick={handleRetry}>Retry Connection</AlertAction>
      </Alert>
    );

    const actionBtn = screen.getByRole('button', { name: /retry connection/i });
    expect(actionBtn).toBeTruthy();
    expect(actionBtn.tagName).toBe('BUTTON');

    await user.click(actionBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('17. renders AlertAction as an anchor link when as="a" is supplied', () => {
    render(
      <Alert>
        <AlertTitle>Quota Exceeded</AlertTitle>
        <AlertAction as="a" href="/billing/upgrade">
          Upgrade Plan
        </AlertAction>
      </Alert>
    );

    const link = screen.getByRole('link', { name: /upgrade plan/i });
    expect(link).toBeTruthy();
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/billing/upgrade');
  });

  it('18. supports full keyboard activation (Enter, Space) on AlertAction and AlertClose', async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();
    const handleClose = vi.fn();

    render(
      <Alert onClose={handleClose}>
        <AlertTitle>Keyboard Alert</AlertTitle>
        <AlertAction onClick={handleAction}>Action</AlertAction>
      </Alert>
    );

    const actionBtn = screen.getByRole('button', { name: /action/i });
    const closeBtn = screen.getByRole('button', { name: /dismiss alert/i });

    // Focus action button and press Enter
    act(() => {
      actionBtn.focus();
    });
    expect(document.activeElement).toBe(actionBtn);

    await user.keyboard('{Enter}');
    expect(handleAction).toHaveBeenCalledTimes(1);

    // Focus close button and press Space
    act(() => {
      closeBtn.focus();
    });
    expect(document.activeElement).toBe(closeBtn);

    await user.keyboard(' ');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('19. verifies focus visibility indicators on interactive controls', () => {
    render(
      <Alert onClose={vi.fn()}>
        <AlertTitle>Focus Ring Test</AlertTitle>
        <AlertAction>Action Focus</AlertAction>
      </Alert>
    );

    const actionBtn = screen.getByRole('button', { name: /action focus/i });
    expect(actionBtn.className).toContain('focus-visible:ring-2');
    expect(actionBtn.className).toContain('focus-visible:ring-brand-primary');

    const closeBtn = screen.getByRole('button', { name: /dismiss alert/i });
    expect(closeBtn.className).toContain('focus-visible:ring-2');
    expect(closeBtn.className).toContain('focus-visible:ring-brand-primary');
  });

  it('20. applies reduced-motion utility classes to Alert container, action, and close controls', () => {
    render(
      <Alert onClose={vi.fn()} data-testid="motion-alert">
        <AlertTitle>Reduced Motion</AlertTitle>
        <AlertAction>Action</AlertAction>
      </Alert>
    );

    const alert = screen.getByTestId('motion-alert');
    expect(alert.className).toContain('motion-reduce:transition-none');

    const actionBtn = screen.getByRole('button', { name: /action/i });
    expect(actionBtn.className).toContain('motion-reduce:transition-none');

    const closeBtn = screen.getByRole('button', { name: /dismiss alert/i });
    expect(closeBtn.className).toContain('motion-reduce:transition-none');
  });

  it('21. merges custom class names and strictly respects FeedbackHub design tokens', () => {
    render(
      <Alert
        className="custom-alert-class"
        data-testid="token-alert"
        onClose={vi.fn()}
      >
        <AlertTitle className="custom-title-class">Custom Title</AlertTitle>
        <AlertDescription className="custom-desc-class">Custom Desc</AlertDescription>
        <AlertAction className="custom-action-class">Action</AlertAction>
      </Alert>
    );

    const alert = screen.getByTestId('token-alert');
    expect(alert.className).toContain('custom-alert-class');
    expect(alert.className).toContain('rounded-xl');

    const title = screen.getByRole('heading', { level: 5 });
    expect(title.className).toContain('custom-title-class');

    const desc = screen.getByText('Custom Desc');
    expect(desc.className).toContain('custom-desc-class');

    const actionBtn = screen.getByRole('button', { name: /action/i });
    expect(actionBtn.className).toContain('custom-action-class');
  });

  it('22. forwards refs across Alert, AlertTitle, AlertDescription, AlertAction, and AlertClose', () => {
    const alertRef = React.createRef<HTMLDivElement>();
    const titleRef = React.createRef<HTMLHeadingElement>();
    const descRef = React.createRef<HTMLParagraphElement>();
    const actionRef = React.createRef<HTMLButtonElement>();
    const closeRef = React.createRef<HTMLButtonElement>();

    render(
      <Alert ref={alertRef}>
        <AlertTitle ref={titleRef}>Ref Title</AlertTitle>
        <AlertDescription ref={descRef}>Ref Desc</AlertDescription>
        <AlertAction ref={actionRef}>Ref Action</AlertAction>
        <AlertClose ref={closeRef} />
      </Alert>
    );

    expect(alertRef.current).toBeInstanceOf(HTMLDivElement);
    expect(titleRef.current).toBeInstanceOf(HTMLHeadingElement);
    expect(descRef.current).toBeInstanceOf(HTMLParagraphElement);
    expect(actionRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(closeRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('23. forwards standard HTML and ARIA attributes (id, data-testid, aria-describedby, etc.)', () => {
    render(
      <Alert
        id="system-alert-banner"
        data-testid="banner-alert"
        aria-describedby="alert-description-id"
      >
        <AlertTitle>Banner</AlertTitle>
        <AlertDescription id="alert-description-id">Banner Details</AlertDescription>
      </Alert>
    );

    const alert = screen.getByTestId('banner-alert');
    expect(alert.getAttribute('id')).toBe('system-alert-banner');
    expect(alert.getAttribute('aria-describedby')).toBe('alert-description-id');
  });

  it('24. applies responsive layout classes supporting mobile-friendly wrapping', () => {
    render(
      <Alert
        data-testid="responsive-alert"
        action={<AlertAction>Action</AlertAction>}
        onClose={vi.fn()}
      >
        <AlertTitle>Responsive Title</AlertTitle>
        <AlertDescription>Responsive Content</AlertDescription>
      </Alert>
    );

    const alert = screen.getByTestId('responsive-alert');
    expect(alert.className).toContain('flex');
    expect(alert.className).toContain('w-full');
    expect(alert.className).toContain('items-start');
    expect(alert.className).toContain('gap-3');
  });

  it('25. correctly renders as "div" and forwards HTMLDivElement ref', () => {
    const divRef = React.createRef<HTMLDivElement>();

    render(
      <Alert>
        <AlertTitle as="div" ref={divRef} className="custom-div-title" id="div-title-id">
          Div Title Content
        </AlertTitle>
      </Alert>
    );

    const element = screen.getByText('Div Title Content');
    expect(element.tagName.toLowerCase()).toBe('div');
    expect(divRef.current).toBeInstanceOf(HTMLDivElement);
    expect(divRef.current).toBe(element);
    expect(element.getAttribute('id')).toBe('div-title-id');
    expect(element.className).toContain('custom-div-title');
  });

  it('26. correctly renders as "h2" and forwards HTMLHeadingElement ref with heading-specific attributes', () => {
    const h2Ref = React.createRef<HTMLHeadingElement>();

    render(
      <Alert>
        <AlertTitle as="h2" ref={h2Ref} className="custom-h2-title" aria-level={2}>
          Heading 2 Title Content
        </AlertTitle>
      </Alert>
    );

    const element = screen.getByRole('heading', { level: 2 });
    expect(element.tagName.toLowerCase()).toBe('h2');
    expect(h2Ref.current).toBeInstanceOf(HTMLHeadingElement);
    expect(h2Ref.current).toBe(element);
    expect(element.className).toContain('custom-h2-title');
  });

  it('27. enforces polymorphic element and ref types at compile time and rejects invalid combinations', () => {
    const headingRef = React.createRef<HTMLHeadingElement>();
    const divRef = React.createRef<HTMLDivElement>();
    const pRef = React.createRef<HTMLParagraphElement>();
    const buttonRef = React.createRef<HTMLButtonElement>();

    // Valid ref assignments and element attributes (must compile cleanly)
    const validDefault = <AlertTitle ref={headingRef}>Valid Default H5</AlertTitle>;
    const validH2 = <AlertTitle as="h2" ref={headingRef}>Valid H2</AlertTitle>;
    const validDiv = <AlertTitle as="div" ref={divRef}>Valid Div</AlertTitle>;
    const validP = <AlertTitle as="p" ref={pRef}>Valid P</AlertTitle>;

    expect(validDefault).toBeTruthy();
    expect(validH2).toBeTruthy();
    expect(validDiv).toBeTruthy();
    expect(validP).toBeTruthy();

    // Invalid ref assignments (must trigger compile-time type errors)
    // @ts-expect-error - HTMLButtonElement ref is invalid for default H5 heading
    const invalidDefaultWithButton = <AlertTitle ref={buttonRef}>Invalid</AlertTitle>;

    // @ts-expect-error - HTMLButtonElement ref is invalid for H2 heading
    const invalidH2WithButton = <AlertTitle as="h2" ref={buttonRef}>Invalid</AlertTitle>;

    // @ts-expect-error - HTMLButtonElement ref is invalid when as="div"
    const invalidDivWithButton = <AlertTitle as="div" ref={buttonRef}>Invalid</AlertTitle>;

    // @ts-expect-error - HTMLButtonElement ref is invalid when as="p"
    const invalidPWithButton = <AlertTitle as="p" ref={buttonRef}>Invalid</AlertTitle>;

    // Invalid element-specific attributes / combinations
    // @ts-expect-error - 'href' is not a valid attribute on h2 heading
    const invalidHrefOnHeading = <AlertTitle as="h2" href="https://feedbackhub.com">Invalid</AlertTitle>;

    // @ts-expect-error - 'disabled' is not a valid attribute on div
    const invalidDisabledOnDiv = <AlertTitle as="div" disabled={true}>Invalid</AlertTitle>;

    // @ts-expect-error - 'as="button"' is not an allowed AlertTitleElement
    const invalidButtonElement = <AlertTitle as="button">Invalid</AlertTitle>;

    expect(invalidDefaultWithButton).toBeTruthy();
    expect(invalidH2WithButton).toBeTruthy();
    expect(invalidDivWithButton).toBeTruthy();
    expect(invalidPWithButton).toBeTruthy();
    expect(invalidHrefOnHeading).toBeTruthy();
    expect(invalidDisabledOnDiv).toBeTruthy();
    expect(invalidButtonElement).toBeTruthy();
  });
});
