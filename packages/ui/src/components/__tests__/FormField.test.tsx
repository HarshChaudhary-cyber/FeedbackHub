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
  it('1. coordinates accessible IDs between FormLabel and FormControl', () => {
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

  it('2. associates FormDescription with FormControl via aria-describedby', () => {
    render(
      <FormField name="surveyTitle">
        <FormItem>
          <FormLabel>Survey Title</FormLabel>
          <FormControl>
            <input type="text" />
          </FormControl>
          <FormDescription>Give your survey a descriptive title</FormDescription>
        </FormItem>
      </FormField>
    );

    const input = screen.getByRole('textbox');
    const description = screen.getByText('Give your survey a descriptive title');

    expect(description).toBeTruthy();
    expect(description.getAttribute('id')).toBe('field-surveyTitle-description');
    expect(input.getAttribute('aria-describedby')).toContain('field-surveyTitle-description');
  });

  it('3. associates FormMessage and sets aria-invalid="true" when error is present', () => {
    render(
      <FormField name="email" error="Please enter a valid work email address">
        <FormItem>
          <FormLabel indicateError>Email</FormLabel>
          <FormControl>
            <input type="email" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    );

    const input = screen.getByRole('textbox');
    const alert = screen.getByRole('alert');

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toBe('Please enter a valid work email address');
    expect(alert.getAttribute('id')).toBe('field-email-message');
    expect(input.getAttribute('aria-describedby')).toContain('field-email-message');
  });

  it('4. does not render FormMessage when error is not present', () => {
    render(
      <FormField name="email">
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <input type="email" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    );

    const input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('5. supports required indicator on FormLabel', () => {
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

  it('6. throws helpful error if useFormField is called outside FormField context', () => {
    const TestComponent = () => {
      useFormField();
      return <div>Test</div>;
    };

    expect(() => render(<TestComponent />)).toThrow(
      'useFormField must be used within a <FormField>'
    );
  });

  it('7. forwards refs to FormItem, FormLabel, FormDescription and FormMessage', () => {
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
