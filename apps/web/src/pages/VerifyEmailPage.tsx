import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, Mail } from 'lucide-react';
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

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, resendVerification } = useAuth();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'idle'>(
    token ? 'verifying' : 'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resend state
  const [resendEmail, setResendEmail] = useState(user?.email || '');
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('idle');
      return;
    }

    let isCancelled = false;
    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));

        if (isCancelled) return;

        if (res.ok) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(data.message || 'Verification token is invalid or has expired.');
        }
      } catch {
        if (!isCancelled) {
          setStatus('error');
          setErrorMessage('Network error occurred while verifying email.');
        }
      }
    };

    verifyToken();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setIsResending(true);
    setResendStatus(null);
    const res = await resendVerification(resendEmail);
    setIsResending(false);

    if (res.success) {
      setResendStatus(res.message || 'Verification link sent!');
    } else {
      setResendStatus(res.error || 'Failed to send verification link.');
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
            Email Verification
          </h1>
          <p className="text-sm text-content-secondary">
            Confirm your account email address.
          </p>
        </div>

        <Card className="shadow-soft-lg border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Verification Status</CardTitle>
            <CardDescription>
              FeedbackHub confirms email ownership to keep workspaces secure.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {status === 'verifying' && (
              <div className="py-8 text-center space-y-3">
                <Spinner size="lg" className="mx-auto text-brand-primary" />
                <p className="text-sm font-medium text-content-main">
                  Verifying your email address...
                </p>
                <p className="text-xs text-content-muted">Please hold on for a moment.</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-subtle/50 text-success-main border border-success-main/20">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-content-main">Email Verified!</h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  Your email address has been successfully confirmed. Your account is fully activated.
                </p>
                <div className="pt-2">
                  <Link to="/account">
                    <Button variant="primary" className="w-full justify-center">
                      Go to Your Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {(status === 'error' || status === 'idle') && (
              <div className="space-y-5">
                {status === 'error' && (
                  <Alert variant="error">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="rounded-xl bg-surface-subtle p-4 border border-border space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-sm text-content-main">
                    <Mail className="h-4 w-4 text-brand-primary" />
                    <span>Request a new verification link</span>
                  </div>
                  <p className="text-xs text-content-secondary">
                    Verification links expire after 24 hours. Enter your email below to receive a fresh verification link.
                  </p>

                  <form onSubmit={handleResend} className="space-y-3 pt-1">
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      required
                      disabled={isResending}
                    />

                    {resendStatus && (
                      <p className="text-xs font-medium text-brand-primary">
                        {resendStatus}
                      </p>
                    )}

                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full justify-center"
                      disabled={isResending || !resendEmail}
                    >
                      {isResending ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Sending...
                        </>
                      ) : (
                        'Send New Verification Link'
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-border/80 pt-4 text-center text-xs text-content-secondary">
            <Link
              to="/login"
              className="font-semibold text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary rounded"
            >
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
