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
  it('renders HomePage with hero headline, preview dashboard, and status badges', () => {
    renderWithRouter('/');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Turn feedback into/i);
    expect(screen.getByText(/Dual Audience/i)).toBeTruthy();
    expect(screen.getByText(/Dedicated Subdomains \(Planned\)/i)).toBeTruthy();
    const featureLinks = screen.getAllByRole('link', { name: /Features/i });
    expect(featureLinks.length).toBeGreaterThan(0);
    const pricingLinks = screen.getAllByRole('link', { name: /Pricing/i });
    expect(pricingLinks.length).toBeGreaterThan(0);

    // Verify absence of fake testimonials and presence of illustrative scenario label
    expect(screen.queryByText(/Our customer success manager resolved our API provisioning question/i)).toBeNull();
    expect(screen.queryByText(/CSAT 5★ Verified/i)).toBeNull();
    expect(screen.getByText(/Illustrative Customer Scenario/i)).toBeTruthy();
    expect(screen.getByText(/Illustrative Employee Scenario/i)).toBeTruthy();

    // Verify ProductDashboardPreview clearly labels sample metrics and illustrative feed
    expect(screen.getByText(/Interactive Preview • Illustrative Sample Data/i)).toBeTruthy();
    expect(screen.getByText(/Simulated Overview Metrics \(Sample Data\)/i)).toBeTruthy();
    expect(screen.getByText(/Illustrative Response Feed \(Sample Data\)/i)).toBeTruthy();
    expect(screen.queryByText(/^Live Feedback Queue$/i)).toBeNull();
    expect(screen.getByText(/All metrics, charts, and feedback entries shown above are illustrative sample data/i)).toBeTruthy();

    // Verify FeatureCard badges communicate status
    expect(screen.getByText('Planned Builder')).toBeTruthy();
    expect(screen.getAllByText('Planned Track').length).toBeGreaterThan(0);
    expect(screen.getByText('Planned Analytics')).toBeTruthy();

    // Verify Value Proposition cards use planned, non-operational wording
    expect(screen.queryByText(/All signals converge in one searchable inbox/i)).toBeNull();
    expect(screen.queryByText(/Real-time sentiment indicators and trend analysis reveal/i)).toBeNull();
    expect(screen.queryByText(/Route inquiries to the right team members/i)).toBeNull();
    expect(screen.queryByText(/Tag customer requests by product area and group/i)).toBeNull();
    expect(screen.getByText(/Designed to bring customer and employee feedback into a single searchable workspace/i)).toBeTruthy();

    // Verify Platform Capabilities section does NOT claim production-grade tooling
    expect(screen.queryByText(/production-grade tooling/i)).toBeNull();
    expect(screen.getByText(/explore the planned feature capabilities and interactive previews in active development/i)).toBeTruthy();
  });

  it('renders FeaturesPage with feature capabilities, subtle status labels, and plan CTAs', () => {
    renderWithRouter('/features');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Everything your organization needs/i);
    expect(screen.getByText(/Multi-Channel Feedback Collection/i)).toBeTruthy();
    expect(screen.getByText(/Intuitive Drag-and-Drop Form Builder/i)).toBeTruthy();
    expect(screen.getByText('Response Inbox & Triage Console')).toBeTruthy();
    expect(screen.queryByText(/Enterprise-grade stability verified/i)).toBeNull();
    expect(screen.getAllByText(/Component reliability and interaction behaviors verified with automated regression and accessibility suites during development\./i).length).toBeGreaterThan(0);

    // Verify status labels exist and are rendered consistently
    expect(screen.getAllByText('In Development').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Planned').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Architecture Preview').length).toBeGreaterThan(0);

    // Verify CTAs navigate to plan preview without claiming features are already functional
    expect(screen.queryByText(/Start with this Feature/i)).toBeNull();
    expect(screen.getAllByRole('button', { name: /View Plan Alignment/i }).length).toBeGreaterThan(0);
  });

  it('renders SolutionsPage with Customer and Employee toggles and planned solution models', () => {
    renderWithRouter('/solutions');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Engineered for customer retention/i);
    expect(screen.getByText(/Customer Experience Track/i)).toBeTruthy();
    expect(screen.queryByText(/See why modern companies are replacing disconnected survey spreadsheets/i)).toBeNull();
    expect(screen.getByText(/Explore the challenges of disconnected survey spreadsheets and fragmented SaaS accounts/i)).toBeTruthy();

    // Verify customer solutions framed as designed/planned capabilities
    expect(screen.getByText(/Designed for continuous listening throughout the customer journey/i)).toBeTruthy();
    expect(screen.getByText(/Planned alert triggers for NPS Detractor scores/i)).toBeTruthy();

    // Click Employee toggle
    const employeeBtn = screen.getByRole('button', { name: /Employee Engagement/i });
    fireEvent.click(employeeBtn);
    expect(screen.getByText(/Employee Engagement Track/i)).toBeTruthy();
    expect(screen.getByText(/Planned lightweight pulse checks designed to measure morale/i)).toBeTruthy();

    // Verify comparison section frames benefits as planned model
    expect(screen.getByText(/One planned subscription model supporting both customer and employee listening tracks/i)).toBeTruthy();
    expect(screen.getByText(/Planned centralized triage inbox connecting customer requests to product priorities/i)).toBeTruthy();
  });

  it('renders PricingPage with illustrative preview badge, billing toggle, and plan modal', () => {
    renderWithRouter('/pricing');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Predictable plans for teams/i);
    expect(screen.getAllByText(/Illustrative Preview Pricing/i).length).toBeGreaterThan(0);

    // Verify SLA, response timeline promises and cryptographic claims were removed
    expect(screen.queryByText(/99\.9% uptime SLA/i)).toBeNull();
    expect(screen.queryByText(/< 24h target/i)).toBeNull();
    expect(screen.queryByText(/Cryptographic anonymous mode/i)).toBeNull();
    expect(screen.queryByText(/our anonymous feedback guarantees/i)).toBeNull();

    // Verify PostgreSQL RLS does NOT render operational checkmarks and renders as Planned
    const rlsRow = screen.getByText(/PostgreSQL RLS data isolation/i).closest('tr');
    expect(rlsRow?.querySelectorAll('svg.text-brand-teal').length).toBe(0);
    expect(screen.getAllByText('Planned').length).toBeGreaterThan(0);

    // Initial state: annual billing is active (Save 20%)
    expect(screen.getByText('$64')).toBeTruthy(); // Pro annual
    expect(screen.getByText('$24')).toBeTruthy(); // Starter annual

    // Toggle switch to monthly billing
    const toggleSwitch = screen.getByRole('switch', { name: /Toggle annual billing/i });
    fireEvent.click(toggleSwitch);

    // Monthly pricing should now appear
    expect(screen.getByText('$79')).toBeTruthy(); // Pro monthly
    expect(screen.getByText('$29')).toBeTruthy(); // Starter monthly

    // Plan selection modal should open and state subscriptions are not active
    const selectStarterBtn = screen.getByRole('button', { name: /Preview Starter Tier/i });
    fireEvent.click(selectStarterBtn);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/Commercial subscriptions are not currently active/i)).toBeTruthy();
    expect(screen.queryByText(/reserve your organization's domain/i)).toBeNull();
  });

  it('renders AboutPage with mission and principles', () => {
    renderWithRouter('/about');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Bridging the gap between/i);
    expect(screen.getByText(/Anonymity by Design/i)).toBeTruthy();
    expect(screen.getByText(/Actionable Clarity/i)).toBeTruthy();
  });

  it('renders ContactPage without invented emails and with working form validation', async () => {
    renderWithRouter('/contact');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Let's build better feedback/i);

    // Ensure invented emails are NOT rendered
    expect(screen.queryByText(/sales@feedbackhub\.com/i)).toBeNull();
    expect(screen.queryByText(/security@feedbackhub\.com/i)).toBeNull();
    expect(screen.queryByText(/hello@feedbackhub\.com/i)).toBeNull();

    // Verify response time promise and routing/privacy guarantees were removed
    expect(screen.queryByText(/24 business hours/i)).toBeNull();
    expect(screen.queryByText(/routed directly to our product and engineering leadership/i)).toBeNull();
    expect(screen.queryByText(/never shared or sold/i)).toBeNull();

    // Verify upfront preview transparency is visible before submission
    expect(screen.getByText(/Interactive Inquiries Preview/i)).toBeTruthy();
    expect(screen.getAllByText(/Preview Form:/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/No waiting list or account is registered/i)).toBeTruthy();

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

    // UI Preview validated state (no false transmission or fake message recorded)
    await waitFor(() => {
      expect(screen.getByText(/Validation Succeeded \(UI Preview Mode\)/i)).toBeTruthy();
      expect(screen.getByText(/Inquiry Not Transmitted/i)).toBeTruthy();
      expect(screen.queryByText(/Message Recorded/i)).toBeNull();
    }, { timeout: 3000 });
  });

  it('renders SecurityPage with accurate controls distinction and no fake email', () => {
    renderWithRouter('/security');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Security as a core/i);

    // Differentiates the 4 categories
    expect(screen.getAllByText(/Planned Architecture/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tested & Verified/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Present in Current Code/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Design Principle/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Implemented in current code/i)).toBeTruthy();
    expect(screen.getByText(/Tested and verified/i)).toBeTruthy();

    // Verify test suite counts are NOT classified as a security control
    expect(screen.queryByText(/Over 390 automated unit and integration tests/i)).toBeNull();

    // Verify fake email was removed
    expect(screen.queryByText(/security@feedbackhub\.com/i)).toBeNull();
  });

  it('renders PrivacyPage with draft disclaimer and no fake email', () => {
    renderWithRouter('/privacy');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Privacy Policy \(Draft Notice\)/i);
    expect(screen.getByText(/Development Preview Draft — Not an Active Legal Policy/i)).toBeTruthy();
    expect(screen.queryByText(/privacy@feedbackhub\.com/i)).toBeNull();

    // Verify contact form preview distinction and absence of central management claim
    expect(screen.queryByText(/managed centrally through our contact form/i)).toBeNull();
    expect(screen.getByText(/illustrative UI preview that does not transmit, store, or deliver messages/i)).toBeTruthy();

    // Verify absolute future promises are reframed as intended principles
    expect(screen.queryByText(/^We will never sell, rent, or monetize customer or employee feedback data/i)).toBeNull();
    expect(screen.getByText(/Intended Privacy Principle:/i)).toBeTruthy();
  });

  it('renders TermsPage with draft notice, without 99.9% SLA promise or fake email', () => {
    renderWithRouter('/terms');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toMatch(/Terms of Service \(Draft\)/i);
    expect(screen.getByText(/Preview Notice — Draft Operating Terms/i)).toBeTruthy();

    // Verify SLA guarantee and fake email were removed
    expect(screen.queryByText(/99\.9% monthly availability service level agreement/i)).toBeNull();
    expect(screen.queryByText(/legal@feedbackhub\.com/i)).toBeNull();
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

  it('verifies absence of unsupported operational and security claims across marketing pages', () => {
    // Check HomePage
    const home = renderWithRouter('/');
    expect(screen.queryByText(/cryptographically decoupled/i)).toBeNull();
    expect(screen.queryByText(/architecture guarantees true/i)).toBeNull();
    expect(screen.queryByText(/Zero Fingerprinting/i)).toBeNull();
    expect(screen.queryByText(/Our customer success manager resolved our API provisioning question/i)).toBeNull();
    expect(screen.queryByText(/Triage time dropped by 50%/i)).toBeNull();
    expect(screen.queryByText(/^Live Feedback Queue$/i)).toBeNull();
    expect(screen.queryByText(/production-grade tooling/i)).toBeNull();
    expect(screen.queryByText(/All signals converge in one searchable inbox/i)).toBeNull();
    expect(screen.queryByText(/Real-time sentiment indicators and trend analysis/i)).toBeNull();
    home.unmount();

    // Check FeaturesPage
    const features = renderWithRouter('/features');
    expect(screen.queryByText(/True Anonymous/i)).toBeNull();
    expect(screen.queryByText(/Launch your first customer or employee feedback survey in under five minutes/i)).toBeNull();
    expect(screen.queryByText(/Enterprise-grade stability verified/i)).toBeNull();
    expect(screen.queryByText(/Start with this Feature/i)).toBeNull();
    expect(screen.queryByText(/Live incoming response feed/i)).toBeNull();
    features.unmount();

    // Check SolutionsPage
    const solutions = renderWithRouter('/solutions');
    expect(screen.queryByText(/\+28% higher response completion rate/i)).toBeNull();
    expect(screen.queryByText(/3x faster escalation/i)).toBeNull();
    expect(screen.queryByText(/82% typical participation rates/i)).toBeNull();
    expect(screen.queryByText(/replacing disconnected survey spreadsheets/i)).toBeNull();
    solutions.unmount();

    // Check PricingPage
    const pricing = renderWithRouter('/pricing');
    expect(screen.queryByText(/Target 99\.9% uptime SLA/i)).toBeNull();
    expect(screen.queryByText(/< 24h target/i)).toBeNull();
    expect(screen.queryByText(/Cryptographic anonymous mode/i)).toBeNull();
    expect(screen.queryByText(/reserve your organization's domain/i)).toBeNull();
    pricing.unmount();

    // Check PrivacyPage
    const privacy = renderWithRouter('/privacy');
    expect(screen.queryByText(/managed centrally through our contact form/i)).toBeNull();
    privacy.unmount();

    // Check ContactPage
    const contact = renderWithRouter('/contact');
    expect(screen.queryByText(/Response within 24 business hours/i)).toBeNull();
    expect(screen.queryByText(/routed directly to our product and engineering leadership/i)).toBeNull();
    expect(screen.queryByText(/never shared or sold/i)).toBeNull();
    contact.unmount();
  });
});
