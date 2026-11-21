import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';

/**
 * Guard that ensures a valid tenant organization was successfully resolved
 * from the request hostname before allowing execution of tenant routes.
 */
@Injectable()
export class TenantResolutionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (!request.tenant || !request.tenant.companyId) {
      throw new NotFoundException(
        'Tenant context not resolved. A valid tenant hostname or subdomain is required to access this endpoint.'
      );
    }

    return true;
  }
}
