/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  type EmptyStateTitleElement,
  type EmptyStateTitleRef,
} from '../EmptyState';
import { Button } from '../Button';

// Compile-time type verification fixtures
type Assert<T extends true> = T;
type IsExact<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;

type _TestElements = Assert<
  IsExact<
    EmptyStateTitleElement,
    'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'p'
  >
>;
type _TestH1 = Assert<IsExact<EmptyStateTitleRef<'h1'>, HTMLHeadingElement>>;
type _TestH2 = Assert<IsExact<EmptyStateTitleRef<'h2'>, HTMLHeadingElement>>;
type _TestH3 = Assert<IsExact<EmptyStateTitleRef<'h3'>, HTMLHeadingElement>>;
type _TestH4 = Assert<IsExact<EmptyStateTitleRef<'h4'>, HTMLHeadingElement>>;
type _TestH5 = Assert<IsExact<EmptyStateTitleRef<'h5'>, HTMLHeadingElement>>;
type _TestH6 = Assert<IsExact<EmptyStateTitleRef<'h6'>, HTMLHeadingElement>>;
type _TestDiv = Assert<IsExact<EmptyStateTitleRef<'div'>, HTMLDivElement>>;
type _TestP = Assert<IsExact<EmptyStateTitleRef<'p'>, HTMLParagraphElement>>;

afterEach(() => {
  cleanup();
});

const DummyInboxIcon = () => (
  <svg
    data-testid="dummy-inbox-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 12h-6l-2 3h-4l-2-3H2v7h20v-7z" />
    <path d="M5.45 5.11L2 12v7a2 2 0 002 2h16a2 2 0 002-2v-7l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
  </svg>
);

describe('EmptyState Component Primitive', () => {
  it('1. renders default EmptyState container correctly', () => {
    const { container } = render(
      <EmptyState>
        <EmptyStateTitle>Empty State Title</EmptyStateTitle>
      </EmptyState>
    );

    const root = container.firstChild as HTMLElement;
    expect(root).toBeTruthy();
    expect(root.getAttribute('data-variant')).toBe('default');
    expect(root.getAttribute('data-size')).toBe('md');
    expect(root.className).toContain('flex flex-col items-center justify-center text-center');
    expect(root.className).toContain('py-10 px-6');
  });

  it('2. renders EmptyStateTitle correctly with default semantic heading', () => {
    render(
      <EmptyState>
        <EmptyStateTitle>No feedback responses yet</EmptyStateTitle>
      </EmptyState>
    );

    const heading = screen.getByRole('heading', { level: 3, name: /no feedback responses yet/i });
    expect(heading).toBeTruthy();
    expect(heading.tagName.toLowerCase()).toBe('h3');
    expect(heading.className).toContain('text-content-main');
    expect(heading.className).toContain('font-semibold');
  });

  it('3. renders EmptyStateDescription correctly with secondary text tokens', () => {
    render(
      <EmptyState>
        <EmptyStateTitle>No responses</EmptyStateTitle>
        <EmptyStateDescription>
          Share your feedback form with customers to start collecting valuable insights.
        </EmptyStateDescription>
      </EmptyState>
    );

    const desc = screen.getByText(/share your feedback form with customers/i);
    expect(desc).toBeTruthy();
    expect(desc.tagName.toLowerCase()).toBe('p');
    expect(desc.className).toContain('text-content-secondary');
    expect(desc.className).toContain('leading-relaxed');
  });

  it('4. renders EmptyStateIcon slot correctly', () => {
    render(
      <EmptyState>
        <EmptyStateIcon>
          <DummyInboxIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>No surveys</EmptyStateTitle>
      </EmptyState>
    );

    const icon = screen.getByTestId('dummy-inbox-icon');
    expect(icon).toBeTruthy();

    const iconContainer = icon.parentElement;
    expect(iconContainer?.className).toContain('bg-surface-main');
    expect(iconContainer?.className).toContain('border-border');
    expect(iconContainer?.className).toContain('rounded-2xl');
  });

  it('5. renders primary action and executes click handler upon user interaction', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <EmptyState>
        <EmptyStateTitle>No forms created</EmptyStateTitle>
        <EmptyStateActions>
          <Button variant="primary" onClick={handleClick}>
            Create feedback form
          </Button>
        </EmptyStateActions>
      </EmptyState>
    );

    const button = screen.getByRole('button', { name: /create feedback form/i });
    expect(button).toBeTruthy();

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('6. renders multiple action buttons in responsive layout', async () => {
    const user = userEvent.setup();
    const handlePrimary = vi.fn();
    const handleSecondary = vi.fn();

    render(
      <EmptyState>
        <EmptyStateTitle>No customer feedback available</EmptyStateTitle>
        <EmptyStateActions>
          <Button variant="primary" onClick={handlePrimary}>
            Request feedback
          </Button>
          <Button variant="outline" onClick={handleSecondary}>
            View documentation
          </Button>
        </EmptyStateActions>
      </EmptyState>
    );

    const primaryBtn = screen.getByRole('button', { name: /request feedback/i });
    const secondaryBtn = screen.getByRole('button', { name: /view documentation/i });

    expect(primaryBtn).toBeTruthy();
    expect(secondaryBtn).toBeTruthy();

    await user.click(primaryBtn);
    expect(handlePrimary).toHaveBeenCalledTimes(1);

    await user.click(secondaryBtn);
    expect(handleSecondary).toHaveBeenCalledTimes(1);
  });

  it('7. preserves and merges custom classNames across all subcomponents', () => {
    const { container } = render(
      <EmptyState className="custom-root-class">
        <EmptyStateIcon className="custom-icon-class">
          <DummyInboxIcon />
        </EmptyStateIcon>
        <EmptyStateTitle className="custom-title-class">Custom Title</EmptyStateTitle>
        <EmptyStateDescription className="custom-desc-class">Custom Description</EmptyStateDescription>
        <EmptyStateActions className="custom-actions-class">
          <button type="button">Action</button>
        </EmptyStateActions>
      </EmptyState>
    );

    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('custom-root-class');

    const iconContainer = screen.getByTestId('dummy-inbox-icon').parentElement;
    expect(iconContainer?.className).toContain('custom-icon-class');

    const title = screen.getByRole('heading', { name: /custom title/i });
    expect(title.className).toContain('custom-title-class');

    const desc = screen.getByText(/custom description/i);
    expect(desc.className).toContain('custom-desc-class');

    const actions = screen.getByRole('button', { name: /action/i }).parentElement;
    expect(actions?.className).toContain('custom-actions-class');
  });

  it('8. applies compact variant styling for dense UI contexts', () => {
    const { container } = render(
      <EmptyState variant="compact">
        <EmptyStateTitle>No notifications</EmptyStateTitle>
      </EmptyState>
    );

    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute('data-variant')).toBe('compact');
    expect(root.className).toContain('py-6 px-4');
  });

  it('9. applies card variant styling with surface elevation and borders', () => {
    const { container } = render(
      <EmptyState variant="card">
        <EmptyStateTitle>No analytics data</EmptyStateTitle>
      </EmptyState>
    );

    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute('data-variant')).toBe('card');
    expect(root.className).toContain('bg-surface-card');
    expect(root.className).toContain('border-border');
    expect(root.className).toContain('shadow-soft-sm');
    expect(root.className).toContain('rounded-[20px]');
  });

  it('10. applies small, medium, and large sizing scale to subcomponents', () => {
    const { rerender, container } = render(
      <EmptyState size="sm">
        <EmptyStateIcon>
          <DummyInboxIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>Small State</EmptyStateTitle>
        <EmptyStateDescription>Small Description</EmptyStateDescription>
        <EmptyStateActions>
          <button type="button">Small Button</button>
        </EmptyStateActions>
      </EmptyState>
    );

    let root = container.firstChild as HTMLElement;
    expect(root.getAttribute('data-size')).toBe('sm');
    expect(root.className).toContain('p-4');
    expect(screen.getByTestId('dummy-inbox-icon').parentElement?.className).toContain('w-10 h-10');
    expect(screen.getByRole('heading', { name: /small state/i }).className).toContain('text-sm');

    // Medium size
    rerender(
      <EmptyState size="md">
        <EmptyStateIcon>
          <DummyInboxIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>Medium State</EmptyStateTitle>
        <EmptyStateDescription>Medium Description</EmptyStateDescription>
        <EmptyStateActions>
          <button type="button">Medium Button</button>
        </EmptyStateActions>
      </EmptyState>
    );
    root = container.firstChild as HTMLElement;
    expect(root.getAttribute('data-size')).toBe('md');
    expect(screen.getByTestId('dummy-inbox-icon').parentElement?.className).toContain('w-14 h-14');
    expect(screen.getByRole('heading', { name: /medium state/i }).className).toContain('text-base');

    // Large size
    rerender(
      <EmptyState size="lg">
        <EmptyStateIcon>
          <DummyInboxIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>Large State</EmptyStateTitle>
        <EmptyStateDescription>Large Description</EmptyStateDescription>
        <EmptyStateActions>
          <button type="button">Large Button</button>
        </EmptyStateActions>
      </EmptyState>
    );
    root = container.firstChild as HTMLElement;
    expect(root.getAttribute('data-size')).toBe('lg');
    expect(root.className).toContain('py-16 px-8');
    expect(screen.getByTestId('dummy-inbox-icon').parentElement?.className).toContain('w-20 h-20');
    expect(screen.getByRole('heading', { name: /large state/i }).className).toContain('text-xl');
  });

  it('11. renders custom ReactNode content and illustrations', () => {
    render(
      <EmptyState>
        <EmptyStateIcon>
          <div data-testid="custom-illustration">SVG Illustration</div>
        </EmptyStateIcon>
        <EmptyStateTitle>
          <span>Rich Text <strong>Bold</strong></span>
        </EmptyStateTitle>
        <EmptyStateDescription>
          <span>Support with <a href="#help" className="text-brand-primary">Help Center</a> link.</span>
        </EmptyStateDescription>
      </EmptyState>
    );

    expect(screen.getByTestId('custom-illustration')).toBeTruthy();
    expect(screen.getByText('Bold')).toBeTruthy();
    expect(screen.getByRole('link', { name: /help center/i })).toBeTruthy();
  });

  it('12. forwards refs to underlying HTML elements across all subcomponents', () => {
    const rootRef = React.createRef<HTMLDivElement>();
    const iconRef = React.createRef<HTMLDivElement>();
    const titleRef = React.createRef<HTMLHeadingElement>();
    const descRef = React.createRef<HTMLParagraphElement>();
    const actionsRef = React.createRef<HTMLDivElement>();

    render(
      <EmptyState ref={rootRef}>
        <EmptyStateIcon ref={iconRef}>
          <DummyInboxIcon />
        </EmptyStateIcon>
        <EmptyStateTitle ref={titleRef}>Ref Title</EmptyStateTitle>
        <EmptyStateDescription ref={descRef}>Ref Desc</EmptyStateDescription>
        <EmptyStateActions ref={actionsRef}>
          <button type="button">Ref Action</button>
        </EmptyStateActions>
      </EmptyState>
    );

    expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
    expect(iconRef.current).toBeInstanceOf(HTMLDivElement);
    expect(titleRef.current).toBeInstanceOf(HTMLHeadingElement);
    expect(descRef.current).toBeInstanceOf(HTMLParagraphElement);
    expect(actionsRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it('13. supports configurable semantic heading levels via "as" prop', () => {
    const { rerender } = render(
      <EmptyState>
        <EmptyStateTitle as="h1">Level 1 Heading</EmptyStateTitle>
      </EmptyState>
    );
    expect(screen.getByRole('heading', { level: 1, name: /level 1 heading/i })).toBeTruthy();

    rerender(
      <EmptyState>
        <EmptyStateTitle as="h2">Level 2 Heading</EmptyStateTitle>
      </EmptyState>
    );
    expect(screen.getByRole('heading', { level: 2, name: /level 2 heading/i })).toBeTruthy();

    rerender(
      <EmptyState>
        <EmptyStateTitle as="h4">Level 4 Heading</EmptyStateTitle>
      </EmptyState>
    );
    expect(screen.getByRole('heading', { level: 4, name: /level 4 heading/i })).toBeTruthy();
  });

  it('14. sets aria-hidden="true" on decorative icon container by default, allowing explicit override', () => {
    const { rerender } = render(
      <EmptyState>
        <EmptyStateIcon>
          <DummyInboxIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>Accessible Test</EmptyStateTitle>
      </EmptyState>
    );

    const iconContainer = screen.getByTestId('dummy-inbox-icon').parentElement;
    expect(iconContainer?.getAttribute('aria-hidden')).toBe('true');

    // Explicit override test
    rerender(
      <EmptyState>
        <EmptyStateIcon aria-hidden={false}>
          <DummyInboxIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>Accessible Test</EmptyStateTitle>
      </EmptyState>
    );
    expect(iconContainer?.getAttribute('aria-hidden')).toBe('false');
  });

  it('15. strictly adheres to FeedbackHub design-token class contracts', () => {
    const { container } = render(
      <EmptyState variant="card">
        <EmptyStateIcon>
          <DummyInboxIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>Token Test</EmptyStateTitle>
        <EmptyStateDescription>Token Description</EmptyStateDescription>
      </EmptyState>
    );

    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('bg-surface-card');
    expect(root.className).toContain('border-border');
    expect(root.className).toContain('shadow-soft-sm');

    const iconContainer = screen.getByTestId('dummy-inbox-icon').parentElement;
    expect(iconContainer?.className).toContain('bg-surface-main');
    expect(iconContainer?.className).toContain('text-content-secondary');
    expect(iconContainer?.className).toContain('border-border');

    const title = screen.getByRole('heading', { name: /token test/i });
    expect(title.className).toContain('text-content-main');

    const desc = screen.getByText(/token description/i);
    expect(desc.className).toContain('text-content-secondary');
  });

  it('16. contains no hardcoded slate or arbitrary color classes', () => {
    const { container } = render(
      <EmptyState variant="card">
        <EmptyStateIcon>
          <DummyInboxIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>Audit Color Classes</EmptyStateTitle>
        <EmptyStateDescription>Checking for raw slate or hex</EmptyStateDescription>
        <EmptyStateActions>
          <Button variant="primary">Action</Button>
        </EmptyStateActions>
      </EmptyState>
    );

    const allElements = container.querySelectorAll('*');
    allElements.forEach((el) => {
      const className = el.className || '';
      if (typeof className === 'string') {
        expect(className).not.toContain('bg-slate-50');
        expect(className).not.toContain('bg-slate-100');
        expect(className).not.toContain('text-slate-500');
        expect(className).not.toContain('text-slate-800');
        expect(className).not.toContain('border-slate-200');
      }
    });
  });

  it('17. supports convenience props syntax as an alternative to composable children', () => {
    render(
      <EmptyState
        icon={<DummyInboxIcon />}
        title="Props Mode Title"
        description="Props Mode Description"
        actions={<Button>Props Action</Button>}
      />
    );

    expect(screen.getByTestId('dummy-inbox-icon')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /props mode title/i })).toBeTruthy();
    expect(screen.getByText(/props mode description/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /props action/i })).toBeTruthy();
  });

  it('18. supports all 10 realistic FeedbackHub empty state scenarios', () => {
    const scenarios = [
      { title: 'No feedback responses yet', desc: 'Share your survey link to start collecting responses.' },
      { title: 'No feedback forms created', desc: 'Create your first feedback form to gather actionable feedback.' },
      { title: 'No search results found', desc: 'Try adjusting your search keywords or active filters.' },
      { title: 'No employee feedback available', desc: 'Launch an anonymous pulse survey for your team.' },
      { title: 'No customer feedback available', desc: 'Connect your CSAT or NPS widget to your product.' },
      { title: 'No notifications', desc: 'You are all caught up! Important alerts will appear here.' },
      { title: 'No analytics data available', desc: 'Analytics charts will populate as soon as responses arrive.' },
      { title: 'No team members added', desc: 'Invite colleagues to collaborate on feedback triage.' },
      { title: 'No archived forms', desc: 'Archived feedback forms will be stored in this directory.' },
      { title: 'No activity history', desc: 'Your workspace audit log is currently clean.' },
    ];

    for (const scenario of scenarios) {
      const { unmount } = render(
        <EmptyState>
          <EmptyStateTitle>{scenario.title}</EmptyStateTitle>
          <EmptyStateDescription>{scenario.desc}</EmptyStateDescription>
        </EmptyState>
      );
      expect(screen.getByRole('heading', { name: scenario.title })).toBeTruthy();
      expect(screen.getByText(scenario.desc)).toBeTruthy();
      unmount();
    }
  });

  it('19. correctly renders as "p" and forwards HTMLParagraphElement ref', () => {
    const pRef = React.createRef<HTMLParagraphElement>();
    render(
      <EmptyState>
        <EmptyStateTitle as="p" ref={pRef} className="custom-paragraph-title">
          Paragraph Title Content
        </EmptyStateTitle>
      </EmptyState>
    );

    const element = screen.getByText('Paragraph Title Content');
    expect(element.tagName.toLowerCase()).toBe('p');
    expect(pRef.current).toBeInstanceOf(HTMLParagraphElement);
    expect(pRef.current).toBe(element);
    expect(element.className).toContain('custom-paragraph-title');
  });

  it('20. correctly renders as "div" and forwards HTMLDivElement ref', () => {
    const divRef = React.createRef<HTMLDivElement>();
    render(
      <EmptyState>
        <EmptyStateTitle as="div" ref={divRef} className="custom-div-title">
          Div Title Content
        </EmptyStateTitle>
      </EmptyState>
    );

    const element = screen.getByText('Div Title Content');
    expect(element.tagName.toLowerCase()).toBe('div');
    expect(divRef.current).toBeInstanceOf(HTMLDivElement);
    expect(divRef.current).toBe(element);
    expect(element.className).toContain('custom-div-title');
  });

  it('21. correctly renders default and all heading levels (h1-h6) and forwards HTMLHeadingElement refs', () => {
    const h3Ref = React.createRef<HTMLHeadingElement>();
    const h1Ref = React.createRef<HTMLHeadingElement>();
    const h2Ref = React.createRef<HTMLHeadingElement>();
    const h4Ref = React.createRef<HTMLHeadingElement>();
    const h5Ref = React.createRef<HTMLHeadingElement>();
    const h6Ref = React.createRef<HTMLHeadingElement>();

    render(
      <EmptyState>
        <EmptyStateTitle ref={h3Ref}>Default H3 Title</EmptyStateTitle>
        <EmptyStateTitle as="h1" ref={h1Ref}>H1 Title</EmptyStateTitle>
        <EmptyStateTitle as="h2" ref={h2Ref}>H2 Title</EmptyStateTitle>
        <EmptyStateTitle as="h4" ref={h4Ref}>H4 Title</EmptyStateTitle>
        <EmptyStateTitle as="h5" ref={h5Ref}>H5 Title</EmptyStateTitle>
        <EmptyStateTitle as="h6" ref={h6Ref}>H6 Title</EmptyStateTitle>
      </EmptyState>
    );

    expect(h3Ref.current).toBeInstanceOf(HTMLHeadingElement);
    expect(h3Ref.current?.tagName.toLowerCase()).toBe('h3');

    expect(h1Ref.current).toBeInstanceOf(HTMLHeadingElement);
    expect(h1Ref.current?.tagName.toLowerCase()).toBe('h1');

    expect(h2Ref.current).toBeInstanceOf(HTMLHeadingElement);
    expect(h2Ref.current?.tagName.toLowerCase()).toBe('h2');

    expect(h4Ref.current).toBeInstanceOf(HTMLHeadingElement);
    expect(h4Ref.current?.tagName.toLowerCase()).toBe('h4');

    expect(h5Ref.current).toBeInstanceOf(HTMLHeadingElement);
    expect(h5Ref.current?.tagName.toLowerCase()).toBe('h5');

    expect(h6Ref.current).toBeInstanceOf(HTMLHeadingElement);
    expect(h6Ref.current?.tagName.toLowerCase()).toBe('h6');
  });

  it('22. enforces element-specific ref types at compile time and rejects mismatching refs', () => {
    const headingRef = React.createRef<HTMLHeadingElement>();
    const pRef = React.createRef<HTMLParagraphElement>();
    const divRef = React.createRef<HTMLDivElement>();
    const buttonRef = React.createRef<HTMLButtonElement>();

    // Valid ref assignments (must compile without errors)
    const validHeading = <EmptyStateTitle as="h2" ref={headingRef}>Valid Heading</EmptyStateTitle>;
    const validDefault = <EmptyStateTitle ref={headingRef}>Valid Default</EmptyStateTitle>;
    const validP = <EmptyStateTitle as="p" ref={pRef}>Valid P</EmptyStateTitle>;
    const validDiv = <EmptyStateTitle as="div" ref={divRef}>Valid Div</EmptyStateTitle>;

    expect(validHeading).toBeTruthy();
    expect(validDefault).toBeTruthy();
    expect(validP).toBeTruthy();
    expect(validDiv).toBeTruthy();

    // Invalid ref assignment
    // @ts-expect-error - HTMLButtonElement ref is invalid for heading
    const invalidHeadingWithButton = <EmptyStateTitle as="h2" ref={buttonRef}>Invalid</EmptyStateTitle>;

    // @ts-expect-error - HTMLButtonElement ref is invalid when as="p"
    const invalidPWithButton = <EmptyStateTitle as="p" ref={buttonRef}>Invalid</EmptyStateTitle>;

    // @ts-expect-error - HTMLButtonElement ref is invalid when as="div"
    const invalidDivWithButton = <EmptyStateTitle as="div" ref={buttonRef}>Invalid</EmptyStateTitle>;

    expect(invalidHeadingWithButton).toBeTruthy();
    expect(invalidPWithButton).toBeTruthy();
    expect(invalidDivWithButton).toBeTruthy();
  });
});
