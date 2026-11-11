import { z } from 'zod';

export const RESERVED_SUBDOMAINS = [
  'app',
  'api',
  'admin',
  'www',
  'docs',
  'auth',
  'status',
  'billing',
  'mail',
  'webhook',
  'static',
  'assets',
  'cdn',
  'support',
  'help',
  'root',
  'internal',
] as const;

export const companySubdomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Subdomain must be at least 3 characters')
  .max(63, 'Subdomain cannot exceed 63 characters')
  .regex(
    /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/,
    'Subdomain can only contain lowercase letters, numbers, and hyphens'
  )
  .refine(
    (slug) => !RESERVED_SUBDOMAINS.includes(slug as (typeof RESERVED_SUBDOMAINS)[number]),
    'This subdomain is reserved by the platform'
  );

export const createCompanySchema = z.object({
  name: z.string().trim().min(2, 'Company name must be at least 2 characters').max(100),
  slug: companySubdomainSchema,
  brandColorHex: z
    .string()
    .trim()
    .regex(/^#([A-Fa-f0-9]{6})$/, 'Must be a valid 6-character hex color code (e.g. #8B5CF6)')
    .default('#8B5CF6'),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
