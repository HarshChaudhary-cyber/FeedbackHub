import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TenantResolutionService } from './tenant-resolution.service';
import { TenantMembershipService } from './tenant-membership.service';
import { TenantController } from './tenant.controller';
import { TenantMiddleware } from './tenant.middleware';
import { TenantResolutionGuard } from './guards/tenant-resolution.guard';
import { TenantMembershipGuard } from './guards/tenant-membership.guard';
import { TenantRoleGuard } from './guards/tenant-role.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TenantController],
  providers: [
    TenantResolutionService,
    TenantMembershipService,
    TenantResolutionGuard,
    TenantMembershipGuard,
    TenantRoleGuard,
  ],
  exports: [
    TenantResolutionService,
    TenantMembershipService,
    TenantResolutionGuard,
    TenantMembershipGuard,
    TenantRoleGuard,
  ],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
