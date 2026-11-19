import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { Badge, Card } from '@feedbackhub/ui';
import { useDocumentTitle } from '../utils/seo';
import { PageContainer } from '../components/shared/PageContainer';
import { ContactForm } from '../components/shared/ContactForm';

export const ContactPage: React.FC = () => {
  useDocumentTitle({
    title: 'Contact FeedbackHub — Inquiries & Preview',
    description:
      'Explore the FeedbackHub project architecture, technical milestones, and our interactive contact form preview.',
  });

  const inquiryTopics = [
    {
      title: 'Sales & Product Walkthroughs (Planned)',
      category: 'Sales & Demo',
      description: 'Planned pathway for scheduling architectural walkthroughs and enterprise evaluations once active.',
      icon: <Sparkles className="h-5 w-5 text-brand-primary" />,
    },
    {
      title: 'Security & Architecture (Planned)',
      category: 'Security & Privacy',
      description: 'Planned pathway to discuss PostgreSQL RLS tenant isolation, privacy design, and technical roadmap.',
      icon: <ShieldCheck className="h-5 w-5 text-brand-teal" />,
    },
    {
      title: 'General Roadmap & Feedback (Planned)',
      category: 'Roadmap Feedback',
      description: 'Planned pathway to explore partnership discussions, developer preview feedback, and release milestones.',
      icon: <MessageSquare className="h-5 w-5 text-brand-secondary" />,
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO HEADER */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative pt-12 sm:pt-20 lg:pt-24 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-brand-primary/10 via-brand-teal/5 to-transparent blur-3xl opacity-70"
        />

        <PageContainer className="relative z-10 text-center">
          <Badge
            variant="secondary"
            className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-brand-primary/10 text-brand-primary border-brand-primary/20 shadow-soft-sm"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Pre-Launch Inquiries &amp; Preview</span>
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-content-main max-w-4xl mx-auto leading-[1.15]">
            Let&apos;s build better feedback{' '}
            <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-teal bg-clip-text text-transparent">
              together.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-content-secondary max-w-2xl mx-auto leading-relaxed">
            Have questions about FeedbackHub or want to explore our technical roadmap? Review our interactive form preview and planned inquiry pathways below.
          </p>
        </PageContainer>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. MAIN CONTACT SECTION: INFO + FORM */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Direct Inquiries & Channel Details */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                  Inquiry Pathways
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-content-main mt-1 tracking-tight">
                  Planned Communication Pathways
                </h2>
                <p className="text-sm text-content-secondary mt-3 leading-relaxed">
                  FeedbackHub is currently in technical preview. Below is an overview of intended communication pathways once backend message routing and inquiry processing are activated.
                </p>
              </div>

              {/* Inquiry Topic Cards */}
              <div className="space-y-4">
                {inquiryTopics.map((topic, idx) => (
                  <Card key={idx} className="p-5 bg-surface-card border-border shadow-soft-sm">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-surface-main border border-border shrink-0">
                        {topic.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-content-main">
                            {topic.title}
                          </h3>
                          <Badge variant="outline" className="text-[10px] text-brand-primary border-brand-primary/30">
                            {topic.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-content-secondary leading-relaxed pt-1">
                          {topic.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Current Inquiries Status */}
              <div className="p-6 rounded-2xl bg-surface-card border border-border shadow-soft-sm space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                  Current Inquiries Status
                </span>
                <ul className="space-y-2.5 text-xs text-content-main">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-teal shrink-0" />
                    <span>Interactive form preview with local client-side validation.</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-teal shrink-0" />
                    <span>Backend message queuing and persistent inbox storage are in active development.</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-teal shrink-0" />
                    <span>Submissions in preview mode validate field constraints without transmitting external data. No waiting list or account is registered.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-7">
              <ContactForm />
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  );
};
