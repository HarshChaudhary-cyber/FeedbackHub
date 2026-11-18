/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../Accordion';

afterEach(() => {
  cleanup();
});

describe('Accordion Component Primitives', () => {
  it('1. renders accordion items and triggers with accessible heading semantics', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>What is FeedbackHub?</AccordionTrigger>
          <AccordionContent>
            FeedbackHub is a multi-tenant feedback intelligence platform.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    const trigger = screen.getByRole('button', { name: 'What is FeedbackHub?' });
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('2. expands and collapses content when trigger is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="faq-1">
          <AccordionTrigger>How does sentiment analysis work?</AccordionTrigger>
          <AccordionContent>
            We use NLP clustering to categorize feedback topics.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    const trigger = screen.getByRole('button', { name: 'How does sentiment analysis work?' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    await user.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('We use NLP clustering to categorize feedback topics.')).toBeTruthy();

    await user.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('3. supports multiple mode allowing multiple items open simultaneously', async () => {
    const user = userEvent.setup();

    render(
      <Accordion type="multiple">
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    const trigger1 = screen.getByRole('button', { name: 'Section 1' });
    const trigger2 = screen.getByRole('button', { name: 'Section 2' });

    await user.click(trigger1);
    await user.click(trigger2);

    expect(trigger1.getAttribute('aria-expanded')).toBe('true');
    expect(trigger2.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Content 1')).toBeTruthy();
    expect(screen.getByText('Content 2')).toBeTruthy();
  });

  it('4. supports keyboard activation using Enter or Space', async () => {
    const user = userEvent.setup();

    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="kb-1">
          <AccordionTrigger>Keyboard Accessible Item</AccordionTrigger>
          <AccordionContent>Accessible Body Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    const trigger = screen.getByRole('button', { name: 'Keyboard Accessible Item' });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    await user.keyboard('{Enter}');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Accessible Body Content')).toBeTruthy();
  });

  it('5. forwards refs across AccordionItem and AccordionTrigger', () => {
    const itemRef = React.createRef<HTMLDivElement>();
    const triggerRef = React.createRef<HTMLButtonElement>();

    render(
      <Accordion type="single" collapsible>
        <AccordionItem ref={itemRef} value="ref-item">
          <AccordionTrigger ref={triggerRef}>Ref Trigger</AccordionTrigger>
          <AccordionContent>Ref Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
  });
});
