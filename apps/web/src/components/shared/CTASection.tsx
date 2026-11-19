import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@feedbackhub/ui';

interface CTAAction {
  label: string;
  href: string;
}

interface CTASectionProps {
  badge?: string;
  title?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  primaryAction?: CTAAction;
  secondaryAction?: CTAAction;
  className?: string;
}

export const CTASection: React.FC<CTASectionProps> = ({
  badge = 'Modern Feedback Architecture',
  title = 'Better feedback starts with listening.',
  description = 'Join forward-thinking teams using FeedbackHub to bring customer satisfaction and employee culture into one clear, actionable platform.',
  primaryCtaText,
  primaryCtaLink,
  secondaryCtaText,
  secondaryCtaLink,
  primaryAction,
  secondaryAction,
  className = '',
}) => {
  const pText = primaryAction?.label || primaryCtaText || 'Get Started';
  const pLink = primaryAction?.href || primaryCtaLink || '/pricing';
  const sText = secondaryAction?.label || secondaryCtaText || 'Contact Us';
  const sLink = secondaryAction?.href || secondaryCtaLink || '/contact';

  return (
    <section className={`py-16 sm:py-24 ${className}`}>
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-b from-surface-card to-surface-main p-8 sm:p-14 lg:p-16 border border-border shadow-soft-lg text-center max-w-5xl mx-auto">
        {/* Subtle decorative glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full bg-brand-primary/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{badge}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-content-main max-w-2xl leading-tight">
            {title}
          </h2>

          <p className="mt-5 text-base sm:text-lg text-content-secondary max-w-xl leading-relaxed">
            {description}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <NavLink to={pLink} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-soft-md group justify-center px-8"
              >
                <span>{pText}</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </NavLink>

            {sText && (
              <NavLink to={sLink} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto justify-center px-8"
                >
                  {sText}
                </Button>
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
