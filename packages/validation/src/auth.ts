import { z } from 'zod';

export const passwordCriteriaRegex = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[^A-Za-z0-9]/,
};

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters'),
    email: z.string().trim().email('Please enter a valid email address'),
    password: z
      .string()
      .min(10, 'Password must be at least 10 characters')
      .regex(passwordCriteriaRegex.uppercase, 'Password must contain at least one uppercase letter')
      .regex(passwordCriteriaRegex.lowercase, 'Password must contain at least one lowercase letter')
      .regex(passwordCriteriaRegex.number, 'Password must contain at least one number')
      .regex(passwordCriteriaRegex.special, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(10, 'Password must be at least 10 characters')
      .regex(passwordCriteriaRegex.uppercase, 'Password must contain at least one uppercase letter')
      .regex(passwordCriteriaRegex.lowercase, 'Password must contain at least one lowercase letter')
      .regex(passwordCriteriaRegex.number, 'Password must contain at least one number')
      .regex(passwordCriteriaRegex.special, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(10, 'Password must be at least 10 characters')
      .regex(passwordCriteriaRegex.uppercase, 'Password must contain at least one uppercase letter')
      .regex(passwordCriteriaRegex.lowercase, 'Password must contain at least one lowercase letter')
      .regex(passwordCriteriaRegex.number, 'Password must contain at least one number')
      .regex(passwordCriteriaRegex.special, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
});

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, 'Verification token is required'),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
