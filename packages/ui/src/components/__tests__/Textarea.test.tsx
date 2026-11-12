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

  describe('Accessibility & aria-describedby combinations', () => {
    it('1. helper text only: helper is rendered and its ID is referenced', () => {
      render(
        <Textarea
          id="custom-textarea-1"
          label="Single Helper Textarea"
          helperText="Max 500 characters"
        />
      );

      const textarea = screen.getByLabelText(/single helper textarea/i);
      const helper = screen.getByText('Max 500 characters');

      expect(helper).toBeTruthy();
      expect(helper.id).toBe('custom-textarea-1-helper');
      expect(textarea.getAttribute('aria-describedby')).toBe('custom-textarea-1-helper');
      expect(textarea.getAttribute('aria-invalid')).toBeNull();
    });

    it('2. error only: error is rendered and its ID is referenced', () => {
      render(
        <Textarea
          id="custom-textarea-2"
          label="Single Error Textarea"
          error="Response is required"
        />
      );

      const textarea = screen.getByLabelText(/single error textarea/i);
      const errorMsg = screen.getByRole('alert');

      expect(errorMsg).toBeTruthy();
      expect(errorMsg.id).toBe('custom-textarea-2-error');
      expect(textarea.getAttribute('aria-describedby')).toBe('custom-textarea-2-error');
      expect(textarea.getAttribute('aria-invalid')).toBe('true');
    });

    it('3. both error and helper text: error is rendered, helper is hidden, and aria-describedby does not contain hidden helper ID', () => {
      render(
        <Textarea
          id="custom-textarea-3"
          label="Conflicted Textarea"
          helperText="Hidden instruction text"
          error="Exceeded character limit"
        />
      );

      const textarea = screen.getByLabelText(/conflicted textarea/i);
      const errorMsg = screen.getByRole('alert');

      // Error message is rendered
      expect(errorMsg).toBeTruthy();
      expect(errorMsg.textContent).toBe('Exceeded character limit');
      expect(errorMsg.id).toBe('custom-textarea-3-error');

      // Helper message is NOT in the DOM
      expect(screen.queryByText('Hidden instruction text')).toBeNull();

      // aria-describedby strictly references the error, not the hidden helper
      const describedBy = textarea.getAttribute('aria-describedby');
      expect(describedBy).toBe('custom-textarea-3-error');
      expect(describedBy).not.toContain('custom-textarea-3-helper');
      expect(textarea.getAttribute('aria-invalid')).toBe('true');
    });

    it('4. external aria-describedby: supplied ID is preserved alongside rendered message IDs', () => {
      render(
        <Textarea
          id="custom-textarea-4"
          label="External Described Textarea"
          aria-describedby="external-counter-id"
          helperText="Formatting instructions"
        />
      );

      const textarea = screen.getByLabelText(/external described textarea/i);
      const describedBy = textarea.getAttribute('aria-describedby');

      expect(describedBy).toBe('external-counter-id custom-textarea-4-helper');
    });
  });
});
