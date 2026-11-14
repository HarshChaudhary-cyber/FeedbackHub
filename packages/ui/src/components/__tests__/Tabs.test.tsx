/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../Tabs';

afterEach(() => {
  cleanup();
});

describe('Tabs Component Primitive', () => {
  it('1. renders tabs container, tablist, triggers, and content panels', () => {
    render(
      <Tabs defaultValue="overview">
        <TabsList aria-label="Feedback Sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview Panel Content</TabsContent>
        <TabsContent value="feedback">Feedback Panel Content</TabsContent>
      </Tabs>
    );

    const tablist = screen.getByRole('tablist', { name: /feedback sections/i });
    expect(tablist).toBeTruthy();

    const triggers = screen.getAllByRole('tab');
    expect(triggers.length).toBe(2);

    expect(screen.getByText('Overview Panel Content')).toBeTruthy();
  });

  it('2. first tab is selected by default when specified via defaultValue', () => {
    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview Panel Content</TabsContent>
        <TabsContent value="feedback">Feedback Panel Content</TabsContent>
      </Tabs>
    );

    const overviewTab = screen.getByRole('tab', { name: /overview/i });
    const feedbackTab = screen.getByRole('tab', { name: /feedback/i });

    expect(overviewTab.getAttribute('aria-selected')).toBe('true');
    expect(overviewTab.getAttribute('data-state')).toBe('active');
    expect(feedbackTab.getAttribute('aria-selected')).toBe('false');
    expect(feedbackTab.getAttribute('data-state')).toBe('inactive');
  });

  it('3. uncontrolled selection changes correctly upon clicking another tab', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview Panel Content</TabsContent>
        <TabsContent value="feedback">Feedback Panel Content</TabsContent>
      </Tabs>
    );

    const overviewTab = screen.getByRole('tab', { name: /overview/i });
    const feedbackTab = screen.getByRole('tab', { name: /feedback/i });

    expect(overviewTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Overview Panel Content').hasAttribute('hidden')).toBe(false);

    await user.click(feedbackTab);

    expect(overviewTab.getAttribute('aria-selected')).toBe('false');
    expect(feedbackTab.getAttribute('aria-selected')).toBe('true');
    expect(feedbackTab.getAttribute('data-state')).toBe('active');
    expect(screen.getByText('Feedback Panel Content').hasAttribute('hidden')).toBe(false);
  });

  it('4. controlled selection calls onValueChange and updates active tab', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    const ControlledTabs = () => {
      const [val, setVal] = useState('tab-1');
      return (
        <div>
          <Tabs
            value={val}
            onValueChange={(next) => {
              setVal(next);
              handleValueChange(next);
            }}
          >
            <TabsList>
              <TabsTrigger value="tab-1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab-2">Tab 2</TabsTrigger>
            </TabsList>
            <TabsContent value="tab-1">Content 1</TabsContent>
            <TabsContent value="tab-2">Content 2</TabsContent>
          </Tabs>
          <button onClick={() => setVal('tab-2')}>External Switch</button>
        </div>
      );
    };

    render(<ControlledTabs />);
    const tab1 = screen.getByRole('tab', { name: /tab 1/i });
    const tab2 = screen.getByRole('tab', { name: /tab 2/i });

    expect(tab1.getAttribute('aria-selected')).toBe('true');

    await user.click(tab2);
    expect(handleValueChange).toHaveBeenCalledWith('tab-2');
    expect(tab2.getAttribute('aria-selected')).toBe('true');
    expect(tab1.getAttribute('aria-selected')).toBe('false');

    // External button update
    await user.click(screen.getByRole('button', { name: /external switch/i }));
    expect(tab2.getAttribute('aria-selected')).toBe('true');
  });

  it('5. only the selected panel is active and displayed according to Radix behavior', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Tabs defaultValue="first">
        <TabsList>
          <TabsTrigger value="first">First</TabsTrigger>
          <TabsTrigger value="second">Second</TabsTrigger>
        </TabsList>
        <TabsContent value="first">First Panel</TabsContent>
        <TabsContent value="second">Second Panel</TabsContent>
      </Tabs>
    );

    const panels = container.querySelectorAll('[role="tabpanel"]');
    expect(panels.length).toBe(2);

    expect(panels[0].getAttribute('data-state')).toBe('active');
    expect(panels[0].hasAttribute('hidden')).toBe(false);
    expect(screen.queryByText('First Panel')).toBeTruthy();

    expect(panels[1].getAttribute('data-state')).toBe('inactive');
    expect(panels[1].hasAttribute('hidden')).toBe(true);
    expect(screen.queryByText('Second Panel')).toBeNull();

    await user.click(screen.getByRole('tab', { name: /second/i }));

    expect(panels[0].getAttribute('data-state')).toBe('inactive');
    expect(panels[0].hasAttribute('hidden')).toBe(true);
    expect(screen.queryByText('First Panel')).toBeNull();

    expect(panels[1].getAttribute('data-state')).toBe('active');
    expect(panels[1].hasAttribute('hidden')).toBe(false);
    expect(screen.queryByText('Second Panel')).toBeTruthy();
  });

  it('6. navigates horizontally to next tab on Keyboard ArrowRight', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab-a">
        <TabsList>
          <TabsTrigger value="tab-a">Tab A</TabsTrigger>
          <TabsTrigger value="tab-b">Tab B</TabsTrigger>
          <TabsTrigger value="tab-c">Tab C</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-a">Panel A</TabsContent>
        <TabsContent value="tab-b">Panel B</TabsContent>
        <TabsContent value="tab-c">Panel C</TabsContent>
      </Tabs>
    );

    const tabA = screen.getByRole('tab', { name: /tab a/i });
    const tabB = screen.getByRole('tab', { name: /tab b/i });

    act(() => {
      tabA.focus();
    });
    expect(document.activeElement).toBe(tabA);

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabB);
    expect(tabB.getAttribute('aria-selected')).toBe('true');
  });

  it('7. navigates horizontally to previous tab on Keyboard ArrowLeft', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab-b">
        <TabsList>
          <TabsTrigger value="tab-a">Tab A</TabsTrigger>
          <TabsTrigger value="tab-b">Tab B</TabsTrigger>
          <TabsTrigger value="tab-c">Tab C</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-a">Panel A</TabsContent>
        <TabsContent value="tab-b">Panel B</TabsContent>
        <TabsContent value="tab-c">Panel C</TabsContent>
      </Tabs>
    );

    const tabA = screen.getByRole('tab', { name: /tab a/i });
    const tabB = screen.getByRole('tab', { name: /tab b/i });

    act(() => {
      tabB.focus();
    });
    expect(document.activeElement).toBe(tabB);

    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(tabA);
    expect(tabA.getAttribute('aria-selected')).toBe('true');
  });

  it('8. navigates vertically to next tab on Keyboard ArrowDown when orientation="vertical"', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="v-one" orientation="vertical">
        <TabsList>
          <TabsTrigger value="v-one">Vertical 1</TabsTrigger>
          <TabsTrigger value="v-two">Vertical 2</TabsTrigger>
        </TabsList>
        <TabsContent value="v-one">Vertical Content 1</TabsContent>
        <TabsContent value="v-two">Vertical Content 2</TabsContent>
      </Tabs>
    );

    const tab1 = screen.getByRole('tab', { name: /vertical 1/i });
    const tab2 = screen.getByRole('tab', { name: /vertical 2/i });

    act(() => {
      tab1.focus();
    });
    expect(document.activeElement).toBe(tab1);

    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(tab2);
    expect(tab2.getAttribute('aria-selected')).toBe('true');
  });

  it('9. navigates vertically to previous tab on Keyboard ArrowUp when orientation="vertical"', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="v-two" orientation="vertical">
        <TabsList>
          <TabsTrigger value="v-one">Vertical 1</TabsTrigger>
          <TabsTrigger value="v-two">Vertical 2</TabsTrigger>
        </TabsList>
        <TabsContent value="v-one">Vertical Content 1</TabsContent>
        <TabsContent value="v-two">Vertical Content 2</TabsContent>
      </Tabs>
    );

    const tab1 = screen.getByRole('tab', { name: /vertical 1/i });
    const tab2 = screen.getByRole('tab', { name: /vertical 2/i });

    act(() => {
      tab2.focus();
    });
    expect(document.activeElement).toBe(tab2);

    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(tab1);
    expect(tab1.getAttribute('aria-selected')).toBe('true');
  });

  it('10. jumps to first enabled tab on Keyboard Home', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="step-3">
        <TabsList>
          <TabsTrigger value="step-1">Step 1</TabsTrigger>
          <TabsTrigger value="step-2">Step 2</TabsTrigger>
          <TabsTrigger value="step-3">Step 3</TabsTrigger>
        </TabsList>
        <TabsContent value="step-1">Content 1</TabsContent>
        <TabsContent value="step-2">Content 2</TabsContent>
        <TabsContent value="step-3">Content 3</TabsContent>
      </Tabs>
    );

    const step1 = screen.getByRole('tab', { name: /step 1/i });
    const step3 = screen.getByRole('tab', { name: /step 3/i });

    act(() => {
      step3.focus();
    });
    expect(document.activeElement).toBe(step3);

    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(step1);
    expect(step1.getAttribute('aria-selected')).toBe('true');
  });

  it('11. jumps to last enabled tab on Keyboard End', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="step-1">
        <TabsList>
          <TabsTrigger value="step-1">Step 1</TabsTrigger>
          <TabsTrigger value="step-2">Step 2</TabsTrigger>
          <TabsTrigger value="step-3">Step 3</TabsTrigger>
        </TabsList>
        <TabsContent value="step-1">Content 1</TabsContent>
        <TabsContent value="step-2">Content 2</TabsContent>
        <TabsContent value="step-3">Content 3</TabsContent>
      </Tabs>
    );

    const step1 = screen.getByRole('tab', { name: /step 1/i });
    const step3 = screen.getByRole('tab', { name: /step 3/i });

    act(() => {
      step1.focus();
    });
    expect(document.activeElement).toBe(step1);

    await user.keyboard('{End}');
    expect(document.activeElement).toBe(step3);
    expect(step3.getAttribute('aria-selected')).toBe('true');
  });

  it('12. skips disabled tabs during keyboard navigation', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="t-1">
        <TabsList>
          <TabsTrigger value="t-1">Tab 1</TabsTrigger>
          <TabsTrigger value="t-2" disabled>Tab 2 Disabled</TabsTrigger>
          <TabsTrigger value="t-3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="t-1">Content 1</TabsContent>
        <TabsContent value="t-2">Content 2</TabsContent>
        <TabsContent value="t-3">Content 3</TabsContent>
      </Tabs>
    );

    const t1 = screen.getByRole('tab', { name: /tab 1/i });
    const t3 = screen.getByRole('tab', { name: /tab 3/i });

    act(() => {
      t1.focus();
    });
    expect(document.activeElement).toBe(t1);

    // ArrowRight bypasses disabled Tab 2 directly to Tab 3
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(t3);
    expect(t3.getAttribute('aria-selected')).toBe('true');
  });

  it('13. manual activation moves focus without selecting until Enter or Space is pressed', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="m-1" activationMode="manual">
        <TabsList>
          <TabsTrigger value="m-1">Manual 1</TabsTrigger>
          <TabsTrigger value="m-2">Manual 2</TabsTrigger>
        </TabsList>
        <TabsContent value="m-1">Manual Content 1</TabsContent>
        <TabsContent value="m-2">Manual Content 2</TabsContent>
      </Tabs>
    );

    const m1 = screen.getByRole('tab', { name: /manual 1/i });
    const m2 = screen.getByRole('tab', { name: /manual 2/i });

    act(() => {
      m1.focus();
    });
    expect(document.activeElement).toBe(m1);

    // ArrowRight moves focus to m-2 without activating it
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(m2);
    expect(m1.getAttribute('aria-selected')).toBe('true');
    expect(m2.getAttribute('aria-selected')).toBe('false');

    // Pressing Enter activates the focused tab
    await user.keyboard('{Enter}');
    expect(m2.getAttribute('aria-selected')).toBe('true');
    expect(m1.getAttribute('aria-selected')).toBe('false');
    expect(screen.getByText('Manual Content 2').hasAttribute('hidden')).toBe(false);
  });

  it('14. automatic activation selects during keyboard navigation', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a-1" activationMode="automatic">
        <TabsList>
          <TabsTrigger value="a-1">Auto 1</TabsTrigger>
          <TabsTrigger value="a-2">Auto 2</TabsTrigger>
        </TabsList>
        <TabsContent value="a-1">Auto Content 1</TabsContent>
        <TabsContent value="a-2">Auto Content 2</TabsContent>
      </Tabs>
    );

    const a1 = screen.getByRole('tab', { name: /auto 1/i });
    const a2 = screen.getByRole('tab', { name: /auto 2/i });

    act(() => {
      a1.focus();
    });
    await user.keyboard('{ArrowRight}');

    expect(document.activeElement).toBe(a2);
    expect(a2.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Auto Content 2').hasAttribute('hidden')).toBe(false);
  });

  it('15. disabled tabs cannot be activated via mouse click or keyboard', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="enabled-tab">
        <TabsList>
          <TabsTrigger value="enabled-tab">Active</TabsTrigger>
          <TabsTrigger value="disabled-tab" disabled>Disabled Tab</TabsTrigger>
        </TabsList>
        <TabsContent value="enabled-tab">Active Content</TabsContent>
        <TabsContent value="disabled-tab">Disabled Content</TabsContent>
      </Tabs>
    );

    const activeTab = screen.getByRole('tab', { name: /active/i });
    const disabledTab = screen.getByRole('tab', { name: /disabled tab/i });

    expect(disabledTab.hasAttribute('disabled')).toBe(true);
    expect(disabledTab.getAttribute('data-disabled')).toBe('');

    await user.click(disabledTab);
    expect(disabledTab.getAttribute('aria-selected')).toBe('false');
    expect(activeTab.getAttribute('aria-selected')).toBe('true');
  });

  it('16. assigns correct WAI-ARIA roles, orientation, and selected states', () => {
    render(
      <Tabs defaultValue="tab-x" orientation="horizontal">
        <TabsList aria-label="Settings navigation">
          <TabsTrigger value="tab-x">Tab X</TabsTrigger>
          <TabsTrigger value="tab-y">Tab Y</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-x">Panel X</TabsContent>
        <TabsContent value="tab-y">Panel Y</TabsContent>
      </Tabs>
    );

    const list = screen.getByRole('tablist', { name: /settings navigation/i });
    expect(list.getAttribute('aria-orientation')).toBe('horizontal');

    const tabX = screen.getByRole('tab', { name: /tab x/i });
    const tabY = screen.getByRole('tab', { name: /tab y/i });

    expect(tabX.getAttribute('role')).toBe('tab');
    expect(tabX.getAttribute('aria-selected')).toBe('true');
    expect(tabY.getAttribute('role')).toBe('tab');
    expect(tabY.getAttribute('aria-selected')).toBe('false');
  });

  it('17. enforces correct trigger-to-panel relationships with aria-controls and aria-labelledby', () => {
    render(
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">Profile Details</TabsContent>
      </Tabs>
    );

    const trigger = screen.getByRole('tab', { name: /profile/i });
    const panel = screen.getByRole('tabpanel');

    const triggerControls = trigger.getAttribute('aria-controls');
    const panelId = panel.getAttribute('id');
    expect(triggerControls).toBe(panelId);

    const panelLabelledBy = panel.getAttribute('aria-labelledby');
    const triggerId = trigger.getAttribute('id');
    expect(panelLabelledBy).toBe(triggerId);
  });

  it('18. preserves and merges custom classNames across all subcomponents', () => {
    render(
      <Tabs defaultValue="custom-tab" className="custom-root-class">
        <TabsList className="custom-list-class">
          <TabsTrigger value="custom-tab" className="custom-trigger-class">
            Custom
          </TabsTrigger>
        </TabsList>
        <TabsContent value="custom-tab" className="custom-content-class">
          Custom Content
        </TabsContent>
      </Tabs>
    );

    const root = screen.getByRole('tablist').parentElement;
    expect(root?.className).toContain('custom-root-class');

    const list = screen.getByRole('tablist');
    expect(list.className).toContain('custom-list-class');

    const trigger = screen.getByRole('tab');
    expect(trigger.className).toContain('custom-trigger-class');

    const content = screen.getByRole('tabpanel');
    expect(content.className).toContain('custom-content-class');
  });

  it('19. adheres to FeedbackHub design token contracts and focus-visible styling', () => {
    render(
      <Tabs defaultValue="token-tab">
        <TabsList>
          <TabsTrigger value="token-tab">Token Tab</TabsTrigger>
        </TabsList>
        <TabsContent value="token-tab">Token Content</TabsContent>
      </Tabs>
    );

    const list = screen.getByRole('tablist');
    // List container token contracts
    expect(list.className).toContain('rounded-xl');
    expect(list.className).toContain('bg-surface-main');
    expect(list.className).toContain('border-border');

    const trigger = screen.getByRole('tab');
    // Trigger token contracts
    expect(trigger.className).toContain('rounded-[10px]');
    expect(trigger.className).toContain('data-[state=active]:bg-surface-card');
    expect(trigger.className).toContain('data-[state=active]:text-content-main');
    // Semantic focus ring token
    expect(trigger.className).toContain('focus-visible:ring-brand-primary');
    expect(trigger.className).toContain('focus-visible:ring-offset-1');

    const content = screen.getByRole('tabpanel');
    // Panel focus ring token
    expect(content.className).toContain('focus-visible:ring-brand-primary');
    expect(content.className).toContain('focus-visible:ring-offset-2');

    // Strict absence of arbitrary hardcoded slate colors
    expect(list.className).not.toContain('bg-slate-50');
    expect(list.className).not.toContain('bg-slate-100');
    expect(list.className).not.toContain('border-slate-300');
    expect(trigger.className).not.toContain('bg-slate-50');
    expect(trigger.className).not.toContain('bg-slate-100');
  });

  it('20. forwards refs to underlying HTML elements across Tabs, TabsList, TabsTrigger, and TabsContent', () => {
    const rootRef = React.createRef<HTMLDivElement>();
    const listRef = React.createRef<HTMLDivElement>();
    const triggerRef = React.createRef<HTMLButtonElement>();
    const contentRef = React.createRef<HTMLDivElement>();

    render(
      <Tabs ref={rootRef} defaultValue="ref-tab">
        <TabsList ref={listRef}>
          <TabsTrigger ref={triggerRef} value="ref-tab">
            Ref Trigger
          </TabsTrigger>
        </TabsList>
        <TabsContent ref={contentRef} value="ref-tab">
          Ref Content
        </TabsContent>
      </Tabs>
    );

    expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
    expect(listRef.current).toBeInstanceOf(HTMLDivElement);
    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it('21. keeps unselected content mounted when forceMount is provided', () => {
    render(
      <Tabs defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab-2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">First Panel</TabsContent>
        <TabsContent value="tab-2" forceMount>
          Second Panel Force Mounted
        </TabsContent>
      </Tabs>
    );

    // Second panel is inactive, but remains present in DOM due to forceMount with data-[state=inactive]:hidden
    const forcedPanel = screen.getByText('Second Panel Force Mounted');
    expect(forcedPanel).toBeTruthy();
    expect(forcedPanel.getAttribute('data-state')).toBe('inactive');
    expect(forcedPanel.className).toContain('data-[state=inactive]:hidden');
  });
});
