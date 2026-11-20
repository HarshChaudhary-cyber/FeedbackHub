import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { RateLimiterService } from './rate-limiter.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService, RateLimiterService, AuthGuard],
  exports: [AuthService, RateLimiterService, AuthGuard],
})
export class AuthModule {}
