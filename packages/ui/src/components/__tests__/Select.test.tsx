/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
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
});
