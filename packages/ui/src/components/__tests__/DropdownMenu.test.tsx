/** @vitest-environment jsdom */
import '../../test-setup';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '../DropdownMenu';
import { Button } from '../Button';

afterEach(() => {
  cleanup();
  if (typeof document !== 'undefined') {
    document.body.style.pointerEvents = '';
    document.body.removeAttribute('data-scroll-locked');
    document.body.removeAttribute('data-radix-scroll-lock');
    document.body.removeAttribute('aria-hidden');
  }
});

describe('DropdownMenu Component Primitive', () => {
  it('1. opens when the trigger is activated and displays menu items', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Form Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Form Management</DropdownMenuLabel>
          <DropdownMenuItem>Edit Form</DropdownMenuItem>
          <DropdownMenuItem>Duplicate Form</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    // Menu is closed initially
    expect(screen.queryByRole('menu')).toBeNull();

    // Activate trigger
    const trigger = screen.getByRole('button', { name: /form actions/i });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');

    fireEvent.pointerDown(trigger);

    // Menu is open
    const menu = screen.getByRole('menu');
    expect(menu).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Edit Form')).toBeTruthy();
    expect(screen.getByText('Duplicate Form')).toBeTruthy();
  });

  it('2. closes after selecting a standard menu item', async () => {
    const handleSelect = vi.fn();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Options</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={handleSelect}>
            Export Responses
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    fireEvent.pointerDown(screen.getByRole('button', { name: /options/i }));
    const menuItem = screen.getByRole('menuitem', { name: /export responses/i });
    expect(menuItem).toBeTruthy();

    fireEvent.click(menuItem);
    expect(handleSelect).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull();
    });
  });

  it('3. closes when the Escape key is pressed', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    fireEvent.pointerDown(screen.getByRole('button', { name: /menu/i }));
    const menu = screen.getByRole('menu');
    expect(menu).toBeTruthy();

    fireEvent.keyDown(menu, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull();
    });
  });

  it('4. supports controlled open state via open and onOpenChange', async () => {
    const ControlledMenu = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setIsOpen(!isOpen)}>
            External Toggle ({isOpen ? 'Open' : 'Closed'})
          </button>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <button type="button">Controlled Trigger</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setIsOpen(false)}>
                Controlled Action
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    };

    render(<ControlledMenu />);
    expect(screen.queryByRole('menu')).toBeNull();

    // Open via external state
    fireEvent.click(screen.getByRole('button', { name: /external toggle/i }));
    expect(screen.getByRole('menu')).toBeTruthy();

    // Select item closes menu
    fireEvent.click(screen.getByRole('menuitem', { name: /controlled action/i }));

    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull();
    });
  });

  it('5. supports uncontrolled open state with defaultOpen', () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button>Uncontrolled</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Default Open Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    // Immediately open
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(screen.getByText('Default Open Item')).toBeTruthy();
  });

  it('6. supports disabled menu items that prevent selection', () => {
    const handleSelect = vi.fn();

    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button>Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled onSelect={handleSelect}>
            Archive Form (Disabled)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const disabledItem = screen.getByRole('menuitem', { name: /archive form/i });
    expect(disabledItem.getAttribute('data-disabled')).toBe('');
    expect(disabledItem.getAttribute('aria-disabled')).toBe('true');

    fireEvent.click(disabledItem);
    expect(handleSelect).not.toHaveBeenCalled();
    // Menu remains open since disabled item cannot be selected
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('7. supports checkbox item selection with checkmark state', () => {
    const CheckboxMenu = () => {
      const [anonymous, setAnonymous] = useState(false);
      const [notifications, setNotifications] = useState(true);

      return (
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger asChild>
            <Button>Settings</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={anonymous}
              onCheckedChange={setAnonymous}
            >
              Allow Anonymous Responses
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={notifications}
              onCheckedChange={setNotifications}
            >
              Email Notifications
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    };

    render(<CheckboxMenu />);

    const anonItem = screen.getByRole('menuitemcheckbox', {
      name: /allow anonymous responses/i,
    });
    const notifItem = screen.getByRole('menuitemcheckbox', {
      name: /email notifications/i,
    });

    expect(anonItem.getAttribute('aria-checked')).toBe('false');
    expect(notifItem.getAttribute('aria-checked')).toBe('true');

    // Toggle anonymous checkbox
    fireEvent.click(anonItem);
    expect(anonItem.getAttribute('aria-checked')).toBe('true');
  });

  it('8. supports radio item selection within DropdownMenuRadioGroup', () => {
    const RadioMenu = () => {
      const [audience, setAudience] = useState('customers');

      return (
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger asChild>
            <Button>Audience</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value={audience} onValueChange={setAudience}>
              <DropdownMenuRadioItem value="customers">
                Customers Only
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="employees">
                Employees Only
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="both">
                Both Audiences
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    };

    render(<RadioMenu />);

    const customerRadio = screen.getByRole('menuitemradio', {
      name: /customers only/i,
    });
    const employeeRadio = screen.getByRole('menuitemradio', {
      name: /employees only/i,
    });

    expect(customerRadio.getAttribute('aria-checked')).toBe('true');
    expect(employeeRadio.getAttribute('aria-checked')).toBe('false');

    // Switch selection to employees
    fireEvent.click(employeeRadio);
    expect(employeeRadio.getAttribute('aria-checked')).toBe('true');
    expect(customerRadio.getAttribute('aria-checked')).toBe('false');
  });

  it('9. renders menu content in a portal attached to document.body', () => {
    render(
      <div data-testid="local-container">
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger asChild>
            <Button>Portal Test</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Portaled Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );

    const localContainer = screen.getByTestId('local-container');
    const menu = screen.getByRole('menu');

    // Content is portaled outside localContainer into document.body
    expect(localContainer.contains(menu)).toBe(false);
    expect(document.body.contains(menu)).toBe(true);
  });

  it('10. supports keyboard navigation through menu items', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Nav Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>First Item</DropdownMenuItem>
          <DropdownMenuItem>Second Item</DropdownMenuItem>
          <DropdownMenuItem>Third Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByRole('button', { name: /nav menu/i });
    // Open menu via ArrowDown key from trigger
    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });

    const menu = screen.getByRole('menu');
    expect(menu).toBeTruthy();

    const items = screen.getAllByRole('menuitem');
    expect(items.length).toBe(3);
  });

  it('11. supports nested submenu interaction', async () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button>Nested Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Top Level</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Share Form</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Copy Portal Link</DropdownMenuItem>
              <DropdownMenuItem>Download QR Code</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const subTrigger = screen.getByRole('menuitem', { name: /share form/i });
    expect(subTrigger.getAttribute('aria-haspopup')).toBe('menu');

    // Trigger submenu open via ArrowRight keyboard navigation
    fireEvent.keyDown(subTrigger, { key: 'ArrowRight', code: 'ArrowRight' });

    await waitFor(() => {
      expect(screen.getByText('Copy Portal Link')).toBeTruthy();
      expect(screen.getByText('Download QR Code')).toBeTruthy();
    });
  });

  it('12. renders accessible roles, labels, separators, and shortcuts', () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button>Full Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem destructive>
              Delete Form
              <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator data-testid="menu-separator" />
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByRole('menu')).toBeTruthy();
    expect(screen.getByText('Actions')).toBeTruthy();

    const deleteItem = screen.getByRole('menuitem', { name: /delete form/i });
    expect(deleteItem.className).toContain('text-semantic-error');
    expect(screen.getByText('⌘⌫')).toBeTruthy();

    const separator = screen.getByTestId('menu-separator');
    expect(separator.getAttribute('role')).toBe('separator');
  });
});
