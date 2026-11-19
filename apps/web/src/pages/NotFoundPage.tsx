import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ArrowLeft, Search, Compass, MessageSquare, Tag } from 'lucide-react';
import { EmptyState, Button } from '@feedbackhub/ui';
import { useDocumentTitle } from '../utils/seo';
import { PageContainer } from '../components/shared/PageContainer';

export const NotFoundPage: React.FC = () => {
  useDocumentTitle({
    title: '404 Page Not Found — FeedbackHub',
    description:
      'The page you are looking for does not exist or may have been moved. Return to the FeedbackHub homepage or explore our main features.',
  });

  const quickLinks = [
    { label: 'Homepage', href: '/', icon: <Home className="h-4 w-4" /> },
    { label: 'Platform Features', href: '/features', icon: <Compass className="h-4 w-4" /> },
    { label: 'Solutions', href: '/solutions', icon: <Compass className="h-4 w-4" /> },
    { label: 'Pricing Plans', href: '/pricing', icon: <Tag className="h-4 w-4" /> },
    { label: 'Contact Team', href: '/contact', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  return (
    <div className="py-16 sm:py-24 lg:py-32 flex items-center justify-center">
      <PageContainer className="max-w-2xl text-center">
        <EmptyState
          variant="card"
          size="lg"
          icon={
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-primary/10 text-brand-primary mb-2 shadow-soft-sm">
              <Search className="h-10 w-10 text-brand-primary animate-pulse" />
            </div>
          }
          title={
            <div className="space-y-1">
              <span className="text-4xl sm:text-5xl font-black text-brand-primary tracking-tight">
                404
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-content-main tracking-tight">
                Page Not Found
              </h1>
            </div>
          }
          description="We couldn't find the page you were looking for. It might have been moved, renamed, or is currently under development."
          actions={
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              <NavLink to="/" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full sm:w-auto rounded-full shadow-soft-sm px-6">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Return to Homepage</span>
                </Button>
              </NavLink>

              <NavLink to="/features" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto rounded-full px-6">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span>Explore Features</span>
                </Button>
              </NavLink>
            </div>
          }
        />

        {/* Quick Links Footer */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-xs font-semibold text-content-muted uppercase tracking-wider mb-4">
            Popular Navigation Destinations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {quickLinks.map((link, idx) => (
              <NavLink
                key={idx}
                to={link.href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card border border-border text-xs font-medium text-content-secondary hover:text-brand-primary hover:border-brand-primary/40 transition-colors shadow-soft-sm"
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </PageContainer>
    </div>
  );
};
