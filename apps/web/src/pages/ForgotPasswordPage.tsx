import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
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
import { forgotPasswordSchema } from '@feedbackhub/validation';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Always show generic success to prevent account enumeration
      setSubmitted(true);
    } catch {
      // Still show success to protect user privacy
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-main">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-soft-sm font-bold text-lg mb-2">
            FH
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-content-main">
            Reset your password
          </h1>
          <p className="text-sm text-content-secondary">
            Enter your email to receive secure recovery instructions.
          </p>
        </div>

        <Card className="shadow-soft-lg border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Password Recovery</CardTitle>
            <CardDescription>
              We will email you a secure, single-use password reset link.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {submitted ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-subtle/50 text-success-main border border-success-main/20">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-content-main">Check Your Inbox</h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  If an account exists with <strong className="text-content-main">{email}</strong>, a password reset link has been dispatched.
                </p>
                <p className="text-xs text-content-muted">
                  The link is valid for 1 hour. Please check your spam folder if you do not see it within a couple minutes.
                </p>
                <div className="pt-2">
                  <Link to="/login">
                    <Button variant="outline" className="w-full justify-center">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <Alert variant="error" className="mb-5">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <Input
                      id="forgot-email"
                      name="email"
                      label="Registered Work Email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={error || undefined}
                      leftIcon={<Mail className="h-4 w-4 text-content-muted" />}
                      disabled={isSubmitting}
                    />
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
                        Sending reset instructions...
                      </>
                    ) : (
                      'Send Password Reset Link'
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-border/80 pt-4 text-center text-xs text-content-secondary">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 font-semibold text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary rounded"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
