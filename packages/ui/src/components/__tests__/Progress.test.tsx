/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import {
  Progress,
  ProgressIndicator,
  type ProgressVariant,
  type ProgressSize,
} from '../Progress';

afterEach(() => {
  cleanup();
});

describe('Progress Component Primitive', () => {
  it('1. renders progressbar with default attributes and styles', () => {
    render(<Progress value={40} data-testid="progress-default" />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeTruthy();
    expect(progressbar.getAttribute('aria-valuenow')).toBe('40');
    expect(progressbar.getAttribute('aria-valuemin')).toBe('0');
    expect(progressbar.getAttribute('aria-valuemax')).toBe('100');
    expect(progressbar.getAttribute('aria-valuetext')).toBe('40%');
    expect(progressbar.getAttribute('data-state')).toBe('loading');
    expect(progressbar.className).toContain('rounded-full');
    expect(progressbar.className).toContain('h-2.5'); // default md size
  });

  it('2. handles zero progress correctly (0%)', () => {
    render(<Progress value={0} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('0');
    expect(progressbar.getAttribute('aria-valuetext')).toBe('0%');

    const indicator = progressbar.querySelector('[data-state]');
    expect(indicator).toBeTruthy();
    expect(indicator?.getAttribute('style')).toContain('width: 0%');
  });

  it('3. handles partial progress correctly (e.g. 65%)', () => {
    render(<Progress value={65} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('65');
    expect(progressbar.getAttribute('aria-valuetext')).toBe('65%');

    const indicator = progressbar.querySelector('[data-state]');
    expect(indicator?.getAttribute('style')).toContain('width: 65%');
  });

  it('4. handles completed progress (100%) and sets data-state="complete"', () => {
    render(<Progress value={100} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('100');
    expect(progressbar.getAttribute('aria-valuetext')).toBe('100%');
    expect(progressbar.getAttribute('data-state')).toBe('complete');

    const indicator = progressbar.querySelector('[data-state]');
    expect(indicator?.getAttribute('data-state')).toBe('complete');
    expect(indicator?.getAttribute('style')).toContain('width: 100%');
  });

  it('5. supports custom maximum value', () => {
    render(<Progress value={150} max={300} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('150');
    expect(progressbar.getAttribute('aria-valuemax')).toBe('300');
    expect(progressbar.getAttribute('aria-valuetext')).toBe('50%');

    const indicator = progressbar.querySelector('[data-state]');
    expect(indicator?.getAttribute('style')).toContain('width: 50%');
  });

  it('6. calculates percentage correctly across arbitrary ranges and rounds properly', () => {
    // 1 out of 3 is 33.333% -> rounds to 33%
    const { rerender } = render(<Progress value={1} max={3} />);
    let progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuetext')).toBe('33%');

    // 2 out of 3 is 66.666% -> rounds to 67%
    rerender(<Progress value={2} max={3} />);
    progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuetext')).toBe('67%');
  });

  it('7. clamps negative values to 0', () => {
    render(<Progress value={-25} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('0');
    expect(progressbar.getAttribute('aria-valuetext')).toBe('0%');

    const indicator = progressbar.querySelector('[data-state]');
    expect(indicator?.getAttribute('style')).toContain('width: 0%');
  });

  it('8. clamps values exceeding max to max', () => {
    render(<Progress value={180} max={100} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('100');
    expect(progressbar.getAttribute('aria-valuetext')).toBe('100%');
    expect(progressbar.getAttribute('data-state')).toBe('complete');

    const indicator = progressbar.querySelector('[data-state]');
    expect(indicator?.getAttribute('style')).toContain('width: 100%');
  });

  it('9. handles invalid values (NaN, negative max) safely without crashing', () => {
    // NaN value falls back to indeterminate gracefully
    const { rerender } = render(<Progress value={NaN} max={-50} />);

    let progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeTruthy();
    expect(progressbar.getAttribute('data-max')).toBe('100'); // defaults to 100 when max <= 0
    expect(progressbar.getAttribute('data-state')).toBe('indeterminate');
    expect(progressbar.getAttribute('aria-valuenow')).toBeNull();

    // Negative max falls back to 100 in determinate mode
    rerender(<Progress value={50} max={-10} />);
    progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuemax')).toBe('100');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('50');
  });

  it('10. renders all four visual variants (default, success, warning, error) with semantic token classes', () => {
    const variants: ProgressVariant[] = ['default', 'success', 'warning', 'error'];
    const expectedClasses: Record<ProgressVariant, string> = {
      default: 'bg-brand-primary',
      success: 'bg-semantic-success',
      warning: 'bg-semantic-warning',
      error: 'bg-semantic-error',
    };

    for (const variant of variants) {
      const { unmount } = render(
        <Progress value={50} variant={variant} data-testid={`progress-${variant}`} />
      );

      const progressbar = screen.getByTestId(`progress-${variant}`);
      const indicator = progressbar.querySelector('[data-state]');
      expect(indicator?.className).toContain(expectedClasses[variant]);

      unmount();
    }
  });

  it('11. renders all three sizes (sm, md, lg) with corresponding track height classes', () => {
    const sizes: ProgressSize[] = ['sm', 'md', 'lg'];
    const expectedHeights: Record<ProgressSize, string> = {
      sm: 'h-1.5',
      md: 'h-2.5',
      lg: 'h-4',
    };

    for (const size of sizes) {
      const { unmount } = render(
        <Progress value={50} size={size} data-testid={`progress-${size}`} />
      );

      const progressbar = screen.getByTestId(`progress-${size}`);
      expect(progressbar.className).toContain(expectedHeights[size]);

      unmount();
    }
  });

  it('12. supports visible label and auto-associates accessible name via aria-label', () => {
    render(<Progress value={40} label="Survey Completion" />);

    const labelElement = screen.getByText('Survey Completion');
    expect(labelElement).toBeTruthy();

    const progressbar = screen.getByRole('progressbar', { name: 'Survey Completion' });
    expect(progressbar).toBeTruthy();
  });

  it('13. supports explicit accessible label via aria-label', () => {
    render(<Progress value={75} aria-label="File Upload Progress" />);

    const progressbar = screen.getByRole('progressbar', { name: 'File Upload Progress' });
    expect(progressbar).toBeTruthy();
    expect(progressbar.getAttribute('aria-label')).toBe('File Upload Progress');
  });

  it('14. supports accessible labeling via aria-labelledby', () => {
    render(
      <div>
        <h3 id="custom-heading-id">Onboarding Progress</h3>
        <Progress value={30} aria-labelledby="custom-heading-id" />
      </div>
    );

    const progressbar = screen.getByRole('progressbar', { name: 'Onboarding Progress' });
    expect(progressbar).toBeTruthy();
    expect(progressbar.getAttribute('aria-labelledby')).toBe('custom-heading-id');
  });

  it('15. displays percentage text when showValue is true', () => {
    render(<Progress value={45} showValue label="Syncing" />);

    const valueText = screen.getByText('45%');
    expect(valueText).toBeTruthy();
    // Verify value text is aria-hidden to avoid duplicate announcement with aria-valuetext
    expect(valueText.getAttribute('aria-hidden')).toBe('true');
  });

  it('16. supports custom getValueText formatting for visible value and aria-valuetext', () => {
    const customFormatter = (val: number, max: number) => `Step ${val} of ${max}`;

    render(
      <Progress
        value={3}
        max={5}
        showValue
        getValueText={customFormatter}
        label="Checkout Wizard"
      />
    );

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuetext')).toBe('Step 3 of 5');

    const formattedDisplay = screen.getByText('Step 3 of 5');
    expect(formattedDisplay).toBeTruthy();
  });

  it('17. handles indeterminate state accessibly when value is null or undefined', () => {
    const { rerender } = render(<Progress value={null} aria-label="Loading survey data" />);

    let progressbar = screen.getByRole('progressbar', { name: 'Loading survey data' });
    expect(progressbar).toBeTruthy();
    expect(progressbar.getAttribute('data-state')).toBe('indeterminate');
    // W3C ARIA: aria-valuenow MUST be omitted when progress is indeterminate
    expect(progressbar.getAttribute('aria-valuenow')).toBeNull();

    const indicator = progressbar.querySelector('[data-state="indeterminate"]');
    expect(indicator).toBeTruthy();
    expect(indicator?.className).toContain('animate-pulse');

    // Test undefined value
    rerender(<Progress value={undefined} aria-label="Loading survey data" />);
    progressbar = screen.getByRole('progressbar', { name: 'Loading survey data' });
    expect(progressbar.getAttribute('data-state')).toBe('indeterminate');
    expect(progressbar.getAttribute('aria-valuenow')).toBeNull();
  });

  it('18. forwards refs to the progressbar element', () => {
    const progressRef = React.createRef<HTMLDivElement>();

    render(<Progress ref={progressRef} value={80} />);

    expect(progressRef.current).toBeInstanceOf(HTMLDivElement);
    expect(progressRef.current?.getAttribute('role')).toBe('progressbar');
    expect(progressRef.current?.getAttribute('aria-valuenow')).toBe('80');
  });

  it('19. merges custom className and wrapperClassName properly', () => {
    render(
      <Progress
        value={50}
        label="Custom Classes"
        className="custom-track-class"
        wrapperClassName="custom-wrapper-class"
      />
    );

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.className).toContain('custom-track-class');

    const wrapper = progressbar.parentElement;
    expect(wrapper?.className).toContain('custom-wrapper-class');
  });

  it('20. forwards standard HTML and data attributes to progressbar', () => {
    render(
      <Progress
        value={60}
        id="survey-progress-bar"
        data-testid="survey-progress"
        data-analytics="onboarding-step-3"
      />
    );

    const progressbar = screen.getByTestId('survey-progress');
    expect(progressbar.getAttribute('id')).toBe('survey-progress-bar');
    expect(progressbar.getAttribute('data-analytics')).toBe('onboarding-step-3');
  });

  it('21. applies reduced-motion utility classes to indicator', () => {
    render(<Progress value={50} />);

    const progressbar = screen.getByRole('progressbar');
    const indicator = progressbar.querySelector('[data-state]');
    expect(indicator?.className).toContain('motion-reduce:transition-none');
    expect(indicator?.className).toContain('transition-all');
  });

  it('22. supports standalone ProgressIndicator rendering and ref forwarding', () => {
    const indicatorRef = React.createRef<HTMLDivElement>();

    render(
      <div className="w-full bg-border/40 h-2 rounded-full">
        <ProgressIndicator
          ref={indicatorRef}
          variant="success"
          percentage={70}
          className="custom-ind"
        />
      </div>
    );

    expect(indicatorRef.current).toBeInstanceOf(HTMLDivElement);
    expect(indicatorRef.current?.getAttribute('data-state')).toBe('loading');
    expect(indicatorRef.current?.getAttribute('style')).toContain('width: 70%');
    expect(indicatorRef.current?.className).toContain('bg-semantic-success');
    expect(indicatorRef.current?.className).toContain('custom-ind');
  });

  it('23. treats Infinity, -Infinity, and NaN value as indeterminate and omits ARIA numeric attributes', () => {
    const { rerender } = render(<Progress value={Infinity} aria-label="Processing" />);

    let progressbar = screen.getByRole('progressbar', { name: 'Processing' });
    expect(progressbar.getAttribute('data-state')).toBe('indeterminate');
    expect(progressbar.getAttribute('aria-valuenow')).toBeNull();
    expect(progressbar.getAttribute('aria-valuemin')).toBeNull();
    expect(progressbar.getAttribute('aria-valuemax')).toBeNull();
    expect(progressbar.getAttribute('aria-valuetext')).toBeNull();

    // -Infinity
    rerender(<Progress value={-Infinity} aria-label="Processing" />);
    progressbar = screen.getByRole('progressbar', { name: 'Processing' });
    expect(progressbar.getAttribute('data-state')).toBe('indeterminate');
    expect(progressbar.getAttribute('aria-valuenow')).toBeNull();

    // NaN
    rerender(<Progress value={NaN} aria-label="Processing" />);
    progressbar = screen.getByRole('progressbar', { name: 'Processing' });
    expect(progressbar.getAttribute('data-state')).toBe('indeterminate');
    expect(progressbar.getAttribute('aria-valuenow')).toBeNull();
    expect(progressbar.getAttribute('aria-valuemin')).toBeNull();
    expect(progressbar.getAttribute('aria-valuemax')).toBeNull();
  });

  it('24. safely handles invalid maximum values (Infinity, -Infinity, NaN, 0, negative) defaulting to 100', () => {
    const invalidMaxValues = [Infinity, -Infinity, NaN, 0, -50];

    for (const invalidMax of invalidMaxValues) {
      const { unmount } = render(
        <Progress value={40} max={invalidMax} data-testid={`progress-max-${String(invalidMax)}`} />
      );

      const progressbar = screen.getByTestId(`progress-max-${String(invalidMax)}`);
      expect(progressbar.getAttribute('aria-valuemax')).toBe('100');
      expect(progressbar.getAttribute('data-max')).toBe('100');
      expect(progressbar.getAttribute('aria-valuenow')).toBe('40');
      expect(progressbar.getAttribute('aria-valuetext')).toBe('40%');

      unmount();
    }
  });

  it('25. standalone ProgressIndicator clamps percentages and handles non-finite values safely', () => {
    const { rerender } = render(<ProgressIndicator percentage={-30} data-testid="indicator" />);
    let indicator = screen.getByTestId('indicator');
    expect(indicator.getAttribute('style')).toContain('width: 0%');

    rerender(<ProgressIndicator percentage={150} data-testid="indicator" />);
    indicator = screen.getByTestId('indicator');
    expect(indicator.getAttribute('style')).toContain('width: 100%');
    expect(indicator.getAttribute('data-state')).toBe('complete');

    rerender(<ProgressIndicator percentage={NaN} data-testid="indicator" />);
    indicator = screen.getByTestId('indicator');
    expect(indicator.getAttribute('style')).toContain('width: 0%');

    rerender(<ProgressIndicator percentage={Infinity} data-testid="indicator" />);
    indicator = screen.getByTestId('indicator');
    expect(indicator.getAttribute('style')).toContain('width: 0%');
  });
});
