/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupLabel,
  RadioGroupDescription,
  RadioGroupIndicator,
} from '../RadioGroup';

afterEach(() => {
  cleanup();
});

describe('RadioGroup Component Primitive', () => {
  it('1. renders basic radiogroup container with role="radiogroup"', () => {
    render(
      <RadioGroup aria-label="Feedback type">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="bug" id="r-bug" />
          <RadioGroupLabel htmlFor="r-bug">Bug Report</RadioGroupLabel>
        </div>
      </RadioGroup>
    );

    const group = screen.getByRole('radiogroup', { name: /feedback type/i });
    expect(group).toBeTruthy();
    expect(group.tagName).toBe('DIV');
  });

  it('2. renders multiple radio options with role="radio"', () => {
    render(
      <RadioGroup aria-label="Satisfaction level">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="high" id="r-high" />
          <RadioGroupLabel htmlFor="r-high">High</RadioGroupLabel>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="medium" id="r-medium" />
          <RadioGroupLabel htmlFor="r-medium">Medium</RadioGroupLabel>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="low" id="r-low" />
          <RadioGroupLabel htmlFor="r-low">Low</RadioGroupLabel>
        </div>
      </RadioGroup>
    );

    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(3);
    radios.forEach((radio) => {
      expect(radio.getAttribute('type')).toBe('button');
      expect(radio.getAttribute('aria-checked')).toBe('false');
    });
  });

  it('3. supports uncontrolled default selection using defaultValue', () => {
    render(
      <RadioGroup defaultValue="csat" aria-label="Metric">
        <RadioGroupItem value="nps" aria-label="NPS" />
        <RadioGroupItem value="csat" aria-label="CSAT">
          <RadioGroupIndicator />
        </RadioGroupItem>
        <RadioGroupItem value="ces" aria-label="CES" />
      </RadioGroup>
    );

    const nps = screen.getByRole('radio', { name: /nps/i });
    const csat = screen.getByRole('radio', { name: /csat/i });

    expect(nps.getAttribute('aria-checked')).toBe('false');
    expect(csat.getAttribute('aria-checked')).toBe('true');
    expect(csat.getAttribute('data-state')).toBe('checked');
    expect(screen.getByTestId('radio-group-indicator-dot')).toBeTruthy();
  });

  it('4. supports controlled selection with value prop', () => {
    const Controlled = () => {
      const [val, setVal] = useState('weekly');
      return (
        <RadioGroup value={val} onValueChange={setVal} aria-label="Frequency">
          <RadioGroupItem value="daily" aria-label="Daily" />
          <RadioGroupItem value="weekly" aria-label="Weekly" />
        </RadioGroup>
      );
    };

    render(<Controlled />);
    const daily = screen.getByRole('radio', { name: /daily/i });
    const weekly = screen.getByRole('radio', { name: /weekly/i });

    expect(daily.getAttribute('aria-checked')).toBe('false');
    expect(weekly.getAttribute('aria-checked')).toBe('true');
  });

  it('5. invokes onValueChange callback with selected value', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <RadioGroup onValueChange={handleValueChange} aria-label="Priority">
        <RadioGroupItem value="low" aria-label="Low" />
        <RadioGroupItem value="high" aria-label="High" />
      </RadioGroup>
    );

    const high = screen.getByRole('radio', { name: /high/i });
    await user.click(high);

    expect(handleValueChange).toHaveBeenCalledTimes(1);
    expect(handleValueChange).toHaveBeenCalledWith('high');
  });

  it('6. changes selection and unchecks previous option', async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup defaultValue="opt1" aria-label="Options">
        <RadioGroupItem value="opt1" aria-label="Option 1" />
        <RadioGroupItem value="opt2" aria-label="Option 2" />
      </RadioGroup>
    );

    const opt1 = screen.getByRole('radio', { name: /option 1/i });
    const opt2 = screen.getByRole('radio', { name: /option 2/i });

    expect(opt1.getAttribute('aria-checked')).toBe('true');
    expect(opt2.getAttribute('aria-checked')).toBe('false');

    await user.click(opt2);

    expect(opt1.getAttribute('aria-checked')).toBe('false');
    expect(opt2.getAttribute('aria-checked')).toBe('true');
  });

  it('7. applies horizontal orientation classes and attribute', () => {
    render(
      <RadioGroup orientation="horizontal" aria-label="Horizontal Group">
        <RadioGroupItem value="h1" aria-label="H1" />
        <RadioGroupItem value="h2" aria-label="H2" />
      </RadioGroup>
    );

    const group = screen.getByRole('radiogroup');
    expect(group.getAttribute('aria-orientation')).toBe('horizontal');
    expect(group.className).toContain('flex-row');
    expect(group.className).toContain('flex-wrap');
    expect(group.className).toContain('gap-4');
  });

  it('8. applies vertical orientation by default', () => {
    render(
      <RadioGroup aria-label="Vertical Group">
        <RadioGroupItem value="v1" aria-label="V1" />
        <RadioGroupItem value="v2" aria-label="V2" />
      </RadioGroup>
    );

    const group = screen.getByRole('radiogroup');
    expect(group.className).toContain('grid');
    expect(group.className).toContain('gap-2.5');
  });

  it('9. disables entire group when disabled prop is set on root', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <RadioGroup disabled onValueChange={handleValueChange} aria-label="Disabled Group">
        <RadioGroupItem value="d1" aria-label="Disabled 1" />
        <RadioGroupItem value="d2" aria-label="Disabled 2" />
      </RadioGroup>
    );

    const radios = screen.getAllByRole('radio') as HTMLButtonElement[];
    radios.forEach((radio) => {
      expect(radio.disabled).toBe(true);
      expect(radio.getAttribute('data-disabled')).toBe('');
      expect(radio.className).toContain('disabled:cursor-not-allowed');
      expect(radio.className).toContain('disabled:opacity-50');
    });

    await user.click(radios[0]);
    expect(handleValueChange).not.toHaveBeenCalled();
    expect(radios[0].getAttribute('aria-checked')).toBe('false');
  });

  it('10. disables individual option while other options remain enabled', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <RadioGroup onValueChange={handleValueChange} aria-label="Mixed Group">
        <RadioGroupItem value="enabled" aria-label="Enabled Option" />
        <RadioGroupItem value="disabled" disabled aria-label="Disabled Option" />
      </RadioGroup>
    );

    const enabledRadio = screen.getByRole('radio', { name: /enabled option/i }) as HTMLButtonElement;
    const disabledRadio = screen.getByRole('radio', { name: /disabled option/i }) as HTMLButtonElement;

    expect(enabledRadio.disabled).toBe(false);
    expect(disabledRadio.disabled).toBe(true);
    expect(disabledRadio.getAttribute('data-disabled')).toBe('');

    await user.click(enabledRadio);
    expect(handleValueChange).toHaveBeenCalledWith('enabled');
  });

  it('11. prevents selection of disabled individual options', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <RadioGroup onValueChange={handleValueChange} aria-label="Disabled Option Group">
        <RadioGroupItem value="opt-a" aria-label="Option A" />
        <RadioGroupItem value="opt-b" disabled aria-label="Option B" />
      </RadioGroup>
    );

    const disabledOption = screen.getByRole('radio', { name: /option b/i });
    await user.click(disabledOption);

    expect(handleValueChange).not.toHaveBeenCalled();
    expect(disabledOption.getAttribute('aria-checked')).toBe('false');
  });

  it('12. associates accessible group label via RadioGroupLabel', () => {
    render(
      <div>
        <RadioGroupLabel id="survey-title">Feedback Frequency</RadioGroupLabel>
        <RadioGroup aria-labelledby="survey-title">
          <RadioGroupItem value="m" id="r-m" />
          <RadioGroupLabel htmlFor="r-m">Monthly</RadioGroupLabel>
        </RadioGroup>
      </div>
    );

    const group = screen.getByRole('radiogroup', { name: /feedback frequency/i });
    expect(group).toBeTruthy();
    expect(group.getAttribute('aria-labelledby')).toBe('survey-title');
  });

  it('13. associates accessible group description via RadioGroupDescription', () => {
    render(
      <div>
        <RadioGroup aria-label="Region" aria-describedby="region-hint">
          <RadioGroupItem value="us" aria-label="US" />
          <RadioGroupItem value="eu" aria-label="EU" />
        </RadioGroup>
        <RadioGroupDescription id="region-hint">
          Data residency location for surveys
        </RadioGroupDescription>
      </div>
    );

    const group = screen.getByRole('radiogroup');
    expect(group.getAttribute('aria-describedby')).toBe('region-hint');
    expect(screen.getByText('Data residency location for surveys')).toBeTruthy();
  });

  it('14. applies required attribute and aria-required semantics', () => {
    render(
      <RadioGroup required aria-label="Mandatory Rating">
        <RadioGroupItem value="1" aria-label="Star 1" />
        <RadioGroupItem value="2" aria-label="Star 2" />
      </RadioGroup>
    );

    const group = screen.getByRole('radiogroup');
    expect(group.getAttribute('aria-required')).toBe('true');
  });

  it('15. supports form integration with name and selected value', () => {
    render(
      <form data-testid="test-form">
        <RadioGroup name="satisfaction" defaultValue="satisfied" aria-label="Satisfaction">
          <RadioGroupItem value="satisfied" aria-label="Satisfied" />
          <RadioGroupItem value="neutral" aria-label="Neutral" />
        </RadioGroup>
      </form>
    );

    const form = screen.getByTestId('test-form');
    // Radix mounts an input[type="radio"] bubble input for HTML form submission
    const input = form.querySelector('input[name="satisfaction"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.name).toBe('satisfaction');
    expect(input.value).toBe('satisfied');
    expect(input.checked).toBe(true);
  });

  it('16. merges custom className cleanly with design tokens via cn', () => {
    render(
      <RadioGroup className="my-custom-group" aria-label="Custom Style Group">
        <RadioGroupItem
          value="custom"
          className="my-custom-item scale-110"
          aria-label="Custom Item"
        />
      </RadioGroup>
    );

    const group = screen.getByRole('radiogroup');
    expect(group.className).toContain('my-custom-group');
    expect(group.className).toContain('grid');

    const item = screen.getByRole('radio');
    expect(item.className).toContain('my-custom-item');
    expect(item.className).toContain('scale-110');
    // Base design token classes preserved
    expect(item.className).toContain('rounded-full');
    expect(item.className).toContain('border-border');
  });

  it('17. forwards React refs correctly to underlying DOM elements', () => {
    const groupRef = React.createRef<HTMLDivElement>();
    const itemRef = React.createRef<HTMLButtonElement>();

    render(
      <RadioGroup ref={groupRef} aria-label="Ref Group">
        <RadioGroupItem ref={itemRef} value="ref-val" aria-label="Ref Item" />
      </RadioGroup>
    );

    expect(groupRef.current).toBeInstanceOf(HTMLDivElement);
    expect(groupRef.current?.getAttribute('role')).toBe('radiogroup');

    expect(itemRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(itemRef.current?.getAttribute('role')).toBe('radio');
  });

  it('18. navigates between enabled options using arrow keys', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <RadioGroup
        defaultValue="opt-1"
        onValueChange={handleValueChange}
        aria-label="Arrow Navigation"
      >
        <RadioGroupItem value="opt-1" aria-label="Option 1" />
        <RadioGroupItem value="opt-2" aria-label="Option 2" />
        <RadioGroupItem value="opt-3" aria-label="Option 3" />
      </RadioGroup>
    );

    const opt1 = screen.getByRole('radio', { name: /option 1/i });
    const opt2 = screen.getByRole('radio', { name: /option 2/i });
    const opt3 = screen.getByRole('radio', { name: /option 3/i });

    act(() => {
      opt1.focus();
    });
    expect(document.activeElement).toBe(opt1);

    // ArrowDown navigates focus to option 2
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(opt2);

    // Space selects focused option 2
    await user.keyboard(' ');
    expect(opt2.getAttribute('aria-checked')).toBe('true');
    expect(handleValueChange).toHaveBeenCalledWith('opt-2');

    // ArrowDown navigates focus to option 3
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(opt3);

    // Space selects focused option 3
    await user.keyboard(' ');
    expect(opt3.getAttribute('aria-checked')).toBe('true');
    expect(handleValueChange).toHaveBeenCalledWith('opt-3');
  });

  it('19. selects focused option using Space key', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <RadioGroup onValueChange={handleValueChange} aria-label="Space Selection">
        <RadioGroupItem value="first" aria-label="First" />
        <RadioGroupItem value="second" aria-label="Second" />
      </RadioGroup>
    );

    const first = screen.getByRole('radio', { name: /first/i });
    act(() => {
      first.focus();
    });
    expect(document.activeElement).toBe(first);

    await user.keyboard(' ');

    expect(first.getAttribute('aria-checked')).toBe('true');
    expect(handleValueChange).toHaveBeenCalledWith('first');
  });

  it('20. jumps to first and last items using Home and End keys', async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup defaultValue="item-2" aria-label="Home End Navigation">
        <RadioGroupItem value="item-1" aria-label="Item 1" />
        <RadioGroupItem value="item-2" aria-label="Item 2" />
        <RadioGroupItem value="item-3" aria-label="Item 3" />
      </RadioGroup>
    );

    const item1 = screen.getByRole('radio', { name: /item 1/i });
    const item2 = screen.getByRole('radio', { name: /item 2/i });
    const item3 = screen.getByRole('radio', { name: /item 3/i });

    act(() => {
      item2.focus();
    });
    expect(document.activeElement).toBe(item2);

    // End jumps focus to last item
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(item3);

    // Home jumps focus to first item
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(item1);
  });

  it('21. skips disabled options during keyboard arrow navigation', async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup defaultValue="step-1" aria-label="Skip Disabled">
        <RadioGroupItem value="step-1" aria-label="Step 1" />
        <RadioGroupItem value="step-2" disabled aria-label="Step 2" />
        <RadioGroupItem value="step-3" aria-label="Step 3" />
      </RadioGroup>
    );

    const step1 = screen.getByRole('radio', { name: /step 1/i });
    const step3 = screen.getByRole('radio', { name: /step 3/i });

    act(() => {
      step1.focus();
    });
    expect(document.activeElement).toBe(step1);

    // ArrowDown skips disabled step-2 directly to step-3
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(step3);

    // Space selects focused step-3
    await user.keyboard(' ');
    expect(step3.getAttribute('aria-checked')).toBe('true');
  });

  it('22. enforces focus-visible and token styling contracts', () => {
    render(
      <RadioGroup aria-label="Contract Test">
        <RadioGroupItem value="val" data-testid="styled-radio" aria-label="Styled Radio" />
      </RadioGroup>
    );

    const radio = screen.getByTestId('styled-radio');
    // Design system tokens
    expect(radio.className).toContain('rounded-full');
    expect(radio.className).toContain('bg-surface-card');
    expect(radio.className).toContain('border-border');
    expect(radio.className).toContain('data-[state=checked]:border-brand-primary');
    // Semantic focus ring token
    expect(radio.className).toContain('focus-visible:ring-brand-primary');
    expect(radio.className).toContain('focus-visible:ring-offset-1');
    // Absence of hardcoded arbitrary slate colors
    expect(radio.className).not.toContain('bg-slate-50');
    expect(radio.className).not.toContain('bg-slate-100');
    expect(radio.className).not.toContain('border-slate-300');
  });
});
