import React from 'react';
import { Badge } from '@feedbackhub/ui';

interface SectionHeadingProps {
  badge?: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  badge,
  title,
  description,
  align = 'center',
  className = '',
}) => {
  const alignment =
    align === 'center'
      ? 'text-center mx-auto items-center'
      : 'text-left items-start';

  return (
    <div className={`flex flex-col max-w-3xl mb-12 sm:mb-16 ${alignment} ${className}`}>
      {badge && (
        <Badge
          variant="secondary"
          className="mb-3.5 bg-brand-primary/10 text-brand-primary border-brand-primary/20 font-medium px-3 py-1"
        >
          {badge}
        </Badge>
      )}
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-content-main leading-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base sm:text-lg text-content-secondary leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
