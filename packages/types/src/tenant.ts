/**
 * Tenant and Company domain models
 */

export interface TenantBranding {
  logoUrl: string | null;
  brandColorHex: string;
  accentColorHex: string;
  faviconUrl?: string | null;
}

export interface TenantSettings {
  allowPublicCustomerFeedback: boolean;
  allowAnonymousEmployeeFeedback: boolean;
  minimumEmployeePrivacyThreshold: number; // e.g. 5
  timeZone: string;
}

export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  branding: TenantBranding;
  settings: TenantSettings;
  isActive: boolean;
}

export type TenantResolutionMode = 'marketing' | 'app' | 'tenant';
