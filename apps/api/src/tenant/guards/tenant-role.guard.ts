import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TENANT_ROLES_KEY } from '../decorators/roles.decorator';
import type { CompanyRole } from '@feedbackhub/types';

const ROLE_HIERARCHY: Record<CompanyRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MANAGER: 1,
};

/**
 * Guard that enforces role-based access control within the tenant organization.
 * Implements a strict hierarchical model: OWNER (3) > ADMIN (2) > MANAGER (1).
 */
@Injectable()
export class TenantRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<CompanyRole[]>(
      TENANT_ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no roles specified on endpoint, pass
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const callerRole = request.tenant?.membershipRole as CompanyRole | undefined;

    if (!callerRole) {
      throw new ForbiddenException('Missing tenant membership role.');
    }

    const callerLevel = ROLE_HIERARCHY[callerRole];
    if (callerLevel === undefined) {
      throw new ForbiddenException('Invalid or unassigned membership role.');
    }

    // Determine the minimum required level among the required roles
    // If endpoint requires OWNER, caller must be OWNER.
    // If endpoint requires ADMIN, caller can be ADMIN or OWNER.
    // If endpoint requires MANAGER, caller can be MANAGER, ADMIN, or OWNER.
    const minRequiredLevel = Math.min(...requiredRoles.map((r) => ROLE_HIERARCHY[r]));

    if (callerLevel < minRequiredLevel) {
      throw new ForbiddenException(
        `Insufficient permissions. This operation requires at least ${requiredRoles.join(' or ')} role.`
      );
    }

    return true;
  }
}
