import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@feedbackhub/ui';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  badge,
  className = '',
}) => {
  return (
    <Card
      interactive
      className={`h-full flex flex-col justify-between border-border bg-surface-card hover:shadow-soft-md transition-smooth ${className}`}
    >
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
            {icon}
          </div>
          {badge && (
            <Badge variant="outline" className="text-xs font-medium">
              {badge}
            </Badge>
          )}
        </div>
        <CardTitle as="h3" className="text-lg sm:text-xl font-semibold text-content-main">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-content-secondary leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};
