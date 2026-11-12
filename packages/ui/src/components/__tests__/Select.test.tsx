/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import React, { useState } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '../Select';

afterEach(() => {
  cleanup();
  if (typeof document !== 'undefined') {
    document.body.style.pointerEvents = '';
    document.body.removeAttribute('data-scroll-locked');
    document.body.removeAttribute('data-radix-scroll-lock');
    document.body.removeAttribute('aria-hidden');
  }
});

describe('Select Component Primitive', () => {
  it('1. renders the Select component with trigger', () => {
    render(
      <Select>
        <SelectTrigger aria-label="Feedback Category">
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="product">Product Feedback</SelectItem>
          <SelectItem value="support">Customer Support</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox', { name: /feedback category/i });
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('2. displays placeholder visibility when no value is selected', () => {
    render(
      <Select>
        <SelectTrigger aria-label="Department">
          <SelectValue placeholder="Choose department..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="eng">Engineering</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByText('Choose department...')).toBeTruthy();
  });

  it('3. displays default selected value when defaultValue is provided', () => {
    render(
      <Select defaultValue="billing">
        <SelectTrigger aria-label="Topic">
          <SelectValue placeholder="Select topic" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="general">General Inquiry</SelectItem>
          <SelectItem value="billing">Billing & Invoices</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByText('Billing & Invoices')).toBeTruthy();
  });

  it('4. supports controlled selection with value and onValueChange', () => {
    const ControlledSelect = () => {
      const [val, setVal] = useState('low');
      return (
        <div>
          <span data-testid="selected-display">Priority: {val}</span>
          <Select value={val} onValueChange={setVal}>
            <SelectTrigger aria-label="Priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    };

    render(<ControlledSelect />);
    expect(screen.getByTestId('selected-display').textContent).toBe('Priority: low');

    const trigger = screen.getByRole('combobox', { name: /priority/i });
    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });

    const highOption = screen.getByRole('option', { name: /high priority/i });
    fireEvent.click(highOption);

    expect(screen.getByTestId('selected-display').textContent).toBe('Priority: high');
  });

  it('5. supports uncontrolled selection updating value internally', async () => {
    render(
      <Select>
        <SelectTrigger aria-label="Role">
          <SelectValue placeholder="Pick role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Administrator</SelectItem>
          <SelectItem value="member">Team Member</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox', { name: /role/i });
    expect(screen.getByText('Pick role')).toBeTruthy();

    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
    const adminOption = screen.getByRole('option', { name: /administrator/i });
    fireEvent.click(adminOption);

    await waitFor(() => {
      expect(screen.getByText('Administrator')).toBeTruthy();
    });
  });

  it('6. selecting an option closes the dropdown listbox', async () => {
    render(
      <Select>
        <SelectTrigger aria-label="Status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox', { name: /status/i });
    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });

    expect(screen.getByRole('listbox')).toBeTruthy();
    const openOption = screen.getByRole('option', { name: /open/i });
    fireEvent.click(openOption);

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });

  it('7. enforces disabled state on SelectTrigger and prevents opening', () => {
    render(
      <Select disabled>
        <SelectTrigger aria-label="Disabled Select">
          <SelectValue placeholder="Locked" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="opt">Option</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox', { name: /disabled select/i }) as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
    expect(trigger.className).toContain('disabled:cursor-not-allowed');
    expect(trigger.className).toContain('disabled:bg-transparent');
    expect(trigger.className).not.toContain('disabled:bg-slate-50');

    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('8. supports disabled individual options that cannot be selected', () => {
    const handleValueChange = vi.fn();

    render(
      <Select onValueChange={handleValueChange}>
        <SelectTrigger aria-label="Tier">
          <SelectValue placeholder="Select Tier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="free">Free Tier</SelectItem>
          <SelectItem value="enterprise" disabled>
            Enterprise Tier (Contact Sales)
          </SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox', { name: /tier/i });
    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });

    const disabledOption = screen.getByRole('option', {
      name: /enterprise tier/i,
    });
    expect(disabledOption.getAttribute('aria-disabled')).toBe('true');
    expect(disabledOption.getAttribute('data-disabled')).toBe('');

    fireEvent.click(disabledOption);
    expect(handleValueChange).not.toHaveBeenCalled();
    // Dropdown remains open
    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('9. supports keyboard opening via ArrowDown from trigger', () => {
    render(
      <Select>
        <SelectTrigger aria-label="Audience">
          <SelectValue placeholder="Audience" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="customers">Customers</SelectItem>
          <SelectItem value="employees">Employees</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox', { name: /audience/i });
    expect(screen.queryByRole('listbox')).toBeNull();

    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('10. supports keyboard selection with Enter key', async () => {
    const handleSelect = vi.fn();

    render(
      <Select onValueChange={handleSelect}>
        <SelectTrigger aria-label="Channel">
          <SelectValue placeholder="Select channel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="email">Email Campaign</SelectItem>
          <SelectItem value="sms">SMS Prompt</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox', { name: /channel/i });
    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });

    const emailOption = screen.getByRole('option', { name: /email campaign/i });
    fireEvent.keyDown(emailOption, { key: 'Enter', code: 'Enter' });

    expect(handleSelect).toHaveBeenCalledWith('email');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });

  it('11. closes dropdown when Escape key is pressed', async () => {
    render(
      <Select>
        <SelectTrigger aria-label="Filter">
          <SelectValue placeholder="Filter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Responses</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox', { name: /filter/i });
    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeTruthy();

    fireEvent.keyDown(listbox, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });

  it('12. restores focus to trigger button after selection or dismissal', async () => {
    render(
      <Select>
        <SelectTrigger aria-label="Restoration Target" data-testid="target-trigger">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="item1">Item 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByTestId('target-trigger');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
    const option = screen.getByRole('option', { name: /item 1/i });
    fireEvent.click(option);

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('13. provides accessible roles (combobox, listbox, option) and aria-expanded state', () => {
    render(
      <Select>
        <SelectTrigger aria-label="Accessible Roles Test">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="val1">Value One</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeTruthy();

    const option = screen.getByRole('option', { name: /value one/i });
    expect(option).toBeTruthy();
  });

  it('14. supports error state and sets aria-invalid on the trigger', () => {
    render(
      <Select>
        <SelectTrigger aria-label="Required Survey" error="Please select a survey">
          <SelectValue placeholder="Choose survey..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="s1">Quarterly NPS</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.className).toContain('border-semantic-error');
    expect(trigger.className).toContain('text-semantic-error');
  });

  it('15. preserves externally supplied aria-describedby on the trigger', () => {
    render(
      <div>
        <p id="survey-help-text">This will determine survey logic routing</p>
        <Select>
          <SelectTrigger
            aria-label="Route Select"
            aria-describedby="survey-help-text"
          >
            <SelectValue placeholder="Route" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="r1">Route A</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger.getAttribute('aria-describedby')).toBe('survey-help-text');
  });

  it('16. renders option groups, section labels and visual separators', () => {
    render(
      <Select defaultValue="csat">
        <SelectTrigger aria-label="Metrics">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Customer Metrics</SelectLabel>
            <SelectItem value="nps">Net Promoter Score (NPS)</SelectItem>
            <SelectItem value="csat">Customer Satisfaction (CSAT)</SelectItem>
          </SelectGroup>
          <SelectSeparator data-testid="select-separator" />
          <SelectGroup>
            <SelectLabel>Employee Metrics</SelectLabel>
            <SelectItem value="enps">Employee NPS (eNPS)</SelectItem>
            <SelectItem value="pulse">Pulse Survey</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });

    expect(screen.getByText('Customer Metrics')).toBeTruthy();
    expect(screen.getByText('Employee Metrics')).toBeTruthy();
    expect(screen.getByTestId('select-separator')).toBeTruthy();
  });

  it('17. renders long option labels cleanly with text truncation support', () => {
    const longLabel =
      'Very Long Feedback Category Description For Enterprise Multi-Region Deployment Plans';

    render(
      <Select>
        <SelectTrigger aria-label="Long Option Select">
          <SelectValue placeholder="Choose category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="long">{longLabel}</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });

    const option = screen.getByRole('option', { name: new RegExp(longLabel, 'i') });
    expect(option).toBeTruthy();
    expect(option.textContent).toContain(longLabel);
  });

  it('18. provides scroll controls within SelectContent when scrolling is applicable', () => {
    render(
      <Select defaultOpen>
        <SelectTrigger aria-label="Scroll Test">
          <SelectValue placeholder="Scroll" />
        </SelectTrigger>
        <SelectContent data-testid="scroll-content">
          {Array.from({ length: 25 }).map((_, i) => (
            <SelectItem key={i} value={`item-${i}`}>
              Option Item {i + 1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );

    const content = screen.getByTestId('scroll-content');
    expect(content).toBeTruthy();
    expect(screen.getAllByRole('option').length).toBe(25);
  });

  it('19. navigates sequentially forward between options with ArrowDown key', async () => {
    render(
      <Select>
        <SelectTrigger aria-label="Sequential Down">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="opt1">Option One</SelectItem>
          <SelectItem value="opt2">Option Two</SelectItem>
          <SelectItem value="opt3">Option Three</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox', { name: /sequential down/i });
    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });

    const items = screen.getAllByRole('option');
    act(() => {
      items[0].focus();
    });
    expect(document.activeElement).toBe(items[0]);

    act(() => {
      fireEvent.keyDown(items[0], { key: 'ArrowDown', code: 'ArrowDown' });
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(items[1]);
    });

    act(() => {
      fireEvent.keyDown(items[1], { key: 'ArrowDown', code: 'ArrowDown' });
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(items[2]);
    });
  });

  it('20. navigates sequentially backward between options with ArrowUp key', async () => {
    render(
      <Select>
        <SelectTrigger aria-label="Sequential Up">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="step1">Step 1</SelectItem>
          <SelectItem value="step2">Step 2</SelectItem>
          <SelectItem value="step3">Step 3</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox', { name: /sequential up/i });
    act(() => {
      fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
    });

    const items = screen.getAllByRole('option');
    act(() => {
      items[2].focus();
    });
    expect(document.activeElement).toBe(items[2]);

    act(() => {
      fireEvent.keyDown(items[2], { key: 'ArrowUp', code: 'ArrowUp' });
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(items[1]);
    });

    act(() => {
      fireEvent.keyDown(items[1], { key: 'ArrowUp', code: 'ArrowUp' });
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(items[0]);
    });
  });

  it('21. jumps directly to the first enabled option with Home key', async () => {
    render(
      <Select>
        <SelectTrigger aria-label="Home Navigation">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="first">First Option</SelectItem>
          <SelectItem value="middle">Middle Option</SelectItem>
          <SelectItem value="last">Last Option</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox', { name: /home navigation/i });
    act(() => {
      fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
    });

    const items = screen.getAllByRole('option');
    act(() => {
      items[2].focus();
    });
    expect(document.activeElement).toBe(items[2]);

    act(() => {
      fireEvent.keyDown(items[2], { key: 'Home', code: 'Home' });
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(items[0]);
    });
  });

  it('22. jumps directly to the last enabled option with End key', async () => {
    render(
      <Select>
        <SelectTrigger aria-label="End Navigation">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="item-a">Alpha</SelectItem>
          <SelectItem value="item-b">Beta</SelectItem>
          <SelectItem value="item-c">Omega</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox', { name: /end navigation/i });
    act(() => {
      fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
    });

    const items = screen.getAllByRole('option');
    act(() => {
      items[0].focus();
    });
    expect(document.activeElement).toBe(items[0]);

    act(() => {
      fireEvent.keyDown(items[0], { key: 'End', code: 'End' });
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(items[2]);
    });
  });

  it('23. selects the highlighted option using Space key', async () => {
    const handleSelect = vi.fn();

    render(
      <Select onValueChange={handleSelect}>
        <SelectTrigger aria-label="Space Selection">
          <SelectValue placeholder="Select method" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="credit">Credit Card</SelectItem>
          <SelectItem value="paypal">PayPal</SelectItem>
          <SelectItem value="wire">Wire Transfer</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox', { name: /space selection/i });
    act(() => {
      fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
    });

    const items = screen.getAllByRole('option');
    act(() => {
      items[1].focus();
    });

    act(() => {
      fireEvent.keyDown(items[1], { key: ' ', code: 'Space' });
    });

    expect(handleSelect).toHaveBeenCalledWith('paypal');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });

  it('24. skips disabled options during keyboard ArrowDown navigation', async () => {
    render(
      <Select>
        <SelectTrigger aria-label="Skip Disabled">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="avail1">Available Plan A</SelectItem>
          <SelectItem value="unavail" disabled>
            Unavailable Legacy Plan
          </SelectItem>
          <SelectItem value="avail2">Available Plan B</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox', { name: /skip disabled/i });
    act(() => {
      fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
    });

    const items = screen.getAllByRole('option');
    act(() => {
      items[0].focus();
    });
    expect(document.activeElement).toBe(items[0]);

    act(() => {
      fireEvent.keyDown(items[0], { key: 'ArrowDown', code: 'ArrowDown' });
    });
    // Should skip index 1 (disabled) and land on index 2 directly
    await waitFor(() => {
      expect(document.activeElement).toBe(items[2]);
    });
  });

  it('25. navigates smoothly across grouped options with keyboard', async () => {
    render(
      <Select>
        <SelectTrigger aria-label="Region Select">
          <SelectValue placeholder="Region" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>North America</SelectLabel>
            <SelectItem value="us-east">US East</SelectItem>
            <SelectItem value="us-west">US West</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Europe</SelectLabel>
            <SelectItem value="eu-central">EU Central</SelectItem>
            <SelectItem value="eu-west">EU West</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox', { name: /region select/i });
    act(() => {
      fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
    });

    const items = screen.getAllByRole('option');
    // items[1] is 'us-west' (last item of group 1)
    act(() => {
      items[1].focus();
    });
    expect(document.activeElement).toBe(items[1]);

    // Press ArrowDown to cross separator into group 2
    act(() => {
      fireEvent.keyDown(items[1], { key: 'ArrowDown', code: 'ArrowDown' });
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(items[2]);
    });
    expect(items[2].textContent).toContain('EU Central');
  });

  it('26. restores focus specifically to the trigger button when Escape is pressed while dropdown is open', async () => {
    render(
      <Select>
        <SelectTrigger aria-label="Escape Test Trigger" data-testid="escape-trigger">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="e1">Item Alpha</SelectItem>
          <SelectItem value="e2">Item Beta</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByTestId('escape-trigger');
    act(() => {
      trigger.focus();
    });
    expect(document.activeElement).toBe(trigger);

    act(() => {
      fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
    });
    expect(screen.getByRole('listbox')).toBeTruthy();

    const items = screen.getAllByRole('option');
    act(() => {
      items[0].focus();
    });
    expect(document.activeElement).toBe(items[0]);

    act(() => {
      fireEvent.keyDown(items[0], { key: 'Escape', code: 'Escape' });
    });

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('27. renders multiple options naturally in the viewport without single-trigger height constraint', () => {
    render(
      <Select defaultOpen>
        <SelectTrigger aria-label="Multi Option Viewport">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent data-testid="multi-viewport-content">
          {Array.from({ length: 12 }).map((_, i) => (
            <SelectItem key={i} value={`opt-${i}`}>
              Dropdown Category Item #{i + 1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );

    const options = screen.getAllByRole('option');
    expect(options.length).toBe(12);

    // Verify that the Viewport does NOT contain the legacy buggy trigger-height constraint
    const content = screen.getByTestId('multi-viewport-content');
    expect(content.innerHTML).not.toContain('h-[var(--radix-select-trigger-height)]');
    // Verify it applies available height
    expect(content.className).toContain('max-h-[var(--radix-select-content-available-height)]');
  });

  it('28. applies Radix available content height and trigger width CSS variables without redundant background classes', () => {
    // Note: In jsdom, layout geometry (clientWidth/clientHeight) is not computed by a real browser engine.
    // This test verifies DOM structure, design token class assignments, and Radix CSS custom property integration.
    render(
      <Select defaultOpen>
        <SelectTrigger aria-label="Token Test" data-testid="token-trigger">
          <SelectValue placeholder="Tokens" />
        </SelectTrigger>
        <SelectContent data-testid="token-content">
          <SelectItem value="item-1">Clean Token Item</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByTestId('token-trigger');
    // Ensure bg-surface-card is present and redundant bg-white is removed
    expect(trigger.className).toContain('bg-surface-card');
    expect(trigger.className).not.toContain('bg-surface-card bg-white');

    const content = screen.getByTestId('token-content');
    expect(content.className).toContain('bg-surface-card');
    expect(content.className).not.toContain('bg-surface-card bg-white');
    expect(content.className).toContain('max-h-[var(--radix-select-content-available-height)]');

    const item = screen.getByRole('option', { name: /clean token item/i });
    expect(item.className).toContain('focus:bg-[var(--color-hover-overlay)]');
  });

  it('29. enforces strict design token consistency for interaction states without hardcoded slate classes', () => {
    const { unmount } = render(
      <Select disabled>
        <SelectTrigger aria-label="Token Consistency Trigger" data-testid="token-consistency-trigger">
          <SelectValue placeholder="Pick token" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="opt-a">Token Option A</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByTestId('token-consistency-trigger');
    // Semantic border tokens on trigger
    expect(trigger.className).toContain('border-border');
    expect(trigger.className).toContain('hover:border-border');
    // Disabled state uses neutral transparency rather than hardcoded slate-50
    expect(trigger.className).toContain('disabled:bg-transparent');
    expect(trigger.className).not.toContain('disabled:bg-slate-50');
    expect(trigger.className).not.toContain('hover:border-slate-300');

    unmount();

    render(
      <Select defaultOpen>
        <SelectTrigger aria-label="Open Token Trigger">
          <SelectValue placeholder="Open" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="opt-a" data-testid="token-consistency-item">
            Token Option A
          </SelectItem>
        </SelectContent>
      </Select>
    );

    // Item focus background uses shared hover overlay variable rather than hardcoded slate
    const item = screen.getByTestId('token-consistency-item');
    expect(item.className).toContain('focus:bg-[var(--color-hover-overlay)]');
    expect(item.className).not.toContain('focus:bg-slate-100');
    expect(item.className).not.toContain('focus:bg-slate-100/80');
  });
});
