import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield } from 'lucide-react';

export const MarketingFooter: React.FC = () => {
  return (
    <footer className="border-t border-border bg-surface-card text-content-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <NavLink
              to="/"
              className="inline-flex items-center gap-2.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-white text-xs font-bold shadow-soft-sm">
                FH
              </div>
              <span className="text-lg font-bold text-content-main">
                FeedbackHub
              </span>
            </NavLink>

            <p className="max-w-sm text-sm text-content-secondary leading-relaxed">
              Multi-tenant B2B SaaS feedback management platform for customer
              and employee insights. Collect, triage, analyze, and act on feedback
              with confidence.
            </p>

            <div className="inline-flex items-center gap-2 text-xs text-content-muted bg-surface-main px-3 py-1.5 rounded-full border border-border">
              <Shield className="h-3.5 w-3.5 text-brand-teal" />
              <span>Cryptographic anonymity &amp; tenant isolation</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-content-main">
              Product
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <NavLink
                  to="/features"
                  className="hover:text-content-main transition-colors"
                >
                  Features
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/solutions"
                  className="hover:text-content-main transition-colors"
                >
                  Solutions
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/pricing"
                  className="hover:text-content-main transition-colors"
                >
                  Pricing
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/security"
                  className="hover:text-content-main transition-colors"
                >
                  Security Architecture
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-content-main">
              Company
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <NavLink
                  to="/about"
                  className="hover:text-content-main transition-colors"
                >
                  About Us
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/contact"
                  className="hover:text-content-main transition-colors"
                >
                  Contact &amp; Early Access
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-content-main">
              Legal &amp; Trust
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <NavLink
                  to="/privacy"
                  className="hover:text-content-main transition-colors"
                >
                  Privacy Policy (Draft)
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/terms"
                  className="hover:text-content-main transition-colors"
                >
                  Terms of Service (Draft)
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/security"
                  className="hover:text-content-main transition-colors"
                >
                  Data Protection
                </NavLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-content-muted">
          <p>© 2026 FeedbackHub. All rights reserved.</p>
          <p className="text-center sm:text-right">
            Independent multi-tenant SaaS feedback intelligence platform.
          </p>
        </div>
      </div>
    </footer>
  );
};
