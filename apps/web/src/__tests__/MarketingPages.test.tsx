/** @vitest-environment jsdom */
import '../test-setup';
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MarketingLayout } from '../components/layout/MarketingLayout';
import { HomePage } from '../pages/HomePage';
import { FeaturesPage } from '../pages/FeaturesPage';
import { SolutionsPage } from '../pages/SolutionsPage';
import { PricingPage } from '../pages/PricingPage';
import { AboutPage } from '../pages/AboutPage';
import { ContactPage } from '../pages/ContactPage';
import { SecurityPage } from '../pages/SecurityPage';
import { PrivacyPage } from '../pages/PrivacyPage';
import { TermsPage } from '../pages/TermsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Helper to render pages within MemoryRouter
function renderWithRouter(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('FeedbackHub Marketing Website Routes', () => {
  it('renders HomePage with hero headline and navigation', () => {
    renderWithRouter('/');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Turn feedback into/i);
    expect(screen.getByText(/Dual Audience/i)).toBeTruthy();
    const featureLinks = screen.getAllByRole('link', { name: /Features/i });
    expect(featureLinks.length).toBeGreaterThan(0);
    const pricingLinks = screen.getAllByRole('link', { name: /Pricing/i });
    expect(pricingLinks.length).toBeGreaterThan(0);
  });

  it('renders FeaturesPage with feature capabilities and category filters', () => {
    renderWithRouter('/features');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Everything your organization needs/i);
    expect(screen.getByText(/Multi-Channel Feedback Collection/i)).toBeTruthy();
    expect(screen.getByText(/Intuitive Drag-and-Drop Form Builder/i)).toBeTruthy();
  });

  it('renders SolutionsPage with Customer and Employee toggles', () => {
    renderWithRouter('/solutions');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Engineered for customer retention/i);
    expect(screen.getByText(/Customer Experience Track/i)).toBeTruthy();

    // Click Employee toggle
    const employeeBtn = screen.getByRole('button', { name: /Employee Engagement/i });
    fireEvent.click(employeeBtn);
    expect(screen.getByText(/Employee Engagement Track/i)).toBeTruthy();
  });

  it('renders PricingPage with plans and interactive billing toggle', () => {
    renderWithRouter('/pricing');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Predictable plans for teams/i);

    // Initial state: annual billing is active (Save 20%)
    expect(screen.getByText('$64')).toBeTruthy(); // Pro annual
    expect(screen.getByText('$24')).toBeTruthy(); // Starter annual

    // Toggle switch to monthly billing
    const toggleSwitch = screen.getByRole('switch', { name: /Toggle annual billing/i });
    fireEvent.click(toggleSwitch);

    // Monthly pricing should now appear
    expect(screen.getByText('$79')).toBeTruthy(); // Pro monthly
    expect(screen.getByText('$29')).toBeTruthy(); // Starter monthly
  });

  it('renders AboutPage with mission and principles', () => {
    renderWithRouter('/about');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Bridging the gap between/i);
    expect(screen.getByText(/Anonymity by Design/i)).toBeTruthy();
    expect(screen.getByText(/Actionable Clarity/i)).toBeTruthy();
  });

  it('renders ContactPage with interactive form validation', async () => {
    renderWithRouter('/contact');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Let's build better feedback/i);

    const submitBtn = screen.getByRole('button', { name: /Submit Inquiry/i });
    fireEvent.click(submitBtn);

    // Validation errors should be displayed
    await waitFor(() => {
      expect(screen.getByText(/Please enter your full name/i)).toBeTruthy();
      expect(screen.getByText(/Please provide a valid work email/i)).toBeTruthy();
    });

    // Fill in valid data
    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Work Email/i);
    const companyInput = screen.getByLabelText(/Company \/ Organization/i);
    const messageInput = screen.getByLabelText(/Message/i);

    fireEvent.change(nameInput, { target: { value: 'Alex Morgan' } });
    fireEvent.change(emailInput, { target: { value: 'alex@acme.corp' } });
    fireEvent.change(companyInput, { target: { value: 'Acme Corp' } });
    fireEvent.change(messageInput, { target: { value: 'We would love to evaluate FeedbackHub for our 500-person team.' } });

    fireEvent.click(submitBtn);

    // Demonstration success message
    await waitFor(() => {
      expect(screen.getByText(/Message Recorded/i)).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('renders SecurityPage with RLS and compliance status disclaimer', () => {
    renderWithRouter('/security');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Security engineered at the/i);
    const rlsElements = screen.getAllByText(/PostgreSQL Row-Level Security/i);
    expect(rlsElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Transparent Compliance Status & Roadmap/i)).toBeTruthy();
  });

  it('renders PrivacyPage with legal draft notice', () => {
    renderWithRouter('/privacy');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/FeedbackHub Privacy Policy/i);
    expect(screen.getByText(/Legal Notice & Preview Disclaimer/i)).toBeTruthy();
    expect(screen.getByText(/k-Anonymity Standard for Workplace Feedback/i)).toBeTruthy();
  });

  it('renders TermsPage with operating agreement terms', () => {
    renderWithRouter('/terms');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/FeedbackHub Terms of Service/i);
    expect(screen.getByText(/Acceptance of Terms/i)).toBeTruthy();
  });

  it('renders NotFoundPage when navigating to an unknown route', () => {
    renderWithRouter('/some/non-existent/path');
    expect(screen.getByText('404')).toBeTruthy();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Page Not Found/i);
    expect(screen.getByRole('link', { name: /Return to Homepage/i })).toBeTruthy();
  });

  it('opens Sign In Phase 4 notice dialog when clicking header Sign In button', async () => {
    renderWithRouter('/');
    const signInBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(signInBtn);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeTruthy();
      expect(screen.getByText(/Authentication Arriving in Phase 4/i)).toBeTruthy();
    });
  });
});
