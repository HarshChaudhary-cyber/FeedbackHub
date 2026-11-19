import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FileText,
  HeartHandshake,
  Users2,
  ShieldAlert,
  Inbox,
  LineChart,
  ArrowRight,
  Globe2,
  CheckCircle,
  Layers,
  Sparkles,
  Lock,
  Building,
} from 'lucide-react';
import { Button, Badge, Card } from '@feedbackhub/ui';
import { useDocumentTitle } from '../utils/seo';
import { PageContainer } from '../components/shared/PageContainer';
import { SectionHeading } from '../components/shared/SectionHeading';
import { FeatureCard } from '../components/shared/FeatureCard';
import { ProductDashboardPreview } from '../components/shared/ProductDashboardPreview';
import { CTASection } from '../components/shared/CTASection';

export const HomePage: React.FC = () => {
  useDocumentTitle({
    title: 'Turn Feedback Into Meaningful Progress',
    description:
      'Collect customer and employee feedback, understand what matters, and turn valuable insights into better decisions with FeedbackHub.',
  });

  return (
    <div className="space-y-20 sm:space-y-28 lg:space-y-36 pb-12">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO SECTION */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative pt-12 sm:pt-20 lg:pt-24 overflow-hidden">
        {/* Subtle background ambient gradient */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-brand-primary/10 via-brand-sky/5 to-transparent blur-3xl opacity-70"
        />

        <PageContainer className="relative z-10 text-center">
          <div className="mx-auto flex max-w-4xl flex-col items-center">
            {/* Pill Announcement */}
            <Badge
              variant="secondary"
              className="mb-6 inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold bg-brand-primary/10 text-brand-primary border-brand-primary/20 shadow-soft-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Multi-Tenant Feedback Intelligence</span>
            </Badge>

            {/* Hero Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-content-main leading-[1.12]">
              Turn feedback into{' '}
              <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-sky bg-clip-text text-transparent">
                meaningful progress.
              </span>
            </h1>

            {/* Hero Description */}
            <p className="mt-6 text-lg sm:text-xl text-content-secondary max-w-2xl leading-relaxed">
              Collect customer and employee feedback, understand what matters, and
              turn valuable insights into better decisions.
            </p>

            {/* Hero Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <NavLink to="/pricing" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto shadow-soft-md group justify-center px-8"
                >
                  <span>Get Started</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </NavLink>

              <NavLink to="/features" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto justify-center px-8"
                >
                  Explore Features
                </Button>
              </NavLink>
            </div>

            {/* Trust Micro-note */}
            <div className="mt-8 flex items-center gap-6 text-xs text-content-muted">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-brand-teal" />
                Dual Audience (Customer &amp; Employee)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-brand-teal" />
                Cryptographic Anonymity
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-brand-teal" />
                Dedicated Subdomains
              </span>
            </div>
          </div>

          {/* Interactive Product Dashboard Preview */}
          <div className="mt-14 sm:mt-20">
            <ProductDashboardPreview />
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. VALUE PROPOSITION */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative">
        <PageContainer>
          <SectionHeading
            badge="Why FeedbackHub"
            title="Why organize all feedback in one platform?"
            description="Scattered feedback across disconnected inboxes, forms, and channels creates blind spots. FeedbackHub unifies your perspective so leaders can act with speed and clarity."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-border bg-surface-card p-6 rounded-[20px] shadow-soft-sm">
              <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-content-main mb-2">
                Centralized Feedback
              </h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                No more chasing comments across Slack, email threads, and disparate surveys. All signals converge in one searchable inbox.
              </p>
            </Card>

            <Card className="border-border bg-surface-card p-6 rounded-[20px] shadow-soft-sm">
              <div className="h-10 w-10 rounded-xl bg-brand-sky/10 text-brand-sky flex items-center justify-center mb-4">
                <LineChart className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-content-main mb-2">
                Better Visibility
              </h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                Real-time sentiment indicators and trend analysis reveal what customers love and where friction emerges before it affects churn.
              </p>
            </Card>

            <Card className="border-border bg-surface-card p-6 rounded-[20px] shadow-soft-sm">
              <div className="h-10 w-10 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center mb-4">
                <CheckCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-content-main mb-2">
                Faster Response
              </h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                Route inquiries to the right team members, add internal notes, and track resolution status through structured triage workflows.
              </p>
            </Card>

            <Card className="border-border bg-surface-card p-6 rounded-[20px] shadow-soft-sm">
              <div className="h-10 w-10 rounded-xl bg-brand-secondary/10 text-brand-secondary flex items-center justify-center mb-4">
                <Inbox className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-content-main mb-2">
                Organized Suggestions
              </h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                Tag customer requests by product area and group employee ideas by department to prioritize product roadmaps and workplace initiatives.
              </p>
            </Card>

            <Card className="border-border bg-surface-card p-6 rounded-[20px] shadow-soft-sm">
              <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-content-main mb-2">
                Confident Decision-Making
              </h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                Base strategic decisions on empirical feedback trends and quantitative ratings rather than loudest-voice bias or intuition.
              </p>
            </Card>

            <Card className="border-border bg-surface-card p-6 rounded-[20px] shadow-soft-sm">
              <div className="h-10 w-10 rounded-xl bg-brand-sky/10 text-brand-sky flex items-center justify-center mb-4">
                <Users2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-content-main mb-2">
                Customer &amp; Employee Harmony
              </h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                Understand the complete organizational picture. Great customer experiences begin with a psychologically safe, empowered team.
              </p>
            </Card>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. FEATURE CARDS */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative">
        <PageContainer>
          <SectionHeading
            badge="Platform Capabilities"
            title="Everything required to capture and manage feedback"
            description="From dynamic multi-question forms to deep sentiment triage, FeedbackHub equips your team with production-grade tooling."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="Custom Feedback Forms"
              description="Build tailored surveys with multiple question types including NPS (0-10), CSAT rating stars, Likert scales, and open text fields."
              badge="Form Builder"
            />
            <FeatureCard
              icon={<HeartHandshake className="h-6 w-6" />}
              title="Customer Experience (CX)"
              description="Collect product reviews, bug reports, and service satisfaction directly from customers via web links and custom subdomains."
              badge="Customer Hub"
            />
            <FeatureCard
              icon={<Users2 className="h-6 w-6" />}
              title="Employee Feedback &amp; Pulse"
              description="Run quarterly culture surveys, manager check-ins, and team pulse assessments to build an open, high-trust workplace."
              badge="Employee Hub"
            />
            <FeatureCard
              icon={<ShieldAlert className="h-6 w-6" />}
              title="Guaranteed Anonymity"
              description="Offer employees genuine psychological safety with cryptographically decoupled submissions and k-anonymity reporting thresholds."
              badge="Privacy-First"
            />
            <FeatureCard
              icon={<Inbox className="h-6 w-6" />}
              title="Response Management &amp; Triage"
              description="Filter by rating, search text, assign internal statuses (New, In Progress, Resolved), and collaborate with internal notes."
              badge="Operations"
            />
            <FeatureCard
              icon={<LineChart className="h-6 w-6" />}
              title="Analytics &amp; Trend Insights"
              description="Visualize Promoter vs. Detractor distributions, response velocity, and historical sentiment patterns across departments."
              badge="Reporting"
            />
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. HOW IT WORKS */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative bg-surface-card/60 py-16 sm:py-24 border-y border-border">
        <PageContainer>
          <SectionHeading
            badge="Simple 3-Step Process"
            title="How FeedbackHub works"
            description="Designed for clarity and momentum. Move from initial question design to actionable resolution in three streamlined steps."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative rounded-[20px] bg-surface-card border border-border p-8 shadow-soft-sm text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-white font-bold text-lg mb-6 shadow-soft-sm">
                1
              </div>
              <h3 className="text-xl font-bold text-content-main mb-3">
                Create Your Feedback Form
              </h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                Choose question formats, customize wording, configure anonymous or identified mode, and set optional rating scales.
              </p>
            </div>

            <div className="relative rounded-[20px] bg-surface-card border border-border p-8 shadow-soft-sm text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-secondary text-white font-bold text-lg mb-6 shadow-soft-sm">
                2
              </div>
              <h3 className="text-xl font-bold text-content-main mb-3">
                Share With Your Audience
              </h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                Distribute via shareable links, embed on your website, or route employees directly to your branded company portal.
              </p>
            </div>

            <div className="relative rounded-[20px] bg-surface-card border border-border p-8 shadow-soft-sm text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal text-white font-bold text-lg mb-6 shadow-soft-sm">
                3
              </div>
              <h3 className="text-xl font-bold text-content-main mb-3">
                Understand &amp; Take Action
              </h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                Review aggregated sentiment trends, assign follow-ups to teammates, track resolution, and close the feedback loop.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. CUSTOMER FEEDBACK DEEP DIVE */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative">
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="bg-brand-primary/10 text-brand-primary font-semibold">
                Customer Intelligence
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-content-main leading-tight">
                Understand your customers before they reach for the exit.
              </h2>
              <p className="text-base text-content-secondary leading-relaxed">
                Customers frequently churn without filing a support ticket. FeedbackHub gives
                you frictionless listening channels to capture customer sentiment at critical
                touchpoints:
              </p>

              <ul className="space-y-3.5 text-sm text-content-main">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="h-5 w-5 text-brand-teal mt-0.5 shrink-0" />
                  <span><strong>Product Experience:</strong> Gauge feature usability, onboarding friction, and core workflows.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="h-5 w-5 text-brand-teal mt-0.5 shrink-0" />
                  <span><strong>Satisfaction Tracking:</strong> Track CSAT and NPS across time, versions, and customer tiers.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="h-5 w-5 text-brand-teal mt-0.5 shrink-0" />
                  <span><strong>Complaint Resolution:</strong> Triage customer pain points swiftly with clear ownership statuses.</span>
                </li>
              </ul>

              <div className="pt-2">
                <NavLink to="/solutions">
                  <Button variant="outline" className="rounded-xl group">
                    <span>Explore Customer Solutions</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </NavLink>
              </div>
            </div>

            {/* Visual Card Mockup */}
            <div className="rounded-[24px] border border-border bg-surface-card p-6 sm:p-8 shadow-soft-md space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-content-main">
                  Customer Survey Preview
                </span>
                <Badge variant="success" className="text-xs">
                  CSAT 5★ Verified
                </Badge>
              </div>
              <div className="space-y-3 text-xs sm:text-sm">
                <p className="font-semibold text-content-main">
                  &ldquo;How satisfied are you with our enterprise onboarding process?&rdquo;
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className="h-8 w-8 rounded-lg bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center text-xs"
                    >
                      ★ {star}
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-surface-main p-3 border border-border text-xs text-content-secondary leading-relaxed">
                  &ldquo;Our customer success manager resolved our API provisioning question in less than an hour. Very smooth launch!&rdquo;
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. EMPLOYEE FEEDBACK & ANONYMITY */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative">
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Visual Card Mockup first on large */}
            <div className="order-2 lg:order-1 rounded-[24px] border border-border bg-surface-card p-6 sm:p-8 shadow-soft-md space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-content-main">
                  Employee Pulse Survey
                </span>
                <Badge variant="outline" className="text-xs text-brand-teal border-brand-teal/40">
                  <Lock className="h-3 w-3 mr-1" />
                  Anonymity Protected
                </Badge>
              </div>
              <div className="space-y-3 text-xs sm:text-sm">
                <p className="font-semibold text-content-main">
                  &ldquo;Do you feel comfortable voicing dissenting opinions in sprint retrospectives?&rdquo;
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
                  <div className="p-2 rounded-xl border border-border bg-surface-main text-content-secondary">
                    Always
                  </div>
                  <div className="p-2 rounded-xl border-2 border-brand-primary bg-brand-primary/10 text-brand-primary font-semibold">
                    Usually
                  </div>
                  <div className="p-2 rounded-xl border border-border bg-surface-main text-content-secondary">
                    Rarely
                  </div>
                </div>
                <p className="text-[11px] text-content-muted">
                  Responses are cryptographically decoupled from user accounts. Reports require minimum 5 submissions per group.
                </p>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-6">
              <Badge variant="secondary" className="bg-brand-teal/10 text-brand-teal font-semibold">
                Workplace Culture
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-content-main leading-tight">
                Empower your team with verifiable psychological safety.
              </h2>
              <p className="text-base text-content-secondary leading-relaxed">
                Employees hesitate to share honest constructive feedback when they worry about
                retaliation or attribution. FeedbackHub’s privacy architecture guarantees true
                peace of mind:
              </p>

              <ul className="space-y-3.5 text-sm text-content-main">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="h-5 w-5 text-brand-teal mt-0.5 shrink-0" />
                  <span><strong>Safe Feedback Options:</strong> Choose between identified or anonymous submission per survey.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="h-5 w-5 text-brand-teal mt-0.5 shrink-0" />
                  <span><strong>Zero Fingerprinting:</strong> No IP address logging or browser hardware fingerprinting.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="h-5 w-5 text-brand-teal mt-0.5 shrink-0" />
                  <span><strong>Culture Insights:</strong> Detect team burnout, leadership friction, and organizational hurdles early.</span>
                </li>
              </ul>

              <div className="pt-2">
                <NavLink to="/solutions">
                  <Button variant="outline" className="rounded-xl group">
                    <span>Explore Employee Solutions</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </NavLink>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 7. BRANDED COMPANY PORTAL SECTION */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative bg-surface-card/60 py-16 sm:py-24 border-y border-border">
        <PageContainer>
          <SectionHeading
            badge="Dedicated Portals"
            title="Your brand. Your subdomain. Your feedback hub."
            description="Give your stakeholders a tailored experience. Each company workspace operates on an independent subdomain with custom logo, accent colors, and branded forms."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Example 1: abc.feedbackhub.com */}
            <Card className="rounded-[20px] border border-border bg-surface-card p-6 shadow-soft-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center">
                    A
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-content-main">ABC Corporation</h4>
                    <span className="text-[11px] font-mono text-content-muted">abc.feedbackhub.com</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Tenant Subdomain
                </Badge>
              </div>
              <div className="rounded-xl bg-surface-main p-4 border border-border space-y-2 text-xs">
                <p className="font-semibold text-content-main">
                  &ldquo;Welcome to ABC Customer Advisory Board Feedback&rdquo;
                </p>
                <p className="text-content-secondary leading-relaxed">
                  Tailored branding, primary color accents, custom logo, and distinct department categories.
                </p>
              </div>
            </Card>

            {/* Example 2: nova.feedbackhub.com */}
            <Card className="rounded-[20px] border border-border bg-surface-card p-6 shadow-soft-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-brand-teal text-white text-xs font-bold flex items-center justify-center">
                    N
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-content-main">Nova Systems</h4>
                    <span className="text-[11px] font-mono text-content-muted">nova.feedbackhub.com</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Tenant Subdomain
                </Badge>
              </div>
              <div className="rounded-xl bg-surface-main p-4 border border-border space-y-2 text-xs">
                <p className="font-semibold text-content-main">
                  &ldquo;Nova Internal Pulse &amp; Retrospective Portal&rdquo;
                </p>
                <p className="text-content-secondary leading-relaxed">
                  Independent employee portal with custom branding and verified anonymous submission rules.
                </p>
              </div>
            </Card>
          </div>

          <p className="text-center text-xs text-content-muted mt-6">
            * Subdomains like <code>abc.feedbackhub.com</code> and <code>nova.feedbackhub.com</code> are conceptual architectural examples.
          </p>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 8. PRIVACY AND TRUST SECTION */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative">
        <PageContainer>
          <SectionHeading
            badge="Privacy & Trust"
            title="Built with transparent security fundamentals"
            description="We believe trust is earned through architectural integrity, not hollow marketing badges. Here is how your data is treated."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="rounded-[20px] border border-border bg-surface-card p-6 shadow-soft-sm space-y-3">
              <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                <Building className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-content-main">
                Tenant Isolation
              </h3>
              <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                PostgreSQL Row-Level Security combined with companyId scoping ensures that no company’s data can ever bleed into another workspace.
              </p>
            </Card>

            <Card className="rounded-[20px] border border-border bg-surface-card p-6 shadow-soft-sm space-y-3">
              <div className="h-10 w-10 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-content-main">
                Cryptographic Anonymity
              </h3>
              <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                Anonymous submissions are decoupled at ingestion. We do not store origin IP addresses, browser fingerprints, or user identifiers.
              </p>
            </Card>

            <Card className="rounded-[20px] border border-border bg-surface-card p-6 shadow-soft-sm space-y-3">
              <div className="h-10 w-10 rounded-xl bg-brand-sky/10 text-brand-sky flex items-center justify-center">
                <Globe2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-content-main">
                Role-Based Access
              </h3>
              <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                Granular member roles ensure only authorized teammates can view sensitive workplace sentiment or customer triage queues.
              </p>
            </Card>
          </div>

          <div className="text-center mt-8">
            <NavLink
              to="/security"
              className="text-xs sm:text-sm font-semibold text-brand-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Read our full Security Architecture document</span>
              <ArrowRight className="h-4 w-4" />
            </NavLink>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 9. FINAL CTA */}
      {/* ------------------------------------------------------------------ */}
      <PageContainer>
        <CTASection />
      </PageContainer>
    </div>
  );
};
