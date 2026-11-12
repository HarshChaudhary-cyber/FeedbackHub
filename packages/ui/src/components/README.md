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

## 3. Extending Primitives

When creating new components in subsequent phases:

1. **Tokens First**: Never hardcode colors or arbitrary border radii. Consume CSS custom properties or token values from `tokens.ts`.
2. **Accessible by Default**: Always support `:focus-visible`, forward React refs, and connect form fields with ARIA attributes.
3. **Class Merging**: Always accept an optional `className` prop and wrap final output with `cn(baseClasses, className)`.
4. **Behavioral Testing**: Add tests in `__tests__/<Component>.test.tsx` verifying interactive behavior, accessibility attributes, and error states.
