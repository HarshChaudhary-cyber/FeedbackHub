import { z } from 'zod';

export const RESERVED_SLUGS = [
  'account',
  'admin',
  'api',
  'app',
  'assets',
  'auth',
  'billing',
  'cdn',
  'dashboard',
  'docs',
  'feedback',
  'help',
  'internal',
  'legal',
  'login',
  'mail',
  'portal',
  'pricing',
  'privacy',
  'public',
  'root',
  'security',
  'settings',
  'signup',
  'static',
  'status',
  'support',
  'system',
  'terms',
  'test',
  'user',
  'users',
  'web',
  'webhook',
  'www',
] as const;

export const RESERVED_SUBDOMAINS = RESERVED_SLUGS;

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const companySubdomainSchema = z
  .string()
  .trim()
  .min(3, 'Slug must be at least 3 characters')
  .max(63, 'Slug cannot exceed 63 characters')
  .regex(
    SLUG_REGEX,
    'Slug can only contain lowercase alphanumeric characters and single hyphens without leading or trailing hyphens'
  )
  .refine(
    (slug) => !RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number]),
    'This slug is reserved by the platform'
  );

export const createCompanySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name cannot exceed 100 characters'),
  slug: z
    .string()
    .trim()
    .transform((val) => (val === '' ? undefined : val))
    .pipe(companySubdomainSchema)
    .optional(),
  brandColorHex: z
    .string()
    .trim()
    .regex(/^#([A-Fa-f0-9]{6})$/, 'Must be a valid 6-character hex color code (e.g. #8B5CF6)')
    .optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const createInvitationSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address format'),
  role: z.enum(['ADMIN', 'MANAGER'], {
    errorMap: () => ({ message: 'Invited role must be either ADMIN or MANAGER' }),
  }),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

export const acceptInvitationSchema = z.object({
  token: z
    .string()
    .trim()
    .min(32, 'Invitation token must be at least 32 characters')
    .max(128, 'Invitation token exceeds maximum length'),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER'], {
    errorMap: () => ({ message: 'Target role must be either ADMIN or MANAGER' }),
  }),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export const updateMemberStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED'], {
    errorMap: () => ({ message: 'Status must be either ACTIVE or SUSPENDED' }),
  }),
});

export type UpdateMemberStatusInput = z.infer<typeof updateMemberStatusSchema>;

export const transferOwnershipSchema = z.object({
  targetUserId: z.string().trim().min(1, 'Target user ID is required'),
  retainedRole: z.enum(['ADMIN', 'MANAGER']).default('ADMIN'),
});

export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
