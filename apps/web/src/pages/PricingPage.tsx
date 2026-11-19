import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Check,
  Minus,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@feedbackhub/ui';
import { useDocumentTitle } from '../utils/seo';
import { PageContainer } from '../components/shared/PageContainer';
import { SectionHeading } from '../components/shared/SectionHeading';
import { PricingCard, PricingPlan } from '../components/shared/PricingCard';
import { FAQAccordion } from '../components/shared/FAQAccordion';
import { CTASection } from '../components/shared/CTASection';

export const PricingPage: React.FC = () => {
  useDocumentTitle({
    title: 'Illustrative Pricing & Tier Preview — FeedbackHub',
    description:
      'Explore planned pricing tiers and feature allocations for FeedbackHub. Transparent preview models for Free, Starter, Professional, and Enterprise plans.',
  });

  const [isYearly, setIsYearly] = useState(true);
  const [selectedPlanModal, setSelectedPlanModal] = useState<PricingPlan | null>(null);

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      tagline: 'Ideal for individuals and small test projects exploring feedback collection.',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        '50 responses / month (target)',
        '1 active survey form',
        '1 team administrator',
        'Direct shareable web link',
        'Standard NPS & CSAT question templates',
        'Community discussion support',
      ],
      isPopular: false,
      ctaText: 'Preview Free Tier',
      ctaLink: '#',
    },
    {
      id: 'starter',
      name: 'Starter',
      tagline: 'Designed for early-stage startups and small teams looking for actionable feedback.',
      monthlyPrice: 29,
      yearlyPrice: 24,
      features: [
        '500 responses / month (target)',
        '5 active survey forms',
        '3 team seats (planned RBAC)',
        'Custom company branding (planned)',
        'Embeddable web widget & QR codes (planned)',
        'Raw CSV data exports (planned)',
        'Standard email support (planned)',
      ],
      isPopular: false,
      ctaText: 'Preview Starter Tier',
      ctaLink: '#',
    },
    {
      id: 'professional',
      name: 'Professional',
      tagline: 'Planned for growing companies running dual customer and employee listening programs.',
      monthlyPrice: 79,
      yearlyPrice: 64,
      features: [
        '5,000 responses / month (target)',
        'Unlimited active survey forms',
        '10 team seats with granular roles (planned)',
        'Dual Customer & Employee tracks',
        'Planned anonymous feedback mode (k-anonymity target)',
        'Real-time triage inbox & notes (planned)',
        'Automated sentiment trends (planned)',
        'Priority email support (planned)',
      ],
      isPopular: true,
      ctaText: 'Preview Professional Tier',
      ctaLink: '#',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      tagline: 'For established organizations needing custom security, volume scaling, and technical onboarding.',
      monthlyPrice: 'Custom',
      yearlyPrice: 'Custom',
      features: [
        'Custom response volume & scaling',
        'Unlimited survey forms & team seats (target)',
        'Dedicated tenant subdomain (planned)',
        'SAML 2.0 / SSO integration (planned Phase 4)',
        'Administrative audit logging (planned)',
        'Custom data retention policies (planned)',
        'Technical onboarding consultation (planned)',
        'Enterprise availability and service terms defined prior to launch',
      ],
      isPopular: false,
      ctaText: 'Inquire for Enterprise',
      ctaLink: '#',
    },
  ];

  const comparisonCategories = [
    {
      category: 'Usage & Limits (Target Allocations)',
      features: [
        { name: 'Monthly responses (target)', free: '50', starter: '500', pro: '5,000', enterprise: 'Unlimited' },
        { name: 'Active survey forms', free: '1', starter: '5', pro: 'Unlimited', enterprise: 'Unlimited' },
        { name: 'Team member seats (target)', free: '1', starter: '3', pro: '10', enterprise: 'Unlimited' },
        { name: 'Dedicated tenant subdomain (Planned)', free: false, starter: false, pro: false, enterprise: 'Planned' },
      ],
    },
    {
      category: 'Distribution & Channels',
      features: [
        { name: 'Direct shareable links', free: true, starter: true, pro: true, enterprise: true },
        { name: 'Dynamic QR codes (Planned)', free: false, starter: 'Planned', pro: 'Planned', enterprise: 'Planned' },
        { name: 'Embeddable web widget (Planned)', free: false, starter: 'Planned', pro: 'Planned', enterprise: 'Planned' },
        { name: 'Automated email distribution (Planned)', free: false, starter: false, pro: 'Planned', enterprise: 'Planned' },
      ],
    },
    {
      category: 'Form Builder & Logic',
      features: [
        { name: 'Standard NPS & CSAT metrics', free: true, starter: true, pro: true, enterprise: true },
        { name: 'Custom company branding & logo (Planned)', free: false, starter: 'Planned', pro: 'Planned', enterprise: 'Planned' },
        { name: 'Conditional question branching (Planned)', free: false, starter: false, pro: 'Planned', enterprise: 'Planned' },
        { name: 'Likert agreement matrices (Planned)', free: false, starter: 'Planned', pro: 'Planned', enterprise: 'Planned' },
      ],
    },
    {
      category: 'Triage & Analytics (Roadmap Targets)',
      features: [
        { name: 'Real-time response inbox (Planned)', free: false, starter: 'Planned', pro: 'Planned', enterprise: 'Planned' },
        { name: 'Internal team notes & tagging (Planned)', free: false, starter: false, pro: 'Planned', enterprise: 'Planned' },
        { name: 'Automated sentiment trends (Planned)', free: false, starter: false, pro: 'Planned', enterprise: 'Planned' },
        { name: 'CSV data export (Planned)', free: false, starter: 'Planned', pro: 'Planned', enterprise: 'Planned' },
        { name: 'Executive PDF summaries (Planned)', free: false, starter: false, pro: 'Planned', enterprise: 'Planned' },
      ],
    },
    {
      category: 'Security & Governance (Roadmap Targets)',
      features: [
        { name: 'Planned anonymous feedback mode (k-anonymity target)', free: false, starter: false, pro: 'Planned', enterprise: 'Planned' },
        { name: 'Role-Based Access Control (RBAC) (Planned Phase 4)', free: false, starter: 'Planned', pro: 'Planned', enterprise: 'Planned' },
        { name: 'PostgreSQL RLS data isolation (Planned Architecture)', free: 'Planned', starter: 'Planned', pro: 'Planned', enterprise: 'Planned' },
        { name: 'Audit activity logs (Planned)', free: false, starter: false, pro: false, enterprise: 'Planned' },
        { name: 'SAML / SSO single sign-on (Planned Phase 4)', free: false, starter: false, pro: false, enterprise: 'Planned' },
      ],
    },
  ];

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlanModal(plan);
  };

  return (
    <div className="space-y-20 sm:space-y-28 lg:space-y-36 pb-12">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO HEADER & BILLING TOGGLE */}
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
            <span>Illustrative Preview Pricing</span>
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-content-main max-w-4xl mx-auto leading-[1.15]">
            Predictable plans for teams that{' '}
            <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-sky bg-clip-text text-transparent">
              care about progress.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-content-secondary max-w-2xl mx-auto leading-relaxed">
            Explore our planned pricing tiers and feature allocations. FeedbackHub is currently in technical
            development; pricing figures and response limits are illustrative design targets.
          </p>

          {/* Interactive Billing Frequency Toggle */}
          <div className="mt-10 flex items-center justify-center gap-3">
            <span
              className={`text-xs sm:text-sm font-semibold transition-colors ${
                !isYearly ? 'text-content-main' : 'text-content-secondary'
              }`}
            >
              Monthly Billing
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={isYearly}
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${
                isYearly ? 'bg-brand-primary' : 'bg-slate-300'
              }`}
            >
              <span className="sr-only">Toggle annual billing</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isYearly ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>

            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs sm:text-sm font-semibold transition-colors ${
                  isYearly ? 'text-content-main' : 'text-content-secondary'
                }`}
              >
                Annual Billing
              </span>
              <Badge
                variant="default"
                className="bg-brand-teal text-slate-900 font-bold text-[11px] px-2 py-0.5 shadow-soft-sm"
              >
                Save 20%
              </Badge>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. PRICING CARDS GRID */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <PageContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 items-stretch">
            {plans.map((plan) => (
              <div key={plan.id} className="flex">
                <PricingCard
                  plan={plan}
                  isYearly={isYearly}
                  onSelectPlan={() => handleSelectPlan(plan)}
                />
              </div>
            ))}
          </div>

          {/* Preview Notice Banner */}
          <div className="mt-12 p-4 rounded-2xl bg-surface-card border border-border shadow-soft-sm flex items-start gap-3 max-w-3xl mx-auto">
            <Info className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-content-secondary leading-relaxed">
              <span className="font-semibold text-content-main">Illustrative Preview Pricing:</span>{' '}
              The pricing figures, limits, and feature lists displayed above are illustrative design targets for general commercial release. FeedbackHub is currently in technical development; no payments or subscriptions are active, and no payment methods will be charged during preview.
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. DETAILED FEATURE COMPARISON TABLE */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-surface-card/40 py-16 sm:py-24 border-y border-border">
        <PageContainer>
          <SectionHeading
            badge="Roadmap Matrix"
            title="Compare all planned tier capabilities"
            description="A detailed side-by-side comparison of planned features, target limits, and roadmap milestones across every tier."
          />

          {/* Table Legend */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-content-secondary">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-teal stroke-[3]" />
              <span>Current Preview / Demo Capability</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                Planned
              </span>
              <span>Roadmap Capability (In Development)</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-content-muted" />
              <span>Not Included in Tier</span>
            </div>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-4 px-4 text-sm font-bold text-content-main w-2/5">
                    Plan Capability
                  </th>
                  <th className="py-4 px-4 text-xs sm:text-sm font-bold text-center text-content-main w-3/20">
                    Free
                  </th>
                  <th className="py-4 px-4 text-xs sm:text-sm font-bold text-center text-content-main w-3/20">
                    Starter
                  </th>
                  <th className="py-4 px-4 text-xs sm:text-sm font-bold text-center text-brand-primary w-3/20 bg-brand-primary/5 rounded-t-xl">
                    Professional
                  </th>
                  <th className="py-4 px-4 text-xs sm:text-sm font-bold text-center text-content-main w-3/20">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonCategories.map((group, groupIdx) => (
                  <React.Fragment key={groupIdx}>
                    <tr className="border-b border-border/80 bg-surface-main">
                      <td
                        colSpan={5}
                        className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-brand-primary"
                      >
                        {group.category}
                      </td>
                    </tr>
                    {group.features.map((feat, featIdx) => (
                      <tr
                        key={featIdx}
                        className="border-b border-border/60 hover:bg-surface-card/60 transition-colors"
                      >
                        <td className="py-3.5 px-4 text-xs sm:text-sm text-content-main font-medium">
                          {feat.name}
                        </td>
                        <td className="py-3.5 px-4 text-xs sm:text-sm text-center text-content-secondary">
                          {renderCellValue(feat.free)}
                        </td>
                        <td className="py-3.5 px-4 text-xs sm:text-sm text-center text-content-secondary">
                          {renderCellValue(feat.starter)}
                        </td>
                        <td className="py-3.5 px-4 text-xs sm:text-sm text-center text-content-main font-semibold bg-brand-primary/5">
                          {renderCellValue(feat.pro)}
                        </td>
                        <td className="py-3.5 px-4 text-xs sm:text-sm text-center text-content-secondary">
                          {renderCellValue(feat.enterprise)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <PageContainer>
          <SectionHeading
            badge="Common Questions"
            title="Everything you need to know about pricing"
            description="Have questions about billing cycles, user seats, or planned anonymous feedback? Find quick answers below."
          />

          <div className="mt-12">
            <FAQAccordion />
          </div>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. CALL TO ACTION */}
      {/* ------------------------------------------------------------------ */}
      <CTASection
        badge="Product Architecture Preview"
        title="Explore the FeedbackHub roadmap"
        description="Review our illustrative pricing models and interactive UI components in technical development."
        primaryAction={{
          label: 'Preview Contact Form',
          href: '/contact',
        }}
        secondaryAction={{
          label: 'Explore Features',
          href: '/features',
        }}
      />

      {/* ------------------------------------------------------------------ */}
      {/* PLAN SELECTION PREVIEW MODAL */}
      {/* ------------------------------------------------------------------ */}
      <Dialog
        open={Boolean(selectedPlanModal)}
        onOpenChange={(open) => !open && setSelectedPlanModal(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-primary" />
              <span>Preview {selectedPlanModal?.name} Tier Details</span>
            </DialogTitle>
            <DialogDescription>
              FeedbackHub is currently in technical preview. Commercial subscriptions are not currently active.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-4 rounded-xl bg-surface-main border border-border space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-content-secondary">Selected Tier:</span>
                <span className="font-bold text-content-main">{selectedPlanModal?.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-content-secondary">Billing Schedule:</span>
                <span className="font-semibold text-brand-primary">
                  {isYearly ? 'Annual Billing (20% preview discount)' : 'Monthly Billing'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-content-secondary">Illustrative Price:</span>
                <span className="font-bold text-content-main">
                  {selectedPlanModal?.monthlyPrice === 'Custom'
                    ? 'Custom Quote'
                    : `$${isYearly ? selectedPlanModal?.yearlyPrice : selectedPlanModal?.monthlyPrice} / user / month`}
                </span>
              </div>
            </div>

            <p className="text-xs text-content-secondary leading-relaxed">
              No payment information will be collected during this preview. To explore planned enterprise capabilities or review architectural milestones, test our interactive contact preview form.
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedPlanModal(null)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <NavLink
              to={`/contact?plan=${selectedPlanModal?.id}`}
              onClick={() => setSelectedPlanModal(null)}
              className="w-full sm:w-auto"
            >
              <Button variant="primary" className="w-full sm:w-auto">
                Preview Contact Form
              </Button>
            </NavLink>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function renderCellValue(val: string | boolean) {
  if (typeof val === 'boolean') {
    return val ? (
      <Check className="h-4 w-4 text-brand-teal mx-auto stroke-[3]" />
    ) : (
      <Minus className="h-4 w-4 text-content-muted mx-auto" />
    );
  }
  if (val === 'Planned') {
    return (
      <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary border border-brand-primary/20 mx-auto">
        Planned
      </span>
    );
  }
  return <span>{val}</span>;
}
