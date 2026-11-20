/** @vitest-environment jsdom */
import '../test-setup';
import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { AccountProfilePage } from '../pages/AccountProfilePage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('FeedbackHub Authentication Frontend Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ authenticated: false, user: null }),
    });
  });

  describe('LoginPage', () => {
    it('renders login form elements and toggles password visibility', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/login']}>
            <AuthProvider>
              <LoginPage />
            </AuthProvider>
          </MemoryRouter>
        );
      });

      expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeTruthy();
      const emailInput = screen.getByLabelText(/Work Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitBtn = screen.getByRole('button', { name: /Sign In/i });

      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(submitBtn).toBeTruthy();

      // Test show/hide password toggle
      expect(passwordInput.getAttribute('type')).toBe('password');
      const toggleBtn = screen.getByRole('button', { name: /Show password/i });
      fireEvent.click(toggleBtn);
      expect(passwordInput.getAttribute('type')).toBe('text');
      fireEvent.click(screen.getByRole('button', { name: /Hide password/i }));
      expect(passwordInput.getAttribute('type')).toBe('password');
    });

    it('displays client validation errors when submitting empty form', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/login']}>
            <AuthProvider>
              <LoginPage />
            </AuthProvider>
          </MemoryRouter>
        );
      });

      const submitBtn = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeTruthy();
      });
    });

    it('submits valid credentials and calls API', async () => {
      mockFetch.mockImplementation(async (url: string) => {
        if (url.includes('/api/v1/auth/login')) {
          return {
            ok: true,
            json: async () => ({
              message: 'Sign in successful.',
              user: {
                id: 'u-123',
                email: 'user@example.com',
                fullName: 'Test User',
                isEmailVerified: true,
                createdAt: new Date().toISOString(),
              },
            }),
          };
        }
        return {
          ok: false,
          json: async () => ({ authenticated: false }),
        };
      });

      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/login']}>
            <AuthProvider>
              <LoginPage />
            </AuthProvider>
          </MemoryRouter>
        );
      });

      fireEvent.change(screen.getByLabelText(/Work Email/i), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^Password$/i), {
        target: { value: 'ValidP@ssw0rd123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/auth/login',
          expect.objectContaining({
            method: 'POST',
            credentials: 'include',
          })
        );
      });
    });
  });

  describe('RegisterPage', () => {
    it('renders registration fields and dynamic password criteria checklist', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/register']}>
            <AuthProvider>
              <RegisterPage />
            </AuthProvider>
          </MemoryRouter>
        );
      });

      expect(screen.getByRole('heading', { name: /Create your account/i })).toBeTruthy();
      const passwordInput = screen.getByLabelText(/^Password$/i);

      // Typing a partial password shows checklist
      fireEvent.change(passwordInput, { target: { value: 'Ab1!' } });

      await waitFor(() => {
        expect(screen.getByText(/Password Requirements:/i)).toBeTruthy();
        expect(screen.getByText(/Min 10 characters/i)).toBeTruthy();
        expect(screen.getByText(/1 uppercase letter/i)).toBeTruthy();
        expect(screen.getByText(/1 special character/i)).toBeTruthy();
      });
    });

    it('rejects mismatched password and confirm password', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/register']}>
            <AuthProvider>
              <RegisterPage />
            </AuthProvider>
          </MemoryRouter>
        );
      });

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Jane Doe' } });
      fireEvent.change(screen.getByLabelText(/Work Email/i), { target: { value: 'jane@example.com' } });
      fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'SecureP@ss123!' } });
      fireEvent.change(screen.getByLabelText(/^Confirm Password$/i), {
        target: { value: 'DifferentP@ss123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeTruthy();
      });
    });

    it('submits registration successfully and shows email verification instructions', async () => {
      mockFetch.mockImplementation(async (url: string) => {
        if (url.includes('/api/v1/auth/register')) {
          return {
            ok: true,
            json: async () => ({
              message: 'Registration successful. Please check your email to verify your account.',
              user: {
                id: 'u-456',
                email: 'jane@example.com',
                fullName: 'Jane Doe',
                isEmailVerified: false,
                createdAt: new Date().toISOString(),
              },
            }),
          };
        }
        return { ok: false, json: async () => ({}) };
      });

      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/register']}>
            <AuthProvider>
              <RegisterPage />
            </AuthProvider>
          </MemoryRouter>
        );
      });

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Jane Doe' } });
      fireEvent.change(screen.getByLabelText(/Work Email/i), { target: { value: 'jane@example.com' } });
      fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'SecureP@ss123!' } });
      fireEvent.change(screen.getByLabelText(/^Confirm Password$/i), { target: { value: 'SecureP@ss123!' } });

      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(screen.getByText(/Verify Your Email/i)).toBeTruthy();
        expect(screen.getByText(/Registration successful/i)).toBeTruthy();
      });
    });
  });

  describe('ForgotPasswordPage', () => {
    it('submits email and displays generic confirmation', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/forgot-password']}>
            <AuthProvider>
              <ForgotPasswordPage />
            </AuthProvider>
          </MemoryRouter>
        );
      });

      expect(screen.getByRole('heading', { name: /Reset your password/i })).toBeTruthy();
      fireEvent.change(screen.getByLabelText(/Registered Work Email/i), {
        target: { value: 'user@example.com' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Send Password Reset Link/i }));

      await waitFor(() => {
        expect(screen.getByText(/Check Your Inbox/i)).toBeTruthy();
        expect(screen.getByText(/a password reset link has been dispatched/i)).toBeTruthy();
      });
    });
  });

  describe('ResetPasswordPage', () => {
    it('shows missing token warning when rendered without token query parameter', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/reset-password']}>
            <AuthProvider>
              <ResetPasswordPage />
            </AuthProvider>
          </MemoryRouter>
        );
      });

      expect(screen.getByText(/Missing or invalid password reset token/i)).toBeTruthy();
    });

    it('renders password reset form when token is provided', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/reset-password?token=valid-test-token']}>
            <AuthProvider>
              <ResetPasswordPage />
            </AuthProvider>
          </MemoryRouter>
        );
      });

      expect(screen.getByLabelText(/^New Password$/i)).toBeTruthy();
      expect(screen.getByLabelText(/^Confirm New Password$/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /Update Password/i })).toBeTruthy();
    });
  });

  describe('VerifyEmailPage', () => {
    it('verifies token automatically on load when token query param is provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Email address verified successfully.' }),
      });

      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/verify-email?token=valid-verification-token']}>
            <AuthProvider>
              <VerifyEmailPage />
            </AuthProvider>
          </MemoryRouter>
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Email Verified!/i)).toBeTruthy();
        expect(screen.getByText(/Your account is fully activated/i)).toBeTruthy();
      });
    });

    it('shows resend option when no token is present', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/verify-email']}>
            <AuthProvider>
              <VerifyEmailPage />
            </AuthProvider>
          </MemoryRouter>
        );
      });

      expect(screen.getByText(/Request a new verification link/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /Send New Verification Link/i })).toBeTruthy();
    });
  });

  describe('ProtectedRoute & AccountProfilePage', () => {
    it('redirects unauthenticated users to /login', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/account']}>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<div>Login Page Redirected</div>} />
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <div>Protected Account Content</div>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AuthProvider>
          </MemoryRouter>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Login Page Redirected')).toBeTruthy();
      });
    });

    it('renders AccountProfilePage when authenticated with tabs and user info', async () => {
      mockFetch.mockImplementation(async (url: string) => {
        if (url.includes('/api/v1/auth/session')) {
          return {
            ok: true,
            json: async () => ({
              authenticated: true,
              user: {
                id: 'usr-authenticated-1',
                email: 'authenticated@feedbackhub.com',
                fullName: 'Sarah Connor',
                isEmailVerified: true,
                isSuperAdmin: false,
                createdAt: new Date('2026-01-15').toISOString(),
              },
            }),
          };
        }
        return { ok: false, json: async () => ({}) };
      });

      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/account']}>
            <AuthProvider>
              <Routes>
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <AccountProfilePage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AuthProvider>
          </MemoryRouter>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Sarah Connor')).toBeTruthy();
        expect(screen.getByText('authenticated@feedbackhub.com')).toBeTruthy();
        expect(screen.getByText(/Verified/i)).toBeTruthy();
        expect(screen.getByText(/January 2026/i)).toBeTruthy();
      });

      // Switch to security tab
      const securityTabBtn = screen.getByRole('tab', { name: /Security & Password/i });
      await act(async () => {
        fireEvent.click(securityTabBtn);
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/^Current Password$/i)).toBeTruthy();
        expect(screen.getByLabelText(/^New Password$/i)).toBeTruthy();
      });
    });
  });
});
