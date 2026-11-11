/**
 * FeedbackHub Design System Tokens
 * Conforming strictly to docs/DESIGN_SYSTEM.md specifications.
 */

export const THEME_COLORS = {
  primaryPurple: '#8B5CF6',
  secondaryPink: '#EC4899',
  skyBlue: '#38BDF8',
  teal: '#2DD4BF',
  mainBackground: '#FAFAFC',
  cardBackground: '#FFFFFF',
  primaryText: '#1E293B',
  secondaryText: '#64748B',
  border: '#F1F5F9',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
} as const;

export const RADIUS_TOKENS = {
  mainDashboardCard: '20px',    // rounded-[20px]
  smallCard: '16px',            // rounded-2xl
  primaryButton: '9999px',      // rounded-full (pill-shaped)
  secondaryButton: '12px',      // rounded-xl
  inputField: '14px',           // rounded-xl
  modalWindow: '24px',          // rounded-3xl
  badge: '9999px',              // rounded-full (pill-shaped)
  avatar: '9999px',             // rounded-full (circular)
} as const;
