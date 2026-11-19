import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@feedbackhub/ui';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSignIn: () => void;
}

const navItems = [
  { name: 'Features', path: '/features' },
  { name: 'Solutions', path: '/solutions' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose,
  onOpenSignIn,
}) => {
  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
      className="fixed inset-0 z-50 flex flex-col bg-surface-main md:hidden"
    >
      {/* Top Bar with Brand & Close */}
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <NavLink
          to="/"
          onClick={onClose}
          className="flex items-center gap-2.5 font-bold text-lg text-content-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-white text-xs font-bold shadow-soft-sm">
            FH
          </div>
          <span>FeedbackHub</span>
        </NavLink>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="rounded-lg p-2 text-content-secondary hover:bg-neutral-mainBackground hover:text-content-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-5 py-6">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                      : 'text-content-secondary hover:bg-neutral-mainBackground hover:text-content-main'
                  }`
                }
              >
                <span>{item.name}</span>
                <ArrowRight className="h-4 w-4 opacity-50" />
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Action Buttons */}
      <div className="border-t border-border p-5 space-y-3 bg-surface-card">
        <Button
          variant="outline"
          className="w-full justify-center rounded-xl"
          onClick={() => {
            onClose();
            onOpenSignIn();
          }}
        >
          Sign In
        </Button>
        <NavLink to="/pricing" onClick={onClose} className="block w-full">
          <Button variant="primary" className="w-full justify-center">
            Get Started
          </Button>
        </NavLink>
      </div>
    </div>
  );
};
