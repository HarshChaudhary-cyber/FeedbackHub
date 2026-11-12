# FeedbackHub UI Component Library Architecture

This directory is the dedicated location for all reusable, accessible UI primitives for the FeedbackHub platform (implemented in **Phase 2.2**).

## Architecture & Conventions

1. **Design System Adherence:**
   - All components must strictly consume design tokens from [`../tokens.ts`](../tokens.ts) and Tailwind custom utility classes mapped in `tailwind.config.ts`.
   - Corner radius tokens must strictly follow the product rules:
     - Dashboard Cards: `rounded-[20px]` (`rounded-card-lg`)
     - Small Cards: `rounded-2xl` (`rounded-card-sm` / 16px)
     - Primary Buttons: `rounded-full` (pill-shaped)
     - Secondary Buttons: `rounded-xl` (12px)
     - Inputs & Textareas: `rounded-xl` (14px)
     - Modals & Sheets: `rounded-3xl` (`rounded-modal` / 24px)
     - Badges: `rounded-full` (pill-shaped)
     - Avatars: `rounded-full` (circular)

2. **Class Merging:**
   - Always use the `cn()` utility from [`../utils.ts`](../utils.ts) to merge component default classes with incoming `className` props.

3. **Accessibility:**
   - Built on top of Radix UI primitives where interactive keyboard navigation, ARIA landmarks, focus traps, or screen reader announcements are needed.
   - Visible focus outlines must follow `:focus-visible` standards with `ring-2 ring-primary ring-offset-2`.

4. **Phase 2.2 Deliverables (Upcoming):**
   - `Button.tsx` (Primary pill, Secondary 12px, Ghost, Outline, Destructive, Loading)
   - `Card.tsx` (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
   - `Input.tsx` & `Textarea.tsx` (14px radius, label, error state, helper text)
   - `Badge.tsx` (Pill status chips)
   - `Modal.tsx` / `Dialog.tsx` (24px radius, backdrop blur, accessible dialog)
   - `Avatar.tsx` (Circular avatar with fallback)
   - `Tabs.tsx` (Pill tabs and underline tabs)
   - `EmptyState.tsx` (Clean, actionable empty state)
