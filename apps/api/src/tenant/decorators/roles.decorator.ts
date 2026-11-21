import { SetMetadata } from '@nestjs/common';
import type { CompanyRole } from '@feedbackhub/types';

export const TENANT_ROLES_KEY = 'feedbackhub:tenant_roles';

/**
 * Decorator that specifies which company membership roles are permitted to access an endpoint.
 * Enforced hierarchically by TenantRoleGuard: OWNER > ADMIN > MANAGER.
 */
export const RequireRoles = (...roles: CompanyRole[]) =>
  SetMetadata(TENANT_ROLES_KEY, roles);
