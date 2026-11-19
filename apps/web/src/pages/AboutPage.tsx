import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Users2,
  Lock,
  Eye,
  Target,
  Zap,
  Globe2,
} from 'lucide-react';
import { Badge, Card } from '@feedbackhub/ui';
import { useDocumentTitle } from '../utils/seo';
import { PageContainer } from '../components/shared/PageContainer';
import { SectionHeading } from '../components/shared/SectionHeading';
import { CTASection } from '../components/shared/CTASection';

export const AboutPage: React.FC = () => {
  useDocumentTitle({
    title: 'About FeedbackHub — Mission, Principles & Vision',
    description:
      'Learn about FeedbackHub: our mission to turn feedback into meaningful progress, our dual customer and employee philosophy, and our core principles.',
  });

  const corePrinciples = [
    {
      title: 'Anonymity by Design',
      tagline: 'Psychological Safety First',
      description:
        'Feedback is only as good as its honesty. When respondents fear retaliation or judgment, insights are diluted into polite platitudes. We are designing mathematical k-anonymity (k >= 5) and metadata decoupling into our planned architecture.',
      icon: <Lock className="h-6 w-6 text-brand-primary" />,
    },
    {
      title: 'Actionable Clarity',
      tagline: 'Outcomes Over Vanity Scores',
      description:
        'A Net Promoter Score without context is just a vanity number. We build feedback experiences that reveal why users feel the way they do and route insights directly into team workflows for rapid resolution.',
      icon: <Target className="h-6 w-6 text-brand-secondary" />,
    },
    {
      title: 'The Dual-Audience Imperative',
      tagline: 'Listening Both Ways',
      description:
        'Great companies do not operate in silos. The people building software and the customers using it face interconnected challenges. FeedbackHub provides a unified system where customer and employee sentiment inform each other.',
      icon: <HeartHandshake className="h-6 w-6 text-brand-sky" />,
    },
    {
      title: 'Enterprise Trust & Data Isolation',
      tagline: 'Security at the Foundation',
      description:
        'Your feedback data contains sensitive customer opinions and confidential employee remarks. Our planned architecture uses PostgreSQL Row-Level Security and modern encryption standards.',
      icon: <ShieldCheck className="h-6 w-6 text-brand-teal" />,
    },
    {
      title: 'Radical Simplicity',
      tagline: 'Low-Friction Responses',
      description:
        'Long, arduous surveys get abandoned. We design ultra-responsive, beautiful, accessible survey interactions that take less than 60 seconds to complete on any device.',
      icon: <Zap className="h-6 w-6 text-brand-primary" />,
    },
    {
      title: 'Closing the Feedback Loop',
      tagline: 'Accountability & Respect',
      description:
        'Nothing demoralizes users more than submitting thoughtful input into a corporate black hole. FeedbackHub gives teams tools to acknowledge, triage, and visibly act on feedback.',
      icon: <Eye className="h-6 w-6 text-brand-secondary" />,
    },
  ];

  const milestones = [
    {
      year: 'Phase 1',
      title: 'Monorepo & Domain Architecture',
      description:
        'Established full-stack TypeScript workspace with domain-driven modularity, clean boundaries, and hostname-aware routing foundation.',
    },
    {
      year: 'Phase 2',
      title: 'Design System & UI Components',
      description:
        'Engineered complete accessible component library with 20+ Radix-powered primitives, WCAG 2.1 AA compliance, and comprehensive test coverage.',
    },
    {
      year: 'Phase 3',
      title: 'Public Platform & Marketing Experience',
      description:
        'Launched responsive, multi-page public presence communicating dual-audience solutions, interactive pricing, and security architecture.',
    },
    {
      year: 'Phase 4',
      title: 'Multi-Tenant Authentication & Core Engine',
      description:
        'Rolling out secure tenant provisioning, session security, form builder canvas, and real-time response ingestion.',
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
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-brand-primary/10 via-brand-secondary/5 to-transparent blur-3xl opacity-70"
        />

        <PageContainer className="relative z-10 text-center">
          <Badge
            variant="secondary"
            className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-brand-primary/10 text-brand-primary border-brand-primary/20 shadow-soft-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Our Mission &amp; Philosophy</span>
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-content-main max-w-4xl mx-auto leading-[1.15]">
            Bridging the gap between{' '}
            <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-teal bg-clip-text text-transparent">
              raw feedback and real momentum.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-content-secondary max-w-2xl mx-auto leading-relaxed">
            We believe organizations thrive when they truly listen to their people.
            FeedbackHub was founded to replace disconnected survey silos with a single,
            privacy-first source of organizational truth.
          </p>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. THE PROBLEM & THE SOLUTION */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                Why FeedbackHub Exists
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-content-main tracking-tight leading-tight">
                Feedback is broken across modern software companies.
              </h2>
              <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
                In most organizations, feedback is scattered across a dozen disjointed channels:
                customer support tickets, NPS email blasts, Slack channels, anonymous suggestion boxes,
                and ad-hoc spreadsheets.
              </p>
              <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
                The result? Valuable customer warnings are ignored until churn hits. Employees hold back
                honest ideas because they do not trust corporate "anonymous" forms. And leaders make
                multi-million dollar bets based on incomplete hunches.
              </p>
              <div className="p-4 rounded-2xl bg-surface-card border border-border space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-content-main">
                  Our Conviction
                </span>
                <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                  When you give both customers and employees a safe, beautiful, and transparent way to share feedback, your organization gains an unbeatable competitive moat.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className="p-6 bg-surface-card border-border shadow-soft-sm space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-content-main">Customer Voice</h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  Understand churn signals before they happen. Directly tie customer ratings to product roadmap tickets.
                </p>
              </Card>

              <Card className="p-6 bg-surface-card border-border shadow-soft-sm space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-secondary/10 text-brand-secondary">
                  <Users2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-content-main">Employee Trust</h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  Planned anonymous feedback mode protects respondents and encourages truthful workplace sentiment.
                </p>
              </Card>

              <Card className="p-6 bg-surface-card border-border shadow-soft-sm space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-sky/10 text-brand-sky">
                  <Globe2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-content-main">Multi-Tenant Portals</h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  Dedicated company subdomains and planned PostgreSQL Row-Level Security for enterprise governance.
                </p>
              </Card>

              <Card className="p-6 bg-surface-card border-border shadow-soft-sm space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-content-main">Real-Time Triage</h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  Move immediately from raw response ingestion to internal notes, team assignments, and resolution.
                </p>
              </Card>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. CORE PRINCIPLES */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-surface-card/40 py-16 sm:py-24 border-y border-border">
        <PageContainer>
          <SectionHeading
            badge="Guiding Values"
            title="Principles that guide every line of code"
            description="Our architecture and product choices are driven by six core commitments to privacy, clarity, and trust."
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {corePrinciples.map((item, index) => (
              <Card
                key={index}
                className="p-6 sm:p-8 bg-surface-card border-border shadow-soft-sm hover:shadow-soft-md transition-smooth flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-main border border-border shadow-soft-sm">
                    {item.icon}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-primary">
                      {item.tagline}
                    </span>
                    <h3 className="text-lg font-bold text-content-main mt-1">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. PLATFORM JOURNEY & ROADMAP */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <PageContainer>
          <SectionHeading
            badge="Execution Roadmap"
            title="Disciplined engineering from day one"
            description="How FeedbackHub is built: rigorously tested phases delivering rock-solid SaaS architecture."
          />

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {milestones.map((m, idx) => (
              <Card
                key={idx}
                className="p-6 bg-surface-card border-border shadow-soft-sm space-y-3 relative"
              >
                <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-primary/10 text-brand-primary">
                  {m.year}
                </span>
                <h3 className="text-base font-bold text-content-main">{m.title}</h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  {m.description}
                </p>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. CALL TO ACTION */}
      {/* ------------------------------------------------------------------ */}
      <CTASection
        badge="Join the Journey"
        title="Be part of the next generation of feedback."
        description="Connect with our founders, request early platform access, or explore our feature breakdown."
        primaryAction={{
          label: 'Request Early Access',
          href: '/contact',
        }}
        secondaryAction={{
          label: 'Explore Features',
          href: '/features',
        }}
      />
    </div>
  );
};
