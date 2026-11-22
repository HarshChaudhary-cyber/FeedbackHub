import { Injectable, NestMiddleware, Optional, Inject } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { TenantResolutionService } from './tenant-resolution.service';
import { TenantContextManager } from './tenant.context';
import { PrismaService } from '../prisma/prisma.service';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant?: import('@feedbackhub/types').TenantContext;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly tenantResolutionService: TenantResolutionService;

  constructor(
    @Optional()
    @Inject(TenantResolutionService)
    tenantResolutionService?: TenantResolutionService,
    @Optional()
    @Inject(PrismaService)
    prismaService?: PrismaService
  ) {
    this.tenantResolutionService =
      tenantResolutionService || new TenantResolutionService(prismaService || new PrismaService());
  }

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      const tenant = await this.tenantResolutionService.resolveFromRequest(req);

      if (tenant) {
        // Attach immutable tenant snapshot to express request
        req.tenant = Object.freeze({ ...tenant });

        // Bind to AsyncLocalStorage for clean, leak-free async context propagation
        await TenantContextManager.run(req.tenant, () => {
          next();
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  }
}
