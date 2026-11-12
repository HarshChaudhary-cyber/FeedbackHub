import React, { useMemo } from 'react';
import { resolveHostMode } from './index';
import { THEME_COLORS, RADIUS_TOKENS } from '@feedbackhub/ui';

export function App() {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const hostResolution = useMemo(() => resolveHostMode(currentHost), [currentHost]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: THEME_COLORS.mainBackground,
        color: THEME_COLORS.primaryText,
      }}
    >
      <main
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: THEME_COLORS.cardBackground,
          borderRadius: RADIUS_TOKENS.mainDashboardCard,
          padding: '32px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
          border: `1px solid ${THEME_COLORS.border}`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: RADIUS_TOKENS.avatar,
            backgroundColor: '#F3E8FF',
            color: THEME_COLORS.primaryPurple,
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '16px',
          }}
        >
          FH
        </div>

        <h1
          style={{
            margin: '0 0 8px',
            fontSize: '24px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          FeedbackHub
        </h1>

        <p
          style={{
            margin: '0 0 24px',
            fontSize: '14px',
            color: THEME_COLORS.secondaryText,
            lineHeight: 1.5,
          }}
        >
          Multi-tenant B2B SaaS feedback platform.
          <br />
          Foundation runtime successfully operational.
        </p>

        <section
          style={{
            backgroundColor: THEME_COLORS.mainBackground,
            borderRadius: RADIUS_TOKENS.smallCard,
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'left',
            fontSize: '13px',
          }}
        >
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: THEME_COLORS.secondaryText }}>Status:</span>
            <span style={{ color: THEME_COLORS.teal, fontWeight: 600 }}>Active (Phase 1.1)</span>
          </div>
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: THEME_COLORS.secondaryText }}>Hostname:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{currentHost}</span>
          </div>
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: THEME_COLORS.secondaryText }}>Resolved Mode:</span>
            <span
              style={{
                backgroundColor: THEME_COLORS.primaryPurple,
                color: '#FFFFFF',
                borderRadius: RADIUS_TOKENS.badge,
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {hostResolution.mode}
            </span>
          </div>
          {hostResolution.slug && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: THEME_COLORS.secondaryText }}>Tenant Slug:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{hostResolution.slug}</span>
            </div>
          )}
        </section>

        <footer style={{ fontSize: '12px', color: THEME_COLORS.secondaryText }}>
          React 19 + TypeScript + Vite | NestJS API Gateway
        </footer>
      </main>
    </div>
  );
}
