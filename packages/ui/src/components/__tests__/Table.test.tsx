/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '../Table';

afterEach(() => {
  cleanup();
});

describe('Table Component Primitives', () => {
  it('1. renders complete table structure with semantic elements', () => {
    render(
      <Table data-testid="table">
        <TableCaption>Feedback Responses</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Acme Corp</TableCell>
            <TableCell>5 Stars</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total: 1 response</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getByText('Feedback Responses')).toBeTruthy();
    expect(screen.getByText('Customer')).toBeTruthy();
    expect(screen.getByText('Acme Corp')).toBeTruthy();
    expect(screen.getByText('Total: 1 response')).toBeTruthy();
  });

  it('2. applies hover and selected state classes to TableRow', () => {
    render(
      <Table>
        <TableBody>
          <TableRow data-state="selected" data-testid="selected-row">
            <TableCell>Selected Row</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const row = screen.getByTestId('selected-row');
    expect(row.getAttribute('data-state')).toBe('selected');
    expect(row.className).toContain('data-[state=selected]:bg-brand-primary/10');
    expect(row.className).toContain('hover:bg-neutral-mainBackground/80');
  });

  it('3. forwards refs across all table primitives', () => {
    const tableRef = React.createRef<HTMLTableElement>();
    const headerRef = React.createRef<HTMLTableSectionElement>();
    const bodyRef = React.createRef<HTMLTableSectionElement>();
    const footerRef = React.createRef<HTMLTableSectionElement>();
    const rowRef = React.createRef<HTMLTableRowElement>();
    const headRef = React.createRef<HTMLTableCellElement>();
    const cellRef = React.createRef<HTMLTableCellElement>();
    const captionRef = React.createRef<HTMLTableCaptionElement>();

    render(
      <Table ref={tableRef}>
        <TableCaption ref={captionRef}>Caption</TableCaption>
        <TableHeader ref={headerRef}>
          <TableRow ref={rowRef}>
            <TableHead ref={headRef}>Header</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody ref={bodyRef}>
          <TableRow>
            <TableCell ref={cellRef}>Data</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter ref={footerRef}>
          <TableRow>
            <TableCell>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    expect(tableRef.current).toBeInstanceOf(HTMLTableElement);
    expect(captionRef.current).toBeInstanceOf(HTMLTableCaptionElement);
    expect(headerRef.current).toBeInstanceOf(HTMLTableSectionElement);
    expect(bodyRef.current).toBeInstanceOf(HTMLTableSectionElement);
    expect(footerRef.current).toBeInstanceOf(HTMLTableSectionElement);
    expect(rowRef.current).toBeInstanceOf(HTMLTableRowElement);
    expect(headRef.current).toBeInstanceOf(HTMLTableCellElement);
    expect(cellRef.current).toBeInstanceOf(HTMLTableCellElement);
  });

  it('4. merges custom classNames', () => {
    render(
      <Table className="custom-table">
        <TableBody>
          <TableRow className="custom-row">
            <TableCell className="custom-cell">Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('table').className).toContain('custom-table');
    expect(screen.getByText('Content').className).toContain('custom-cell');
  });
});
