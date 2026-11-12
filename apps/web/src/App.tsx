import React, { useMemo } from 'react';
import { resolveHostMode } from './index';

export function App() {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const hostResolution = useMemo(() => resolveHostMode(currentHost), [currentHost]);

  return (
    <div className="min-h-screen bg-surface-main text-content-main flex flex-col items-center justify-center p-6 antialiased">
      <main className="max-w-[560px] w-full bg-surface-card rounded-card-lg p-8 shadow-soft-md border border-border text-center">
        {/* Brand Avatar Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-primary/10 text-brand-primary text-xl font-bold mb-4 shadow-soft-sm">
          FH
        </div>

        {/* Display Typography */}
        <h1 className="text-2xl font-bold tracking-tight text-content-main mb-2">
          FeedbackHub
        </h1>

        <p className="text-sm text-content-secondary leading-relaxed mb-6">
          Multi-tenant B2B SaaS feedback platform.
          <br />
          Design tokens &amp; styling foundation established.
        </p>

        {/* Runtime Context Card */}
        <section className="bg-surface-main rounded-card-sm p-4 mb-6 text-left text-xs space-y-2.5 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-content-secondary font-medium">Phase Status:</span>
            <span className="inline-flex items-center gap-1.5 text-brand-teal font-semibold">
              <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
              Active (Phase 2.1)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-content-secondary font-medium">Hostname:</span>
            <span className="font-mono text-content-main font-semibold">{currentHost}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-content-secondary font-medium">Resolved Routing Mode:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-brand-primary text-white shadow-soft-sm">
              {hostResolution.mode}
            </span>
          </div>

          {hostResolution.slug && (
            <div className="flex items-center justify-between">
              <span className="text-content-secondary font-medium">Tenant Slug:</span>
              <span className="font-mono font-semibold text-brand-primary">{hostResolution.slug}</span>
            </div>
          )}
        </section>

        {/* Visual Token Palette Preview */}
        <div className="pt-2 border-t border-border">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-content-muted mb-3">
            Core Design Tokens
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-brand-primary shadow-soft-sm" title="Primary Purple (#8B5CF6)" />
              <span className="text-[10px] text-content-muted">Purple</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-brand-secondary shadow-soft-sm" title="Secondary Pink (#EC4899)" />
              <span className="text-[10px] text-content-muted">Pink</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-brand-sky shadow-soft-sm" title="Sky Blue (#38BDF8)" />
              <span className="text-[10px] text-content-muted">Sky</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-brand-teal shadow-soft-sm" title="Teal Accent (#2DD4BF)" />
              <span className="text-[10px] text-content-muted">Teal</span>
            </div>
          </div>
        </div>

        <footer className="mt-6 text-xs text-content-muted">
          Tailwind CSS + Design Tokens | React 19 + Vite
        </footer>
      </main>
    </div>
  );
}
