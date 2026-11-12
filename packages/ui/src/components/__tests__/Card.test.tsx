/** @vitest-environment jsdom */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../Card';

afterEach(() => {
  cleanup();
});

describe('Card Primitive', () => {
  it('renders a fully composed card structure with header, title, description, content and footer', () => {
    render(
      <Card data-testid="card-root">
        <CardHeader>
          <CardTitle>Feedback Summary</CardTitle>
          <CardDescription>Aggregate metrics for Q3</CardDescription>
        </CardHeader>
        <CardContent>
          <p>94% customer satisfaction score across 1,200 responses.</p>
        </CardContent>
        <CardFooter>
          <button type="button">Export Report</button>
        </CardFooter>
      </Card>
    );

    const card = screen.getByTestId('card-root');
    expect(card).toBeTruthy();
    expect(card.className).toContain('rounded-[20px]');
    expect(card.className).toContain('bg-surface-card');

    expect(screen.getByText('Feedback Summary')).toBeTruthy();
    expect(screen.getByText('Aggregate metrics for Q3')).toBeTruthy();
    expect(
      screen.getByText('94% customer satisfaction score across 1,200 responses.')
    ).toBeTruthy();
    expect(screen.getByText('Export Report')).toBeTruthy();
  });

  it('renders the small variant with 16px corner radius', () => {
    render(
      <Card variant="small" data-testid="small-card">
        <CardContent spacing="compact">Compact content</CardContent>
      </Card>
    );

    const card = screen.getByTestId('small-card');
    expect(card.className).toContain('rounded-2xl');
    expect(screen.getByText('Compact content')).toBeTruthy();
  });

  it('applies interactive hover styles when interactive is true', () => {
    render(
      <Card interactive data-testid="interactive-card">
        <CardContent>Interactive Card</CardContent>
      </Card>
    );

    const card = screen.getByTestId('interactive-card');
    expect(card.className).toContain('cursor-pointer');
    expect(card.className).toContain('hover:shadow-soft-md');
  });

  it('supports custom heading levels for CardTitle', () => {
    render(
      <CardTitle as="h2" data-testid="card-h2">
        Heading 2 Title
      </CardTitle>
    );

    const heading = screen.getByTestId('card-h2');
    expect(heading.tagName).toBe('H2');
    expect(heading.textContent).toBe('Heading 2 Title');
  });

  it('forwards ref properly to HTMLDivElement', () => {
    const cardRef = React.createRef<HTMLDivElement>();
    render(<Card ref={cardRef}>Card with ref</Card>);
    expect(cardRef.current).toBeInstanceOf(HTMLDivElement);
  });
});
