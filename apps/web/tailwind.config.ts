import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-brand-primary, #8B5CF6)',
          secondary: 'var(--color-brand-secondary, #EC4899)',
          sky: 'var(--color-brand-sky, #38BDF8)',
          teal: 'var(--color-brand-teal, #2DD4BF)',
        },
        surface: {
          main: 'var(--color-bg-main, #FAFAFC)',
          card: 'var(--color-bg-card, #FFFFFF)',
        },
        content: {
          main: 'var(--color-text-main, #1E293B)',
          secondary: 'var(--color-text-secondary, #64748B)',
          muted: 'var(--color-text-muted, #94A3B8)',
        },
        border: 'var(--color-border, #E2E8F0)',
        semantic: {
          success: 'var(--color-semantic-success, #16A34A)',
          warning: 'var(--color-semantic-warning, #D97706)',
          error: 'var(--color-semantic-error, #DC2626)',
          info: 'var(--color-semantic-info, #0284C7)',
        },
      },
      borderRadius: {
        'card-lg': 'var(--radius-card-lg, 20px)',
        'card-sm': 'var(--radius-card-sm, 16px)',
        'btn-secondary': 'var(--radius-btn-secondary, 12px)',
        input: 'var(--radius-input, 14px)',
        modal: 'var(--radius-modal, 24px)',
      },
      boxShadow: {
        'soft-sm': 'var(--shadow-soft-sm)',
        'soft-md': 'var(--shadow-soft-md)',
        'soft-lg': 'var(--shadow-soft-lg)',
        'glow-purple': 'var(--shadow-glow-purple)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          "'Segoe UI'",
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
