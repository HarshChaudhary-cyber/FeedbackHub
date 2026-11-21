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
    if (!requiredRoles) {
      return true;
    }

    if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
      throw new ForbiddenException('Invalid or empty role requirement configuration.');
    }

    // Fail-closed validation: verify every required role is a recognized, valid CompanyRole
    for (const role of requiredRoles) {
      if (typeof role !== 'string' || ROLE_HIERARCHY[role as CompanyRole] === undefined) {
        throw new ForbiddenException(`Invalid or unknown role requirement: "${String(role)}".`);
      }
    }

    const request = context.switchToHttp().getRequest();
    const callerRole = request.tenant?.membershipRole as CompanyRole | undefined;

    if (!callerRole || typeof callerRole !== 'string' || ROLE_HIERARCHY[callerRole] === undefined) {
      throw new ForbiddenException('Missing, invalid, or unassigned membership role.');
    }

    const callerLevel = ROLE_HIERARCHY[callerRole];

    // Determine the minimum required level among the validated required roles
    const minRequiredLevel = Math.min(...requiredRoles.map((r) => ROLE_HIERARCHY[r as CompanyRole]));

    if (callerLevel < minRequiredLevel) {
      throw new ForbiddenException(
        `Insufficient permissions. This operation requires at least ${requiredRoles.join(' or ')} role.`
      );
    }

    return true;
  }
}
