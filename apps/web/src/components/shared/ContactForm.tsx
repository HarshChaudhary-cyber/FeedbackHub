import React, { useState } from 'react';
import { Send, RotateCcw, Info } from 'lucide-react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Input,
  Textarea,
  Button,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
} from '@feedbackhub/ui';

interface ContactFormData {
  fullName: string;
  email: string;
  company: string;
  category: string;
  message: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  company?: string;
  category?: string;
  message?: string;
}

const CATEGORIES = [
  'General Inquiry',
  'Sales & Demo',
  'Enterprise Solutions',
  'Security & Privacy',
  'Early Access Program',
];

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    email: '',
    company: '',
    category: CATEGORIES[0],
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name (at least 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid work email address.';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required.';
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      newErrors.message = 'Please provide a message with at least 10 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const delay = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test' ? 20 : 400;
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, delay);
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      email: '',
      company: '',
      category: CATEGORIES[0],
      message: '',
    });
    setErrors({});
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-[20px] border border-border bg-surface-card p-8 sm:p-10 shadow-soft-md text-center max-w-xl mx-auto space-y-6"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          <Info className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className="text-xs text-brand-primary border-brand-primary/30">
            UI Preview Mode
          </Badge>
          <h3 className="text-2xl font-bold text-content-main">
            Validation Succeeded (UI Preview Mode)
          </h3>
          <p className="text-sm text-content-secondary leading-relaxed max-w-md mx-auto">
            Form fields for <strong className="text-content-main">{formData.company}</strong> regarding{' '}
            <strong className="text-brand-primary">{formData.category}</strong> passed client-side validation rules.
          </p>
        </div>

        <Alert variant="info" className="text-left text-xs bg-surface-main">
          <Info className="h-4 w-4" />
          <AlertTitle className="text-xs">Inquiry Not Transmitted</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed">
            FeedbackHub is currently in technical preview. Backend email delivery, persistent inbox storage, and waiting list pipelines are not connected yet. No message has been transmitted, and no account or early-access spot has been reserved.
          </AlertDescription>
        </Alert>

        <div className="pt-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="rounded-xl inline-flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Return to Form Preview</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-[24px] border border-border bg-surface-card p-6 sm:p-10 shadow-soft-md space-y-5 max-w-2xl mx-auto"
    >
      <div className="border-b border-border pb-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl font-bold text-content-main">
            Interactive Inquiries Preview
          </h3>
          <Badge variant="outline" className="text-[10px] text-brand-primary border-brand-primary/30">
            Interactive UI Preview
          </Badge>
        </div>
        <p className="text-xs text-content-secondary">
          Have questions about FeedbackHub, custom company portals, or enterprise security?
          Fill in your details below to test form validation.
        </p>
        <div className="p-3 rounded-xl bg-surface-main border border-border flex items-start gap-2.5 text-xs text-content-secondary">
          <Info className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
          <span>
            <strong>Preview Form:</strong> Validates input constraints locally. Backend email routing and persistent inquiry storage are under development; form submissions are not transmitted. Submitting this form does not send an email or register you for early access.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <FormField name="fullName" error={errors.fullName}>
          <FormItem>
            <FormLabel required>Full Name</FormLabel>
            <FormControl>
              <Input
                placeholder="Jane Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        {/* Work Email */}
        <FormField name="email" error={errors.email}>
          <FormItem>
            <FormLabel required>Work Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="jane@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Company */}
        <FormField name="company" error={errors.company}>
          <FormItem>
            <FormLabel required>Company / Organization</FormLabel>
            <FormControl>
              <Input
                placeholder="Acme Corp"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        {/* Inquiry Category */}
        <FormField name="category">
          <FormItem>
            <FormLabel>Inquiry Category</FormLabel>
            <FormControl>
              <select
                id="contact-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="h-10 w-full rounded-[14px] border border-border bg-surface-card px-3.5 text-xs sm:text-sm text-content-main shadow-soft-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </FormControl>
          </FormItem>
        </FormField>
      </div>

      {/* Message */}
      <FormField name="message" error={errors.message}>
        <FormItem>
          <FormLabel required>Message</FormLabel>
          <FormControl>
            <Textarea
              rows={4}
              placeholder="Tell us about your feedback goals or questions..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </FormControl>
          <FormDescription>
            Include any specific requirements such as employee survey frequency or custom subdomain branding.
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[11px] text-content-muted">
          Interactive preview &mdash; inputs are validated in-browser in accordance with our{' '}
          <a href="/privacy" className="text-brand-primary underline hover:text-brand-primary/80">
            Privacy Policy draft
          </a>
          .
        </p>

        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          className="w-full sm:w-auto px-8 justify-center shadow-soft-sm"
        >
          <Send className="h-4 w-4 mr-2" />
          <span>Submit Inquiry (Preview)</span>
        </Button>
      </div>
    </form>
  );
};
