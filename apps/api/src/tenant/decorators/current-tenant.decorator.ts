import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TenantContext } from '@feedbackhub/types';

/**
 * Parameter decorator that extracts the validated TenantContext (or a specific property)
 * from the current request.
 */
export const CurrentTenant = createParamDecorator(
  (data: keyof TenantContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request.tenant as TenantContext | undefined;

    return data && tenant ? tenant[data] : tenant;
  }
);
