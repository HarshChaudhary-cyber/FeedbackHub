# FeedbackHub UI Component Primitives

This directory contains the production-quality, accessible UI component primitives for the FeedbackHub platform.

All primitives strictly consume design tokens from [`../tokens.ts`](../tokens.ts) and conform to the visual rules in [`docs/DESIGN_SYSTEM.md`](../../../docs/DESIGN_SYSTEM.md).

---

## 1. Design System Adherence & Corner Radii

FeedbackHub enforces a strict corner-radius hierarchy:

| Component | Radius Token | Visual Style |
| :--- | :--- | :--- |
| **Primary Buttons** | `var(--radius-btn-primary)` | Pill-shaped (`rounded-full`) |
| **Secondary Buttons** | `var(--radius-btn-secondary)` | 12px (`rounded-xl`) |
| **Inputs & Textareas** | `var(--radius-input)` | 14px (`rounded-[14px]`) |
| **Modal Windows & Dialogs** | `var(--radius-modal)` | 24px (`rounded-[24px]`) |
| **Main Cards** | `var(--radius-card-lg)` | 20px (`rounded-[20px]`) |
| **Small Cards** | `var(--radius-card-sm)` | 16px (`rounded-2xl`) |
| **Badges** | `var(--radius-badge)` | Pill-shaped (`rounded-full`) |
| **Avatars** | `var(--radius-avatar)` | Circular (`rounded-full`) |

---

## 2. Available Components

### 2.1 Button (`Button.tsx`)

Semantic `<button>` with accessible keyboard navigation, loading state, icon slots, and strict radius mapping.

- **Variants**:
  - `primary`: Pill-shaped, Primary Purple (`#8B5CF6`), white text, soft elevation.
  - `secondary`: 12px radius, card surface, subtle border, main text.
  - `outline`: 12px radius, transparent background, subtle border.
  - `ghost`: 12px radius, transparent background, hover tint.
  - `destructive`: 12px radius, Semantic Red (`#DC2626`), white text.
  - `link`: Borderless, text button with underline on hover.
- **Sizes**: `sm` (32px), `md` (40px, default), `lg` (48px).
- **Key Props**: `variant`, `size`, `loading`, `disabled`, `leftIcon`, `rightIcon`, `fullWidth`.

#### Usage Example:
```tsx
import { Button } from '@feedbackhub/ui';

// Primary Action
<Button variant="primary" size="md">
  Create Feedback Form
</Button>

// Loading State (auto-disables button & adds aria-busy)
<Button variant="primary" loading>
  Saving Changes
</Button>

// Secondary with Icons
<Button variant="secondary" leftIcon={<PlusIcon />}>
  Add Question
</Button>
```

---

### 2.2 Card (`Card.tsx`)

Composable surface container for metrics, survey responses, and dashboard widgets.

- **Variants**:
  - `default`: 20px corner radius (`rounded-[20px]`).
  - `small`: 16px corner radius (`rounded-2xl`).
- **Interactive**: `interactive={true}` provides subtle hover elevation and cursor pointer.
- **Composable Parts**:
  - `Card`: Surface container (`bg-surface-card border border-border shadow-soft-sm`).
  - `CardHeader`: Title and description container with consistent spacing.
  - `CardTitle`: Semantic heading (supports `as="h1" | "h2" | "h3" | "h4" | "div"`).
  - `CardDescription`: Subtitle / secondary metadata copy.
  - `CardContent`: Main content body with automatic top-padding offset.
  - `CardFooter`: Actions container for buttons or timestamp links.

#### Usage Example:
```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button
} from '@feedbackhub/ui';

<Card variant="default" interactive>
  <CardHeader>
    <CardTitle>Customer NPS</CardTitle>
    <CardDescription>Live Net Promoter Score for the last 30 days</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-brand-primary">+68</div>
  </CardContent>
  <CardFooter>
    <Button variant="outline" size="sm">View Detailed Breakdown</Button>
  </CardFooter>
</Card>
```

---

### 2.3 Input (`Input.tsx`)

Form input with accessible label linking (`htmlFor` / `id`), error/success states, helper text, and icon slots.

- **Radius**: Strict 14px (`rounded-[14px]`).
- **Sizes**: `sm` (32px), `md` (40px, default), `lg` (48px).
- **Accessibility**: Automatically associates `<label>` with `<input>` using React `useId()`, connects error/helper text via `aria-describedby`, and manages `aria-invalid`.
- **Key Props**: `label`, `error`, `success`, `helperText`, `leftIcon`, `rightIcon`, `size`, `wrapperClassName`.

#### Usage Example:
```tsx
import { Input } from '@feedbackhub/ui';

<Input
  label="Work Email"
  type="email"
  name="email"
  placeholder="alex@company.com"
  helperText="We will never share your email address."
  required
/>

// Error State
<Input
  label="Subdomain"
  name="subdomain"
  error="This subdomain is already taken"
/>
```

---

### 2.4 Textarea (`Textarea.tsx`)

Multi-line feedback entry field with accessible labeling, error management, and configurable resize behavior.

- **Radius**: Strict 14px (`rounded-[14px]`).
- **Resizing**: Defaults to standard vertical resize (`resize-y`), configurable with `resizable` prop (`'y' | 'x' | 'both' | 'none' | boolean`).
- **Accessibility**: Automatically links `label` and `aria-describedby` for error/helper announcements.

#### Usage Example:
```tsx
import { Textarea } from '@feedbackhub/ui';

<Textarea
  label="Employee Feedback"
  name="feedback"
  rows={4}
  placeholder="Share your thoughts on the recent product roadmap..."
  helperText="All submissions are strictly confidential."
/>
```

---

### 2.5 Badge (`Badge.tsx`)

Pill-shaped tag for statuses, categories, sentiment scores, and feedback tags.

- **Variants**:
  - `default`: Neutral slate background.
  - `primary`: Brand Purple tint (`#8B5CF6`).
  - `secondary`: Brand Pink tint (`#EC4899`).
  - `success`: Semantic Green tint (`#16A34A` / CSAT 5-star / Promoter).
  - `warning`: Semantic Amber tint (`#D97706` / Passive).
  - `error`: Semantic Red tint (`#DC2626` / Detractor).
  - `info`: Semantic Sky tint (`#0284C7` / Pulse).
  - `outline`: Transparent background with border.
- **Sizes**: `sm`, `md` (default).
- **Status Dot**: Pass `dot={true}` for a color-matched pulse/status indicator.

#### Usage Example:
```tsx
import { Badge } from '@feedbackhub/ui';

<Badge variant="success" dot>Promoter (10/10)</Badge>
<Badge variant="warning" dot>Passive (7/10)</Badge>
<Badge variant="error" dot>Detractor (2/10)</Badge>
<Badge variant="primary">New Feature</Badge>
```

---

### 2.6 Avatar (`Avatar.tsx`)

Circular avatar component with automatic image fallback initials and status indicators.

- **Sizes**: `sm` (32px), `md` (40px, default), `lg` (48px).
- **Fallback Handling**: Gracefully computes 2-letter uppercase initials from `name` (e.g. "Sarah Connor" -> "SC") or uses `fallback`. If an image `src` fails to load, `onError` flips seamlessly to the initials without layout shifting.
- **Status Indicators**: `status="online" | "offline" | "busy" | "away"`.

#### Usage Example:
```tsx
import { Avatar } from '@feedbackhub/ui';

// With image
<Avatar
  src="https://avatar.vercel.sh/harsh"
  name="Harsh Chaudhary"
  status="online"
  size="md"
/>

// Fallback to initials
<Avatar
  name="Sarah Connor"
  size="lg"
/>
```

---

### 2.7 Dialog & Modal (`Dialog.tsx`)

Fully accessible, composable modal dialog built on `@radix-ui/react-dialog`. Automatically traps focus, locks background scroll, restores focus on dismiss, and supports both controlled and uncontrolled open states.

- **Radius**: Strict 24px modal corner radius (`rounded-[24px]` / `rounded-modal`).
- **Surface**: White elevated surface (`bg-surface-card`), subtle border (`border-border`), and multi-layer soft depth (`shadow-soft-lg`).
- **Composable Subcomponents**:
  - `Dialog`: Root container managing open/closed state.
  - `DialogTrigger`: Interactive trigger opening the modal (`asChild` supported).
  - `DialogPortal`: Portals overlay and content to `document.body`.
  - `DialogOverlay`: Semi-transparent backdrop with subtle blur (`backdrop-blur-sm`).
  - `DialogContent`: Centered modal surface with built-in accessible close button (`aria-label="Close"`), auto-scrollable viewport (`max-h-[85vh] overflow-y-auto`), and responsive width (`w-[calc(100%-2rem)] max-w-lg`).
  - `DialogHeader`: Header layout for title and description.
  - `DialogTitle`: Accessible modal title linked via `aria-labelledby`.
  - `DialogDescription`: Accessible description linked via `aria-describedby`.
  - `DialogFooter`: Action button row with responsive column-reverse mobile stacking.
  - `DialogClose`: Accessible trigger for dismissing the dialog.

#### Uncontrolled Example:
```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Button
} from '@feedbackhub/ui';

<Dialog>
  <DialogTrigger asChild>
    <Button variant="primary">Create Feedback Form</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create New Survey</DialogTitle>
      <DialogDescription>
        Choose a template or build custom questions for your respondents.
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* Form content here */}
    </div>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="secondary">Cancel</Button>
      </DialogClose>
      <Button variant="primary">Continue</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Controlled Example with Cancel & Confirm Actions:
```tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Button
} from '@feedbackhub/ui';

export function DeleteConfirmationDialog() {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSurveyAction();
      setOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete Survey
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All responses collected for this feedback form will be permanently archived.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              loading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

### 2.8 Dropdown Menu (`DropdownMenu.tsx`)

Fully accessible, composable dropdown menu built on top of `@radix-ui/react-dropdown-menu`. Supports standard actions, checkable options, radio groups, submenus, keyboard shortcuts, and semantic destructive styling.

- **Radius**: Modern 12–16px menu surface radius (`rounded-xl` / 14px) and 8px item radius (`rounded-lg`).
- **Surface**: White elevated surface (`bg-surface-card`), subtle border (`border-border`), and multi-layer soft depth (`shadow-soft-md`).
- **Composable Parts**:
  - `DropdownMenu`: Root container managing open/closed states.
  - `DropdownMenuTrigger`: Activator opening the menu (supports `asChild`).
  - `DropdownMenuPortal`: Portals menu content outside the parent DOM node.
  - `DropdownMenuContent`: Menu surface with positioning and offset management.
  - `DropdownMenuItem`: Selectable action with optional `destructive` and `inset` props.
  - `DropdownMenuCheckboxItem`: Toggleable item with a checkmark indicator.
  - `DropdownMenuRadioGroup`: Group for mutually exclusive radio items.
  - `DropdownMenuRadioItem`: Radio option with a dot indicator.
  - `DropdownMenuLabel`: Accessible section heading.
  - `DropdownMenuSeparator`: Horizontal divider line.
  - `DropdownMenuShortcut`: Right-aligned keyboard shortcut hint.
  - `DropdownMenuGroup`: Container for grouping related menu items.
  - `DropdownMenuSub`: Root container for nested submenus.
  - `DropdownMenuSubTrigger`: Activator opening a submenu with a right chevron icon.
  - `DropdownMenuSubContent`: Surface containing nested submenu options.

#### 1. Basic & Dashboard Action Menu Example
```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  Button
} from '@feedbackhub/ui';

export function FeedbackFormActionMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Actions ▾
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Form Actions</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => handleEdit()}>
            Edit form
            <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleDuplicate()}>
            Duplicate form
            <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleExport()}>
            Export responses
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => handleArchive()}>
            Archive form
          </DropdownMenuItem>
          <DropdownMenuItem destructive onSelect={() => handleDelete()}>
            Delete form
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### 2. Checkbox & Radio Selection Example
```tsx
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  Button
} from '@feedbackhub/ui';

export function FormSettingsMenu() {
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [targetAudience, setTargetAudience] = useState<'customers' | 'employees' | 'both'>('customers');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">Form Settings</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Preferences</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={allowAnonymous}
          onCheckedChange={setAllowAnonymous}
        >
          Allow Anonymous Feedback
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={emailAlerts}
          onCheckedChange={setEmailAlerts}
        >
          Instant Email Alerts
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Audience Scope</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={targetAudience} onValueChange={(val) => setTargetAudience(val as any)}>
          <DropdownMenuRadioItem value="customers">Customers</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="employees">Employees</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="both">Both Audiences</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### 3. Submenu Example
```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  Button
} from '@feedbackhub/ui';

export function ShareMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Share</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Direct Portal Link</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Export Options</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Export CSV</DropdownMenuItem>
            <DropdownMenuItem>Export JSON</DropdownMenuItem>
            <DropdownMenuItem>Download QR Code</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### Keyboard Accessibility:
- **Opening**: Click, or press `Enter`, `Space`, or `ArrowDown` while focused on the trigger.
- **Navigating**: `ArrowDown` moves to the next item; `ArrowUp` moves to the previous item (wraps around).
- **Submenus**: `ArrowRight` opens a submenu; `ArrowLeft` or `Escape` closes it and returns focus to the subtrigger.
- **Selecting**: Press `Enter` or `Space` on any active item to select it.
- **Dismissing**: Press `Escape` or click outside to dismiss the menu and automatically restore focus to the trigger element.

---

## 3. Extending Primitives

When creating new components in subsequent phases:

1. **Tokens First**: Never hardcode colors or arbitrary border radii. Consume CSS custom properties or token values from `tokens.ts`.
2. **Accessible by Default**: Always support `:focus-visible`, forward React refs, and connect form fields with ARIA attributes.
3. **Class Merging**: Always accept an optional `className` prop and wrap final output with `cn(baseClasses, className)`.
4. **Behavioral Testing**: Add tests in `__tests__/<Component>.test.tsx` verifying interactive behavior, accessibility attributes, and error states.
