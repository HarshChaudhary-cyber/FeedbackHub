import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { SessionUser } from '@feedbackhub/types';
import type {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from '@feedbackhub/validation';

export interface LoginResult {
  success: boolean;
  emailVerificationRequired?: boolean;
  email?: string;
  error?: string;
}

export interface AuthContextType {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<LoginResult>;
  register: (data: RegisterInput) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<{ success: boolean; error?: string }>;
  changePassword: (data: ChangePasswordInput) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/auth/session', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (data: LoginInput): Promise<LoginResult> => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403 || body.emailVerificationRequired) {
          return {
            success: false,
            emailVerificationRequired: true,
            email: body.email || data.email,
            error: body.message || 'Please verify your email address before signing in.',
          };
        }
        return {
          success: false,
          error: body.message || 'Invalid email or password. Please try again.',
        };
      }

      setUser(body.user);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error occurred. Please try again.';
      return {
        success: false,
        error: message,
      };
    }
  };

  const register = async (
    data: RegisterInput
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          error: body.message || 'Registration failed. Please try again.',
        };
      }

      return {
        success: true,
        message: body.message || 'Registration successful. Please verify your email.',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error occurred. Please try again.';
      return {
        success: false,
        error: message,
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (
    data: UpdateProfileInput
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/v1/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          error: body.message || 'Failed to update profile.',
        };
      }

      if (body.user) {
        setUser(body.user);
      }
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error occurred. Please try again.';
      return {
        success: false,
        error: message,
      };
    }
  };

  const changePassword = async (
    data: ChangePasswordInput
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          error: body.message || 'Failed to change password.',
        };
      }

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error occurred. Please try again.';
      return {
        success: false,
        error: message,
      };
    }
  };

  const resendVerification = async (
    email?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email || user?.email }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          error: body.message || 'Failed to send verification email.',
        };
      }

      return {
        success: true,
        message: body.message || 'Verification link sent to your email.',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error occurred.';
      return {
        success: false,
        error: message,
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        resendVerification,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
