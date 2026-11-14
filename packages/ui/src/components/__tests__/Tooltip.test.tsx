/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
} from '../Tooltip';
import { Button } from '../Button';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Tooltip Component Primitive', () => {
  it('1. tooltip opens after the configured delay', async () => {
    vi.useFakeTimers();
    render(
      <TooltipProvider delayDuration={250}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">Hover Me</button>
          </TooltipTrigger>
          <TooltipContent>Delayed Tooltip Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const trigger = screen.getByRole('button', { name: /hover me/i });

    // Initial state: tooltip is not in document
    expect(screen.queryByRole('tooltip')).toBeNull();

    // Trigger pointer move with mouse
    fireEvent.pointerMove(trigger, { pointerType: 'mouse' });

    // Before delay has elapsed, content should still be absent
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByRole('tooltip')).toBeNull();

    // After delay has elapsed
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toBeTruthy();
    expect(screen.getByText('Delayed Tooltip Content')).toBeTruthy();
  });

  it('2. tooltip closes when the pointer leaves', async () => {
    vi.useFakeTimers();
    render(
      <TooltipProvider delayDuration={0} disableHoverableContent>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">Pointer Target</button>
          </TooltipTrigger>
          <TooltipContent>Closing Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const trigger = screen.getByRole('button', { name: /pointer target/i });

    fireEvent.pointerMove(trigger, { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(screen.getByRole('tooltip')).toBeTruthy();

    // Pointer leaves
    fireEvent.pointerLeave(trigger);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('3. tooltip opens when the trigger receives keyboard focus', async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">Focus Target</button>
          </TooltipTrigger>
          <TooltipContent>Keyboard Focused Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const trigger = screen.getByRole('button', { name: /focus target/i });

    act(() => {
      trigger.focus();
    });

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeTruthy();
      expect(screen.getByText('Keyboard Focused Content')).toBeTruthy();
    });
  });

  it('4. escape dismisses an open tooltip', async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">Dismissable Target</button>
          </TooltipTrigger>
          <TooltipContent>Dismissable Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const trigger = screen.getByRole('button', { name: /dismissable target/i });
    act(() => {
      trigger.focus();
    });

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeTruthy();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).toBeNull();
    });
  });

  it('5. controlled open state works', () => {
    const ControlledComponent = ({ isOpen }: { isOpen: boolean }) => (
      <TooltipProvider>
        <Tooltip open={isOpen}>
          <TooltipTrigger asChild>
            <button type="button">Controlled Target</button>
          </TooltipTrigger>
          <TooltipContent>Controlled Text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const { rerender } = render(<ControlledComponent isOpen={false} />);
    expect(screen.queryByRole('tooltip')).toBeNull();

    rerender(<ControlledComponent isOpen={true} />);
    expect(screen.getByRole('tooltip')).toBeTruthy();
    expect(screen.getByText('Controlled Text')).toBeTruthy();

    rerender(<ControlledComponent isOpen={false} />);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('6. onOpenChange receives the correct values', async () => {
    const handleOpenChange = vi.fn();
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip onOpenChange={handleOpenChange}>
          <TooltipTrigger asChild>
            <button type="button">Callback Target</button>
          </TooltipTrigger>
          <TooltipContent>Callback Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const trigger = screen.getByRole('button', { name: /callback target/i });

    act(() => {
      trigger.focus();
    });

    await waitFor(() => {
      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });

    act(() => {
      trigger.blur();
    });

    await waitFor(() => {
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('7. default provider behavior works without explicit delayDuration prop', async () => {
    vi.useFakeTimers();
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">Default Provider</button>
          </TooltipTrigger>
          <TooltipContent>Default Delay Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const trigger = screen.getByRole('button', { name: /default provider/i });
    fireEvent.pointerMove(trigger, { pointerType: 'mouse' });

    // Default delay is 300ms; at 150ms it should still be closed
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.queryByRole('tooltip')).toBeNull();

    // At 350ms it should be open
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toBeTruthy();
  });

  it('8. custom delay settings work on TooltipProvider and individual Tooltip', async () => {
    vi.useFakeTimers();
    render(
      <TooltipProvider delayDuration={500}>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <button type="button">Fast Tooltip</button>
          </TooltipTrigger>
          <TooltipContent>Fast Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const trigger = screen.getByRole('button', { name: /fast tooltip/i });
    fireEvent.pointerMove(trigger, { pointerType: 'mouse' });

    // Fast tooltip opens at 100ms instead of 500ms
    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(screen.getByRole('tooltip')).toBeTruthy();
  });

  it('9. content supports custom class names and design tokens', () => {
    render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger asChild>
            <button type="button">Styled Target</button>
          </TooltipTrigger>
          <TooltipContent className="custom-tooltip-class">
            Styled Content
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const content = screen.getByRole('tooltip');
    expect(content.className).toContain('custom-tooltip-class');
    // Design tokens contract
    expect(content.className).toContain('bg-surface-card');
    expect(content.className).toContain('border-border');
    expect(content.className).toContain('text-content-main');
    expect(content.className).toContain('shadow-soft-md');
    expect(content.className).toContain('rounded-lg');
  });

  it('10. side and alignment props are forwarded correctly', () => {
    render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger asChild>
            <button type="button">Position Target</button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end" sideOffset={12}>
            Positioned Content
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const content = screen.getByRole('tooltip');
    expect(content.getAttribute('data-side')).toBe('bottom');
    expect(content.getAttribute('data-align')).toBe('end');
  });

  it('11. TooltipArrow renders correctly with design token fill', () => {
    render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger asChild>
            <button type="button">Arrow Target</button>
          </TooltipTrigger>
          <TooltipContent>
            Arrow Content
            <TooltipArrow className="custom-arrow-class" />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    // Radix Arrow renders an SVG inside or alongside content
    const tooltip = screen.getByRole('tooltip');
    const svg = tooltip.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('class')).toContain('fill-surface-card');
    expect(svg?.getAttribute('class')).toContain('custom-arrow-class');
  });

  it('12. refs are forwarded correctly across TooltipTrigger, TooltipContent, and TooltipArrow', () => {
    const triggerRef = React.createRef<HTMLButtonElement>();
    const contentRef = React.createRef<HTMLDivElement>();
    const arrowRef = React.createRef<SVGSVGElement>();

    render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger ref={triggerRef}>
            Ref Trigger
          </TooltipTrigger>
          <TooltipContent ref={contentRef}>
            Ref Content
            <TooltipArrow ref={arrowRef} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    expect(arrowRef.current).toBeInstanceOf(SVGSVGElement);
  });

  it('13. multiple tooltips work within a shared TooltipProvider', async () => {
    vi.useFakeTimers();
    render(
      <TooltipProvider delayDuration={100} skipDelayDuration={200} disableHoverableContent>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">Button One</button>
          </TooltipTrigger>
          <TooltipContent>Content One</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">Button Two</button>
          </TooltipTrigger>
          <TooltipContent>Content Two</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const btn1 = screen.getByRole('button', { name: /button one/i });
    const btn2 = screen.getByRole('button', { name: /button two/i });

    // Hover button 1
    fireEvent.pointerMove(btn1, { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(screen.getByText('Content One')).toBeTruthy();

    // Leave button 1 and enter button 2 (within skipDelayDuration)
    fireEvent.pointerLeave(btn1);
    fireEvent.pointerMove(btn2, { pointerType: 'mouse' });
    // Instant/skip delay opening
    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(screen.getByText('Content Two')).toBeTruthy();
  });

  it('14. disabled triggers are accessible when wrapped with a focusable container or using aria-disabled', async () => {
    render(
      <TooltipProvider delayDuration={0}>
        {/* Pattern A: Accessible wrapper container with tabIndex */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} role="button" aria-disabled="true" data-testid="disabled-wrapper">
              <Button disabled variant="primary">
                Export NPS Report
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Exporting is restricted to Enterprise plan administrators.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const wrapper = screen.getByTestId('disabled-wrapper');
    expect(wrapper.getAttribute('tabindex')).toBe('0');
    expect(wrapper.getAttribute('aria-disabled')).toBe('true');

    act(() => {
      wrapper.focus();
    });

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeTruthy();
      expect(
        screen.getByText(/exporting is restricted to enterprise plan administrators/i)
      ).toBeTruthy();
    });
  });

  it('15. connects trigger and content via accessible ARIA attributes', () => {
    render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger asChild>
            <button type="button">A11y Button</button>
          </TooltipTrigger>
          <TooltipContent>Descriptive Information</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const trigger = screen.getByRole('button', { name: /a11y button/i });
    const tooltip = screen.getByRole('tooltip');

    const describedBy = trigger.getAttribute('aria-describedby');
    const tooltipId = tooltip.getAttribute('id');

    expect(describedBy).toBeTruthy();
    expect(tooltipId).toBeTruthy();
    expect(describedBy).toBe(tooltipId);
  });

  it('16. strictly avoids hardcoded slate or arbitrary colors', () => {
    render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger asChild>
            <button type="button">Audit Button</button>
          </TooltipTrigger>
          <TooltipContent>
            Audit Colors
            <TooltipArrow />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).not.toContain('bg-slate-50');
    expect(tooltip.className).not.toContain('bg-slate-100');
    expect(tooltip.className).not.toContain('text-slate-500');
    expect(tooltip.className).not.toContain('text-slate-800');
    expect(tooltip.className).not.toContain('border-slate-200');
  });
});
