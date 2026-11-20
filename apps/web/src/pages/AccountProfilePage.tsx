import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  LogOut,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Calendar,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  AlertDescription,
  Spinner,
} from '@feedbackhub/ui';
import { useAuth } from '../context/AuthContext';
import { updateProfileSchema, changePasswordSchema } from '@feedbackhub/validation';

export const AccountProfilePage: React.FC = () => {
  const { user, logout, updateProfile, changePassword, resendVerification } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Resend Verification State
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const criteria = {
    length: newPassword.length >= 10,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    const validation = updateProfileSchema.safeParse({ fullName });
    if (!validation.success) {
      setProfileError(validation.error.issues[0]?.message || 'Please provide a valid full name.');
      return;
    }

    setIsUpdatingProfile(true);
    const res = await updateProfile({ fullName });
    setIsUpdatingProfile(false);

    if (res.success) {
      setProfileSuccess('Profile information updated successfully.');
    } else {
      setProfileError(res.error || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    const validation = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      setPasswordError(validation.error.issues[0]?.message || 'Invalid password details.');
      return;
    }

    setIsChangingPassword(true);
    const res = await changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    setIsChangingPassword(false);

    if (res.success) {
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(res.error || 'Failed to change password.');
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendStatus(null);
    const res = await resendVerification();
    setIsResending(false);

    if (res.success) {
      setResendStatus(res.message || 'Verification email dispatched.');
    } else {
      setResendStatus(res.error || 'Failed to send verification email.');
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-main py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header Profile Card */}
        <div className="rounded-2xl border border-border bg-surface-card p-6 shadow-soft-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary text-xl font-bold text-white shadow-soft-sm">
                {user.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'FH'}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-content-main sm:text-2xl">
                    {user.fullName}
                  </h1>
                  {user.isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-subtle/40 px-2.5 py-0.5 text-xs font-semibold text-success-main border border-success-main/20">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 border border-amber-500/20">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Unverified
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-content-secondary">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-content-muted" />
                    {user.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-content-muted" />
                    Member since {formattedDate}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="self-start sm:self-auto text-content-secondary hover:text-danger-main hover:border-danger-main/30"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>

          {/* Unverified Email Warning Banner */}
          {!user.isEmailVerified && (
            <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Your email address has not been verified yet.</span>
                    <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                      Verify your email to guarantee continuous access to your account and notifications.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="shrink-0 bg-white dark:bg-neutral-800"
                >
                  {isResending ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </Button>
              </div>
              {resendStatus && (
                <p className="mt-2 text-xs font-medium text-amber-900 dark:text-amber-200">
                  {resendStatus}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-content-secondary hover:text-content-main'
            }`}
          >
            <User className="h-4 w-4" />
            Profile Details
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'security'}
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'security'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-content-secondary hover:text-content-main'
            }`}
          >
            <Shield className="h-4 w-4" />
            Security & Password
          </button>
        </div>

        {/* Tab Content: Profile */}
        {activeTab === 'profile' && (
          <Card className="shadow-soft-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <CardDescription>
                Update your display name and view your registered email address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profileSuccess && (
                <Alert variant="success" className="mb-5">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{profileSuccess}</AlertDescription>
                </Alert>
              )}
              {profileError && (
                <Alert variant="error" className="mb-5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{profileError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-lg">
                <div className="space-y-1.5">
                  <Input
                    id="profile-name"
                    label="Full Name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={isUpdatingProfile}
                  />
                </div>

                <div className="space-y-1.5">
                  <Input
                    id="profile-email"
                    label="Email Address"
                    type="email"
                    value={user.email}
                    disabled
                    helperText="Email cannot be changed directly for security and audit integrity."
                    className="cursor-not-allowed"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isUpdatingProfile || fullName.trim() === user.fullName}
                  className="shadow-soft-sm"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Saving changes...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tab Content: Security */}
        {activeTab === 'security' && (
          <Card className="shadow-soft-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg">Change Password</CardTitle>
              <CardDescription>
                Ensure your account uses a strong password to maintain security.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordSuccess && (
                <Alert variant="success" className="mb-5">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{passwordSuccess}</AlertDescription>
                </Alert>
              )}
              {passwordError && (
                <Alert variant="error" className="mb-5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg" noValidate>
                <div className="space-y-1.5">
                  <div className="relative">
                    <Input
                      id="current-password"
                      label="Current Password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="pr-10"
                      disabled={isChangingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                      className="absolute right-3 top-8 text-content-muted hover:text-content-main focus:outline-none"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="relative">
                    <Input
                      id="new-password"
                      label="New Password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="pr-10"
                      disabled={isChangingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      className="absolute right-3 top-8 text-content-muted hover:text-content-main focus:outline-none"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Requirements checklist */}
                  {newPassword.length > 0 && (
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
                      id="confirm-new-password"
                      label="Confirm New Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="pr-10"
                      disabled={isChangingPassword}
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
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="shadow-soft-sm"
                >
                  {isChangingPassword ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Updating password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
