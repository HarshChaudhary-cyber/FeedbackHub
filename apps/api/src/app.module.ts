import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [PrismaModule, EmailModule, AuthModule, CompaniesModule, TenantModule, HealthModule],
})
export class AppModule {}
