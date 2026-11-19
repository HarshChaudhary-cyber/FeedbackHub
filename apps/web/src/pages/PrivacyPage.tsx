import React from 'react';
import { ShieldAlert, Lock, Clock } from 'lucide-react';
import { Badge, Alert, AlertTitle, AlertDescription } from '@feedbackhub/ui';
import { useDocumentTitle } from '../utils/seo';
import { PageContainer } from '../components/shared/PageContainer';

export const PrivacyPage: React.FC = () => {
  useDocumentTitle({
    title: 'Privacy Policy — FeedbackHub',
    description:
      'Read the FeedbackHub Privacy Policy. Understand how we collect, process, and protect your customer and employee feedback data with strict tenant isolation.',
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
            <span>Privacy &amp; Data Protection</span>
          </Badge>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-content-main">
            FeedbackHub Privacy Policy
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
                This document is a design and architectural preview draft prepared for the FeedbackHub platform demonstration. It reflects the technical privacy architecture of our multi-tenant SaaS application but does not constitute formal legal counsel. A legally executed agreement will be provided upon commercial general availability.
              </AlertDescription>
            </div>
          </div>
        </Alert>

        {/* Structured Legal Content */}
        <article className="prose prose-slate max-w-none space-y-10 text-content-secondary text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              1. Introduction &amp; Architectural Scope
            </h2>
            <p>
              FeedbackHub (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) provides a multi-tenant B2B software-as-a-service platform enabling business organizations (&ldquo;Tenants&rdquo;) to collect, analyze, and manage customer and employee feedback.
            </p>
            <p>
              This Privacy Policy explains how we collect, store, process, and protect personal information when individuals access our public websites, when company administrators use our platform dashboards, and when end-users (&ldquo;Respondents&rdquo;) submit feedback through FeedbackHub forms.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              2. Information We Collect
            </h2>
            <p>We collect information across three distinct interaction surfaces:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Tenant Account Data:</strong> When an organization registers for FeedbackHub, we collect administrator contact details including name, corporate email address, organization name, billing details, and workspace configuration preferences.
              </li>
              <li>
                <strong>Identified Feedback Responses:</strong> When a respondent submits feedback via an identified survey, we record their submitted ratings, textual comments, and any contact information explicitly provided by the respondent or pre-authorized by the Tenant.
              </li>
              <li>
                <strong>Anonymous Feedback Responses:</strong> When feedback is submitted via anonymous mode, FeedbackHub cryptographically decouples the submission from user credentials, discards the respondent&apos;s IP address, User-Agent, and browser fingerprints at ingestion, and stores the response record with zero foreign-key associations to personal identities.
              </li>
              <li>
                <strong>Technical &amp; Telemetry Data:</strong> We collect essential technical telemetry necessary to operate the service, including response latency, HTTP status codes, and security audit logs.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              3. How We Use Collected Information
            </h2>
            <p>We process data solely for the following legitimate business purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Providing, maintaining, and improving our multi-tenant SaaS services.</li>
              <li>Generating aggregated analytics, Net Promoter Scores (NPS), and Customer Satisfaction (CSAT) metrics for the respective Tenant.</li>
              <li>Detecting, preventing, and responding to security incidents, fraudulent access, or malicious abuse.</li>
              <li>Communicating critical administrative updates, service notices, and customer support responses.</li>
            </ul>
            <p className="font-semibold text-content-main">
              We never sell, rent, or monetize your feedback or personal information to third parties or advertising networks.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              4. Tenant Data Ownership &amp; Multi-Tenant Isolation
            </h2>
            <p>
              Each Tenant owns all rights, title, and interest in and to their customer and employee feedback data. FeedbackHub acts strictly as a Data Processor (under GDPR) or Service Provider (under CCPA) on behalf of the Tenant.
            </p>
            <p>
              Data is logically and cryptographically partitioned using <strong>PostgreSQL Row-Level Security (RLS)</strong>. Under no circumstances can queries from one organization access or expose data belonging to another tenant workspace.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              5. The k-Anonymity Standard for Workplace Feedback
            </h2>
            <p>
              To protect employee psychological safety, FeedbackHub implements a strict mathematical <strong>k-anonymity guarantee (k &ge; 5)</strong>.
            </p>
            <p>
              When viewing filtered demographic or departmental feedback distributions (e.g. &ldquo;Engineering Team in EMEA&rdquo;), the platform automatically suppresses and refuses to display aggregated responses unless at least five unique respondents meet the filtering criteria. This prevents managers from identifying individuals by elimination.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              6. Data Retention &amp; Deletion
            </h2>
            <p>
              Tenants maintain full control over the lifecycle of their data. Account administrators can configure automated response retention policies or initiate full workspace data purges. Upon tenant termination or verified deletion request, all tenant data and associated backups are permanently scrubbed in accordance with our data disposal protocols.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              7. Your Rights Under GDPR and CCPA
            </h2>
            <p>
              Depending on your jurisdiction, you may possess the following statutory rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The right to access, obtain a portable copy of, or rectify your personal information.</li>
              <li>The right to request erasure (&ldquo;right to be forgotten&rdquo;) of your data.</li>
              <li>The right to restrict or object to the processing of your personal information.</li>
              <li>The right to lodge a complaint with your local supervisory authority.</li>
            </ul>
            <p>
              Because FeedbackHub processes respondent feedback on behalf of our corporate Tenants, individual respondents should direct initial data access or deletion requests to the respective organization controlling the survey. We assist our Tenants promptly in honoring all verified requests.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              8. Contact Our Data Protection Officer
            </h2>
            <p>
              If you have questions regarding this Privacy Policy, our data protection measures, or wish to exercise your privacy rights, please contact our Data Protection Officer:
            </p>
            <div className="p-4 rounded-xl bg-surface-card border border-border text-xs sm:text-sm space-y-1">
              <p className="font-bold text-content-main">FeedbackHub Privacy &amp; Data Protection</p>
              <p>Email: <a href="mailto:privacy@feedbackhub.com" className="text-brand-primary underline">privacy@feedbackhub.com</a></p>
              <p>Attn: Data Protection Officer</p>
            </div>
          </section>
        </article>
      </PageContainer>
    </div>
  );
};
