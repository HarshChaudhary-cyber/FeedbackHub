import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Sparkles, ShieldCheck } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@feedbackhub/ui';
import { MobileNavigation } from './MobileNavigation';

const navItems = [
  { name: 'Features', path: '/features' },
  { name: 'Solutions', path: '/solutions' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

export const MarketingHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-surface-main/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <NavLink
          to="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-white text-sm font-bold shadow-soft-sm">
            FH
          </div>
          <span className="text-lg font-bold tracking-tight text-content-main">
            FeedbackHub
          </span>
        </NavLink>

        {/* Desktop Nav Links */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex md:items-center md:gap-7"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-content-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-sm px-1 py-0.5 ${
                  isActive
                    ? 'text-brand-primary font-semibold'
                    : 'text-content-secondary'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex md:items-center md:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSignInModalOpen(true)}
            className="text-sm font-medium text-content-secondary hover:text-content-main"
          >
            Sign In
          </Button>

          <NavLink to="/pricing">
            <Button variant="primary" size="sm" className="shadow-soft-sm">
              View Plans
            </Button>
          </NavLink>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={isMobileMenuOpen}
            className="rounded-lg p-2 text-content-secondary hover:bg-neutral-mainBackground hover:text-content-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenSignIn={() => setIsSignInModalOpen(true)}
      />

      {/* Phase 4 Authentication Roadmap Notice Dialog */}
      <Dialog open={isSignInModalOpen} onOpenChange={setIsSignInModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-xl">
              Authentication Arriving in Phase 4
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-content-secondary pt-2">
              FeedbackHub is currently in active development. Dedicated tenant login,
              Argon2id password hashing, and cookie-based multi-tenant session
              management are scheduled for Phase 4.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 rounded-xl bg-surface-main p-3.5 border border-border text-xs text-content-secondary space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-content-main">
              <ShieldCheck className="h-4 w-4 text-brand-teal" />
              <span>Multi-Tenant Architecture</span>
            </div>
            <p>
              In production, companies access their workspace directly via their branded subdomain
              (e.g., <code className="text-brand-primary">company.feedbackhub.com</code>).
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <NavLink
              to="/contact"
              onClick={() => setIsSignInModalOpen(false)}
              className="w-full sm:w-auto flex-1"
            >
              <Button variant="outline" className="w-full justify-center">
                Preview Contact Form
              </Button>
            </NavLink>
            <DialogClose asChild>
              <Button variant="primary" className="w-full sm:w-auto flex-1 justify-center">
                Got it
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};
