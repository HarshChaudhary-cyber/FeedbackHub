import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextManager } from '../tenant.context';
import type { CompanyRole } from '@feedbackhub/types';

/**
 * Guard that verifies the authenticated user holds an active membership
 * in the resolved tenant organization.
 */
@Injectable()
export class TenantMembershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Verify authentication context
    const user = request.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('Authentication required. Missing user identity.');
    }

    // 2. Strict account eligibility (fail-closed)
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not in active standing.');
    }

    // 3. Verify tenant resolution context
    const tenant = request.tenant;
    if (!tenant || !tenant.companyId) {
      throw new ForbiddenException('Tenant context missing. Cannot verify organization membership.');
    }

    // 4. Verify explicit database membership within transaction-local tenant RLS context
    const membership = await this.prisma.withTenantContext(
      tenant.companyId,
      user.id,
      async (tx) => {
        return tx.companyMembership.findUnique({
          where: {
            companyId_userId: {
              companyId: tenant.companyId,
              userId: user.id,
            },
          },
        });
      }
    );

    if (!membership) {
      throw new ForbiddenException(
        'Access denied. You do not hold an active membership in this organization.'
      );
    }

    if (membership.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Your membership in this organization is suspended or not active.'
      );
    }

    // 5. Enrich request tenant context with verified membership identity in both request and AsyncLocalStorage
    const enriched = Object.freeze({
      ...tenant,
      userId: user.id,
      membershipId: membership.id,
      membershipRole: membership.role as CompanyRole,
    });
    TenantContextManager.enrich(enriched);
    request.tenant = enriched;

    return true;
  }
}
