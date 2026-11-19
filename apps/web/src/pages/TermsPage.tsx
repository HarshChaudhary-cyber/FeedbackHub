import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, Scale, Clock, ArrowRight } from 'lucide-react';
import { Badge, Alert, AlertTitle, AlertDescription, Button } from '@feedbackhub/ui';
import { useDocumentTitle } from '../utils/seo';
import { PageContainer } from '../components/shared/PageContainer';

export const TermsPage: React.FC = () => {
  useDocumentTitle({
    title: 'Terms of Service (Platform Preview Draft) — FeedbackHub',
    description:
      'Review the draft Terms of Service outlining the operating principles and preview terms for the FeedbackHub platform.',
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
            <span>Platform Preview Draft</span>
          </Badge>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-content-main">
            Terms of Service (Draft)
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-content-secondary">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-content-muted" />
              Last Updated: {lastUpdated}
            </span>
            <span>&bull;</span>
            <span>Status: Technical Preview / Not Binding Legal Agreement</span>
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
                Preview Notice — Draft Operating Terms
              </AlertTitle>
              <AlertDescription className="text-xs text-amber-900 leading-relaxed mt-1">
                FeedbackHub is currently in technical development and preview status. The platform is not currently accepting commercial subscriptions, processing billing transactions, or offering legally binding service level agreements (SLAs). Formal Terms of Service and Master Services Agreements (MSAs) will be published prior to commercial launch.
              </AlertDescription>
            </div>
          </div>
        </Alert>

        {/* Structured Legal Content */}
        <article className="prose prose-slate max-w-none space-y-10 text-content-secondary text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              1. Scope &amp; Nature of this Preview Document
            </h2>
            <p>
              This document provides an overview of the proposed terms and operating standards intended to govern FeedbackHub once made commercially available.
            </p>
            <p>
              Your access to and evaluation of the FeedbackHub public marketing website, developer preview interfaces, or demonstration environments is governed by these preliminary terms.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              2. Platform Description &amp; Planned Services
            </h2>
            <p>
              FeedbackHub is being engineered as a multi-tenant B2B cloud software platform designed to assist organizations in capturing, managing, analyzing, and acting upon customer and employee feedback.
            </p>
            <p>
              All features, response limits, and integration capabilities described on the public website represent product roadmaps and planned software deliverables.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              3. User Responsibilities &amp; Acceptable Use
            </h2>
            <p>Users and prospective evaluators agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the platform or its public endpoints for transmission of unsolicited communications (spam).</li>
              <li>Attempt to disrupt, probe, or compromise software infrastructure, routing mechanisms, or security boundaries.</li>
              <li>Submit malicious payloads, viruses, or harmful scripts through form fields or input controls.</li>
              <li>Impersonate individuals or organizations in survey communications.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              4. Intellectual Property &amp; Content Rights
            </h2>
            <p>
              <strong>Platform Software:</strong> FeedbackHub, its codebases, user interfaces, visual design tokens, documentation, and logos remain the exclusive intellectual property of FeedbackHub and its creators.
            </p>
            <p>
              <strong>Tenant Data Principle:</strong> Under our core operating philosophy, customer and employee feedback responses submitted to an organization’s workspace remain the property of that organization.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              5. Service Availability &amp; Preview Status
            </h2>
            <p>
              During this technical development and preview phase, FeedbackHub is provided strictly on an &ldquo;as-is&rdquo; and &ldquo;as-available&rdquo; basis.
            </p>
            <p>
              We do not provide uptime guarantees, formal service level agreements (SLAs), or financial remedy credits during the preview phase. Formal commercial SLAs tailored for enterprise tiers will be established upon general availability.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              6. Future Subscription &amp; Commercial Terms
            </h2>
            <p>
              The pricing tiers and limits shown on our marketing website are illustrative preview models. No payments are accepted, no payment methods are collected, and no recurring commercial contracts are formed during this preview.
            </p>
            <p>
              Final subscription terms, billing intervals, payment processing mechanisms, and cancellation procedures will be published prior to commercial account provisioning.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              7. Disclaimer of Warranties &amp; Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by applicable law, FeedbackHub and its developers disclaim all warranties, express or implied, regarding the platform preview, including warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
            <p>
              In no event shall FeedbackHub be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use this preview platform.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
              8. Legal &amp; Platform Inquiries
            </h2>
            <p>
              For questions regarding these draft terms, enterprise evaluation agreements, or the FeedbackHub development roadmap, please reach out via our public Contact page:
            </p>
            <div className="p-5 rounded-xl bg-surface-card border border-border text-xs sm:text-sm space-y-3">
              <p className="font-bold text-content-main">FeedbackHub Platform &amp; Legal Inquiries</p>
              <p className="text-content-secondary leading-relaxed">
                All inquiries regarding preview terms, enterprise pilot evaluations, and commercial availability are managed through our contact form.
              </p>
              <NavLink to="/contact">
                <Button variant="outline" size="sm" className="rounded-full mt-1">
                  <span>Contact Our Team</span>
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
