import React, { useState } from 'react';
import {
  HeartHandshake,
  Users2,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Smile,
  AlertCircle,
  Sparkles,
  BarChart,
  Repeat,
  Compass,
  Lock,
} from 'lucide-react';
import { Badge, Card, CardHeader, CardTitle, CardContent } from '@feedbackhub/ui';
import { useDocumentTitle } from '../utils/seo';
import { PageContainer } from '../components/shared/PageContainer';
import { SectionHeading } from '../components/shared/SectionHeading';
import { CTASection } from '../components/shared/CTASection';

export const SolutionsPage: React.FC = () => {
  useDocumentTitle({
    title: 'Solutions for Customers & Employees — FeedbackHub',
    description:
      'Discover FeedbackHub solutions for Customer Experience (NPS, CSAT, churn reduction) and Employee Engagement (pulse surveys, anonymous feedback, team morale).',
  });

  const [activeTab, setActiveTab] = useState<'customer' | 'employee'>('customer');

  const customerUseCases = [
    {
      title: 'Voice of the Customer (VoC) Programs',
      description:
        'Continuous listening throughout the entire customer journey — from onboarding to renewal. Understand expectations and pinpoint drop-off reasons.',
      metrics: '+28% higher response completion rate with minimal, frictionless surveys.',
      icon: <Smile className="h-5 w-5 text-brand-primary" />,
    },
    {
      title: 'Product Validation & Roadmap Input',
      description:
        'Validate new product features with active power users before writing code. Prioritize engineering roadmaps based on quantified user demand.',
      metrics: 'Eliminate feature guesswork with targeted feedback segmentation.',
      icon: <Compass className="h-5 w-5 text-brand-secondary" />,
    },
    {
      title: 'Customer Churn Prevention & Detractor Triage',
      description:
        'Trigger immediate alerts when an account reports an NPS Detractor score (0-6). Enable customer success teams to intervene and resolve dissatisfaction fast.',
      metrics: '3x faster escalation and recovery for at-risk enterprise accounts.',
      icon: <AlertCircle className="h-5 w-5 text-brand-sky" />,
    },
    {
      title: 'Support Satisfaction (CSAT / CES)',
      description:
        'Capture immediate post-resolution customer sentiment. Track individual agent helpfulness and resolution effort metrics automatically.',
      metrics: 'Instant CSAT score calculation and automated weekly team digests.',
      icon: <CheckCircle2 className="h-5 w-5 text-brand-teal" />,
    },
  ];

  const employeeUseCases = [
    {
      title: 'Continuous Workplace Pulse Surveys',
      description:
        'Short, frequent, low-burden pulse checks that measure morale, psychological safety, and workload distribution in real time without annual survey fatigue.',
      metrics: '82% typical participation rates driven by 2-minute weekly pulses.',
      icon: <Repeat className="h-5 w-5 text-brand-primary" />,
    },
    {
      title: 'Cryptographically Anonymous Suggestion Box',
      description:
        'Give employees complete peace of mind to voice critical concerns, ethical questions, and creative ideas without fear of managerial retaliation.',
      metrics: 'Zero-knowledge anonymization with strict k-anonymity (k >= 5) safeguards.',
      icon: <Lock className="h-5 w-5 text-brand-secondary" />,
    },
    {
      title: 'Departmental & Team Health Benchmarks',
      description:
        'Compare sentiment trajectories across engineering, design, sales, and support departments while safeguarding individual anonymity.',
      metrics: 'Identify cross-departmental friction before it drives attrition.',
      icon: <BarChart className="h-5 w-5 text-brand-sky" />,
    },
    {
      title: 'Structured Exit & Onboarding Interviews',
      description:
        'Standardize feedback from new hires at day 30 and departing employees on day zero. Uncover honest patterns regarding company culture and management.',
      metrics: 'Clear retrospective reporting on retention factors and leadership impact.',
      icon: <Users2 className="h-5 w-5 text-brand-teal" />,
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
            <Sparkles className="h-3.5 w-3.5" />
            <span>Targeted Feedback Solutions</span>
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-content-main max-w-4xl mx-auto leading-[1.15]">
            Engineered for customer retention.{' '}
            <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-teal bg-clip-text text-transparent">
              Built for employee trust.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-content-secondary max-w-2xl mx-auto leading-relaxed">
            Organizations excel when they listen to the people who buy their products
            and the people who build them. FeedbackHub provides tailored workflows for both.
          </p>

          {/* Interactive Toggle for View Tracks */}
          <div className="mt-10 inline-flex p-1.5 rounded-full bg-surface-card border border-border shadow-soft-sm">
            <button
              type="button"
              onClick={() => setActiveTab('customer')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'customer'
                  ? 'bg-brand-primary text-white shadow-soft-sm'
                  : 'text-content-secondary hover:text-content-main'
              }`}
            >
              <HeartHandshake className="h-4 w-4" />
              <span>Customer Experience</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('employee')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'employee'
                  ? 'bg-brand-secondary text-white shadow-soft-sm'
                  : 'text-content-secondary hover:text-content-main'
              }`}
            >
              <Users2 className="h-4 w-4" />
              <span>Employee Engagement</span>
            </button>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. TAB CONTENT: SOLUTIONS SHOWCASE */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <PageContainer>
          {activeTab === 'customer' ? (
            <div className="space-y-12">
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                  Customer Experience Track
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-content-main tracking-tight">
                  Turn user feedback into revenue retention
                </h2>
                <p className="text-sm sm:text-base text-content-secondary">
                  Eliminate guesswork by asking customers at precisely the right moment in their journey.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {customerUseCases.map((uc, i) => (
                  <Card key={i} className="p-6 sm:p-8 bg-surface-card border-border shadow-soft-sm hover:shadow-soft-md transition-smooth">
                    <CardHeader className="p-0 mb-4 flex flex-row items-center gap-4">
                      <div className="p-3 rounded-2xl bg-brand-primary/10 text-brand-primary shrink-0">
                        {uc.icon}
                      </div>
                      <CardTitle as="h3" className="text-lg sm:text-xl font-bold text-content-main">
                        {uc.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                      <p className="text-sm text-content-secondary leading-relaxed">
                        {uc.description}
                      </p>
                      <div className="p-3 rounded-xl bg-surface-main border border-border/80 flex items-center gap-2 text-xs font-semibold text-brand-primary">
                        <TrendingUp className="h-4 w-4 shrink-0 text-brand-teal" />
                        <span>{uc.metrics}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
                  Employee Engagement Track
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-content-main tracking-tight">
                  Foster radical candor and psychological safety
                </h2>
                <p className="text-sm sm:text-base text-content-secondary">
                  When employees trust the privacy of their feedback, leadership receives genuine insights.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {employeeUseCases.map((uc, i) => (
                  <Card key={i} className="p-6 sm:p-8 bg-surface-card border-border shadow-soft-sm hover:shadow-soft-md transition-smooth">
                    <CardHeader className="p-0 mb-4 flex flex-row items-center gap-4">
                      <div className="p-3 rounded-2xl bg-brand-secondary/10 text-brand-secondary shrink-0">
                        {uc.icon}
                      </div>
                      <CardTitle as="h3" className="text-lg sm:text-xl font-bold text-content-main">
                        {uc.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                      <p className="text-sm text-content-secondary leading-relaxed">
                        {uc.description}
                      </p>
                      <div className="p-3 rounded-xl bg-surface-main border border-border/80 flex items-center gap-2 text-xs font-semibold text-brand-secondary">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-brand-teal" />
                        <span>{uc.metrics}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. BEFORE & AFTER: WHY CONSOLIDATION WINS */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-surface-card/60 py-16 sm:py-24 border-y border-border">
        <PageContainer>
          <SectionHeading
            badge="Architecture Comparison"
            title="Siloed tools vs. FeedbackHub Unified System"
            description="See why modern companies are replacing disconnected survey spreadsheets and fragmented SaaS accounts with a single multi-tenant platform."
          />

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* The Old Way */}
            <Card className="p-8 bg-surface-card border-border/80 shadow-soft-sm border-l-4 border-l-content-muted">
              <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                The Fragmented Stack
              </span>
              <h3 className="text-xl font-bold text-content-main mt-1 mb-4">
                Siloed SaaS Subscriptions &amp; Lost Insights
              </h3>
              <ul className="space-y-4 text-xs sm:text-sm text-content-secondary">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold text-base leading-none">&times;</span>
                  <span>Separate subscriptions for customer surveys, employee pulses, and support feedback.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold text-base leading-none">&times;</span>
                  <span>Customer insights trapped in marketing tools; product engineers never see them.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold text-base leading-none">&times;</span>
                  <span>Employees distrust "anonymous" surveys when managed through corporate email tools.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold text-base leading-none">&times;</span>
                  <span>Manual exports to Google Sheets that go out-of-date within days.</span>
                </li>
              </ul>
            </Card>

            {/* The FeedbackHub Way */}
            <Card className="p-8 bg-surface-card border-border/80 shadow-soft-md border-l-4 border-l-brand-teal">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-teal">
                The FeedbackHub Model
              </span>
              <h3 className="text-xl font-bold text-content-main mt-1 mb-4">
                Unified Governance &amp; Actionable Intelligence
              </h3>
              <ul className="space-y-4 text-xs sm:text-sm text-content-main">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-brand-teal shrink-0 mt-0.5" />
                  <span>One predictable subscription supporting both customer and employee listening tracks.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-brand-teal shrink-0 mt-0.5" />
                  <span>Centralized triage inbox connecting customer requests directly to product priorities.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-brand-teal shrink-0 mt-0.5" />
                  <span>Verified cryptographic anonymity (k &ge; 5) ensuring genuine employee honesty.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-brand-teal shrink-0 mt-0.5" />
                  <span>Real-time executive dashboards with automatic trend calculation and zero CSV wrangling.</span>
                </li>
              </ul>
            </Card>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. CALL TO ACTION */}
      {/* ------------------------------------------------------------------ */}
      <CTASection
        badge="Ready to Unify Your Feedback?"
        title="Experience FeedbackHub for your organization."
        description="Select the plan that fits your current team size or request early platform access."
        primaryAction={{
          label: 'View Pricing & Plans',
          href: '/pricing',
        }}
        secondaryAction={{
          label: 'Talk to Sales',
          href: '/contact',
        }}
      />
    </div>
  );
};
