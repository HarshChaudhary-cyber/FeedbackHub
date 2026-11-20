import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { Button } from '@feedbackhub/ui';
import { MobileNavigation } from './MobileNavigation';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { name: 'Features', path: '/features' },
  { name: 'Solutions', path: '/solutions' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

export const MarketingHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

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
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link to="/account">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 font-medium text-content-main"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-[10px] text-white font-bold">
                    {user.fullName ? user.fullName.slice(0, 1).toUpperCase() : 'U'}
                  </div>
                  <span>Account</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                aria-label="Sign Out"
                className="text-content-secondary hover:text-danger-main"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-content-secondary hover:text-content-main"
                >
                  Sign In
                </Button>
              </Link>

              <Link to="/register">
                <Button variant="primary" size="sm" className="shadow-soft-sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
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
      />
    </header>
  );
};
