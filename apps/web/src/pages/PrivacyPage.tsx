import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, Lock, Clock, ArrowRight } from 'lucide-react';
import { Badge, Alert, AlertTitle, AlertDescription, Button } from '@feedbackhub/ui';
import { useDocumentTitle } from '../utils/seo';
import { PageContainer } from '../components/shared/PageContainer';

export const PrivacyPage: React.FC = () => {
  useDocumentTitle({
    title: 'Privacy Statement (Development Preview Draft) — FeedbackHub',
    description:
      'Read the FeedbackHub development preview privacy statement. Understand our planned privacy design principles and data protection roadmap.',
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
            <Lock className="h-3.5 w-3.5" />
            <span>Development Preview Draft</span>
          </Badge>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-content-main">
            Privacy Policy (Draft Notice)
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-content-secondary">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-content-muted" />
              Last Updated: {lastUpdated}
            </span>
            <span>&bull;</span>
            <span>Status: Technical Preview / Not Binding Legal Counsel</span>
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
                Development Preview Draft — Not an Active Legal Policy
              </AlertTitle>
              <AlertDescription className="text-xs text-amber-900 leading-relaxed mt-1">
                FeedbackHub is currently under active technical development. The platform is not currently collecting, processing, or storing live production user data. The document below outlines our planned privacy architecture, data handling design principles, and roadmap targets. Final, legally binding privacy documentation will be published prior to commercial launch.
              </AlertDescription>
            </div>
          </div>
        </Alert>

        {/* Structured Legal Content */}
        <article className="prose prose-slate max-w-none space-y-10 text-content-secondary text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              1. Platform Status &amp; Scope of this Draft
            </h2>
            <p>
              FeedbackHub is a software project currently in development, designed to provide a multi-tenant B2B feedback management platform for customer experience and employee engagement.
            </p>
            <p>
              This draft policy explains the privacy principles and architectural intentions guiding our software development. It does not represent an active data-processing agreement (DPA) and should not be relied upon as binding legal counsel.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              2. Planned Data Collection Categories
            </h2>
            <p>In future production releases, the platform is designed to handle three broad categories of data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Tenant Account Information (Planned):</strong> Administrator names, corporate email addresses, organization profile metadata, and workspace configuration settings necessary for account administration.
              </li>
              <li>
                <strong>Identified Feedback Responses (Planned):</strong> Survey responses submitted where the respondent explicitly identifies themselves or provides contact details for follow-up communication.
              </li>
              <li>
                <strong>Anonymous Feedback Responses (Planned):</strong> Feedback submitted through anonymous mode. Our planned technical architecture will decouple submissions from user accounts, strip origin network identifiers, and store records without identifying foreign keys.
              </li>
              <li>
                <strong>Operational Telemetry (Planned):</strong> Essential technical metrics (such as API latency, system errors, and aggregate throughput) needed for platform reliability.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              3. Intended Data Use Principles
            </h2>
            <p>Once operational, FeedbackHub is intended to process data solely to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Deliver feedback management, aggregation, and response triage workflows to authorized tenant members.</li>
              <li>Generate aggregate sentiment analytics, Net Promoter Scores (NPS), and Customer Satisfaction (CSAT) indicators for the tenant organization.</li>
              <li>Maintain software security, prevent abuse, and troubleshoot technical platform issues.</li>
            </ul>
            <p className="font-semibold text-content-main">
              Intended Privacy Principle: FeedbackHub’s intended business model is software subscriptions. Our architectural roadmap and planned operating principles prohibit selling, renting, or monetizing customer or employee feedback data to third-party data brokers or advertisers.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              4. Tenant Data Ownership &amp; Planned Multi-Tenant Isolation
            </h2>
            <p>
              Under our architectural design, tenant organizations will own all rights to their submitted survey questions, branding assets, and collected feedback responses.
            </p>
            <p>
              To protect organization boundaries, FeedbackHub is being developed to enforce database-level isolation through <strong>PostgreSQL Row-Level Security (RLS)</strong> in upcoming backend phases. Verified isolation controls will be thoroughly tested and documented prior to handling production tenant data.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              5. Planned k-Anonymity Target for Workplace Feedback
            </h2>
            <p>
              Employee psychological safety is a critical design requirement for FeedbackHub. In our planned employee survey engine, we intend to implement a mathematical <strong>k-anonymity standard (k &ge; 5)</strong> for filtered demographic and departmental reporting.
            </p>
            <p>
              Under this planned feature, aggregated responses for filtered groups with fewer than five unique contributors will be suppressed from manager dashboards to prevent deducing individual identities.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              6. Data Lifecycle &amp; Retention Roadmap
            </h2>
            <p>
              Production policies governing data retention, archival, and tenant-initiated deletion are currently being designed. Account administrators will be provided with tools to configure custom retention windows and purge feedback data in accordance with their organizational governance needs once the platform reaches general availability.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              7. Regulatory Framework Alignment
            </h2>
            <p>
              FeedbackHub is being designed with the goal of supporting tenant compliance under global privacy regulations, including the European Union General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
            </p>
            <p>
              Formal compliance documentation, data-processing addenda (DPAs), and standard contractual clauses will be established and made available upon commercial release.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              8. Privacy Questions &amp; Inquiries
            </h2>
            <p>
              FeedbackHub is currently in technical preview. While our contact form demonstrates frontend interaction patterns and client-side validation, it is an illustrative UI preview that does not transmit, store, or deliver messages.
            </p>
            <div className="p-5 rounded-xl bg-surface-card border border-border text-xs sm:text-sm space-y-3">
              <p className="font-bold text-content-main">FeedbackHub Privacy &amp; Architecture Roadmap</p>
              <p className="text-content-secondary leading-relaxed">
                Inquiries regarding technical architecture, privacy policies, and enterprise evaluations will be accepted through official communication channels established prior to commercial launch. You can preview our contact form design below.
              </p>
              <NavLink to="/contact">
                <Button variant="outline" size="sm" className="rounded-full mt-1">
                  <span>Preview Contact Form</span>
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </NavLink>
            </div>
          </section>
        </article>
      </PageContainer>
    </div>
  );
};
