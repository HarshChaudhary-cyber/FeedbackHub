import React from 'react';
import { ShieldAlert, Scale, Clock } from 'lucide-react';
import { Badge, Alert, AlertTitle, AlertDescription } from '@feedbackhub/ui';
import { useDocumentTitle } from '../utils/seo';
import { PageContainer } from '../components/shared/PageContainer';

export const TermsPage: React.FC = () => {
  useDocumentTitle({
    title: 'Terms of Service — FeedbackHub',
    description:
      'Review the Terms of Service governing the use of FeedbackHub multi-tenant feedback platform, tenant accounts, and acceptable use policies.',
  });

  const lastUpdated = 'November 19, 2026';

  return (
    <div className="py-12 sm:py-20 lg:py-24">
      <PageContainer className="max-w-4xl">
        {/* Header */}
        <div className="space-y-4 text-center sm:text-left mb-10 pb-8 border-b border-border">
          <Badge
            variant="secondary"
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-brand-primary/10 text-brand-primary border-brand-primary/20 shadow-soft-sm"
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Terms &amp; Operating Agreement</span>
          </Badge>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-content-main">
            FeedbackHub Terms of Service
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-content-secondary">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-content-muted" />
              Last Updated: {lastUpdated}
            </span>
            <span>&bull;</span>
            <span>Version: 1.0 (Platform Preview Draft)</span>
          </div>
        </div>

        {/* Legal Disclaimer Alert */}
        <Alert
          variant="warning"
          className="mb-10 p-5 rounded-2xl border-amber-500/30 bg-amber-500/5 text-amber-900 shadow-soft-sm"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <AlertTitle className="text-sm font-bold text-amber-950">
                Legal Notice &amp; Preview Disclaimer
              </AlertTitle>
              <AlertDescription className="text-xs text-amber-900 leading-relaxed mt-1">
                This document is a technical and design preview draft prepared for the FeedbackHub demonstration platform. It outlines the proposed commercial and operational terms for our SaaS platform but does not constitute an active, executed legal agreement. Formal Master Services Agreements (MSAs) will govern commercial production accounts.
              </AlertDescription>
            </div>
          </div>
        </Alert>

        {/* Structured Legal Content */}
        <article className="prose prose-slate max-w-none space-y-10 text-content-secondary text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing our public website, creating an account, provisioning a tenant workspace, or submitting feedback through FeedbackHub interfaces, you agree to be legally bound by these Terms of Service (&ldquo;Terms&rdquo;) and our Privacy Policy.
            </p>
            <p>
              If you are entering into these Terms on behalf of a company, corporate entity, or organization, you represent that you possess the lawful authority to bind such entity.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              2. Platform Services &amp; Tenant Provisioning
            </h2>
            <p>
              FeedbackHub provides a multi-tenant cloud software platform that enables organizations to author feedback forms, distribute surveys across digital channels, collect customer and employee sentiments, triage incoming responses, and generate analytical insights.
            </p>
            <p>
              We grant you a non-exclusive, non-transferable, revocable right to access and use the platform in accordance with the subscription plan tier selected by your organization.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              3. Tenant Responsibilities &amp; Account Security
            </h2>
            <p>Each Tenant organization is responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintaining the confidentiality of account credentials and managing assigned Role-Based Access Control (RBAC) tiers.</li>
              <li>Ensuring all authorized team members adhere to applicable data protection laws.</li>
              <li>Promptly notifying FeedbackHub of any suspected unauthorized access or credential compromise.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              4. Acceptable Use Policy
            </h2>
            <p>You agree not to use FeedbackHub to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Distribute unsolicited commercial communications (spam) or engage in deceptive phishing practices.</li>
              <li>Collect sensitive categories of data (e.g. credit card numbers, national identification numbers, protected health information) without prior written enterprise authorization.</li>
              <li>Attempt to reverse-engineer, de-anonymize, or breach our cryptographic anonymity safeguards or PostgreSQL Row-Level Security barriers.</li>
              <li>Introduce viruses, malware, or destructive code designed to disrupt service infrastructure.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              5. Intellectual Property &amp; Content Ownership
            </h2>
            <p>
              <strong>Your Feedback Data:</strong> As between FeedbackHub and Tenant, Tenant exclusively retains all rights, title, and ownership in all survey questions, company branding, and customer or employee responses submitted to their workspace.
            </p>
            <p>
              <strong>Platform IP:</strong> FeedbackHub and its licensors retain all rights, title, and intellectual property in and to the platform, source code, UI components, algorithms, documentation, and registered trademarks.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              6. Service Availability &amp; Service Level Commitments
            </h2>
            <p>
              We employ commercially reasonable efforts to deliver high availability and uptime. Enterprise subscription plans include a 99.9% monthly availability service level agreement (SLA) with defined remedy credits.
            </p>
            <p>
              Scheduled maintenance windows will be communicated to account administrators in advance via email and platform notification banners.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              7. Subscription Billing &amp; Cancellations
            </h2>
            <p>
              Paid plans are billed on a recurring monthly or annual basis in advance. You may cancel your subscription at any time through the organization settings console. Cancellations take effect at the end of the current billing cycle.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              8. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, neither party shall be liable for any indirect, incidental, consequential, or punitive damages arising out of or related to these Terms. FeedbackHub&apos;s total aggregate liability shall not exceed the fees paid by Tenant during the twelve (12) months preceding the event giving rise to liability.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              9. Contact Legal Affairs
            </h2>
            <p>
              For legal notices, enterprise contract inquiries, or master service agreement questions, contact:
            </p>
            <div className="p-4 rounded-xl bg-surface-card border border-border text-xs sm:text-sm space-y-1">
              <p className="font-bold text-content-main">FeedbackHub Legal &amp; Corporate Affairs</p>
              <p>Email: <a href="mailto:legal@feedbackhub.com" className="text-brand-primary underline">legal@feedbackhub.com</a></p>
            </div>
          </section>
        </article>
      </PageContainer>
    </div>
  );
};
