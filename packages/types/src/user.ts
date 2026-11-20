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
  status: 'ACTIVE' | 'SUSPENDED';
  emailVerifiedAt?: string | null;
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
  isEmailVerified: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  status?: string;
  currentCompanyId?: string;
  currentRole?: TenantRole;
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuthResponse {
  user: SessionUser;
  message?: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user: SessionUser | null;
}
