/** @vitest-environment jsdom */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../Dialog';
import { Button } from '../Button';

afterEach(() => {
  cleanup();
});

describe('Dialog / Modal Component Primitive', () => {
  it('1. opens dialog content when trigger is activated', () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open Feedback Modal</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Feedback</DialogTitle>
            <DialogDescription>Let us know how your experience was.</DialogDescription>
          </DialogHeader>
          <p>Modal body contents</p>
        </DialogContent>
      </Dialog>
    );

    // Prior to activation, content is not visible
    expect(screen.queryByRole('dialog')).toBeNull();

    // Activate trigger
    const trigger = screen.getByRole('button', { name: /open feedback modal/i });
    fireEvent.click(trigger);

    // Dialog is opened and visible
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('Share Feedback')).toBeTruthy();
    expect(screen.getByText('Modal body contents')).toBeTruthy();
  });

  it('2. closes dialog using the built-in close button', async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open Modal</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Test</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    fireEvent.click(screen.getByRole('button', { name: /open modal/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();

    // Click the built-in Close button
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('3. closes dialog when Escape key is pressed', async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open Escape Modal</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escape Modal</DialogTitle>
            <DialogDescription>Escape to close</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    fireEvent.click(screen.getByRole('button', { name: /open escape modal/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();

    // Send Escape key event
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('4. supports controlled open state via open and onOpenChange', async () => {
    const ControlledComponent = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setIsOpen(true)}>
            External Open ({isOpen ? 'open' : 'closed'})
          </button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Controlled Dialog</DialogTitle>
                <DialogDescription>Controlled state description</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    };

    render(<ControlledComponent />);
    expect(screen.queryByRole('dialog')).toBeNull();

    // Open via controlled state
    fireEvent.click(screen.getByRole('button', { name: /external open/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();

    // Close via DialogClose within DialogFooter
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('5. provides accessible title and description associations (aria-labelledby and aria-describedby)', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accessible Title</DialogTitle>
            <DialogDescription>Accessible Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    const dialog = screen.getByRole('dialog');
    const title = screen.getByText('Accessible Title');
    const description = screen.getByText('Accessible Description');

    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
    expect(dialog.getAttribute('aria-describedby')).toBe(description.id);
  });

  it('6. renders dialog content in a portal appended outside the container', () => {
    render(
      <div data-testid="app-root">
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Portal Test</DialogTitle>
              <DialogDescription>Portal Verification</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    );

    const appRoot = screen.getByTestId('app-root');
    const dialog = screen.getByRole('dialog');

    // Dialog element is rendered in a portal attached to document.body, not inside appRoot
    expect(appRoot.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it('7. restores focus to trigger button after dialog closes', async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button data-testid="test-trigger">Trigger Button</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Focus Management</DialogTitle>
            <DialogDescription>Focus restoration test</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button data-testid="dialog-close-btn">Dismiss</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByTestId('test-trigger');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeTruthy();

    const closeBtn = screen.getByTestId('dialog-close-btn');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Verify focus restoration to trigger
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('8. generates distinct accessibility IDs when multiple dialogs are present', () => {
    render(
      <div>
        <Dialog defaultOpen>
          <DialogContent aria-label="First Modal">
            <DialogHeader>
              <DialogTitle>Modal One Title</DialogTitle>
              <DialogDescription>Modal One Description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <Dialog defaultOpen>
          <DialogContent aria-label="Second Modal">
            <DialogHeader>
              <DialogTitle>Modal Two Title</DialogTitle>
              <DialogDescription>Modal Two Description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    );

    const titleOne = screen.getByText('Modal One Title');
    const titleTwo = screen.getByText('Modal Two Title');
    const descOne = screen.getByText('Modal One Description');
    const descTwo = screen.getByText('Modal Two Description');

    // Each title and description has a unique ID, preventing collision
    expect(titleOne.id).not.toBe(titleTwo.id);
    expect(descOne.id).not.toBe(descTwo.id);
  });

  it('9. applies design system corner radius (24px) and surface styles', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent data-testid="styled-dialog">
          <DialogHeader>
            <DialogTitle>Style Check</DialogTitle>
            <DialogDescription>Check styling</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    const dialog = screen.getByTestId('styled-dialog');
    // Strict 24px corner radius from design tokens
    expect(dialog.className).toContain('rounded-[24px]');
    expect(dialog.className).toContain('bg-surface-card');
    expect(dialog.className).toContain('border-border');
    expect(dialog.className).toContain('shadow-soft-lg');
  });
});
