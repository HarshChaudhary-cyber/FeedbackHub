import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
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
import { registerSchema } from '@feedbackhub/validation';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
    setSuccessMessage(null);

    const validation = registerSchema.safeParse({
      fullName,
      email,
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
    const res = await register({
      fullName,
      email,
      password,
      confirmPassword,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setServerError(res.error || 'Registration failed. Please try again.');
      return;
    }

    setSuccessMessage(
      res.message ||
        'Registration successful! A verification link has been sent to your email. Please verify your email before logging in.'
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-main">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-soft-sm font-bold text-lg mb-2">
            FH
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-content-main">
            Create your account
          </h1>
          <p className="text-sm text-content-secondary">
            Get started with FeedbackHub to collect and act on feedback.
          </p>
        </div>

        <Card className="shadow-soft-lg border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign Up</CardTitle>
            <CardDescription>
              Enter your details to create an individual user profile.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {successMessage ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-subtle/50 text-success-main border border-success-main/20">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-content-main">Verify Your Email</h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {successMessage}
                </p>
                <div className="rounded-xl bg-surface-subtle p-3 text-xs text-content-muted text-left border border-border">
                  <div className="flex items-center gap-1.5 font-semibold text-content-main mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
                    <span>Next step</span>
                  </div>
                  Click the link in the verification email sent to <strong className="text-content-main">{email}</strong> to activate your account.
                </div>
                <div className="pt-2">
                  <Link to="/login">
                    <Button variant="primary" className="w-full justify-center">
                      Proceed to Sign In
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
                    <Input
                      id="register-name"
                      name="fullName"
                      label="Full Name"
                      type="text"
                      autoComplete="name"
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      error={errors.fullName}
                      leftIcon={<User className="h-4 w-4 text-content-muted" />}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Input
                      id="register-email"
                      name="email"
                      label="Work Email"
                      type="email"
                      autoComplete="email"
                      placeholder="jane@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={errors.email}
                      leftIcon={<Mail className="h-4 w-4 text-content-muted" />}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="relative">
                      <Input
                        id="register-password"
                        name="password"
                        label="Password"
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

                    {/* Real-time Password Strength Criteria Checklist */}
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
                            <span>1 special character (e.g., !@#$%^&*)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="relative">
                      <Input
                        id="register-confirm-password"
                        name="confirmPassword"
                        label="Confirm Password"
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
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col border-t border-border/80 pt-4 text-center text-xs text-content-secondary">
            <p>
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary rounded"
              >
                Sign in instead
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
