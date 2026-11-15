/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
} from '../Toast';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Toast Component Primitive', () => {
  it('1. renders toast with title', () => {
    render(
      <ToastProvider>
        <Toast defaultOpen>
          <ToastTitle>Form Saved</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const title = screen.getByText('Form Saved');
    expect(title).toBeTruthy();
    expect(title.className).toContain('font-semibold');
    expect(title.className).toContain('text-content-main');
  });

  it('2. renders toast with description', () => {
    render(
      <ToastProvider>
        <Toast defaultOpen>
          <ToastDescription>All changes were saved to your tenant database.</ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const description = screen.getByText(/all changes were saved/i);
    expect(description).toBeTruthy();
    expect(description.className).toContain('text-content-secondary');
  });

  it('3. renders toast with both title and description', () => {
    render(
      <ToastProvider>
        <Toast defaultOpen>
          <ToastTitle>Response Submitted</ToastTitle>
          <ToastDescription>Thank you for submitting your feedback.</ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    expect(screen.getByText('Response Submitted')).toBeTruthy();
    expect(screen.getByText(/thank you for submitting your feedback/i)).toBeTruthy();
  });

  it('4. respects default duration behavior', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Toast defaultOpen>
          <ToastTitle>Default Duration Toast</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    // Toast is initially visible
    expect(screen.getByText('Default Duration Toast')).toBeTruthy();

    // Default duration is 5000ms; at 4000ms it should still be open
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText('Default Duration Toast')).toBeTruthy();

    // At 5500ms it should close
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.queryByText('Default Duration Toast')).toBeNull();
  });

  it('5. respects custom duration prop on individual Toast', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Toast defaultOpen duration={2000}>
          <ToastTitle>Quick Toast</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    expect(screen.getByText('Quick Toast')).toBeTruthy();

    // At 1500ms it is still visible
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText('Quick Toast')).toBeTruthy();

    // At 2500ms it has closed
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText('Quick Toast')).toBeNull();
  });

  it('6. toast closes automatically after its duration', () => {
    vi.useFakeTimers();
    const handleOpenChange = vi.fn();

    render(
      <ToastProvider>
        <Toast defaultOpen duration={1000} onOpenChange={handleOpenChange}>
          <ToastTitle>Expiring Toast</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    expect(screen.getByText('Expiring Toast')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(handleOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByText('Expiring Toast')).toBeNull();
  });

  it('7. supports controlled open state', () => {
    const ControlledHost = () => {
      const [open, setOpen] = useState(true);
      return (
        <ToastProvider>
          <button type="button" onClick={() => setOpen(false)}>
            Close External
          </button>
          <button type="button" onClick={() => setOpen(true)}>
            Open External
          </button>
          <Toast open={open} onOpenChange={setOpen}>
            <ToastTitle>Controlled Toast</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
    };

    render(<ControlledHost />);
    expect(screen.getByText('Controlled Toast')).toBeTruthy();

    // Click external close button
    const closeBtn = screen.getByRole('button', { name: /close external/i });
    act(() => {
      closeBtn.click();
    });
    expect(screen.queryByText('Controlled Toast')).toBeNull();

    // Click external open button
    const openBtn = screen.getByRole('button', { name: /open external/i });
    act(() => {
      openBtn.click();
    });
    expect(screen.getByText('Controlled Toast')).toBeTruthy();
  });

  it('8. supports uncontrolled open state with defaultOpen', () => {
    render(
      <ToastProvider>
        <Toast defaultOpen={true}>
          <ToastTitle>Uncontrolled Toast</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    expect(screen.getByText('Uncontrolled Toast')).toBeTruthy();
  });

  it('9. invokes onOpenChange callback when dismissed', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <Toast defaultOpen onOpenChange={handleOpenChange}>
          <ToastTitle>Callback Toast</ToastTitle>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const closeBtn = screen.getByRole('button', { name: /close/i });
    await user.click(closeBtn);

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('10. close button dismisses the toast and includes accessible label', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Toast defaultOpen>
          <ToastTitle>Dismissable Toast</ToastTitle>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeTruthy();
    expect(closeButton.getAttribute('aria-label')).toBe('Close');

    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Dismissable Toast')).toBeNull();
    });
  });

  it('11. ToastAction renders and executes callback upon click', async () => {
    const user = userEvent.setup();
    const handleUndo = vi.fn();

    render(
      <ToastProvider>
        <Toast defaultOpen>
          <ToastTitle>Form Deleted</ToastTitle>
          <ToastAction altText="Undo form deletion" onClick={handleUndo}>
            Undo
          </ToastAction>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const actionButton = screen.getByRole('button', { name: /undo/i });
    expect(actionButton).toBeTruthy();

    await user.click(actionButton);
    expect(handleUndo).toHaveBeenCalledTimes(1);
  });

  it('12. renders multiple toast notifications within the same viewport', () => {
    render(
      <ToastProvider>
        <Toast defaultOpen>
          <ToastTitle>Toast One</ToastTitle>
        </Toast>
        <Toast defaultOpen>
          <ToastTitle>Toast Two</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    expect(screen.getByText('Toast One')).toBeTruthy();
    expect(screen.getByText('Toast Two')).toBeTruthy();
  });

  it('13. supports ToastProvider configuration options', () => {
    render(
      <ToastProvider label="System Alerts" swipeDirection="left" duration={3000}>
        <Toast defaultOpen>
          <ToastTitle>Configured Provider Toast</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const toast = screen.getByText('Configured Provider Toast').closest('li');
    expect(toast).toBeTruthy();
    expect(toast?.getAttribute('data-swipe-direction')).toBe('left');
  });

  it('14. supports viewport positioning options', () => {
    const { rerender } = render(
      <ToastProvider>
        <Toast defaultOpen>
          <ToastTitle>Position Toast</ToastTitle>
        </Toast>
        <ToastViewport position="top-right" />
      </ToastProvider>
    );

    let viewport = screen.getByRole('list');
    expect(viewport.getAttribute('data-position')).toBe('top-right');
    expect(viewport.className).toContain('top-0 right-0');

    rerender(
      <ToastProvider>
        <Toast defaultOpen>
          <ToastTitle>Position Toast</ToastTitle>
        </Toast>
        <ToastViewport position="bottom-left" />
      </ToastProvider>
    );

    viewport = screen.getByRole('list');
    expect(viewport.getAttribute('data-position')).toBe('bottom-left');
    expect(viewport.className).toContain('bottom-0 left-0');
  });

  it('15. renders success, error, warning, and info visual variants correctly', () => {
    const { rerender } = render(
      <ToastProvider>
        <Toast defaultOpen variant="success">
          <ToastTitle>Success Toast</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    let toastItem = screen.getByText('Success Toast').closest('[data-variant]');
    expect(toastItem?.getAttribute('data-variant')).toBe('success');
    expect(toastItem?.className).toContain('border-l-semantic-success');

    // Error variant
    rerender(
      <ToastProvider>
        <Toast defaultOpen variant="error">
          <ToastTitle>Error Toast</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
    toastItem = screen.getByText('Error Toast').closest('[data-variant]');
    expect(toastItem?.getAttribute('data-variant')).toBe('error');
    expect(toastItem?.className).toContain('border-l-semantic-error');

    // Warning variant
    rerender(
      <ToastProvider>
        <Toast defaultOpen variant="warning">
          <ToastTitle>Warning Toast</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
    toastItem = screen.getByText('Warning Toast').closest('[data-variant]');
    expect(toastItem?.getAttribute('data-variant')).toBe('warning');
    expect(toastItem?.className).toContain('border-l-semantic-warning');

    // Info variant
    rerender(
      <ToastProvider>
        <Toast defaultOpen variant="info">
          <ToastTitle>Info Toast</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
    toastItem = screen.getByText('Info Toast').closest('[data-variant]');
    expect(toastItem?.getAttribute('data-variant')).toBe('info');
    expect(toastItem?.className).toContain('border-l-semantic-info');
  });

  it('16. merges custom class names and strictly respects FeedbackHub semantic tokens', () => {
    render(
      <ToastProvider>
        <Toast defaultOpen className="custom-toast-class">
          <ToastTitle className="custom-title-class">Token Test</ToastTitle>
          <ToastDescription className="custom-desc-class">Description Tokens</ToastDescription>
          <ToastClose className="custom-close-class" />
        </Toast>
        <ToastViewport className="custom-viewport-class" />
      </ToastProvider>
    );

    const toastItem = screen.getByText('Token Test').closest('[data-variant]');
    expect(toastItem?.className).toContain('custom-toast-class');
    expect(toastItem?.className).toContain('bg-surface-card');
    expect(toastItem?.className).toContain('border-border');
    expect(toastItem?.className).toContain('shadow-soft-lg');

    // Strict absence of hardcoded slate colors
    expect(toastItem?.className).not.toContain('bg-slate-50');
    expect(toastItem?.className).not.toContain('bg-slate-100');
    expect(toastItem?.className).not.toContain('text-slate-800');
    expect(toastItem?.className).not.toContain('border-slate-200');

    const title = screen.getByText('Token Test');
    expect(title.className).toContain('custom-title-class');

    const desc = screen.getByText('Description Tokens');
    expect(desc.className).toContain('custom-desc-class');

    const closeBtn = screen.getByRole('button', { name: /close/i });
    expect(closeBtn.className).toContain('custom-close-class');
  });

  it('17. forwards refs across Toast, ToastViewport, ToastTitle, ToastDescription, ToastAction, and ToastClose', () => {
    const toastRef = React.createRef<HTMLLIElement>();
    const viewportRef = React.createRef<HTMLOListElement>();
    const titleRef = React.createRef<HTMLDivElement>();
    const descRef = React.createRef<HTMLDivElement>();
    const actionRef = React.createRef<HTMLButtonElement>();
    const closeRef = React.createRef<HTMLButtonElement>();

    render(
      <ToastProvider>
        <Toast ref={toastRef} defaultOpen>
          <ToastTitle ref={titleRef}>Ref Title</ToastTitle>
          <ToastDescription ref={descRef}>Ref Desc</ToastDescription>
          <ToastAction ref={actionRef} altText="Ref Action">
            Action
          </ToastAction>
          <ToastClose ref={closeRef} />
        </Toast>
        <ToastViewport ref={viewportRef} />
      </ToastProvider>
    );

    expect(toastRef.current).toBeInstanceOf(HTMLLIElement);
    expect(viewportRef.current).toBeInstanceOf(HTMLOListElement);
    expect(titleRef.current).toBeInstanceOf(HTMLDivElement);
    expect(descRef.current).toBeInstanceOf(HTMLDivElement);
    expect(actionRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(closeRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('18. assigns appropriate live-region announcement roles based on urgency', async () => {
    // 1. Routine notifications (type="background", default for non-error variants)
    const { unmount } = render(
      <ToastProvider label="Feedback Notification">
        <Toast defaultOpen variant="success">
          <ToastTitle>Polite Announcement</ToastTitle>
          <ToastDescription>Routine feedback message</ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    // Toast root element is a standard <li> within the landmark <ol>
    const successToast = screen.getByText('Polite Announcement').closest('li');
    expect(successToast).toBeTruthy();
    expect(successToast?.getAttribute('data-variant')).toBe('success');
    // Ensure no conflicting role="alert" or role="status" is forced onto the <li>
    expect(successToast?.getAttribute('role')).toBeNull();

    // Radix manages out-of-band live regions via a dedicated portal element with role="status" and aria-live="polite"
    const politeAnnouncer = screen.getByRole('status');
    expect(politeAnnouncer).toBeTruthy();
    expect(politeAnnouncer.getAttribute('aria-live')).toBe('polite');

    // Wait for the announcement text to be rendered into the live region
    await waitFor(() => {
      expect(politeAnnouncer.textContent).toContain('Polite Announcement');
      expect(politeAnnouncer.textContent).toContain('Routine feedback message');
      expect(politeAnnouncer.textContent).toContain('Feedback Notification');
    });

    unmount();

    // 2. Urgent notifications (type="foreground", default for variant="error")
    render(
      <ToastProvider label="Urgent Alert">
        <Toast defaultOpen variant="error">
          <ToastTitle>Urgent Alert Title</ToastTitle>
          <ToastDescription>Critical network error</ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const errorToast = screen.getByText('Urgent Alert Title').closest('li');
    expect(errorToast).toBeTruthy();
    expect(errorToast?.getAttribute('data-variant')).toBe('error');
    // Ensure toast root <li> does not have conflicting role="alert"
    expect(errorToast?.getAttribute('role')).toBeNull();

    // Urgent notification uses assertive announcement via role="status" and aria-live="assertive"
    const assertiveAnnouncer = document.querySelector('[aria-live="assertive"]');
    expect(assertiveAnnouncer).toBeTruthy();
    expect(assertiveAnnouncer?.getAttribute('role')).toBe('status');

    await waitFor(() => {
      expect(assertiveAnnouncer?.textContent).toContain('Urgent Alert Title');
      expect(assertiveAnnouncer?.textContent).toContain('Critical network error');
    });
  });

  it('19. supports keyboard navigation and interaction', async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();

    render(
      <ToastProvider>
        <Toast defaultOpen>
          <ToastTitle>Keyboard Nav</ToastTitle>
          <ToastAction altText="Perform Action" onClick={handleAction}>
            Retry
          </ToastAction>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const actionButton = screen.getByRole('button', { name: /retry/i });
    const closeButton = screen.getByRole('button', { name: /close/i });

    // Focus action button via keyboard
    act(() => {
      actionButton.focus();
    });
    expect(document.activeElement).toBe(actionButton);

    // Tab moves focus between interactive toast elements
    await user.tab();
    expect(document.activeElement).toBe(closeButton);

    // Shift-Tab returns focus to action button
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(actionButton);

    // Enter activates action
    await user.keyboard('{Enter}');
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('20. applies reduced-motion and smooth transition classes to Toast and controls', () => {
    render(
      <ToastProvider>
        <Toast defaultOpen>
          <ToastTitle>Motion Test</ToastTitle>
          <ToastAction altText="Action test">Action</ToastAction>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const toast = screen.getByText('Motion Test').closest('[data-variant]');
    expect(toast?.className).toContain('transition-smooth');
    expect(toast?.className).toContain('motion-reduce:transition-none');
    expect(toast?.className).toContain('motion-reduce:transform-none');

    const actionBtn = screen.getByRole('button', { name: /action/i });
    expect(actionBtn.className).toContain('transition-smooth');
    expect(actionBtn.className).toContain('motion-reduce:transition-none');

    const closeBtn = screen.getByRole('button', { name: /close/i });
    expect(closeBtn.className).toContain('transition-smooth');
    expect(closeBtn.className).toContain('motion-reduce:transition-none');
  });

  it('21. supports all horizontal and vertical swipe movement classes and direction configurations', () => {
    const { rerender } = render(
      <ToastProvider swipeDirection="right">
        <Toast defaultOpen>
          <ToastTitle>Swipe Right</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const toast = screen.getByText('Swipe Right').closest('li');
    expect(toast).toBeTruthy();
    expect(toast?.getAttribute('data-swipe-direction')).toBe('right');

    // Verify horizontal and vertical swipe classes are configured on Toast root
    expect(toast?.className).toContain('data-[swipe=cancel]:translate-x-0');
    expect(toast?.className).toContain('data-[swipe=cancel]:translate-y-0');
    expect(toast?.className).toContain(
      'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]'
    );
    expect(toast?.className).toContain(
      'data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-y)]'
    );
    expect(toast?.className).toContain(
      'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]'
    );
    expect(toast?.className).toContain(
      'data-[swipe=end]:translate-y-[var(--radix-toast-swipe-end-y)]'
    );
    expect(toast?.className).toContain('data-[swipe=cancel]:transition-[transform_200ms_ease-out]');

    // Verify provider swipeDirection accepts all 4 directions without being overridden
    const directions: Array<'right' | 'left' | 'up' | 'down'> = ['left', 'up', 'down'];
    for (const dir of directions) {
      rerender(
        <ToastProvider swipeDirection={dir}>
          <Toast defaultOpen>
            <ToastTitle>Swipe {dir}</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      const updatedToast = screen.getByText(`Swipe ${dir}`).closest('li');
      expect(updatedToast?.getAttribute('data-swipe-direction')).toBe(dir);
    }
  });
});
