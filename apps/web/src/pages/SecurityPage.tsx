import React from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Database,
  Server,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  EyeOff,
} from 'lucide-react';
import { Badge, Card, Alert, AlertTitle, AlertDescription } from '@feedbackhub/ui';
import { useDocumentTitle } from '../utils/seo';
import { PageContainer } from '../components/shared/PageContainer';
import { SectionHeading } from '../components/shared/SectionHeading';
import { CTASection } from '../components/shared/CTASection';

export const SecurityPage: React.FC = () => {
  useDocumentTitle({
    title: 'Security & Trust Architecture — FeedbackHub',
    description:
      'Learn how FeedbackHub protects tenant data with PostgreSQL Row-Level Security, cryptographic anonymity, AES-256 encryption, and rigorous access controls.',
  });

  const securityPillars = [
    {
      title: 'Multi-Tenant Isolation via PostgreSQL RLS',
      tagline: 'Database-Level Enforcement',
      description:
        'We believe software multi-tenancy should not rely solely on application-level WHERE clauses. FeedbackHub enforces data partitioning at the database engine level using PostgreSQL Row-Level Security (RLS).',
      details: [
        'Every incoming request dynamically scopes the database connection to the verified tenant UUID.',
        'Zero cross-tenant data leakage risks, even in the event of an application logic defect.',
        'Separate database connection pools with strict connection timeouts and leak detection.',
      ],
      icon: <Database className="h-6 w-6 text-brand-primary" />,
    },
    {
      title: 'Cryptographic Anonymity & k-Anonymity',
      tagline: 'Mathematical Privacy Safeguards',
      description:
        'When collecting anonymous employee or customer feedback, privacy must be provable, not merely promised. We decouple submission metadata at ingestion.',
      details: [
        'Zero-knowledge decoupling: response records have no foreign key relationship to user identities.',
        'Automatic redaction of client IP addresses, User-Agent strings, and tracking headers.',
        'Strict k-anonymity aggregation (k >= 5): demographic or departmental views are suppressed unless at least five distinct respondents contribute.',
      ],
      icon: <EyeOff className="h-6 w-6 text-brand-secondary" />,
    },
    {
      title: 'Encryption in Transit & at Rest',
      tagline: 'Modern Cryptographic Standards',
      description:
        'All information moving through FeedbackHub is protected against eavesdropping and interception using modern TLS protocols and industry-standard cipher suites.',
      details: [
        'TLS 1.3 enforced for all public endpoints with HSTS and modern forward-secret cipher suites.',
        'AES-256 encryption at rest for all database volumes, backups, and file storage.',
        'Argon2id state-of-the-art password hashing with high memory cost parameters for credential storage.',
      ],
      icon: <Lock className="h-6 w-6 text-brand-sky" />,
    },
    {
      title: 'Role-Based Access Control (RBAC)',
      tagline: 'Principle of Least Privilege',
      description:
        'Organizations can manage fine-grained access across four distinct permission tiers, ensuring team members only access information relevant to their role.',
      details: [
        'Owner: Complete billing, tenant provisioning, subdomain management, and account deletion.',
        'Administrator: Manage team invitations, survey form publishing, and integrations.',
        'Member: View and triage response inboxes, add internal notes, and export reports.',
        'Viewer: Read-only access to aggregated analytics dashboards and metric summaries.',
      ],
      icon: <KeyRound className="h-6 w-6 text-brand-teal" />,
    },
    {
      title: 'Session & Application Security',
      tagline: 'Defensive Software Design',
      description:
        'Our web application is protected against common OWASP Top 10 vulnerabilities, unauthorized session hijacking, and automated abuse.',
      details: [
        'Strict HttpOnly, Secure, and SameSite cookie policies prevent client-side JavaScript access.',
        'Automated rate limiting on authentication and survey submission endpoints to mitigate brute force and DDoS.',
        'Strict Content Security Policy (CSP) and automated sanitization of all rendered survey text.',
      ],
      icon: <Server className="h-6 w-6 text-brand-primary" />,
    },
    {
      title: 'Continuous Vulnerability & Dependency Scanning',
      tagline: 'Proactive Security Posture',
      description:
        'Security is an ongoing discipline. Our continuous integration pipelines automatically audit software dependencies for known CVE vulnerabilities.',
      details: [
        'Automated dependency analysis runs on every commit across the monorepo.',
        'Rigorous automated test suites verifying permission boundaries and RLS isolation.',
        'Strict branch protection and mandatory code review on all production-bound modifications.',
      ],
      icon: <FileCheck className="h-6 w-6 text-brand-secondary" />,
    },
  ];

  return (
    <div className="space-y-20 sm:space-y-28 lg:space-y-36 pb-12">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO HEADER */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative pt-12 sm:pt-20 lg:pt-24 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-brand-primary/10 via-brand-teal/5 to-transparent blur-3xl opacity-70"
        />

        <PageContainer className="relative z-10 text-center">
          <Badge
            variant="secondary"
            className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-brand-primary/10 text-brand-primary border-brand-primary/20 shadow-soft-sm"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Enterprise Security &amp; Data Governance</span>
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-content-main max-w-4xl mx-auto leading-[1.15]">
            Security engineered at the{' '}
            <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-teal bg-clip-text text-transparent">
              database foundation.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-content-secondary max-w-2xl mx-auto leading-relaxed">
            Feedback data contains sensitive sentiment and strategic insights. We protect
            your organization with PostgreSQL Row-Level Security, cryptographic anonymity,
            and strict tenant isolation.
          </p>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. TRANSPARENT COMPLIANCE STATUS DISCLAIMER */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <PageContainer>
          <div className="max-w-3xl mx-auto">
            <Alert variant="info" className="p-6 rounded-2xl border-brand-primary/30 bg-surface-card shadow-soft-sm">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <AlertTitle className="text-sm font-bold text-content-main">
                    Transparent Compliance Status &amp; Roadmap
                  </AlertTitle>
                  <AlertDescription className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                    FeedbackHub is engineered strictly in accordance with the architectural controls and specifications of <strong>SOC 2 Type II</strong>, <strong>GDPR</strong>, and <strong>ISO 27001</strong>. In accordance with our radical transparency policy, please note that formal third-party audits and certifications are scheduled alongside our upcoming enterprise release. We do not claim unverified certifications.
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. SIX ARCHITECTURAL PILLARS */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <PageContainer>
          <SectionHeading
            badge="Defense in Depth"
            title="Six pillars of our trust architecture"
            description="Explore how data flows through FeedbackHub securely from the moment a respondent taps submit."
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityPillars.map((pillar, idx) => (
              <Card
                key={idx}
                className="p-6 sm:p-8 bg-surface-card border-border shadow-soft-sm hover:shadow-soft-md transition-smooth flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-main border border-border shadow-soft-sm">
                    {pillar.icon}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-primary">
                      {pillar.tagline}
                    </span>
                    <h3 className="text-lg font-bold text-content-main mt-1">
                      {pillar.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                    {pillar.description}
                  </p>
                  <ul className="space-y-2 pt-2 border-t border-border">
                    {pillar.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2 text-xs text-content-main">
                        <CheckCircle2 className="h-3.5 w-3.5 text-brand-teal shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. SECURITY AUDIT & BUG BOUNTY CONTACT */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-surface-card/40 py-16 sm:py-24 border-y border-border">
        <PageContainer>
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
              Security Community
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-content-main tracking-tight">
              Responsible Disclosure &amp; Security Inquiries
            </h2>
            <p className="text-sm text-content-secondary leading-relaxed">
              We welcome collaboration with independent security researchers and enterprise security teams.
              If you discover a potential vulnerability or need our security whitepaper, please contact us directly.
            </p>
            <div className="pt-4">
              <a
                href="mailto:security@feedbackhub.com"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-primary text-white font-semibold text-sm shadow-soft-sm hover:bg-brand-primary/90 transition-colors"
              >
                <span>Contact Security Team (security@feedbackhub.com)</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. CALL TO ACTION */}
      {/* ------------------------------------------------------------------ */}
      <CTASection
        badge="Enterprise Confidence"
        title="Deploy feedback intelligence with peace of mind."
        description="Schedule a technical evaluation with our engineering team to review our security architecture."
        primaryAction={{
          label: 'Request Security Review',
          href: '/contact',
        }}
        secondaryAction={{
          label: 'View Pricing & Plans',
          href: '/pricing',
        }}
      />
    </div>
  );
};
