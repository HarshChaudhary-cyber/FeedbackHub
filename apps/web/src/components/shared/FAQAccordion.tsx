import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@feedbackhub/ui';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const defaultFaqs: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'Can I collect customer and employee feedback in the same workspace?',
    answer:
      'Yes. FeedbackHub is specifically designed with a dual-audience architecture. You can manage customer experience surveys (NPS, CSAT, product feedback) and internal workplace pulse surveys within the same organization while keeping permissions strictly partitioned.',
  },
  {
    id: 'faq-2',
    question: 'How does anonymous feedback work, and can identities be traced?',
    answer:
      'FeedbackHub is designed with a privacy-first feedback model. In our planned architecture, anonymous mode decouples submission metadata from user accounts and strips network identifiers before persistence. Demographic reporting is designed with a k-anonymity threshold (k >= 5) so individual answers cannot be isolated.',
  },
  {
    id: 'faq-3',
    question: 'Can I customize question types and feedback form layouts?',
    answer:
      'Absolutely. FeedbackHub includes a flexible form builder supporting Net Promoter Score (NPS 0-10), Customer Satisfaction (CSAT 1-5), Likert scales, multi-choice selectors, and structured open text fields with customizable headers and completion screens.',
  },
  {
    id: 'faq-4',
    question: 'Can my company use its own branding and custom subdomain?',
    answer:
      'Yes. Every company gets an independent portal running on their dedicated subdomain (e.g. company.feedbackhub.com). You can upload custom company logos, set brand accent colors, and configure tailored survey links for customer and employee portals.',
  },
  {
    id: 'faq-5',
    question: 'Can I upgrade, downgrade, or change plans at any time?',
    answer:
      'Yes. Plan upgrades and workspace tier changes can be adjusted at any time directly through your company settings console once general availability opens. Annual billing offers a 20% discount across paid tiers.',
  },
  {
    id: 'faq-6',
    question: 'How do I submit questions or explore the product roadmap?',
    answer:
      'You can explore our interactive inquiry preview on the public Contact page to review roadmap topics, architecture questions, and planned capabilities.',
  },
];

interface FAQAccordionProps {
  items?: FAQItem[];
  className?: string;
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({
  items = defaultFaqs,
  className = '',
}) => {
  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      <Accordion type="single" collapsible className="w-full space-y-2">
        {items.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="border border-border rounded-xl px-5 py-1 bg-surface-card shadow-soft-sm"
          >
            <AccordionTrigger className="text-left font-semibold text-content-main hover:text-brand-primary text-sm sm:text-base">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-content-secondary text-xs sm:text-sm leading-relaxed pt-2">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
