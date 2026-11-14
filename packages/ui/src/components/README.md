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
| **Checkboxes** | `5px` | Modern soft square (`rounded-[5px]`) |
| **Radio Buttons** | `9999px` | Circular indicators (`rounded-full`) |
| **Switches** | `9999px` | Pill-shaped track & circular thumb (`rounded-full`) |
| **Sliders** | `9999px` | Pill-shaped track & circular thumbs (`rounded-full`) |
| **Tabs List** | `var(--radius-btn-secondary)` | 12px container (`rounded-xl`), 10px triggers (`rounded-[10px]`) |
| **Empty State Cards** | `var(--radius-card-lg)` | 20px card (`rounded-[20px]`), 16px icon badge (`rounded-2xl`) |
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

### 2.9 Select (`Select.tsx`)

Fully accessible, composable select dropdown built on `@radix-ui/react-select`. Supports placeholders, controlled/uncontrolled values, disabled items/states, error validation styling, group labels, separators, and scroll overflow buttons.

- **Radius**: Strict 14px rounded corners (`rounded-[14px]`) matching `Input` and `Textarea` design tokens.
- **Surface**: White elevated surface (`bg-surface-card`), subtle border (`border-border`), and multi-layer soft depth (`shadow-soft-md`).
- **Composable Parts**:
  - `Select`: Root state container managing selection.
  - `SelectGroup`: Groups related options together.
  - `SelectValue`: Renders selected value text or placeholder.
  - `SelectTrigger`: Interactive button opening the dropdown with 14px radius, chevron icon, and optional `error` state.
  - `SelectContent`: Portaled dropdown list container (`popper` positioning, `z-50`, bounded by `--radix-select-content-available-height` and `--radix-select-trigger-width`).
  - `SelectLabel`: Accessible group header.
  - `SelectItem`: Individual selectable option with checkmark SVG indicator.
  - `SelectSeparator`: Visual divider line.
  - `SelectScrollUpButton`: Scroll button appearing when options overflow upwards.
  - `SelectScrollDownButton`: Scroll button appearing when options overflow downwards.

#### 1. Basic Usage Example
```tsx
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@feedbackhub/ui';

export function FeedbackCategorySelect() {
  return (
    <Select defaultValue="product">
      <SelectTrigger aria-label="Feedback Category">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="product">Product Feedback</SelectItem>
        <SelectItem value="service">Customer Support</SelectItem>
        <SelectItem value="billing">Billing & Pricing</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

#### 2. Controlled Usage Example
```tsx
import React, { useState } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@feedbackhub/ui';

export function PrioritySelector() {
  const [priority, setPriority] = useState('medium');

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-content-main">
        Feedback Priority
      </label>
      <Select value={priority} onValueChange={setPriority}>
        <SelectTrigger aria-label="Priority">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low Priority</SelectItem>
          <SelectItem value="medium">Medium Priority</SelectItem>
          <SelectItem value="high">High Priority</SelectItem>
        </SelectContent>
      </Select>
      <span className="text-xs text-content-secondary">
        Current selection: {priority}
      </span>
    </div>
  );
}
```

#### 3. Disabled Option & Group Labels Example
```tsx
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from '@feedbackhub/ui';

export function MetricsSelector() {
  return (
    <Select defaultValue="nps">
      <SelectTrigger aria-label="Survey Metric Type">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Customer Feedback</SelectLabel>
          <SelectItem value="nps">Net Promoter Score (NPS)</SelectItem>
          <SelectItem value="csat">Customer Satisfaction (CSAT)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Employee Feedback</SelectLabel>
          <SelectItem value="enps">Employee NPS (eNPS)</SelectItem>
          <SelectItem value="360" disabled>
            360 Review (Enterprise Only)
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
```

#### 4. Label & Error Validation State Example
```tsx
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@feedbackhub/ui';

export function ValidatedSurveyRouting() {
  const errorMessage = "Please select a routing destination";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="route-select" className="text-xs font-semibold text-content-main">
        Routing Destination <span className="text-semantic-error">*</span>
      </label>
      <Select>
        <SelectTrigger
          id="route-select"
          error={errorMessage}
          aria-describedby="routing-error-msg"
        >
          <SelectValue placeholder="Choose team..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="triage">Triage Team</SelectItem>
          <SelectItem value="exec">Executive Escalations</SelectItem>
        </SelectContent>
      </Select>
      <p id="routing-error-msg" role="alert" className="text-xs text-semantic-error font-medium">
        {errorMessage}
      </p>
    </div>
  );
}
```

#### Accessibility Notes:
- **ARIA Roles**: Trigger exposes `role="combobox"` with `aria-haspopup="listbox"` and `aria-expanded`.
- **Keyboard Control**:
  - `ArrowDown` or `Space` / `Enter` opens the dropdown from the trigger.
  - `ArrowDown` / `ArrowUp` navigates through options.
  - `Home` / `End` jumps to the first / last option.
  - `Enter` or `Space` commits the highlighted option.
  - `Escape` dismisses the dropdown and returns focus to the trigger.
- **Focus Restoration**: Focus is automatically restored to the `SelectTrigger` upon selection or dismissal.

---

### 2.10 Checkbox (`Checkbox.tsx`)

Fully accessible, composable checkbox component built on `@radix-ui/react-checkbox`. Supports controlled and uncontrolled states, indeterminate status, disabled state, required semantics, error states, and standard form integration.

- **Geometry**: Compact 16px square (`h-4 w-4`) with 5px rounded corners (`rounded-[5px]`).
- **Surface**: Neutral card background (`bg-surface-card border-border`) when unchecked; Primary Purple (`bg-brand-primary border-brand-primary text-white`) when checked or indeterminate.
- **Indicator**: Dual SVG indicators (crisp checkmark for `checked`, horizontal dash for `indeterminate`). State is never communicated by color alone.
- **Focus Ring**: Prominent semantic ring (`focus-visible:ring-brand-primary focus-visible:ring-offset-1`).

#### 1. Basic Uncontrolled Example with Label
```tsx
import { Checkbox } from '@feedbackhub/ui';

export function TermsCheckbox() {
  return (
    <div className="flex items-center gap-2.5">
      <Checkbox id="terms-consent" defaultChecked name="terms" value="accepted" />
      <label htmlFor="terms-consent" className="text-sm font-normal text-content-main cursor-pointer select-none">
        I accept the FeedbackHub terms and privacy policy
      </label>
    </div>
  );
}
```

#### 2. Controlled Checkbox Example
```tsx
import { useState } from 'react';
import { Checkbox, type CheckedState } from '@feedbackhub/ui';

export function NotificationsToggle() {
  const [notify, setNotify] = useState<CheckedState>(false);

  return (
    <div className="flex items-center gap-2.5">
      <Checkbox
        id="weekly-digest"
        checked={notify}
        onCheckedChange={setNotify}
      />
      <label htmlFor="weekly-digest" className="text-sm font-medium text-content-main cursor-pointer select-none">
        Receive weekly feedback sentiment digest
      </label>
    </div>
  );
}
```

#### 3. Indeterminate Parent Checkbox Example
```tsx
import { useState } from 'react';
import { Checkbox, type CheckedState } from '@feedbackhub/ui';

export function CategorySelectionGroup() {
  const [items, setItems] = useState({
    bug: true,
    feature: false,
    praise: false,
  });

  const allChecked = Object.values(items).every(Boolean);
  const isIndeterminate = Object.values(items).some(Boolean) && !allChecked;
  const parentChecked: CheckedState = isIndeterminate ? 'indeterminate' : allChecked;

  const handleParentChange = (nextState: CheckedState) => {
    const target = nextState === true;
    setItems({ bug: target, feature: target, praise: target });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id="select-all"
          checked={parentChecked}
          onCheckedChange={handleParentChange}
        />
        <label htmlFor="select-all" className="text-sm font-semibold text-content-main cursor-pointer">
          Select all categories
        </label>
      </div>

      <div className="ml-6 space-y-1.5">
        <div className="flex items-center gap-2">
          <Checkbox
            id="cat-bug"
            checked={items.bug}
            onCheckedChange={(c) => setItems((s) => ({ ...s, bug: c === true }))}
          />
          <label htmlFor="cat-bug" className="text-sm text-content-secondary cursor-pointer">
            Bug Reports
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="cat-feature"
            checked={items.feature}
            onCheckedChange={(c) => setItems((s) => ({ ...s, feature: c === true }))}
          />
          <label htmlFor="cat-feature" className="text-sm text-content-secondary cursor-pointer">
            Feature Requests
          </label>
        </div>
      </div>
    </div>
  );
}
```

#### Accessibility Notes:
- **Semantic Role**: Emits `role="checkbox"`.
- **States**: Accurately reports `aria-checked="true"`, `aria-checked="false"`, or `aria-checked="mixed"` (for indeterminate).
- **Keyboard Operation**: Can be toggled using the `Space` key.
- **Disabled State**: Uses `disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-transparent`.
- **Error Semantics**: Supports `error` prop which sets `aria-invalid="true"` and applies `border-semantic-error`.

---

### 2.11 Radio Group (`RadioGroup.tsx`)

Fully accessible, composable radio group primitive built on `@radix-ui/react-radio-group`. Supports controlled/uncontrolled selection, single selection enforcement, horizontal and vertical layouts, disabled states, required semantics, roving focus keyboard navigation, and HTML form integration.

- **Geometry**: 16px circular button (`h-4 w-4 rounded-full`) with an 8px inner indicator dot (`h-2 w-2 rounded-full`).
- **Surface**: White card surface (`bg-surface-card border-border hover:border-border`) when unselected; Primary Purple border and dot (`border-brand-primary text-brand-primary bg-brand-primary`) when selected.
- **Focus Ring**: Semantic focus ring (`focus-visible:ring-brand-primary focus-visible:ring-offset-1`).
- **Composable Parts**:
  - `RadioGroup`: Root container managing roving focus and group selection.
  - `RadioGroupItem`: Circular radio option button.
  - `RadioGroupIndicator`: Centered active dot indicator.
  - `RadioGroupLabel`: Accessible label component for the group or individual items.
  - `RadioGroupDescription`: Secondary helper text for the group or options.

#### 1. Basic Radio Group Example
```tsx
import { RadioGroup, RadioGroupItem, RadioGroupLabel } from '@feedbackhub/ui';

export function PrioritySelector() {
  return (
    <RadioGroup defaultValue="medium" aria-label="Ticket Priority">
      <div className="flex items-center gap-2.5">
        <RadioGroupItem value="low" id="p-low" />
        <RadioGroupLabel htmlFor="p-low">Low Priority</RadioGroupLabel>
      </div>
      <div className="flex items-center gap-2.5">
        <RadioGroupItem value="medium" id="p-medium" />
        <RadioGroupLabel htmlFor="p-medium">Medium Priority</RadioGroupLabel>
      </div>
      <div className="flex items-center gap-2.5">
        <RadioGroupItem value="high" id="p-high" />
        <RadioGroupLabel htmlFor="p-high">High Priority</RadioGroupLabel>
      </div>
    </RadioGroup>
  );
}
```

#### 2. Controlled Radio Group Example
```tsx
import { useState } from 'react';
import { RadioGroup, RadioGroupItem, RadioGroupLabel } from '@feedbackhub/ui';

export function NotificationChannel() {
  const [channel, setChannel] = useState('email');

  return (
    <div className="space-y-2">
      <RadioGroup value={channel} onValueChange={setChannel} aria-label="Notification Channel">
        <div className="flex items-center gap-2.5">
          <RadioGroupItem value="email" id="c-email" />
          <RadioGroupLabel htmlFor="c-email">Email Notifications</RadioGroupLabel>
        </div>
        <div className="flex items-center gap-2.5">
          <RadioGroupItem value="slack" id="c-slack" />
          <RadioGroupLabel htmlFor="c-slack">Slack Direct Message</RadioGroupLabel>
        </div>
      </RadioGroup>
      <p className="text-xs text-content-secondary">Active delivery: {channel}</p>
    </div>
  );
}
```

#### 3. Disabled Option Example
```tsx
import { RadioGroup, RadioGroupItem, RadioGroupLabel } from '@feedbackhub/ui';

export function SubscriptionTier() {
  return (
    <RadioGroup defaultValue="pro" aria-label="Subscription Tier">
      <div className="flex items-center gap-2.5">
        <RadioGroupItem value="free" id="t-free" />
        <RadioGroupLabel htmlFor="t-free">Starter Plan</RadioGroupLabel>
      </div>
      <div className="flex items-center gap-2.5">
        <RadioGroupItem value="pro" id="t-pro" />
        <RadioGroupLabel htmlFor="t-pro">Professional Plan</RadioGroupLabel>
      </div>
      <div className="flex items-center gap-2.5">
        <RadioGroupItem value="enterprise" id="t-ent" disabled />
        <RadioGroupLabel htmlFor="t-ent" disabled>Enterprise (Waitlist only)</RadioGroupLabel>
      </div>
    </RadioGroup>
  );
}
```

#### 4. Horizontal Orientation Example
```tsx
import { RadioGroup, RadioGroupItem, RadioGroupLabel } from '@feedbackhub/ui';

export function StatusFilter() {
  return (
    <RadioGroup orientation="horizontal" defaultValue="all" aria-label="Status Filter">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="all" id="sf-all" />
        <RadioGroupLabel htmlFor="sf-all">All</RadioGroupLabel>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="open" id="sf-open" />
        <RadioGroupLabel htmlFor="sf-open">Open</RadioGroupLabel>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="resolved" id="sf-resolved" />
        <RadioGroupLabel htmlFor="sf-resolved">Resolved</RadioGroupLabel>
      </div>
    </RadioGroup>
  );
}
```

#### 5. Required Group with Accessible Labels and Descriptions
```tsx
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupLabel,
  RadioGroupDescription,
} from '@feedbackhub/ui';

export function DeploymentRegion() {
  return (
    <div className="space-y-1.5">
      <RadioGroupLabel id="region-label" className="font-semibold">
        Data Hosting Region <span className="text-semantic-error">*</span>
      </RadioGroupLabel>
      <RadioGroupDescription id="region-desc">
        Select where customer feedback responses are encrypted and stored.
      </RadioGroupDescription>
      <RadioGroup
        required
        aria-labelledby="region-label"
        aria-describedby="region-desc"
        name="hostingRegion"
        defaultValue="us"
      >
        <div className="flex items-center gap-2.5">
          <RadioGroupItem value="us" id="reg-us" />
          <RadioGroupLabel htmlFor="reg-us">United States (Virginia)</RadioGroupLabel>
        </div>
        <div className="flex items-center gap-2.5">
          <RadioGroupItem value="eu" id="reg-eu" />
          <RadioGroupLabel htmlFor="reg-eu">European Union (Frankfurt)</RadioGroupLabel>
        </div>
      </RadioGroup>
    </div>
  );
}
```

#### 6. Customer Feedback Satisfaction Scale Example
```tsx
import { useState } from 'react';
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupLabel,
  RadioGroupDescription,
} from '@feedbackhub/ui';

export function ServiceSatisfactionSurvey() {
  const [rating, setRating] = useState('very-satisfied');

  const options = [
    { value: 'very-satisfied', label: 'Very satisfied' },
    { value: 'satisfied', label: 'Satisfied' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'dissatisfied', label: 'Dissatisfied' },
    { value: 'very-dissatisfied', label: 'Very dissatisfied' },
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface-card p-6 shadow-soft-sm">
      <div className="space-y-1">
        <RadioGroupLabel id="sat-question" className="text-base font-semibold text-content-main">
          How satisfied are you with our service?
        </RadioGroupLabel>
        <RadioGroupDescription id="sat-hint">
          Your feedback helps our product and customer success teams improve.
        </RadioGroupDescription>
      </div>

      <RadioGroup
        value={rating}
        onValueChange={setRating}
        aria-labelledby="sat-question"
        aria-describedby="sat-hint"
        name="serviceSatisfaction"
        className="space-y-2 pt-2"
      >
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-3">
            <RadioGroupItem value={opt.value} id={`sat-${opt.value}`} />
            <RadioGroupLabel htmlFor={`sat-${opt.value}`}>
              {opt.label}
            </RadioGroupLabel>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
```

#### Accessibility Notes:
- **ARIA Roles**: Container emits `role="radiogroup"`; options emit `role="radio"` with `aria-checked="true" | "false"`.
- **Keyboard Navigation**:
  - `ArrowDown` / `ArrowRight` moves focus to the next enabled option.
  - `ArrowUp` / `ArrowLeft` moves focus to the previous enabled option.
  - `Home` / `End` jumps focus to the first / last enabled option.
  - `Space` selects the currently focused option.
  - Disabled options are automatically bypassed during keyboard traversal.
- **Form Integration**: Automatically serializes with HTML forms using hidden inputs.

---

### 2.12 Switch (`Switch.tsx`)

Accessible, pill-shaped toggle switch built upon `@radix-ui/react-switch`. Supports controlled and uncontrolled states, semantic label and description association, required validation, form integration, and full keyboard interaction using the `Space` key.

- **Tokens & Geometry**:
  - Track: 44px x 24px pill shape (`h-6 w-11 rounded-full border-2 transition-smooth`), surface card background with neutral semantic border (`bg-surface-card border-border`) when OFF; Primary Purple (`bg-brand-primary border-brand-primary`) when ON.
  - Thumb: 20px x 20px circular slider (`h-5 w-5 rounded-full shadow-soft-sm ring-0 transition-transform`), muted slate (`data-[state=unchecked]:bg-content-muted`) when OFF; white (`data-[state=checked]:bg-white`) when ON, with smooth 20px horizontal translation (`translate-x-5`).
  - Focus Ring: Semantic focus ring token (`focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2`).
  - Disabled: Reduced opacity (`disabled:opacity-50 disabled:cursor-not-allowed`).
- **Composable Parts**:
  - `Switch`: Toggle root button with automatic thumb indicator.
  - `SwitchLabel`: Accessible label linked to the switch via `htmlFor`.
  - `SwitchDescription`: Secondary helper/explanatory copy linked via `aria-describedby`.
  - `SwitchThumb`: Explicit thumb component when custom indicators are required.
- **Key Props**: `checked`, `defaultChecked`, `onCheckedChange`, `disabled`, `required`, `name`, `value`, `error`, `thumbClassName`, `className`.

#### Example A — Anonymous feedback
Label: Allow anonymous submissions.

```tsx
import { Switch, SwitchLabel } from '@feedbackhub/ui';

export function AnonymousFeedbackToggle() {
  return (
    <div className="flex items-center gap-3">
      <Switch id="anonymous-mode" name="isAnonymous" />
      <SwitchLabel htmlFor="anonymous-mode">
        Allow anonymous submissions
      </SwitchLabel>
    </div>
  );
}
```

#### Example B — Email notifications
Label: Receive email notifications.

```tsx
import { Switch, SwitchLabel, SwitchDescription } from '@feedbackhub/ui';

export function EmailNotificationSettings() {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <Switch
          id="email-notif"
          name="emailNotifications"
          defaultChecked
          aria-describedby="email-notif-desc"
        />
        <SwitchLabel htmlFor="email-notif" className="font-semibold">
          Receive email notifications
        </SwitchLabel>
      </div>
      <SwitchDescription id="email-notif-desc">
        Receive a daily email digest summarizing customer satisfaction ratings and alerts.
      </SwitchDescription>
    </div>
  );
}
```

#### Example C — Employee feedback
Label: Enable employee feedback collection.

```tsx
import { Switch, SwitchLabel, SwitchDescription } from '@feedbackhub/ui';

export function EmployeeFeedbackModule() {
  return (
    <div className="rounded-2xl border border-border bg-surface-card p-5 shadow-soft-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <SwitchLabel htmlFor="emp-feedback" className="text-base font-semibold">
            Enable employee feedback collection
          </SwitchLabel>
          <SwitchDescription id="emp-feedback-desc">
            Allow internal team members to submit pulse feedback and quarterly satisfaction surveys.
          </SwitchDescription>
        </div>
        <Switch
          id="emp-feedback"
          name="employeeFeedbackEnabled"
          aria-describedby="emp-feedback-desc"
        />
      </div>
    </div>
  );
}
```

#### Example D — Controlled switch
Demonstrate `checked` and `onCheckedChange`.

```tsx
import { useState } from 'react';
import { Switch, SwitchLabel, SwitchDescription } from '@feedbackhub/ui';

export function ControlledMaintenanceToggle() {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Switch
          id="maint-mode"
          checked={maintenanceMode}
          onCheckedChange={setMaintenanceMode}
          aria-describedby="maint-desc"
        />
        <SwitchLabel htmlFor="maint-mode">
          Maintenance Mode: {maintenanceMode ? 'Active' : 'Disabled'}
        </SwitchLabel>
      </div>
      <SwitchDescription id="maint-desc">
        Temporarily pauses external feedback widgets while platform schema migration runs.
      </SwitchDescription>
    </div>
  );
}
```

#### Example E — Disabled switch
Demonstrate a disabled setting.

```tsx
import { Switch, SwitchLabel, SwitchDescription } from '@feedbackhub/ui';

export function EnterpriseSsoToggle() {
  return (
    <div className="space-y-1 opacity-75">
      <div className="flex items-center gap-3">
        <Switch
          id="sso-enforce"
          disabled
          defaultChecked={false}
          aria-describedby="sso-desc"
        />
        <SwitchLabel htmlFor="sso-enforce" disabled>
          Enforce SAML 2.0 Single Sign-On
        </SwitchLabel>
      </div>
      <SwitchDescription id="sso-desc">
        SAML 2.0 Single Sign-On enforcement is an Enterprise tier feature. Upgrade your organization plan to unlock this setting.
      </SwitchDescription>
    </div>
  );
}
```

#### Accessibility Notes:
- **ARIA Roles**: Track element emits `role="switch"` and manages `aria-checked="true" | "false"`.
- **Keyboard Navigation**:
  - `Tab` / `Shift+Tab` moves focus to and from the switch.
  - `Space` toggles the switch on and off using Radix UI accessible event binding.
  - Disabled switches are unfocusable or inert and cannot be activated via keyboard.
- **Form Integration**: Transparently mounts a hidden checkbox input to support native HTML `<form>` submissions.
- **Screen Reader Support**: Associated with labels and descriptions via `htmlFor` and `aria-describedby` or explicit `aria-label`.

---

### 2.13 Slider (`Slider.tsx`)

Accessible, highly configurable slider primitive built upon `@radix-ui/react-slider`. Supports single-value sliders and dual-thumb range sliders, controlled and uncontrolled state management, accessible label and description pairing, custom step increments, and comprehensive keyboard navigation.

- **Tokens & Geometry**:
  - Track: Pill-shaped track (`h-2 rounded-full bg-border transition-smooth`) with vertical orientation support (`w-2 h-full`).
  - Range: Filled active bar in Primary Purple (`bg-brand-primary transition-smooth`).
  - Thumb: 20px x 20px circular slider knob (`h-5 w-5 rounded-full border-2 border-brand-primary bg-surface-card shadow-soft-sm transition-smooth`).
  - Focus Ring: Semantic focus ring token (`focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2`).
  - Disabled: Reduced opacity and disabled cursor (`data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed`).
- **Composable Parts**:
  - `Slider`: Root container that automatically mounts track, range, and thumbs when used as a self-contained component, or houses custom subcomponents.
  - `SliderTrack`: Base track container.
  - `SliderRange`: Colored fill representing current value or span.
  - `SliderThumb`: Movable knob indicator with accessible keyboard semantics.
  - `SliderLabel`: Label component with optional disabled styling.
  - `SliderDescription`: Secondary helper text.
- **Key Props**: `value`, `defaultValue`, `onValueChange`, `onValueCommit`, `min`, `max`, `step`, `disabled`, `orientation`, `thumbAriaLabels`, `thumbClassName`, `trackClassName`, `rangeClassName`.

#### Example 1 — Single-Value Slider
Self-contained single slider with default value.

```tsx
import { Slider } from '@feedbackhub/ui';

export function RatingSlider() {
  return (
    <div className="w-full max-w-md">
      <Slider
        defaultValue={[75]}
        min={0}
        max={100}
        step={5}
        aria-label="Customer Satisfaction Rating"
      />
    </div>
  );
}
```

#### Example 2 — Controlled Slider
Demonstrates `value` and `onValueChange` state synchronization.

```tsx
import { useState } from 'react';
import { Slider, SliderLabel } from '@feedbackhub/ui';

export function ControlledVolumeSlider() {
  const [volume, setVolume] = useState<number[]>([60]);

  return (
    <div className="space-y-3 w-full max-w-md">
      <div className="flex justify-between items-center">
        <SliderLabel id="vol-label">Notification Volume</SliderLabel>
        <span className="text-sm font-semibold text-brand-primary">{volume[0]}%</span>
      </div>
      <Slider
        value={volume}
        onValueChange={setVolume}
        min={0}
        max={100}
        step={1}
        aria-labelledby="vol-label"
      />
    </div>
  );
}
```

#### Example 3 — Range Slider (Two Thumbs)
Select minimum and maximum values with dual interactive thumbs.

```tsx
import { useState } from 'react';
import { Slider, SliderLabel, SliderDescription } from '@feedbackhub/ui';

export function PriceRangeFilter() {
  const [range, setRange] = useState<number[]>([250, 750]);

  return (
    <div className="space-y-2 w-full max-w-md">
      <SliderLabel id="price-range-label">Filter by NPS Score Range</SliderLabel>
      <SliderDescription id="price-range-desc">
        Focus analytics on respondents within a specific score bracket.
      </SliderDescription>
      <Slider
        value={range}
        onValueChange={setRange}
        min={0}
        max={1000}
        step={10}
        aria-labelledby="price-range-label"
        aria-describedby="price-range-desc"
        thumbAriaLabels={['Minimum score bracket', 'Maximum score bracket']}
      />
      <div className="flex justify-between text-xs text-content-secondary">
        <span>Min: {range[0]}</span>
        <span>Max: {range[1]}</span>
      </div>
    </div>
  );
}
```

#### Example 4 — Disabled Slider
Demonstrates non-interactive disabled styling.

```tsx
import { Slider, SliderLabel, SliderDescription } from '@feedbackhub/ui';

export function DisabledRetentionSlider() {
  return (
    <div className="space-y-2 w-full max-w-md opacity-75">
      <SliderLabel id="retention-label" disabled>
        Data Retention Period (Days)
      </SliderLabel>
      <Slider
        disabled
        defaultValue={[90]}
        min={30}
        max={365}
        aria-labelledby="retention-label"
        aria-describedby="retention-desc"
      />
      <SliderDescription id="retention-desc">
        Custom data retention is locked to 90 days on the Standard tier.
      </SliderDescription>
    </div>
  );
}
```

#### Example 5 — Accessible Label and Description (Composable API)
Explicit composition of Slider subcomponents with screen reader associations.

```tsx
import {
  Slider,
  SliderTrack,
  SliderRange,
  SliderThumb,
  SliderLabel,
  SliderDescription,
} from '@feedbackhub/ui';

export function ComposableSurveySlider() {
  return (
    <div className="space-y-2 w-full max-w-md">
      <SliderLabel id="survey-scale-label">Survey Response Target</SliderLabel>
      <SliderDescription id="survey-scale-desc">
        Set the monthly response threshold before triggering an alert.
      </SliderDescription>
      <Slider
        defaultValue={[500]}
        min={100}
        max={2000}
        step={50}
        aria-labelledby="survey-scale-label"
        aria-describedby="survey-scale-desc"
      >
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb aria-label="Monthly response goal" />
      </Slider>
    </div>
  );
}
```

#### Accessibility & Keyboard Information:
- **ARIA Semantics**:
  - Thumbs emit `role="slider"`.
  - Exposes `aria-valuemin`, `aria-valuemax`, and real-time `aria-valuenow`.
  - Multi-thumb sliders expose distinct accessible names for each thumb via `thumbAriaLabels` or explicit `aria-label`.
  - When `aria-invalid="true"` or an `error` prop is present, `aria-invalid="true"` and semantic error styling (`border-semantic-error focus-visible:ring-semantic-error`) are automatically assigned to all interactive slider thumb elements with `role="slider"`.
  - When `aria-invalid="false"` is explicitly supplied, the valid state is preserved on all thumbs and error styling is not applied solely because the attribute exists.
  - Other explicitly supplied ARIA invalid values (including `"grammar"` and `"spelling"`) are preserved on thumbs and receive semantic error styling.
  - Consistent error and invalid state propagation applies uniformly to automatically generated single-value thumbs, range thumbs, and composable `SliderThumb` instances.
- **Keyboard Navigation**:
  - `ArrowRight` / `ArrowUp`: Increments slider value by one `step`.
  - `ArrowLeft` / `ArrowDown`: Decrements slider value by one `step`.
  - `Home`: Jumps thumb to `min`.
  - `End`: Jumps thumb to `max`.
  - `PageUp`: Advances slider value by 10 steps (`10 * step`), clamped to `max`.
  - `PageDown`: Decreases slider value by 10 steps (`10 * step`), clamped to `min`.
  - Disabled sliders reflect `aria-disabled="true"`, `data-disabled=""`, and prevent all keyboard/pointer interactions.
- **Form Integration**: Transparently renders hidden `<input>` elements when `name` is passed, enabling standard HTML form submission.

---

### 2.14 Tabs (`Tabs.tsx`)

Fully accessible, composable tabbed interface component built on `@radix-ui/react-tabs`. Provides structured navigation between alternate views within the same context, supporting horizontal and vertical orientations, automatic and manual activation modes, controlled and uncontrolled state management, disabled triggers, and optional DOM preservation via `forceMount`.

- **Geometry**:
  - `TabsList`: 12px rounded container (`rounded-xl`) with 4px padding (`p-1`), neutral border (`border border-border`), and smooth transitions.
  - `TabsTrigger`: 10px rounded interactive tab triggers (`rounded-[10px]`) with responsive padding (`px-3.5 py-1.5`), active elevation card surface (`data-[state=active]:bg-surface-card data-[state=active]:shadow-soft-sm`), and clear focus rings.
  - `TabsContent`: Focusable tab panels (`rounded-xl focus-visible:ring-2 focus-visible:ring-brand-primary`) with automatic content hiding for inactive states (`data-[state=inactive]:hidden`).
- **Components & Exports**:
  - `Tabs`: Root tabs container managing active tab state, orientation, and keyboard activation behavior.
  - `TabsList`: Container for tab triggers (`role="tablist"`).
  - `TabsTrigger`: Interactive tab element (`role="tab"`).
  - `TabsContent`: Panel container presenting associated content (`role="tabpanel"`).
- **Public Types**: `TabsProps`, `TabsListProps`, `TabsTriggerProps`, `TabsContentProps`.

#### Example 1 — Basic Uncontrolled Tabs (Feedback Dashboard)
Uncontrolled horizontal tabs switching between overview and category feedback feeds.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@feedbackhub/ui';

export function FeedbackDashboardTabs() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList aria-label="Feedback navigation">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="customer">Customer Feedback</TabsTrigger>
        <TabsTrigger value="employee">Employee Feedback</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="p-4 rounded-xl border border-border bg-surface-card">
          <h3 className="text-base font-semibold text-content-main">Aggregate Analytics</h3>
          <p className="mt-1 text-sm text-content-secondary">
            Overall sentiment score: 4.8 / 5.0 across 1,240 responses this month.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="customer">
        <div className="p-4 rounded-xl border border-border bg-surface-card">
          <h3 className="text-base font-semibold text-content-main">Customer Feedback Stream</h3>
          <p className="mt-1 text-sm text-content-secondary">
            Displaying verified customer survey submissions and Net Promoter Scores.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="employee">
        <div className="p-4 rounded-xl border border-border bg-surface-card">
          <h3 className="text-base font-semibold text-content-main">Internal Employee Pulse</h3>
          <p className="mt-1 text-sm text-content-secondary">
            Anonymous internal feedback and quarterly eNPS benchmarks.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
```

#### Example 2 — Controlled Tabs (Feedback Response Details View)
Controlled tab state synchronized with external application state or URL search parameters.

```tsx
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@feedbackhub/ui';

export function ResponseDetailsView() {
  const [activeTab, setActiveTab] = useState('details');

  return (
    <div className="space-y-4 w-full max-w-2xl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-content-secondary">
          Active view: <strong className="text-content-main">{activeTab}</strong>
        </span>
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className="text-xs text-brand-primary underline"
        >
          Jump to Timeline
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList aria-label="Response details sections">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <div className="p-4 rounded-xl border border-border bg-surface-card text-sm text-content-main">
            Customer reported latency issue on checkout funnel. Priority: High.
          </div>
        </TabsContent>
        <TabsContent value="timeline">
          <div className="p-4 rounded-xl border border-border bg-surface-card text-sm text-content-main">
            Audit log: Submitted at 10:14 AM &bull; Triaged by Support at 10:30 AM.
          </div>
        </TabsContent>
        <TabsContent value="metadata">
          <div className="p-4 rounded-xl border border-border bg-surface-card text-sm text-content-main">
            Browser: Chrome 124 &bull; OS: macOS 14 &bull; IP: 192.168.1.1
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### Example 3 — Vertical Tabs (Company Settings Navigation)
Vertical orientation for multi-section administrative settings.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@feedbackhub/ui';

export function CompanySettingsNavigation() {
  return (
    <Tabs defaultValue="general" orientation="vertical" className="w-full">
      <TabsList aria-label="Company settings">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="branding">Branding</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <div className="p-6 rounded-xl border border-border bg-surface-card">
          <h2 className="text-lg font-semibold text-content-main">General Settings</h2>
          <p className="mt-2 text-sm text-content-secondary">
            Configure tenant name, default language, and timezone settings.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="branding">
        <div className="p-6 rounded-xl border border-border bg-surface-card">
          <h2 className="text-lg font-semibold text-content-main">Brand Customization</h2>
          <p className="mt-2 text-sm text-content-secondary">
            Upload custom company logos, set brand colors, and configure email templates.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="notifications">
        <div className="p-6 rounded-xl border border-border bg-surface-card">
          <h2 className="text-lg font-semibold text-content-main">Notification Preferences</h2>
          <p className="mt-2 text-sm text-content-secondary">
            Manage email digests, Slack webhook integrations, and urgent alert routing.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="security">
        <div className="p-6 rounded-xl border border-border bg-surface-card">
          <h2 className="text-lg font-semibold text-content-main">Security & SSO</h2>
          <p className="mt-2 text-sm text-content-secondary">
            Configure SAML 2.0 single sign-on, session timeouts, and two-factor enforcement.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
```

#### Example 4 — Manual Activation Mode (Survey Builder)
Prevents premature content rendering during arrow-key navigation by requiring `Enter` or `Space` to activate tabs (`activationMode="manual"`).

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@feedbackhub/ui';

export function ManualSurveyBuilderTabs() {
  return (
    <Tabs defaultValue="questions" activationMode="manual" className="w-full">
      <TabsList aria-label="Survey editor steps">
        <TabsTrigger value="questions">Questions</TabsTrigger>
        <TabsTrigger value="logic">Conditional Logic</TabsTrigger>
        <TabsTrigger value="preview">Live Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="questions">
        <div className="p-4 rounded-xl border border-border bg-surface-card text-sm text-content-main">
          Survey questions editor and field configuration.
        </div>
      </TabsContent>
      <TabsContent value="logic">
        <div className="p-4 rounded-xl border border-border bg-surface-card text-sm text-content-main">
          Branching rules and question skip logic tree.
        </div>
      </TabsContent>
      <TabsContent value="preview">
        <div className="p-4 rounded-xl border border-border bg-surface-card text-sm text-content-main">
          Interactive respondent preview simulator.
        </div>
      </TabsContent>
    </Tabs>
  );
}
```

#### Example 5 — Disabled Tab (Enterprise Analytics)
Demonstrates disabled tab triggers with inaccessible pointer and keyboard interactions.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@feedbackhub/ui';

export function EnterpriseAnalyticsTabs() {
  return (
    <Tabs defaultValue="standard" className="w-full">
      <TabsList aria-label="Analytics features">
        <TabsTrigger value="standard">Standard Analytics</TabsTrigger>
        <TabsTrigger value="advanced" disabled>
          Predictive AI (Enterprise Only)
        </TabsTrigger>
      </TabsList>
      <TabsContent value="standard">
        <div className="p-4 rounded-xl border border-border bg-surface-card text-sm text-content-main">
          Standard feedback trends, response volume, and sentiment scores.
        </div>
      </TabsContent>
      <TabsContent value="advanced">
        <div className="p-4 rounded-xl border border-border bg-surface-card text-sm text-content-main">
          Advanced predictive churn forecasting and natural language clustering.
        </div>
      </TabsContent>
    </Tabs>
  );
}
```

#### Accessibility & Keyboard Information:
- **ARIA Semantics**:
  - `TabsList` emits `role="tablist"` and exposes `aria-orientation` matching the orientation prop (`horizontal` or `vertical`).
  - `TabsTrigger` emits `role="tab"`, manages `aria-selected="true" | "false"`, `data-state="active" | "inactive"`, and dynamically links `aria-controls` to its associated tabpanel ID.
  - `TabsContent` emits `role="tabpanel"`, manages `data-state="active" | "inactive"`, and dynamically links `aria-labelledby` to its associated tab trigger ID.
  - Disabled tabs receive `disabled`, `data-disabled=""`, and prevent pointer and keyboard events.
- **Keyboard Navigation**:
  - **Horizontal Tabs**:
    - `ArrowRight`: Moves focus (and activates in `automatic` mode) to the next tab, cycling from last to first.
    - `ArrowLeft`: Moves focus (and activates in `automatic` mode) to the previous tab, cycling from first to last.
  - **Vertical Tabs**:
    - `ArrowDown`: Moves focus to the next tab vertically.
    - `ArrowUp`: Moves focus to the previous tab vertically.
  - **Common Keys**:
    - `Home`: Focuses the first non-disabled tab trigger.
    - `End`: Focuses the last non-disabled tab trigger.
    - `Enter` / `Space`: When `activationMode="manual"`, activates the currently focused tab. In `automatic` mode, tabs activate automatically upon receiving focus.
- **Preserving Inactive Content (`forceMount`)**:
  - By default, inactive tab panels unmount their child content for performance.
  - When `forceMount={true}` is set on `TabsContent`, the panel content remains mounted in the DOM (useful for preserving client form state, video/audio players, or iframe caches) while being visually and accessibly hidden via `data-[state=inactive]:hidden`.

---

### 2.15 Empty State (`EmptyState.tsx`)

Production-quality, accessible empty state component for zero-data, initial onboarding, search misses, and clean states. Features a composable architecture (`EmptyState`, `EmptyStateIcon`, `EmptyStateTitle`, `EmptyStateDescription`, `EmptyStateActions`) with responsive sizing, card/compact variants, and automatic accessibility defaults.

- **Geometry**:
  - `EmptyState`: Centered, balanced vertical flex container with configurable padding (`p-4` for `sm`, `py-10 px-6` for `md`, `py-16 px-8` for `lg`).
  - `EmptyStateIcon`: Rounded icon container (`rounded-xl` for `sm`, `rounded-2xl` for `md`, `rounded-3xl` for `lg`) with neutral border (`border border-border`), surface background (`bg-surface-main`), and soft ambient shadow (`shadow-soft-sm`).
  - `EmptyState (card)`: Elevated surface with 20px rounded corners (`rounded-[20px]`), card background (`bg-surface-card`), and subtle border (`border border-border`).
- **Components & Exports**:
  - `EmptyState`: Root container managing variant, sizing scale, and layout.
  - `EmptyStateIcon`: Icon or illustration wrapper (`aria-hidden="true"` by default).
  - `EmptyStateTitle`: Semantic heading (`h3` by default, configurable via `as`).
  - `EmptyStateDescription`: Descriptive body copy using secondary content tokens.
  - `EmptyStateActions`: Responsive button container supporting single or dual actions.
- **Public Types**: `EmptyStateProps`, `EmptyStateVariant`, `EmptyStateSize`, `EmptyStateIconProps`, `EmptyStateTitleProps`, `EmptyStateDescriptionProps`, `EmptyStateActionsProps`.

#### Example 1 — Basic Usage
Simple empty state informing users of an empty feedback inbox.

```tsx
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  Button,
} from '@feedbackhub/ui';

export function FeedbackInboxEmpty() {
  return (
    <EmptyState>
      <EmptyStateIcon>
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12h-6l-2 3h-4l-2-3H2v7h20v-7z" />
          <path d="M5.45 5.11L2 12v7a2 2 0 002 2h16a2 2 0 002-2v-7l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
        </svg>
      </EmptyStateIcon>
      <EmptyStateTitle>No feedback responses yet</EmptyStateTitle>
      <EmptyStateDescription>
        Share your survey link with respondents to begin collecting real-time sentiment data.
      </EmptyStateDescription>
      <EmptyStateActions>
        <Button variant="primary">Share Survey Link</Button>
      </EmptyStateActions>
    </EmptyState>
  );
}
```

#### Example 2 — Primary and Secondary Actions
Empty state providing both a primary creation action and a secondary documentation link.

```tsx
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  Button,
} from '@feedbackhub/ui';

export function FormsListEmpty() {
  return (
    <EmptyState size="lg">
      <EmptyStateIcon>
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      </EmptyStateIcon>
      <EmptyStateTitle>No feedback forms created</EmptyStateTitle>
      <EmptyStateDescription>
        Build your first custom survey to measure customer satisfaction, Net Promoter Score, or employee sentiment.
      </EmptyStateDescription>
      <EmptyStateActions>
        <Button variant="primary">Create feedback form</Button>
        <Button variant="outline">Learn more</Button>
      </EmptyStateActions>
    </EmptyState>
  );
}
```

#### Example 3 — Compact Variant
Dense empty state suitable for dropdowns, sidebars, dashboard widgets, and filter panels.

```tsx
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  Button,
} from '@feedbackhub/ui';

export function NotificationsWidgetEmpty() {
  return (
    <EmptyState variant="compact" size="sm">
      <EmptyStateIcon>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </EmptyStateIcon>
      <EmptyStateTitle as="h4">No notifications</EmptyStateTitle>
      <EmptyStateDescription>
        You are completely caught up! New alerts will appear here.
      </EmptyStateDescription>
      <EmptyStateActions>
        <Button variant="ghost" size="sm">Refresh</Button>
      </EmptyStateActions>
    </EmptyState>
  );
}
```

#### Example 4 — Card Variant
Elevated surface container with rounded corners, subtle border, and ambient shadow.

```tsx
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  Button,
} from '@feedbackhub/ui';

export function AnalyticsCardEmpty() {
  return (
    <EmptyState variant="card" size="md">
      <EmptyStateIcon>
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      </EmptyStateIcon>
      <EmptyStateTitle>No analytics data available</EmptyStateTitle>
      <EmptyStateDescription>
        Visual trend charts and sentiment score breakdowns will populate as soon as respondents complete your surveys.
      </EmptyStateDescription>
      <EmptyStateActions>
        <Button variant="secondary">View Sample Report</Button>
      </EmptyStateActions>
    </EmptyState>
  );
}
```

#### FeedbackHub Use Cases:
The `EmptyState` component is designed for 10 primary product scenarios across respondent portals and admin workspaces:

1. **No feedback responses received yet**: Encourages sharing the public feedback link.
2. **No feedback forms created**: Guides administrators through initial survey creation.
3. **No search results found**: Suggests clearing search queries or relaxing filter parameters.
4. **No employee feedback available**: Invites HR teams to launch an anonymous internal pulse.
5. **No customer feedback available**: Prompts embedding feedback widgets into product funnels.
6. **No notifications**: Confirms the user has reviewed all pending workspace alerts.
7. **No analytics data available**: Explains that charts will populate once responses arrive.
8. **No team members added**: Recommends inviting collaborators to manage feedback triage.
9. **No archived forms**: Indicates that inactive or retired forms have not yet been stored.
10. **No activity history**: Displays a clean slate status for newly provisioned tenant audit logs.

#### Accessibility & Token Information:
- **ARIA & Semantics**:
  - `EmptyStateTitle` renders a semantic heading (`<h3>` by default) with high-contrast text (`text-content-main`), meeting WCAG AAA requirements. Configurable via `as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div'`.
  - `EmptyStateIcon` sets `aria-hidden="true"` by default to ensure purely decorative icons or illustrations are hidden from assistive technology, avoiding noisy screen reader announcements.
  - Interactive elements inside `EmptyStateActions` retain native keyboard focusability (`focus-visible:ring-brand-primary`) and accessible names.
- **Design Tokens**:
  - Strictly consumes FeedbackHub semantic tokens: `bg-surface-main`, `bg-surface-card`, `text-content-main`, `text-content-secondary`, `border-border`, and `shadow-soft-sm`.
  - Zero hardcoded colors (`bg-slate-*`, `text-slate-*`, raw hex/rgb).

---

## 3. Extending Primitives

When creating new components in subsequent phases:

1. **Tokens First**: Never hardcode colors or arbitrary border radii. Consume CSS custom properties or token values from `tokens.ts`.
2. **Accessible by Default**: Always support `:focus-visible`, forward React refs, and connect form fields with ARIA attributes.
3. **Class Merging**: Always accept an optional `className` prop and wrap final output with `cn(baseClasses, className)`.
4. **Behavioral Testing**: Add tests in `__tests__/<Component>.test.tsx` verifying interactive behavior, accessibility attributes, and error states.
