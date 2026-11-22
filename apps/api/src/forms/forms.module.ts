import { Module } from '@nestjs/common';
import { FormsController } from './forms.controller';
import { PublicFormsController } from './public-forms.controller';
import { FormsService } from './forms.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { RateLimiterService } from '../auth/rate-limiter.service';
import { TenantModule } from '../tenant/tenant.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, TenantModule, AuthModule],
  controllers: [FormsController, PublicFormsController],
  providers: [FormsService, PrismaService, RateLimiterService],
  exports: [FormsService],
})
export class FormsModule {}
