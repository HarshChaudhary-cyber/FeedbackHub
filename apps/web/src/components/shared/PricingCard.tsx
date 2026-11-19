import React from 'react';
import { NavLink } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Badge } from '@feedbackhub/ui';

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number | 'Custom';
  yearlyPrice: number | 'Custom';
  features: string[];
  isPopular?: boolean;
  ctaText: string;
  ctaLink: string;
}

interface PricingCardProps {
  plan: PricingPlan;
  isYearly: boolean;
  onSelectPlan?: (planId: string) => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  isYearly,
  onSelectPlan,
}) => {
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const isCustom = price === 'Custom';

  return (
    <Card
      className={`relative flex flex-col justify-between border-2 transition-all p-6 sm:p-8 ${
        plan.isPopular
          ? 'border-brand-primary bg-surface-card shadow-soft-lg scale-[1.02]'
          : 'border-border bg-surface-card hover:border-border/80 shadow-soft-sm'
      }`}
    >
      {/* Popular Badge */}
      {plan.isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <Badge
            variant="default"
            className="bg-brand-primary text-white font-semibold text-xs shadow-soft-sm flex items-center gap-1.5 px-3 py-1"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Most Popular</span>
          </Badge>
        </div>
      )}

      <div>
        <CardHeader className="p-0 mb-6 space-y-2">
          <CardTitle as="h3" className="text-xl font-bold text-content-main">
            {plan.name}
          </CardTitle>
          <CardDescription className="text-xs text-content-secondary min-h-[36px]">
            {plan.tagline}
          </CardDescription>

          <div className="pt-4 flex items-baseline gap-1.5">
            {isCustom ? (
              <span className="text-3xl sm:text-4xl font-extrabold text-content-main">
                Custom
              </span>
            ) : (
              <>
                <span className="text-3xl sm:text-4xl font-extrabold text-content-main tabular-nums">
                  ${price}
                </span>
                <span className="text-xs sm:text-sm text-content-secondary font-medium">
                  / user / month
                </span>
              </>
            )}
          </div>

          <p className="text-[11px] text-content-muted">
            {isCustom
              ? 'Tailored enterprise contract & SLA'
              : isYearly
              ? 'Billed annually (Save 20%)'
              : 'Billed monthly'}
          </p>
        </CardHeader>

        <CardContent className="p-0 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-content-main uppercase tracking-wider mb-4">
            Included features:
          </p>
          <ul className="space-y-3">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-content-main">
                <div className="flex h-4 w-4 rounded-full bg-brand-primary/10 text-brand-primary items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </div>

      <CardFooter className="p-0 mt-8 pt-6">
        <NavLink
          to={plan.ctaLink}
          className="w-full"
          onClick={() => onSelectPlan && onSelectPlan(plan.id)}
        >
          <Button
            variant={plan.isPopular ? 'primary' : 'outline'}
            className="w-full justify-center shadow-soft-sm text-sm"
          >
            {plan.ctaText}
          </Button>
        </NavLink>
      </CardFooter>
    </Card>
  );
};
