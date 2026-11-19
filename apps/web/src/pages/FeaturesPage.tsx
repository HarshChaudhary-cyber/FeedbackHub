import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  HeartHandshake,
  Users2,
  Inbox,
  LineChart,
  ArrowRight,
  Sparkles,
  Sliders,
  Globe2,
  CheckCircle2,
  Bell,
} from 'lucide-react';
import { Button, Badge, Card } from '@feedbackhub/ui';
import { useDocumentTitle } from '../utils/seo';
import { PageContainer } from '../components/shared/PageContainer';
import { SectionHeading } from '../components/shared/SectionHeading';
import { CTASection } from '../components/shared/CTASection';

type FeatureCategory = 'all' | 'collection' | 'builder' | 'analytics' | 'management';

export const FeaturesPage: React.FC = () => {
  useDocumentTitle({
    title: 'Platform Features — Unified Feedback Architecture',
    description:
      'Explore FeedbackHub features: drag-and-drop form builder, multi-channel feedback collection, response triage inbox, sentiment analytics, and enterprise multi-tenancy.',
  });

  const [activeCategory, setActiveCategory] = useState<FeatureCategory>('all');

  const featurePillars = [
    {
      id: 'collection',
      category: 'collection',
      icon: <Globe2 className="h-6 w-6 text-brand-primary" />,
      title: 'Multi-Channel Feedback Collection',
      badge: 'Capture Anywhere',
      tagline: 'Never miss a voice across touchpoints',
      description:
        'Meet your customers and employees exactly where they are. FeedbackHub provides versatile distribution tools that seamlessly integrate into websites, emails, physical locations, and internal workspaces.',
      details: [
        'Shareable branded web links for direct survey distribution via SMS or chat.',
        'Embeddable feedback widgets and subtle bottom-sheet popups for web apps.',
        'Dynamic QR codes optimized for in-person events, kiosks, and retail environments.',
        'Automated post-interaction email triggers via transactional webhooks.',
        'Flexible submission modes: full identity capture or cryptographically verified anonymous feedback.',
      ],
      highlights: [
        { label: 'Distribution Channels', value: 'Web, Widget, QR, Email' },
        { label: 'Identity Modes', value: 'Identified & True Anonymous' },
        { label: 'Mobile Optimized', value: '100% Responsive Viewports' },
      ],
    },
    {
      id: 'builder',
      category: 'builder',
      icon: <Sliders className="h-6 w-6 text-brand-secondary" />,
      title: 'Intuitive Drag-and-Drop Form Builder',
      badge: 'Zero Code Required',
      tagline: 'Create beautiful, conversion-focused feedback forms in minutes',
      description:
        'Construct tailored survey flows with our modular form canvas. Combine quantitative rating indicators with qualitative contextual questions to uncover actionable insights without engineering bottlenecks.',
      details: [
        'Pre-configured industry metrics: Net Promoter Score (NPS 0-10) and Customer Satisfaction (CSAT 1-5).',
        'Likert agreement scales, multiple-choice options, and structured multi-line text responses.',
        'Conditional question logic: dynamically show follow-up questions based on respondent scores.',
        'Custom branding controls: upload company logos, set brand colors, and craft custom completion messages.',
        'Instant live preview toggle between mobile and desktop form layouts.',
      ],
      highlights: [
        { label: 'Question Types', value: 'NPS, CSAT, Likert, Text, Options' },
        { label: 'Branching Logic', value: 'Score-Based Rules' },
        { label: 'Live Preview', value: 'Instant Multi-Device Emulation' },
      ],
    },
    {
      id: 'inbox',
      category: 'management',
      icon: <Inbox className="h-6 w-6 text-brand-sky" />,
      title: 'Real-Time Response Inbox & Triage Console',
      badge: 'Collaborative Action',
      tagline: 'Turn incoming sentiment into structured team workflows',
      description:
        'A unified, real-time command center for your feedback stream. Triage, tag, filter, and assign customer comments or employee suggestions without letting valuable feedback slip through the cracks.',
      details: [
        'Live incoming response feed with instantaneous status badges (Open, Under Review, In Progress, Resolved).',
        'Multi-dimensional filtering: search by date range, sentiment score, rating category, or custom tag.',
        'Internal collaboration notes: leave private team comments on responses without exposing them to respondents.',
        'Direct ticket routing: assign feedback items to designated team members or department leads.',
        'Archiving and audit history to preserve complete compliance and review trails.',
      ],
      highlights: [
        { label: 'Triage Workflows', value: '4-Stage Lifecycle Status' },
        { label: 'Internal Notes', value: 'Private Team Collaboration' },
        { label: 'Response Tagging', value: 'Color-Coded Custom Labels' },
      ],
    },
    {
      id: 'analytics',
      category: 'analytics',
      icon: <LineChart className="h-6 w-6 text-brand-teal" />,
      title: 'Analytics & Sentiment Intelligence',
      badge: 'Actionable Insights',
      tagline: 'Spot recurring trends and quantify organizational sentiment',
      description:
        'Move beyond raw comment spreadsheets. FeedbackHub aggregates responses into high-level visual dashboards, tracking score trajectories, distribution spreads, and sentiment shifts over time.',
      details: [
        'Automated computation of core loyalty and satisfaction metrics (NPS breakdown: Promoters, Passives, Detractors).',
        'Historical trend monitoring: observe customer sentiment changes across weekly and monthly cohorts.',
        'Sentiment clustering: identify key recurring positive and critical themes across open text answers.',
        'One-click data export: download complete raw datasets in CSV or structured PDF executive summaries.',
        'Visual distribution charts powered by clean, accessible data representations.',
      ],
      highlights: [
        { label: 'Core Metrics', value: 'Real-time NPS, CSAT & Response Rates' },
        { label: 'Cohort Tracking', value: 'Historical Sentiment Trajectories' },
        { label: 'Export Formats', value: 'CSV, Excel & Executive PDF' },
      ],
    },
    {
      id: 'workspaces',
      category: 'management',
      icon: <Users2 className="h-6 w-6 text-brand-primary" />,
      title: 'Multi-Tenant Workspaces & Role-Based Access',
      badge: 'Enterprise Architecture',
      tagline: 'Strict organization boundaries and granular team control',
      description:
        'Built from the foundation up for B2B SaaS multi-tenancy. Every organization operates within its own securely partitioned workspace with custom subdomains, dedicated settings, and strict access governance.',
      details: [
        'Dedicated organizational subdomains (e.g. acme.feedbackhub.com) with custom branded tenant portals.',
        'Granular Role-Based Access Control (RBAC): Owner, Administrator, Team Member, and Read-Only Viewer roles.',
        'PostgreSQL Row-Level Security (RLS) ensuring strict cryptographic isolation of tenant datasets.',
        'Centralized team management: invite members, assign role permissions, and manage active sessions.',
        'Comprehensive audit log capturing critical administrative configuration actions.',
      ],
      highlights: [
        { label: 'Data Isolation', value: 'PostgreSQL Row-Level Security (RLS)' },
        { label: 'Tenant Routing', value: 'Dedicated Custom Subdomains' },
        { label: 'Access Governance', value: '4-Tier Granular RBAC' },
      ],
    },
    {
      id: 'notifications',
      category: 'management',
      icon: <Bell className="h-6 w-6 text-brand-secondary" />,
      title: 'Automated Notifications & Alert Triggers',
      badge: 'Immediate Awareness',
      tagline: 'Notify the right teams the moment critical feedback arrives',
      description:
        'Stay ahead of customer churn and urgent employee concerns. Configure intelligent alert policies that notify designated stakeholders instantly when negative sentiment or urgent issues are reported.',
      details: [
        'Instant alert triggers: automatically notify support leads when an NPS Detractor (0-6) or low CSAT is submitted.',
        'Weekly summary digest emails delivering high-level response velocity and sentiment trajectory to executives.',
        'Customizable email delivery preferences per team member to prevent notification fatigue.',
        'Upcoming integration webhook roadmap for Slack, Microsoft Teams, and Jira ticket generation.',
        'Rate-limited notification delivery engine designed for high-volume enterprise stability.',
      ],
      highlights: [
        { label: 'Trigger Rules', value: 'Detractor Alerts & Milestone Triggers' },
        { label: 'Digests', value: 'Automated Weekly Executive Summaries' },
        { label: 'Integrations', value: 'Webhooks & Collaboration Connectors' },
      ],
    },
  ];

  const filteredPillars = activeCategory === 'all'
    ? featurePillars
    : featurePillars.filter((p) => p.category === activeCategory);

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
            <span>Complete Platform Capabilities</span>
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-content-main max-w-4xl mx-auto leading-[1.15]">
            Everything your organization needs to{' '}
            <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-sky bg-clip-text text-transparent">
              listen, analyze, and act.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-content-secondary max-w-2xl mx-auto leading-relaxed">
            FeedbackHub unites multi-channel survey collection, intuitive form building,
            real-time team triage, and executive sentiment analytics into one unified architecture.
          </p>

          {/* Category Filter Pills */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'All Capabilities' },
              { id: 'collection', label: 'Collection & Distribution' },
              { id: 'builder', label: 'Form Builder' },
              { id: 'management', label: 'Triage & Workspaces' },
              { id: 'analytics', label: 'Analytics & Insights' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as FeatureCategory)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-brand-primary text-white shadow-soft-sm'
                    : 'bg-surface-card text-content-secondary hover:text-content-main border border-border hover:border-border/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. DETAILED FEATURE BREAKDOWN */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <PageContainer>
          <div className="space-y-16 sm:space-y-24">
            {filteredPillars.map((pillar, index) => {
              const isEven = index % 2 === 0;
              return (
                <div
                  key={pillar.id}
                  id={pillar.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-8 border-t border-border first:pt-0 first:border-t-0"
                >
                  {/* Left Column: Text & Bullet Details */}
                  <div
                    className={`space-y-6 lg:col-span-7 ${
                      isEven ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-card border border-border shadow-soft-sm">
                        {pillar.icon}
                      </div>
                      <Badge variant="outline" className="text-xs font-semibold text-brand-primary border-brand-primary/30">
                        {pillar.badge}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                        {pillar.tagline}
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-content-main mt-1 tracking-tight">
                        {pillar.title}
                      </h2>
                    </div>

                    <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
                      {pillar.description}
                    </p>

                    <div className="space-y-2.5 pt-2">
                      {pillar.details.map((detail, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="h-4 w-4 text-brand-teal mt-0.5 shrink-0" />
                          <span className="text-xs sm:text-sm text-content-main leading-relaxed">
                            {detail}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 flex flex-wrap gap-4">
                      <NavLink to="/pricing">
                        <Button variant="primary" size="sm" className="rounded-full shadow-soft-sm">
                          <span>Start with this Feature</span>
                          <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                      </NavLink>
                      <NavLink to="/solutions">
                        <Button variant="outline" size="sm" className="rounded-full">
                          View Relevant Solutions
                        </Button>
                      </NavLink>
                    </div>
                  </div>

                  {/* Right Column: Interactive Highlight Card */}
                  <div
                    className={`lg:col-span-5 ${
                      isEven ? 'lg:order-2' : 'lg:order-1'
                    }`}
                  >
                    <Card className="p-6 sm:p-8 bg-surface-card border-border shadow-soft-md space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-border">
                        <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                          Architecture Highlights
                        </span>
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-brand-primary/40" />
                          <div className="w-2.5 h-2.5 rounded-full bg-brand-secondary/40" />
                          <div className="w-2.5 h-2.5 rounded-full bg-brand-teal/40" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        {pillar.highlights.map((h, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-xl bg-surface-main border border-border/60 flex items-center justify-between"
                          >
                            <span className="text-xs text-content-secondary font-medium">
                              {h.label}
                            </span>
                            <span className="text-xs font-bold text-content-main">
                              {h.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 text-center">
                        <p className="text-[11px] text-content-muted leading-relaxed">
                          Enterprise-grade stability verified with automated regression and accessibility suites.
                        </p>
                      </div>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. DUAL AUDIENCE VALUE PROPOSITION */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-surface-card/50 py-16 sm:py-24 border-y border-border">
        <PageContainer>
          <SectionHeading
            badge="Unified Platform"
            title="Two audiences. One shared source of truth."
            description="Traditional tools force companies to buy separate systems for customer surveys and employee engagement. FeedbackHub brings them together securely."
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8 bg-surface-card border-border shadow-soft-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-content-main">
                  Customer Experience &amp; Product Validation
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  Understand churn signals before they happen, benchmark Net Promoter Scores across product releases, and gather targeted feedback on new feature prototypes.
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-content-main pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-teal" />
                    Targeted in-app micro-surveys
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-teal" />
                    Automated Detractor alerts for support escalation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-teal" />
                    Exportable feedback reports for product roadmaps
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <NavLink to="/solutions">
                  <Button variant="outline" className="w-full justify-center rounded-full text-xs sm:text-sm">
                    View Customer Solutions
                  </Button>
                </NavLink>
              </div>
            </Card>

            <Card className="p-8 bg-surface-card border-border shadow-soft-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-secondary/10 text-brand-secondary">
                  <Users2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-content-main">
                  Employee Engagement &amp; Culture Listening
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  Provide safe, anonymous channels for genuine workplace sentiment, routine team pulse checks, and structured continuous improvement suggestions.
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-content-main pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-teal" />
                    k-anonymity privacy safeguards (k &ge; 5)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-teal" />
                    Departmental pulse surveys with trend benchmarks
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-teal" />
                    Zero-fear psychological safety for constructive feedback
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <NavLink to="/solutions">
                  <Button variant="outline" className="w-full justify-center rounded-full text-xs sm:text-sm">
                    View Employee Solutions
                  </Button>
                </NavLink>
              </div>
            </Card>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. CALL TO ACTION */}
      {/* ------------------------------------------------------------------ */}
      <CTASection
        badge="Ready to Experience the Difference?"
        title="Start gathering actionable feedback today."
        description="Launch your first customer or employee feedback survey in under five minutes with FeedbackHub."
        primaryAction={{
          label: 'Get Started Free',
          href: '/pricing',
        }}
        secondaryAction={{
          label: 'Request Early Access',
          href: '/contact',
        }}
      />
    </div>
  );
};
