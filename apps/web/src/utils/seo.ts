import { useEffect } from 'react';

export interface SEOProps {
  title: string;
  description?: string;
}

const DEFAULT_TITLE = 'FeedbackHub — Multi-tenant B2B Feedback Management Platform';
const DEFAULT_DESCRIPTION =
  'Collect customer and employee feedback, understand what matters, and turn valuable insights into better decisions.';

export function useDocumentTitle({ title, description = DEFAULT_DESCRIPTION }: SEOProps) {
  useEffect(() => {
    document.title = title ? `${title} | FeedbackHub` : DEFAULT_TITLE;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }
  }, [title, description]);
}
