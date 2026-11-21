/**
 * Tenant and Company domain models
 */

export type CompanyRole = 'OWNER' | 'ADMIN' | 'MANAGER';
export type CompanyStatus = 'ACTIVE' | 'SUSPENDED';
export type MembershipStatus = 'ACTIVE' | 'SUSPENDED';

export interface Company {
  id: string;
  name: string;
  slug: string;
  status: CompanyStatus;
  customDomain?: string | null;
  logoUrl?: string | null;
  brandColorHex?: string;
  accentColorHex?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyMembershipRecord {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyRole;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserCompanyItem {
  id: string;
  name: string;
  slug: string;
  role: CompanyRole;
  status?: string;
  createdAt: string;
}

export interface CreateCompanyResponse {
  id: string;
  name: string;
  slug: string;
  role: CompanyRole;
  status: string;
  createdAt: string;
  updatedAt: string;
}

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
