/**
 * User, Roles, and Membership domain models
 */

export type PlatformRole = 'SUPER_ADMIN' | 'STANDARD_USER';

export type TenantRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER';

export interface PlatformUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isSuperAdmin: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyMembership {
  id: string;
  companyId: string;
  userId: string;
  role: TenantRole;
  jobTitle?: string | null;
  department?: string | null;
  joinedAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  isSuperAdmin: boolean;
  currentCompanyId?: string;
  currentRole?: TenantRole;
}
