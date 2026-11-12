/**
 * FeedbackHub Design System Tokens
 * Source of truth for brand colors, typography, radius, shadows, spacing, and transitions.
 * Conforms strictly to docs/DESIGN_SYSTEM.md specifications.
 */

// ------------------------------------------------------------------------------
// 1. Color Palette Tokens
// ------------------------------------------------------------------------------

export const COLOR_TOKENS = {
  // Brand Spectrum
  brand: {
    primaryPurple: '#8B5CF6', // Primary brand action, key accents
    secondaryPink: '#EC4899', // Delight moments, highlights, NPS Promoters
    skyBlue: '#38BDF8',       // Informational accents, active tabs, pulse surveys
    teal: '#2DD4BF',          // Positive states, resolved feedback, CSAT 5-star
  },

  // Neutral Spectrum
  neutral: {
    mainBackground: '#FAFAFC', // Main app background / canvas
    surfaceCard: '#FFFFFF',    // Surface cards / elevated elements
    mainText: '#1E293B',       // Slate 800 - high-contrast primary text
    secondaryText: '#64748B',  // Slate 500 - subtitles, descriptions, timestamps
    mutedText: '#94A3B8',      // Slate 400 - placeholders, disabled states
    border: '#E2E8F0',         // Slate 200 - subtle container borders
  },

  // Semantic Spectrum
  semantic: {
    success: '#16A34A',     // Green 600 - successful submissions, verified
    warning: '#D97706',     // Amber 600 - warnings, passive ratings
    error: '#DC2626',       // Red 600 - critical errors, detractor ratings
    info: '#0284C7',        // Sky 600 - informative alerts, announcements
  },

  // Interaction States
  interaction: {
    focusRing: '#8B5CF6',
    hoverOverlay: 'rgba(139, 92, 246, 0.06)',
    activeOverlay: 'rgba(139, 92, 246, 0.12)',
  },
} as const;

// Legacy alias for backwards compatibility with earlier Phase 1 stubs
export const THEME_COLORS = {
  primaryPurple: COLOR_TOKENS.brand.primaryPurple,
  secondaryPink: COLOR_TOKENS.brand.secondaryPink,
  skyBlue: COLOR_TOKENS.brand.skyBlue,
  teal: COLOR_TOKENS.brand.teal,
  mainBackground: COLOR_TOKENS.neutral.mainBackground,
  cardBackground: COLOR_TOKENS.neutral.surfaceCard,
  primaryText: COLOR_TOKENS.neutral.mainText,
  secondaryText: COLOR_TOKENS.neutral.secondaryText,
  border: COLOR_TOKENS.neutral.border,
  danger: COLOR_TOKENS.semantic.error,
  warning: COLOR_TOKENS.semantic.warning,
  success: COLOR_TOKENS.semantic.success,
} as const;

// ------------------------------------------------------------------------------
// 2. Strict Rounded UI Tokens
// ------------------------------------------------------------------------------

export const RADIUS_TOKENS = {
  mainDashboardCard: '20px',    // rounded-card-lg: Primary metrics cards, dashboard containers
  smallCard: '16px',            // rounded-card-sm: Form cards, mini stat widgets, question boxes
  primaryButton: '9999px',      // rounded-full: Pill-shaped primary action buttons
  secondaryButton: '12px',      // rounded-xl: Secondary/toolbar buttons
  inputField: '14px',           // rounded-xl: Text inputs, selects, textareas (12-14px)
  modalWindow: '24px',          // rounded-modal: Dialog popups, sheets, preview modals
  badge: '9999px',              // rounded-full: Status tags, category chips
  avatar: '9999px',             // rounded-full: Circular profile photos and tenant logos
} as const;

// ------------------------------------------------------------------------------
// 3. Shadow & Elevation Tokens
// ------------------------------------------------------------------------------

export const SHADOW_TOKENS = {
  softSm: '0 2px 8px -2px rgba(15, 23, 42, 0.04), 0 1px 4px -1px rgba(15, 23, 42, 0.02)',
  softMd: '0 8px 24px -4px rgba(15, 23, 42, 0.06), 0 2px 8px -2px rgba(15, 23, 42, 0.03)',
  softLg: '0 20px 40px -8px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
  glowPurple: '0 0 24px -4px rgba(139, 92, 246, 0.25)',
  focusRing: '0 0 0 2px #FAFAFC, 0 0 0 4px #8B5CF6',
} as const;

// ------------------------------------------------------------------------------
// 4. Typography Scale Tokens
// ------------------------------------------------------------------------------

export const TYPOGRAPHY_TOKENS = {
  fontFamily: {
    sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  fontSize: {
    display: { size: '36px', lineHeight: '1.2' },      // 2.25rem - Landing hero, large KPI metric
    h1: { size: '28px', lineHeight: '1.25' },          // 1.75rem - Page titles, form header
    h2: { size: '22px', lineHeight: '1.3' },           // 1.375rem - Section headers, card groups
    h3: { size: '18px', lineHeight: '1.4' },           // 1.125rem - Question title, modal header
    bodyBase: { size: '15px', lineHeight: '1.5' },     // 0.9375rem - Standard body text, answers
    bodySm: { size: '13px', lineHeight: '1.4' },       // 0.8125rem - Descriptions, table items
    caption: { size: '11px', lineHeight: '1.3' },      // 0.6875rem - Timestamps, badges, footers
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// ------------------------------------------------------------------------------
// 5. Spacing Scale Tokens (4px Base Grid)
// ------------------------------------------------------------------------------

export const SPACING_TOKENS = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

// ------------------------------------------------------------------------------
// 6. Transition & Animation Tokens
// ------------------------------------------------------------------------------

export const TRANSITION_TOKENS = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
    linear: 'linear',
  },
} as const;

// ------------------------------------------------------------------------------
// 7. Responsive Breakpoint Tokens
// ------------------------------------------------------------------------------

export const BREAKPOINT_TOKENS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;
