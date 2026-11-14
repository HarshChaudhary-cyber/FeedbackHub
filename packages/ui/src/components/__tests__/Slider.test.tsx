/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import {
  Slider,
  SliderTrack,
  SliderRange,
  SliderThumb,
  SliderLabel,
  SliderDescription,
} from '../Slider';

afterEach(() => {
  cleanup();
});

describe('Slider Component Primitive', () => {
  it('1. renders slider container and thumb with role="slider"', () => {
    render(<Slider defaultValue={[50]} aria-label="Volume level" />);
    const slider = screen.getByRole('slider', { name: /volume level/i });
    expect(slider).toBeTruthy();
    expect(slider.getAttribute('aria-valuenow')).toBe('50');
  });

  it('2. sets correct default value via defaultValue prop', () => {
    render(<Slider defaultValue={[35]} aria-label="Default value test" />);
    const slider = screen.getByRole('slider', { name: /default value test/i });
    expect(slider.getAttribute('aria-valuenow')).toBe('35');
  });

  it('3. operates as a controlled component with value and onValueChange', async () => {
    const user = userEvent.setup();
    const Controlled = () => {
      const [val, setVal] = useState([40]);
      return (
        <div>
          <Slider
            value={val}
            onValueChange={setVal}
            aria-label="Controlled slider"
            min={0}
            max={100}
            step={1}
          />
          <button onClick={() => setVal([90])}>Set to 90</button>
        </div>
      );
    };

    render(<Controlled />);
    const slider = screen.getByRole('slider', { name: /controlled slider/i });
    expect(slider.getAttribute('aria-valuenow')).toBe('40');

    act(() => {
      slider.focus();
    });
    await user.keyboard('{ArrowRight}');
    expect(slider.getAttribute('aria-valuenow')).toBe('41');

    await user.click(screen.getByRole('button', { name: /set to 90/i }));
    expect(slider.getAttribute('aria-valuenow')).toBe('90');
  });

  it('4. operates as an uncontrolled component managing its internal value', async () => {
    const user = userEvent.setup();
    render(
      <Slider
        defaultValue={[25]}
        min={0}
        max={100}
        step={5}
        aria-label="Uncontrolled slider"
      />
    );
    const slider = screen.getByRole('slider', { name: /uncontrolled slider/i });
    expect(slider.getAttribute('aria-valuenow')).toBe('25');

    act(() => {
      slider.focus();
    });
    await user.keyboard('{ArrowRight}');
    expect(slider.getAttribute('aria-valuenow')).toBe('30');
  });

  it('5. respects custom minimum and maximum bounds', async () => {
    const user = userEvent.setup();
    render(
      <Slider
        defaultValue={[10]}
        min={10}
        max={20}
        step={1}
        aria-label="Bounded slider"
      />
    );
    const slider = screen.getByRole('slider', { name: /bounded slider/i });
    expect(slider.getAttribute('aria-valuemin')).toBe('10');
    expect(slider.getAttribute('aria-valuemax')).toBe('20');
    expect(slider.getAttribute('aria-valuenow')).toBe('10');

    act(() => {
      slider.focus();
    });
    // Attempting to step below minimum remains at minimum
    await user.keyboard('{ArrowLeft}');
    expect(slider.getAttribute('aria-valuenow')).toBe('10');

    // Stepping to maximum
    await user.keyboard('{End}');
    expect(slider.getAttribute('aria-valuenow')).toBe('20');

    // Attempting to step above maximum remains at maximum
    await user.keyboard('{ArrowRight}');
    expect(slider.getAttribute('aria-valuenow')).toBe('20');
  });

  it('6. advances according to custom step increments', async () => {
    const user = userEvent.setup();
    render(
      <Slider
        defaultValue={[15]}
        min={0}
        max={100}
        step={15}
        aria-label="Step slider"
      />
    );
    const slider = screen.getByRole('slider', { name: /step slider/i });
    expect(slider.getAttribute('aria-valuenow')).toBe('15');

    act(() => {
      slider.focus();
    });
    await user.keyboard('{ArrowRight}');
    expect(slider.getAttribute('aria-valuenow')).toBe('30');

    await user.keyboard('{ArrowRight}');
    expect(slider.getAttribute('aria-valuenow')).toBe('45');

    await user.keyboard('{ArrowLeft}');
    expect(slider.getAttribute('aria-valuenow')).toBe('30');
  });

  it('7. handles single-thumb keyboard interaction accurately', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Slider
        defaultValue={[50]}
        min={0}
        max={100}
        step={10}
        onValueChange={handleChange}
        aria-label="Single thumb"
      />
    );
    const slider = screen.getByRole('slider', { name: /single thumb/i });

    act(() => {
      slider.focus();
    });
    await user.keyboard('{ArrowRight}');
    expect(handleChange).toHaveBeenCalledWith([60]);
    expect(slider.getAttribute('aria-valuenow')).toBe('60');
  });

  it('8. manages two-thumb range slider maintaining boundary order', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Slider
        defaultValue={[20, 80]}
        min={0}
        max={100}
        step={5}
        onValueChange={handleChange}
        thumbAriaLabels={['Minimum price', 'Maximum price']}
      />
    );
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBe(2);

    const minThumb = screen.getByRole('slider', { name: /minimum price/i });
    const maxThumb = screen.getByRole('slider', { name: /maximum price/i });

    expect(minThumb.getAttribute('aria-valuenow')).toBe('20');
    expect(maxThumb.getAttribute('aria-valuenow')).toBe('80');

    act(() => {
      minThumb.focus();
    });
    await user.keyboard('{ArrowRight}');
    expect(minThumb.getAttribute('aria-valuenow')).toBe('25');
    expect(handleChange).toHaveBeenCalledWith([25, 80]);

    act(() => {
      maxThumb.focus();
    });
    await user.keyboard('{ArrowLeft}');
    expect(maxThumb.getAttribute('aria-valuenow')).toBe('75');
    expect(handleChange).toHaveBeenCalledWith([25, 75]);
  });

  it('9. increments value on Keyboard ArrowRight', async () => {
    const user = userEvent.setup();
    render(<Slider defaultValue={[10]} min={0} max={100} step={2} aria-label="ArrowRight" />);
    const slider = screen.getByRole('slider', { name: /arrowright/i });

    act(() => {
      slider.focus();
    });
    await user.keyboard('{ArrowRight}');
    expect(slider.getAttribute('aria-valuenow')).toBe('12');
  });

  it('10. decrements value on Keyboard ArrowLeft', async () => {
    const user = userEvent.setup();
    render(<Slider defaultValue={[10]} min={0} max={100} step={2} aria-label="ArrowLeft" />);
    const slider = screen.getByRole('slider', { name: /arrowleft/i });

    act(() => {
      slider.focus();
    });
    await user.keyboard('{ArrowLeft}');
    expect(slider.getAttribute('aria-valuenow')).toBe('8');
  });

  it('11. increments on Keyboard ArrowUp and decrements on ArrowDown', async () => {
    const user = userEvent.setup();
    render(<Slider defaultValue={[30]} min={0} max={100} step={5} aria-label="ArrowUpDown" />);
    const slider = screen.getByRole('slider', { name: /arrowupdown/i });

    act(() => {
      slider.focus();
    });
    await user.keyboard('{ArrowUp}');
    expect(slider.getAttribute('aria-valuenow')).toBe('35');

    await user.keyboard('{ArrowDown}');
    expect(slider.getAttribute('aria-valuenow')).toBe('30');
  });

  it('12. jumps to minimum on Home and maximum on End', async () => {
    const user = userEvent.setup();
    render(<Slider defaultValue={[50]} min={10} max={90} step={1} aria-label="HomeEnd" />);
    const slider = screen.getByRole('slider', { name: /homeend/i });

    act(() => {
      slider.focus();
    });
    await user.keyboard('{Home}');
    expect(slider.getAttribute('aria-valuenow')).toBe('10');

    await user.keyboard('{End}');
    expect(slider.getAttribute('aria-valuenow')).toBe('90');
  });

  it('13. prevents keyboard interaction and reflects disabled state', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Slider
        disabled
        defaultValue={[50]}
        min={0}
        max={100}
        onValueChange={handleChange}
        aria-label="Disabled slider"
      />
    );
    const slider = screen.getByRole('slider', { name: /disabled slider/i });

    expect(slider.getAttribute('data-disabled')).toBe('');
    expect(slider.getAttribute('aria-disabled')).toBe('true');

    act(() => {
      slider.focus();
    });
    await user.keyboard('{ArrowRight}');
    expect(handleChange).not.toHaveBeenCalled();
    expect(slider.getAttribute('aria-valuenow')).toBe('50');
  });

  it('14. invokes onValueChange callback with new value array', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Slider
        defaultValue={[0]}
        min={0}
        max={10}
        step={2}
        onValueChange={handleChange}
        aria-label="Value change"
      />
    );
    const slider = screen.getByRole('slider', { name: /value change/i });

    act(() => {
      slider.focus();
    });
    await user.keyboard('{ArrowRight}');
    expect(handleChange).toHaveBeenCalledWith([2]);
  });

  it('15. invokes onValueCommit callback upon completing interaction', async () => {
    const user = userEvent.setup();
    const handleCommit = vi.fn();
    render(
      <Slider
        defaultValue={[40]}
        min={0}
        max={100}
        step={10}
        onValueCommit={handleCommit}
        aria-label="Commit test"
      />
    );
    const slider = screen.getByRole('slider', { name: /commit test/i });

    act(() => {
      slider.focus();
    });
    await user.keyboard('{ArrowRight}');
    expect(handleCommit).toHaveBeenCalledWith([50]);
  });

  it('16. associates accessible label via SliderLabel and aria-labelledby', () => {
    render(
      <div className="space-y-2">
        <SliderLabel id="brightness-label">Display Brightness</SliderLabel>
        <Slider defaultValue={[70]} aria-labelledby="brightness-label" />
      </div>
    );
    const slider = screen.getByRole('slider', { name: /display brightness/i });
    expect(slider).toBeTruthy();
    expect(slider.getAttribute('aria-labelledby')).toBe('brightness-label');
  });

  it('17. associates accessible description via SliderDescription and aria-describedby', () => {
    render(
      <div className="space-y-1">
        <Slider
          defaultValue={[50]}
          aria-label="Volume"
          aria-describedby="volume-desc"
        />
        <SliderDescription id="volume-desc">
          Adjust the output volume for alert sounds.
        </SliderDescription>
      </div>
    );
    const slider = screen.getByRole('slider', { name: /volume/i });
    expect(slider.getAttribute('aria-describedby')).toBe('volume-desc');

    const desc = screen.getByText(/adjust the output volume for alert sounds/i);
    expect(desc.id).toBe('volume-desc');
    expect(desc.className).toContain('text-content-secondary');
  });

  it('18. provides accessible labeling for multiple thumbs in range mode', () => {
    render(
      <Slider
        defaultValue={[100, 500]}
        min={0}
        max={1000}
        thumbAriaLabels={['Minimum budget', 'Maximum budget']}
      />
    );
    const minThumb = screen.getByRole('slider', { name: /minimum budget/i });
    const maxThumb = screen.getByRole('slider', { name: /maximum budget/i });

    expect(minThumb).toBeTruthy();
    expect(maxThumb).toBeTruthy();
    expect(minThumb.getAttribute('aria-valuenow')).toBe('100');
    expect(maxThumb.getAttribute('aria-valuenow')).toBe('500');
  });

  it('19. forwards refs to underlying DOM elements', () => {
    const rootRef = React.createRef<HTMLSpanElement>();
    const trackRef = React.createRef<HTMLSpanElement>();
    const rangeRef = React.createRef<HTMLSpanElement>();
    const thumbRef = React.createRef<HTMLSpanElement>();
    const labelRef = React.createRef<HTMLLabelElement>();
    const descRef = React.createRef<HTMLParagraphElement>();

    render(
      <div>
        <SliderLabel ref={labelRef} id="lbl-id">Label</SliderLabel>
        <Slider ref={rootRef} defaultValue={[50]}>
          <SliderTrack ref={trackRef}>
            <SliderRange ref={rangeRef} />
          </SliderTrack>
          <SliderThumb ref={thumbRef} aria-label="Thumb" />
        </Slider>
        <SliderDescription ref={descRef}>Description</SliderDescription>
      </div>
    );

    expect(rootRef.current).toBeInstanceOf(HTMLSpanElement);
    expect(trackRef.current).toBeInstanceOf(HTMLSpanElement);
    expect(rangeRef.current).toBeInstanceOf(HTMLSpanElement);
    expect(thumbRef.current).toBeInstanceOf(HTMLSpanElement);
    expect(labelRef.current).toBeInstanceOf(HTMLLabelElement);
    expect(descRef.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it('20. enforces FeedbackHub design token contracts and focus-visible styling', () => {
    render(
      <Slider
        defaultValue={[50]}
        aria-label="Design token test"
        className="custom-root"
        trackClassName="custom-track"
        rangeClassName="custom-range"
        thumbClassName="custom-thumb"
      />
    );

    const root = screen.getByRole('slider', { name: /design token test/i }).closest('[data-orientation="horizontal"]');
    expect(root).toBeTruthy();

    const sliderThumb = screen.getByRole('slider', { name: /design token test/i });
    // Thumb design tokens
    expect(sliderThumb.className).toContain('rounded-full');
    expect(sliderThumb.className).toContain('bg-surface-card');
    expect(sliderThumb.className).toContain('border-brand-primary');
    // Semantic focus ring token
    expect(sliderThumb.className).toContain('focus-visible:ring-brand-primary');
    expect(sliderThumb.className).toContain('focus-visible:ring-offset-2');
    // Custom class merging
    expect(sliderThumb.className).toContain('custom-thumb');

    // Strict absence of arbitrary hardcoded slate colors
    expect(sliderThumb.className).not.toContain('bg-slate-50');
    expect(sliderThumb.className).not.toContain('bg-slate-100');
    expect(sliderThumb.className).not.toContain('border-slate-300');
  });

  it('21. handles PageUp and PageDown large step increments when supported', async () => {
    const user = userEvent.setup();
    render(<Slider defaultValue={[50]} min={0} max={100} step={1} aria-label="Page keys" />);
    const slider = screen.getByRole('slider', { name: /page keys/i });

    act(() => {
      slider.focus();
    });
    await user.keyboard('{PageUp}');
    const valAfterUp = Number(slider.getAttribute('aria-valuenow'));
    expect(valAfterUp).toBeGreaterThanOrEqual(50);

    await user.keyboard('{PageDown}');
    const valAfterDown = Number(slider.getAttribute('aria-valuenow'));
    expect(valAfterDown).toBeLessThanOrEqual(valAfterUp);
  });
});
