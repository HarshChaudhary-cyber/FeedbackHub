/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { Textarea } from '../Textarea';

afterEach(() => {
  cleanup();
});

describe('Textarea Primitive', () => {
  it('renders textarea with accessible label and 14px radius', () => {
    render(
      <Textarea
        label="Feedback Description"
        name="description"
        placeholder="Tell us what you think..."
      />
    );

    const textarea = screen.getByLabelText(/feedback description/i) as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    expect(textarea.placeholder).toBe('Tell us what you think...');
    expect(textarea.className).toContain('rounded-[14px]');
  });

  it('handles value changes and calls onChange handler', () => {
    const handleChange = vi.fn();
    render(<Textarea label="Comments" onChange={handleChange} />);

    const textarea = screen.getByLabelText(/comments/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Great product experience!' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(textarea.value).toBe('Great product experience!');
  });

  it('enforces disabled state and applies disabled styling', () => {
    render(<Textarea label="Locked Feedback" disabled defaultValue="Cannot edit this" />);

    const textarea = screen.getByLabelText(/locked feedback/i) as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
    expect(textarea.className).toContain('cursor-not-allowed');
  });

  it('renders error state with aria-invalid, alert role, and aria-describedby', () => {
    render(
      <Textarea
        label="Employee Note"
        name="note"
        error="Feedback description cannot be empty"
      />
    );

    const textarea = screen.getByLabelText(/employee note/i) as HTMLTextAreaElement;
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(textarea.className).toContain('border-semantic-error');

    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toBeTruthy();
    expect(errorMessage.textContent).toBe('Feedback description cannot be empty');
    expect(textarea.getAttribute('aria-describedby')).toContain(errorMessage.id);
  });

  it('supports custom rows and resizing configuration', () => {
    const { rerender } = render(
      <Textarea label="Custom Rows" rows={8} resizable="y" />
    );
    let textarea = screen.getByLabelText(/custom rows/i) as HTMLTextAreaElement;
    expect(textarea.rows).toBe(8);
    expect(textarea.className).toContain('resize-y');

    rerender(<Textarea label="Custom Rows" resizable={false} />);
    textarea = screen.getByLabelText(/custom rows/i) as HTMLTextAreaElement;
    expect(textarea.className).toContain('resize-none');
  });

  it('forwards ref properly to HTMLTextAreaElement', () => {
    const textareaRef = React.createRef<HTMLTextAreaElement>();
    render(<Textarea label="Ref Textarea" ref={textareaRef} />);
    expect(textareaRef.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});
