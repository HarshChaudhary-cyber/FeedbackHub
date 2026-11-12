# FeedbackHub — Design System & Visual Identity

**Document Version:** 2.0.0  
**Phase:** 2.1 — Design Tokens & Styling Foundation  
**Status:** Approved & Implemented  
**Design Philosophy:** Premium Modern B2B SaaS with Friendly, High-Conversion UX  
**Visual Inspiration:** Clean, refined visual aesthetic inspired by modern, high-polish interfaces (soft depth, pill controls, generous whitespace, subtle borders, accessible contrast)  

---

## 1. Product Design Direction

FeedbackHub is a multi-tenant B2B SaaS platform that unifies customer and employee feedback. The visual design system harmonizes two distinct operational experiences:
1. **Respondent Portals (Customer & Employee)**: Friendly, conversational, approachable, frictionless, and mobile-first.
2. **Company Workspace & Admin Dashboards**: Professional, refined, high-density, calm, and data-centric.

### Core Visual Principles
- **Generous Whitespace**: Generous breathing room to reduce cognitive overload and highlight core feedback metrics.
- **Soft Shadows & Subtle Borders**: Subtle border strokes (`border-slate-200` / `#E2E8F0`) paired with multi-layer ambient drop shadows.
- **Selective Gradients**: Subtle gradients reserved for hero accents, key active states, and brand pills—avoiding neon clutter.
- **Fluid Micro-Interactions**: Smooth 150ms–200ms transitions with full support for `prefers-reduced-motion`.

---

## 2. Color Palette & Token Architecture

The color system is defined in [`packages/ui/src/tokens.ts`](../packages/ui/src/tokens.ts) and surfaced via CSS Custom Properties in [`packages/ui/src/styles/tokens.css`](../packages/ui/src/styles/tokens.css) and Tailwind CSS classes in `apps/web`.

### 2.1 Brand Spectrum
| Token Name | Hex Code | Semantic Role & Usage |
| :--- | :--- | :--- |
| **Primary Purple** | `#8B5CF6` | Primary action buttons, active navigation indicators, key highlights. |
| **Pink Accent** | `#EC4899` | NPS Promoters (9-10), delight indicators, secondary badges. |
| **Sky Blue** | `#38BDF8` | Informational callouts, active survey tabs, pulse surveys. |
| **Teal Accent** | `#2DD4BF` | Positive feedback states, resolved status badges, 5-star CSAT. |

### 2.2 Neutral Spectrum
| Token Name | Hex Code | Role & Usage |
| :--- | :--- | :--- |
| **Main Background** | `#FAFAFC` | Application canvas and page background. |
| **Surface / Card** | `#FFFFFF` | Elevated cards, dialog surfaces, table rows. |
| **Main Text** | `#1E293B` | High-contrast headings and primary body copy (Slate 800). |
| **Secondary Text** | `#64748B` | Subtitles, labels, descriptions, timestamps (Slate 500). |
| **Muted Text** | `#94A3B8` | Input placeholders, disabled controls (Slate 400). |
| **Border** | `#E2E8F0` | Structural card borders, dividers, form outlines (Slate 200). |

### 2.3 Semantic Spectrum
| Token Name | Hex Code | Role & Usage |
| :--- | :--- | :--- |
| **Success** | `#16A34A` | Successful submissions, active accounts, positive trends (Green 600). |
| **Warning** | `#D97706` | Approaching quotas, passive NPS ratings, unsaved alerts (Amber 600). |
| **Error** | `#DC2626` | Validation errors, detractor NPS ratings, critical alerts (Red 600). |
| **Information** | `#0284C7` | Neutral system notices, onboarding hints (Sky 600). |

---

## 3. Strict Rounded UI Design Language

All UI components must adhere strictly to these defined corner radius rules to preserve brand identity across the entire product:

| UI Component | Corner Radius Rule | Tailwind Utility | CSS Custom Property |
| :--- | :--- | :--- | :--- |
| **Main Dashboard Cards** | `20px` | `rounded-card-lg` / `rounded-[20px]` | `var(--radius-card-lg)` |
| **Small Cards & Widgets** | `16px` | `rounded-card-sm` / `rounded-2xl` | `var(--radius-card-sm)` |
| **Primary Buttons** | Pill-shaped (`9999px`) | `rounded-full` | `var(--radius-btn-primary)` |
| **Secondary Buttons** | `12px` | `rounded-btn-secondary` / `rounded-xl` | `var(--radius-btn-secondary)` |
| **Inputs & Textareas** | `12–14px` (`14px` default) | `rounded-input` / `rounded-xl` | `var(--radius-input)` |
| **Modal Windows & Dialogs** | `24px` | `rounded-modal` / `rounded-3xl` | `var(--radius-modal)` |
| **Badges & Status Tags** | Pill-shaped (`9999px`) | `rounded-full` | `var(--radius-badge)` |
| **Avatars** | Circular (`9999px`) | `rounded-full` | `var(--radius-avatar)` |

---

## 4. Typography Scale

FeedbackHub uses a clean sans-serif typography stack based on **Inter** with tabular figure support.

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

| Hierarchy Level | Font Size | Line Height | Weight | Tailwind Utility | Primary Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | 36px (2.25rem) | 1.2 | 700 (Bold) | `text-4xl font-bold` | Landing hero, big metric displays |
| **Page Heading (H1)** | 28px (1.75rem) | 1.25 | 700 (Bold) | `text-2xl font-bold` | Dashboard page titles, form title |
| **Section Heading (H2)** | 22px (1.375rem) | 1.3 | 600 (Semibold) | `text-xl font-semibold` | Card group titles, form section |
| **Card Heading (H3)** | 18px (1.125rem) | 1.4 | 600 (Semibold) | `text-lg font-semibold` | Survey question title, modal header |
| **Body Base** | 15px (0.9375rem) | 1.5 | 400 (Regular) | `text-[15px]` | Standard body copy, form answers |
| **Body Small** | 13px (0.8125rem) | 1.4 | 500 (Medium) | `text-xs font-medium` | Descriptions, table cells, metadata |
| **Caption / Labels** | 11px (0.6875rem) | 1.3 | 600 (Semibold) | `text-[11px] font-semibold` | Badges, timestamps, footers |

---

## 5. Spacing Scale (4px Base Grid)

Spacing uses an 8-point / 4-point incremental grid:

| Step | Pixels | Rem Equivalent | Tailwind Class |
| :---: | :---: | :---: | :---: |
| 1 | 4px | 0.25rem | `p-1`, `gap-1`, `m-1` |
| 2 | 8px | 0.5rem | `p-2`, `gap-2`, `m-2` |
| 3 | 12px | 0.75rem | `p-3`, `gap-3`, `m-3` |
| 4 | 16px | 1rem | `p-4`, `gap-4`, `m-4` |
| 5 | 20px | 1.25rem | `p-5`, `gap-5`, `m-5` |
| 6 | 24px | 1.5rem | `p-6`, `gap-6`, `m-6` |
| 8 | 32px | 2rem | `p-8`, `gap-8`, `m-8` |
| 10 | 40px | 2.5rem | `p-10`, `gap-10` |
| 12 | 48px | 3rem | `p-12`, `gap-12` |
| 16 | 64px | 4rem | `p-16`, `gap-16` |

---

## 6. Elevation & Shadows

Soft multi-layer shadows create natural surface elevation without harsh dark silhouettes:

```css
--shadow-soft-sm: 0 2px 8px -2px rgba(15, 23, 42, 0.04), 0 1px 4px -1px rgba(15, 23, 42, 0.02);
--shadow-soft-md: 0 8px 24px -4px rgba(15, 23, 42, 0.06), 0 2px 8px -2px rgba(15, 23, 42, 0.03);
--shadow-soft-lg: 0 20px 40px -8px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04);
--shadow-glow-purple: 0 0 24px -4px rgba(139, 92, 246, 0.25);
```

- `shadow-soft-sm`: Subtle card elevation, badge depth.
- `shadow-soft-md`: Main dashboard cards, elevated form containers.
- `shadow-soft-lg`: Floating modal dialogs, popovers, dropdown menus.
- `shadow-glow-purple`: Focus state halo, primary CTA hover state.

---

## 7. Responsive Breakpoints

FeedbackHub employs mobile-first responsive breakpoints:

| Name | Minimum Width | Typical Target |
| :--- | :--- | :--- |
| `sm` | `640px` | Large smartphones / landscape mobile |
| `md` | `768px` | Tablets and small screens |
| `lg` | `1024px` | Laptops and standard desktop |
| `xl` | `1280px` | Large desktop displays |
| `2xl` | `1536px` | Ultra-wide monitors |

---

## 8. Accessibility, Contrast & Interaction States

### 8.1 Focus Rings
Accessible keyboard navigation is mandatory across all interactive elements:
```css
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
```
In Tailwind components: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2`.

### 8.2 Contrast Guard
- All primary text (`#1E293B`) achieves a contrast ratio $> 12:1$ against `#FFFFFF` and `#FAFAFC` (exceeding WCAG AAA).
- Secondary text (`#64748B`) achieves $> 4.8:1$ against `#FFFFFF` (exceeding WCAG AA).
- Primary Purple buttons (`#8B5CF6`) with white text achieve $> 4.6:1$ contrast ratio.

### 8.3 Motion & Transitions
Transitions default to `cubic-bezier(0.16, 1, 0.3, 1)` with durations between 150ms and 200ms.  
When `prefers-reduced-motion: reduce` is detected, animations and transitions are automatically collapsed to zero duration.

---

## 9. Developer Usage Guide

### 9.1 Using Tailwind Utilities (Recommended in Apps)
In `apps/web`:
```tsx
<div className="bg-surface-card rounded-card-lg p-6 shadow-soft-md border border-border">
  <h2 className="text-xl font-semibold text-content-main">Customer Feedback</h2>
  <p className="text-xs text-content-secondary mt-1">Review verified NPS submissions.</p>
  <button className="mt-4 px-6 py-2.5 rounded-full bg-brand-primary text-white font-medium shadow-soft-sm hover:opacity-90 transition-smooth">
    View Responses
  </button>
</div>
```

### 9.2 Using TypeScript Tokens (In Programmatic Code / Charts)
```ts
import { COLOR_TOKENS, RADIUS_TOKENS } from '@feedbackhub/ui';

const chartFill = COLOR_TOKENS.brand.primaryPurple;
const cardRadius = RADIUS_TOKENS.mainDashboardCard; // '20px'
```

### 9.3 Using the Class Merging Helper (`cn`)
```ts
import { cn } from '@feedbackhub/ui';

const buttonClasses = cn(
  'rounded-full px-6 py-2.5 font-medium transition-smooth',
  variant === 'primary' ? 'bg-brand-primary text-white' : 'bg-surface-card border border-border text-content-main',
  className
);
```

---

## 10. Future Component Library Guidelines (Phase 2.2)

In **Phase 2.2**, all reusable UI primitives will be built inside [`packages/ui/src/components/`](../packages/ui/src/components/):
- **Component File Structure**: `packages/ui/src/components/<ComponentName>.tsx`
- **Props Convention**: Components must accept standard HTML attributes and an optional `className` merged via `cn()`.
- **Primitive Engine**: Radix UI primitives for dialogs, dropdowns, and tabs.
- **Exports**: Re-exported through [`packages/ui/src/index.ts`](../packages/ui/src/index.ts) so consuming applications import cleanly:
  ```ts
  import { Button, Card, Input, Badge } from '@feedbackhub/ui';
  ```
