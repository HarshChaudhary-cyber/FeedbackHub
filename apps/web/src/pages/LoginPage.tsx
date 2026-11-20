import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Alert,
  AlertDescription,
  Spinner,
} from '@feedbackhub/ui';
import { useAuth } from '../context/AuthContext';
import { loginSchema } from '@feedbackhub/validation';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const res = await login({ email, password });
    setIsSubmitting(false);

    if (!res.success) {
      setServerError(res.error || 'Invalid email or password.');
      return;
    }

    const destination =
      (location.state as { from?: { pathname?: string } })?.from?.pathname || '/account';
    navigate(destination, { replace: true });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-main">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-soft-sm font-bold text-lg mb-2">
            FH
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-content-main">
            Welcome back
          </h1>
          <p className="text-sm text-content-secondary">
            Sign in to access your feedback insights and account settings.
          </p>
        </div>

        <Card className="shadow-soft-lg border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Enter your FeedbackHub account credentials below.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {serverError && (
              <Alert variant="error" className="mb-5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Input
                  id="login-email"
                  name="email"
                  label="Work Email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  leftIcon={<Mail className="h-4 w-4 text-content-muted" />}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="text-xs font-semibold text-content-main"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary rounded"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                    leftIcon={<Lock className="h-4 w-4 text-content-muted" />}
                    className="pr-10"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-3 text-content-muted hover:text-content-main focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center mt-2 shadow-soft-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col border-t border-border/80 pt-4 text-center text-xs text-content-secondary">
            <p>
              Don&apos;t have an account yet?{' '}
              <Link
                to="/register"
                className="font-semibold text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary rounded"
              >
                Create an account
              </Link>
            </p>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-content-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-success-main" />
              <span>Protected by Argon2id & secure encrypted session cookies</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
