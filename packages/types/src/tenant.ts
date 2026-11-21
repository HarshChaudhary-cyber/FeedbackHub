/**
 * Tenant and Company domain models
 */

export type CompanyRole = 'OWNER' | 'ADMIN' | 'MANAGER';
export type CompanyStatus = 'ACTIVE' | 'SUSPENDED';
export type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'INVITED';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

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

export interface CompanyInvitation {
  id: string;
  companyId: string;
  invitedByUserId: string;
  email: string;
  role: CompanyRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantMemberResponse {
  id: string;
  userId: string;
  companyId: string;
  email: string;
  fullName: string;
  role: CompanyRole;
  status: string;
  joinedAt: string;
  createdAt: string;
}

export interface TenantContext {
  companyId: string;
  companySlug: string;
  companyName: string;
  companyStatus: string;
  userId?: string;
  membershipId?: string;
  membershipRole?: CompanyRole;
  correlationId?: string;
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

export type TenantResolutionMode = 'marketing' | 'app' | 'tenant';
