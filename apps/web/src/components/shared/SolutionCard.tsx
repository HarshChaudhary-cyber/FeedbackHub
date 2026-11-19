import React from 'react';
import { NavLink } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Badge } from '@feedbackhub/ui';

interface SolutionCardProps {
  title: string;
  tagline: string;
  description: string;
  bulletPoints: string[];
  icon: React.ReactNode;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
  className?: string;
}

export const SolutionCard: React.FC<SolutionCardProps> = ({
  title,
  tagline,
  description,
  bulletPoints,
  icon,
  badge,
  ctaText = 'Explore Solution',
  ctaLink = '/pricing',
  className = '',
}) => {
  return (
    <Card
      className={`flex flex-col justify-between border-border bg-surface-card p-6 sm:p-8 shadow-soft-sm hover:shadow-soft-md transition-smooth ${className}`}
    >
      <div>
        <CardHeader className="p-0 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
              {icon}
            </div>
            {badge && (
              <Badge variant="secondary" className="font-semibold text-xs bg-brand-primary/10 text-brand-primary">
                {badge}
              </Badge>
            )}
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
              {tagline}
            </span>
            <CardTitle as="h3" className="text-2xl font-bold text-content-main mt-1">
              {title}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-0 space-y-6">
          <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
            {description}
          </p>

          <ul className="space-y-3">
            {bulletPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm text-content-main">
                <CheckCircle2 className="h-4 w-4 text-brand-teal mt-0.5 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </div>

      <CardFooter className="p-0 mt-8 pt-6 border-t border-border">
        <NavLink to={ctaLink} className="w-full">
          <Button variant="outline" className="w-full justify-center group rounded-xl">
            <span>{ctaText}</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </NavLink>
      </CardFooter>
    </Card>
  );
};
