import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
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
import { resetPasswordSchema } from '@feedbackhub/validation';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const criteria = {
    length: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    if (!token) {
      setServerError('Missing reset token. Please follow the link sent to your email.');
      return;
    }

    const validation = resetPasswordSchema.safeParse({
      token,
      password,
      confirmPassword,
    });

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
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(data.message || 'Failed to reset password. The link may have expired.');
        return;
      }

      setSuccess(true);
    } catch {
      setServerError('A network error occurred. Please try again.');
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
            Set new password
          </h1>
          <p className="text-sm text-content-secondary">
            Choose a strong password to protect your account.
          </p>
        </div>

        <Card className="shadow-soft-lg border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">New Password</CardTitle>
            <CardDescription>
              Enter and confirm your updated credentials.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!token ? (
              <div className="space-y-4 py-4 text-center">
                <Alert variant="error" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Missing or invalid password reset token. Please request a new link.
                  </AlertDescription>
                </Alert>
                <Link to="/forgot-password">
                  <Button variant="primary" className="w-full justify-center">
                    Request New Reset Link
                  </Button>
                </Link>
              </div>
            ) : success ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-subtle/50 text-success-main border border-success-main/20">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-content-main">Password Updated</h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  Your password has been securely reset and all existing sessions have been terminated.
                </p>
                <div className="pt-2">
                  <Link to="/login">
                    <Button variant="primary" className="w-full justify-center">
                      Sign In with New Password
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {serverError && (
                  <Alert variant="error" className="mb-5">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Input
                        id="reset-password"
                        name="password"
                        label="New Password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
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
                        className="absolute right-3 top-8 text-content-muted hover:text-content-main focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Criteria checklist */}
                    {password.length > 0 && (
                      <div className="rounded-lg bg-surface-subtle p-2.5 text-xs text-content-secondary space-y-1 border border-border mt-2">
                        <p className="font-semibold text-content-main mb-1">Password Requirements:</p>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          <div className={`flex items-center gap-1.5 ${criteria.length ? 'text-success-main font-medium' : 'text-content-muted'}`}>
                            {criteria.length ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                            <span>Min 10 characters</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${criteria.uppercase ? 'text-success-main font-medium' : 'text-content-muted'}`}>
                            {criteria.uppercase ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                            <span>1 uppercase letter</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${criteria.lowercase ? 'text-success-main font-medium' : 'text-content-muted'}`}>
                            {criteria.lowercase ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                            <span>1 lowercase letter</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${criteria.number ? 'text-success-main font-medium' : 'text-content-muted'}`}>
                            {criteria.number ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                            <span>1 number</span>
                          </div>
                          <div className={`flex items-center gap-1.5 col-span-2 ${criteria.special ? 'text-success-main font-medium' : 'text-content-muted'}`}>
                            {criteria.special ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                            <span>1 special character (!@#$%^&*)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="relative">
                      <Input
                        id="reset-confirm-password"
                        name="confirmPassword"
                        label="Confirm New Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        error={errors.confirmPassword}
                        leftIcon={<Lock className="h-4 w-4 text-content-muted" />}
                        className="pr-10"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        className="absolute right-3 top-8 text-content-muted hover:text-content-main focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                        Updating password...
                      </>
                    ) : (
                      'Update Password'
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
