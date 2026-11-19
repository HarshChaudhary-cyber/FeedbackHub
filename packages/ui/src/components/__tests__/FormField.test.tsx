/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from '../FormField';

afterEach(() => {
  cleanup();
});

describe('FormField Composition Primitives', () => {
  it('1. coordinates accessible IDs between FormLabel and FormControl by default', () => {
    render(
      <FormField name="companyName">
        <FormItem>
          <FormLabel>Company Name</FormLabel>
          <FormControl>
            <input type="text" />
          </FormControl>
        </FormItem>
      </FormField>
    );

    const label = screen.getByText('Company Name').closest('label');
    const input = screen.getByRole('textbox');

    expect(label).toBeTruthy();
    expect(input).toBeTruthy();
    expect(label?.getAttribute('for')).toBe(input.getAttribute('id'));
    expect(input.getAttribute('id')).toBe('field-companyName-item');
  });

  it('2. coordinates label htmlFor to match custom control ID', () => {
    // Custom ID on the input element
    const { rerender } = render(
      <FormField name="username">
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <input id="custom-username-input" type="text" />
          </FormControl>
        </FormItem>
      </FormField>
    );

    let label = screen.getByText('Username').closest('label');
    let input = screen.getByRole('textbox');

    expect(input.getAttribute('id')).toBe('custom-username-input');
    expect(label?.getAttribute('for')).toBe('custom-username-input');

    // Custom ID on the FormControl wrapper
    rerender(
      <FormField name="username">
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl id="custom-wrapper-id">
            <input type="text" />
          </FormControl>
        </FormItem>
      </FormField>
    );

    label = screen.getByText('Username').closest('label');
    input = screen.getByRole('textbox');

    expect(input.getAttribute('id')).toBe('custom-wrapper-id');
    expect(label?.getAttribute('for')).toBe('custom-wrapper-id');
  });

  it('3. associates custom description ID with FormControl via aria-describedby', () => {
    render(
      <FormField name="surveyTitle">
        <FormItem>
          <FormLabel>Survey Title</FormLabel>
          <FormControl>
            <input type="text" />
          </FormControl>
          <FormDescription id="custom-hint-guidance">
            Give your survey a descriptive title
          </FormDescription>
        </FormItem>
      </FormField>
    );

    const input = screen.getByRole('textbox');
    const description = screen.getByText('Give your survey a descriptive title');

    expect(description.getAttribute('id')).toBe('custom-hint-guidance');
    expect(input.getAttribute('aria-describedby')).toBe('custom-hint-guidance');
  });

  it('4. associates custom error-message ID with FormControl via aria-describedby', () => {
    render(
      <FormField name="email" error="Please enter a valid work email address">
        <FormItem>
          <FormLabel indicateError>Email</FormLabel>
          <FormControl>
            <input type="email" />
          </FormControl>
          <FormMessage id="custom-email-error-id" />
        </FormItem>
      </FormField>
    );

    const input = screen.getByRole('textbox');
    const alert = screen.getByRole('alert');

    expect(alert.getAttribute('id')).toBe('custom-email-error-id');
    expect(input.getAttribute('aria-describedby')).toBe('custom-email-error-id');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('5. preserves existing aria-describedby supplied by consumer without duplicates', () => {
    render(
      <FormField name="apiKey">
        <FormItem>
          <FormLabel>API Key</FormLabel>
          <FormControl aria-describedby="external-security-note">
            <input aria-describedby="input-extra-info" type="text" />
          </FormControl>
          <FormDescription id="field-api-hint">Copy from developer portal</FormDescription>
        </FormItem>
      </FormField>
    );

    const input = screen.getByRole('textbox');
    const describedBy = input.getAttribute('aria-describedby') || '';
    const tokens = describedBy.split(' ');

    expect(tokens).toContain('external-security-note');
    expect(tokens).toContain('input-extra-info');
    expect(tokens).toContain('field-api-hint');
    // Ensure no duplicates exist in describedBy tokens
    expect(new Set(tokens).size).toBe(tokens.length);
  });

  it('6. correctly associates both description and error when both are rendered', () => {
    render(
      <FormField name="password" error="Password must contain at least 8 characters">
        <FormItem>
          <FormLabel>Password</FormLabel>
          <FormControl>
            <input type="password" />
          </FormControl>
          <FormDescription id="pwd-help">Include letters and numbers</FormDescription>
          <FormMessage id="pwd-err" />
        </FormItem>
      </FormField>
    );

    const input = document.querySelector('input[type="password"]');
    const desc = screen.getByText('Include letters and numbers');
    const alert = screen.getByRole('alert');

    expect(desc.getAttribute('id')).toBe('pwd-help');
    expect(alert.getAttribute('id')).toBe('pwd-err');
    expect(input?.getAttribute('aria-describedby')).toBe('pwd-help pwd-err');
    expect(input?.getAttribute('aria-invalid')).toBe('true');
  });

  it('7. avoids stale or duplicate description IDs when conditionally rendered', () => {
    const TestConditionalForm = ({ showDesc }: { showDesc: boolean }) => (
      <FormField name="conditionalField">
        <FormItem>
          <FormLabel>Dynamic Field</FormLabel>
          <FormControl>
            <input type="text" />
          </FormControl>
          {showDesc && <FormDescription>Currently visible hint</FormDescription>}
        </FormItem>
      </FormField>
    );

    // Initial render with description visible
    const { rerender } = render(<TestConditionalForm showDesc={true} />);
    let input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-describedby')).toBe('field-conditionalField-description');

    // Rerender with description hidden -> aria-describedby must be removed synchronously
    rerender(<TestConditionalForm showDesc={false} />);
    input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-describedby')).toBeNull();

    // Rerender with description visible again -> single ID present, no stale duplicates
    rerender(<TestConditionalForm showDesc={true} />);
    input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-describedby')).toBe('field-conditionalField-description');
  });

  it('8. applies aria-invalid="true" when error is present and omits it when valid', () => {
    const TestValidationForm = ({ error }: { error?: string }) => (
      <FormField name="billingZip" error={error}>
        <FormItem>
          <FormLabel>ZIP Code</FormLabel>
          <FormControl>
            <input type="text" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    );

    const { rerender } = render(<TestValidationForm error={undefined} />);
    let input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();

    rerender(<TestValidationForm error="Invalid ZIP code" />);
    input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('9. FormMessage uses role="alert" without conflicting aria-live="polite"', () => {
    render(
      <FormField name="domain" error="Domain is already in use">
        <FormItem>
          <FormLabel>Domain</FormLabel>
          <FormControl>
            <input type="text" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeTruthy();
    expect(alert.getAttribute('role')).toBe('alert');
    // Ensure no conflicting aria-live="polite" is present
    expect(alert.getAttribute('aria-live')).toBeNull();
  });

  it('10. supports required indicator on FormLabel', () => {
    render(
      <FormField name="workspace">
        <FormItem>
          <FormLabel required>Workspace Subdomain</FormLabel>
          <FormControl>
            <input type="text" />
          </FormControl>
        </FormItem>
      </FormField>
    );

    const star = screen.getByText('*');
    expect(star).toBeTruthy();
    expect(star.className).toContain('text-semantic-error');
  });

  it('11. throws helpful error if useFormField is called outside FormField context', () => {
    const TestComponent = () => {
      useFormField();
      return <div>Test</div>;
    };

    expect(() => render(<TestComponent />)).toThrow(
      'useFormField must be used within a <FormField>'
    );
  });

  it('12. forwards refs to FormItem, FormLabel, FormDescription and FormMessage', () => {
    const itemRef = React.createRef<HTMLDivElement>();
    const labelRef = React.createRef<HTMLLabelElement>();
    const descRef = React.createRef<HTMLParagraphElement>();
    const msgRef = React.createRef<HTMLParagraphElement>();

    render(
      <FormField name="username" error="Required">
        <FormItem ref={itemRef}>
          <FormLabel ref={labelRef}>Username</FormLabel>
          <FormControl>
            <input type="text" />
          </FormControl>
          <FormDescription ref={descRef}>Choose a handle</FormDescription>
          <FormMessage ref={msgRef} />
        </FormItem>
      </FormField>
    );

    expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
    expect(labelRef.current).toBeInstanceOf(HTMLLabelElement);
    expect(descRef.current).toBeInstanceOf(HTMLParagraphElement);
    expect(msgRef.current).toBeInstanceOf(HTMLParagraphElement);
  });
});
