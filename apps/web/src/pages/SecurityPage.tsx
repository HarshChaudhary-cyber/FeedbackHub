import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Database,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  EyeOff,
  Globe2,
} from 'lucide-react';
import { Badge, Card, Alert, AlertTitle, AlertDescription } from '@feedbackhub/ui';
import { useDocumentTitle } from '../utils/seo';
import { PageContainer } from '../components/shared/PageContainer';
import { SectionHeading } from '../components/shared/SectionHeading';
import { CTASection } from '../components/shared/CTASection';

export const SecurityPage: React.FC = () => {
  useDocumentTitle({
    title: 'Security Architecture & Design Principles — FeedbackHub',
    description:
      'Explore the planned security architecture, design principles, and data isolation controls guiding the development of FeedbackHub.',
  });

  const securityPillars = [
    {
      title: 'Multi-Tenant Isolation (PostgreSQL RLS)',
      tagline: 'Planned Database-Level Enforcement',
      category: 'Planned Control',
      badgeVariant: 'outline' as const,
      badgeText: 'Planned Architecture',
      description:
        'Software multi-tenancy should not rely solely on application-level WHERE clauses. FeedbackHub is architected to enforce data partitioning at the database engine level using PostgreSQL Row-Level Security (RLS) in upcoming backend phases.',
      details: [
        'Planned architecture: dynamically scope database connection sessions to verified tenant identifiers.',
        'Target design: prevent cross-tenant data access even in the event of an application logic defect.',
        'Dedicated connection pooling and tenant scoping middleware scheduled for implementation.',
      ],
      icon: <Database className="h-6 w-6 text-brand-primary" />,
    },
    {
      title: 'Privacy-Preserving Anonymous Feedback',
      tagline: 'Design Principle & Requirement',
      category: 'Design Principle',
      badgeVariant: 'outline' as const,
      badgeText: 'Design Requirement',
      description:
        'When collecting anonymous employee or customer feedback, privacy must be architecturally guaranteed. Anonymous feedback is a core requirement designed to decouple submission metadata at ingestion.',
      details: [
        'Architectural design: response records will have no foreign key relationship to respondent account IDs.',
        'Planned redaction of client network identifiers, IP addresses, and User-Agent headers at ingestion.',
        'Planned k-anonymity threshold (k >= 5) on demographic aggregation queries to protect respondent identities.',
      ],
      icon: <EyeOff className="h-6 w-6 text-brand-secondary" />,
    },
    {
      title: 'Encryption in Transit & at Rest',
      tagline: 'Target Cryptographic Standards',
      category: 'Planned Control',
      badgeVariant: 'outline' as const,
      badgeText: 'Production Specification',
      description:
        'Production feedback data will be protected against eavesdropping and unauthorized access using modern transport protocols and standard persistent storage encryption.',
      details: [
        'Target standard: TLS 1.3 encryption for all production public endpoints with modern forward-secret ciphers.',
        'Target standard: AES-256 encryption at rest for production databases, volume backups, and object storage.',
        'Planned credential security: Argon2id password hashing planned for implementation in Phase 4 authentication.',
      ],
      icon: <Lock className="h-6 w-6 text-brand-sky" />,
    },
    {
      title: 'Role-Based Access Control (RBAC)',
      tagline: 'Principle of Least Privilege',
      category: 'Planned Control',
      badgeVariant: 'outline' as const,
      badgeText: 'Planned (Phase 4)',
      description:
        'FeedbackHub is designed with fine-grained access governance across distinct permission tiers, ensuring team members only access information relevant to their operational role.',
      details: [
        'Owner tier: Organization management, billing settings, and tenant configuration.',
        'Administrator tier: Team invitations, survey publishing, and integration management.',
        'Member tier: Triage inbox access, internal collaboration notes, and response filtering.',
        'Viewer tier: Read-only access to aggregated analytics reports and high-level metrics.',
      ],
      icon: <KeyRound className="h-6 w-6 text-brand-teal" />,
    },
    {
      title: 'Domain & Hostname Routing Isolation',
      tagline: 'Implemented & Verified in Code',
      category: 'Implemented & Verified',
      badgeVariant: 'default' as const,
      badgeText: 'Implemented in Codebase',
      description:
        'The FeedbackHub web application implements deterministic hostname resolution that strictly separates public marketing, central management console, and organization tenant subdomain contexts.',
      details: [
        'Verified in codebase: resolveHostMode utility strictly classifies marketing, app, and tenant modes.',
        'Safe navigation architecture prevents unsafe host injection and ensures correct tenant scope.',
        'Fully covered by automated regression test suites in the current workspace.',
      ],
      icon: <Globe2 className="h-6 w-6 text-brand-primary" />,
    },
    {
      title: 'Type Safety & Automated Test Verification',
      tagline: 'Implemented & Verified in Code',
      category: 'Implemented & Verified',
      badgeVariant: 'default' as const,
      badgeText: 'Verified Quality',
      description:
        'Our software engineering foundation enforces strict static analysis, domain boundary segregation, and comprehensive automated testing before any code reaches production.',
      details: [
        'Strict TypeScript compilation enforced across all monorepo packages and applications.',
        'Over 390 automated unit and integration tests verifying component contracts and behavior.',
        'Modular monorepo structure separating shared types, validation schemas, and UI primitives.',
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
            <span>Security-First Architectural Design</span>
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-content-main max-w-4xl mx-auto leading-[1.15]">
            Security as a core{' '}
            <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-teal bg-clip-text text-transparent">
              design priority.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-content-secondary max-w-2xl mx-auto leading-relaxed">
            FeedbackHub is being developed with a security-first architecture. We believe in transparent,
            honest communication regarding our design principles, implemented controls, and planned roadmap.
          </p>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. TRANSPARENT DEVELOPMENT STATUS & CLASSIFICATION */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <PageContainer>
          <div className="max-w-3xl mx-auto">
            <Alert variant="info" className="p-6 rounded-2xl border-brand-primary/30 bg-surface-card shadow-soft-sm">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <AlertTitle className="text-sm font-bold text-content-main">
                    Development Status &amp; Architectural Transparency
                  </AlertTitle>
                  <AlertDescription className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                    FeedbackHub is currently in technical development. The controls below are transparently categorized into <strong>Implemented &amp; Verified Controls</strong> (confirmed in our current codebase), <strong>Planned Controls</strong> (scheduled for implementation in upcoming development phases), and <strong>Design Principles</strong> (core architectural requirements). Formal independent third-party audits and certifications will be undertaken prior to commercial production launch.
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. SECURITY ARCHITECTURE PILLARS */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <PageContainer>
          <SectionHeading
            badge="Architecture & Controls"
            title="Design principles and technical controls"
            description="Explore our implemented software controls and planned architectural standards designed to protect feedback integrity."
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityPillars.map((pillar, idx) => (
              <Card
                key={idx}
                className="p-6 sm:p-8 bg-surface-card border-border shadow-soft-sm hover:shadow-soft-md transition-smooth flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-main border border-border shadow-soft-sm">
                      {pillar.icon}
                    </div>
                    <Badge
                      variant={pillar.badgeVariant}
                      className={`text-[10px] font-semibold px-2 py-0.5 ${
                        pillar.category === 'Implemented & Verified'
                          ? 'bg-brand-teal/15 text-slate-900 border-brand-teal/40'
                          : 'bg-surface-main text-content-secondary border-border'
                      }`}
                    >
                      {pillar.badgeText}
                    </Badge>
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
      {/* 4. SECURITY QUESTIONS & INQUIRIES */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-surface-card/40 py-16 sm:py-24 border-y border-border">
        <PageContainer>
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
              Security Questions &amp; Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-content-main tracking-tight">
              Have questions about our security roadmap?
            </h2>
            <p className="text-sm text-content-secondary leading-relaxed">
              We welcome dialogue with security professionals, enterprise architects, and prospective customers.
              Submit an inquiry through our central Contact page to connect with our engineering team regarding our planned architecture.
            </p>
            <div className="pt-4">
              <NavLink
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-primary text-white font-semibold text-sm shadow-soft-sm hover:bg-brand-primary/90 transition-colors"
              >
                <span>Submit a Security Inquiry via Contact Form</span>
                <ArrowRight className="h-4 w-4" />
              </NavLink>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. CALL TO ACTION */}
      {/* ------------------------------------------------------------------ */}
      <CTASection
        badge="Enterprise Transparency"
        title="Building feedback intelligence with honesty."
        description="Connect with our team to learn more about our architectural roadmap and technical milestones."
        primaryAction={{
          label: 'Request Technical Overview',
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
