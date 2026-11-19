import React, { useMemo } from 'react';
import { resolveHostMode } from './index';
import { AppRouter } from './routes/AppRouter';
import { Button } from '@feedbackhub/ui';

export function App() {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const hostResolution = useMemo(() => resolveHostMode(currentHost), [currentHost]);

  // If in tenant subdomain mode (e.g., acme.feedbackhub.com)
  if (hostResolution.mode === 'tenant') {
    return (
      <div className="min-h-screen bg-surface-main text-content-main flex flex-col items-center justify-center p-6 antialiased">
        <main className="max-w-[560px] w-full bg-surface-card rounded-card-lg p-8 shadow-soft-md border border-border text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-primary/10 text-brand-primary text-xl font-bold shadow-soft-sm">
            {hostResolution.slug ? hostResolution.slug.slice(0, 2).toUpperCase() : 'FH'}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-content-main">
            {hostResolution.slug ? `${hostResolution.slug.toUpperCase()} Feedback Portal` : 'Tenant Portal'}
          </h1>
          <p className="text-sm text-content-secondary leading-relaxed">
            Welcome to the dedicated feedback environment for <strong>{hostResolution.slug}</strong>.
            Tenant authentication and branded surveys are scheduled for Phase 4.
          </p>
          <div className="pt-4">
            <a href="http://localhost:3000/">
              <Button variant="outline" size="sm" className="rounded-full">
                Visit Main Marketing Website
              </Button>
            </a>
          </div>
        </main>
      </div>
    );
  }

  // If in app console mode (e.g., app.feedbackhub.com)
  if (hostResolution.mode === 'app') {
    return (
      <div className="min-h-screen bg-surface-main text-content-main flex flex-col items-center justify-center p-6 antialiased">
        <main className="max-w-[560px] w-full bg-surface-card rounded-card-lg p-8 shadow-soft-md border border-border text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-primary/10 text-brand-primary text-xl font-bold shadow-soft-sm">
            FH
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-content-main">
            FeedbackHub Management Console
          </h1>
          <p className="text-sm text-content-secondary leading-relaxed">
            Multi-tenant company dashboard and administrative login will be activated in Phase 4.
          </p>
          <div className="pt-4">
            <a href="http://localhost:3000/">
              <Button variant="outline" size="sm" className="rounded-full">
                Visit Main Marketing Website
              </Button>
            </a>
          </div>
        </main>
      </div>
    );
  }

  // Marketing mode: Render complete public marketing website
  return <AppRouter />;
}
