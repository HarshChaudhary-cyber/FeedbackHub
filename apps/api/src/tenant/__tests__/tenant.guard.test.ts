/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantResolutionGuard } from '../guards/tenant-resolution.guard';
import { TenantMembershipGuard } from '../guards/tenant-membership.guard';
import { TenantRoleGuard } from '../guards/tenant-role.guard';
import { TenantContextManager } from '../tenant.context';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

function createMockExecutionContext(req: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('Tenant Guards', () => {
  let prisma: PrismaService;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    prisma = new PrismaService();
    prisma.isInMemory = true;
    prisma.resetMemoryStore();
  });

  describe('TenantResolutionGuard', () => {
    const guard = new TenantResolutionGuard();

    it('passes when request has resolved tenant context', () => {
      const mockReq = {
        tenant: { companyId: 'comp-1', companySlug: 'acme' },
      };
      const context = createMockExecutionContext(mockReq);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('throws 404 NotFoundException when tenant is missing or unresolved', () => {
      const mockReq = {};
      const context = createMockExecutionContext(mockReq);

      expect(() => guard.canActivate(context)).toThrow(NotFoundException);
    });
  });

  describe('TenantMembershipGuard', () => {
    let guard: TenantMembershipGuard;

    beforeEach(() => {
      guard = new TenantMembershipGuard(prisma);
    });

    it('allows access and enriches request.tenant when user holds active membership', async () => {
      const user = await prisma.platformUser.create({
        data: {
          email: 'member@example.com',
          fullName: 'Active Member',
          passwordHash: 'hash',
          isEmailVerified: true,
          status: 'ACTIVE',
        },
      });

      const company = await prisma.company.create({
        data: {
          name: 'Target Company',
          slug: 'target-co',
          status: 'ACTIVE',
          isActive: true,
        },
      });

      const membership = await prisma.companyMembership.create({
        data: {
          companyId: company.id,
          userId: user.id,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });

      const mockReq: any = {
        user: { id: user.id, email: user.email, status: 'ACTIVE' },
        tenant: { companyId: company.id, companySlug: company.slug },
      };
      const context = createMockExecutionContext(mockReq);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(mockReq.tenant.userId).toBe(user.id);
      expect(mockReq.tenant.membershipId).toBe(membership.id);
      expect(mockReq.tenant.membershipRole).toBe('ADMIN');
    });

    it('synchronizes enriched tenant context to both request.tenant and TenantContextManager', async () => {
      const user = await prisma.platformUser.create({
        data: {
          email: 'sync@example.com',
          fullName: 'Sync User',
          passwordHash: 'hash',
          isEmailVerified: true,
          status: 'ACTIVE',
        },
      });

      const company = await prisma.company.create({
        data: {
          name: 'Sync Co',
          slug: 'sync-co',
          status: 'ACTIVE',
          isActive: true,
        },
      });

      const membership = await prisma.companyMembership.create({
        data: {
          companyId: company.id,
          userId: user.id,
          role: 'MANAGER',
          status: 'ACTIVE',
        },
      });

      const initialContext: any = { companyId: company.id, companySlug: company.slug };
      const mockReq: any = {
        user: { id: user.id, email: user.email, status: 'ACTIVE' },
        tenant: initialContext,
      };
      const context = createMockExecutionContext(mockReq);

      await TenantContextManager.run(initialContext, async () => {
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
        expect(mockReq.tenant.userId).toBe(user.id);
        expect(mockReq.tenant.membershipId).toBe(membership.id);
        expect(mockReq.tenant.membershipRole).toBe('MANAGER');

        const alsContext = TenantContextManager.getContext();
        expect(alsContext).toBeDefined();
        expect(alsContext?.userId).toBe(user.id);
        expect(alsContext?.membershipId).toBe(membership.id);
        expect(alsContext?.membershipRole).toBe('MANAGER');
      });
    });

    it('throws 401 Unauthorized if request user is missing', async () => {
      const mockReq: any = {
        tenant: { companyId: 'comp-1' },
      };
      const context = createMockExecutionContext(mockReq);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('throws 403 Forbidden if user account status is not ACTIVE (e.g. SUSPENDED)', async () => {
      const mockReq: any = {
        user: { id: 'user-1', status: 'SUSPENDED' },
        tenant: { companyId: 'comp-1' },
      };
      const context = createMockExecutionContext(mockReq);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('throws 403 Forbidden if user has no membership in resolved company (cross-tenant protection)', async () => {
      const user = await prisma.platformUser.create({
        data: {
          email: 'outsider@example.com',
          fullName: 'Outsider User',
          passwordHash: 'hash',
          isEmailVerified: true,
          status: 'ACTIVE',
        },
      });

      const company = await prisma.company.create({
        data: {
          name: 'Protected Corp',
          slug: 'protected-corp',
          status: 'ACTIVE',
          isActive: true,
        },
      });

      const mockReq: any = {
        user: { id: user.id, email: user.email, status: 'ACTIVE' },
        tenant: { companyId: company.id, companySlug: company.slug },
      };
      const context = createMockExecutionContext(mockReq);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('throws 403 Forbidden if membership status is SUSPENDED or INVITED', async () => {
      const user = await prisma.platformUser.create({
        data: {
          email: 'suspended.member@example.com',
          fullName: 'Suspended Member',
          passwordHash: 'hash',
          isEmailVerified: true,
          status: 'ACTIVE',
        },
      });

      const company = await prisma.company.create({
        data: {
          name: 'Some Corp',
          slug: 'some-corp',
          status: 'ACTIVE',
          isActive: true,
        },
      });

      // Suspended membership
      await prisma.companyMembership.create({
        data: {
          companyId: company.id,
          userId: user.id,
          role: 'MANAGER',
          status: 'SUSPENDED',
        },
      });

      const mockReq: any = {
        user: { id: user.id, email: user.email, status: 'ACTIVE' },
        tenant: { companyId: company.id, companySlug: company.slug },
      };
      const context = createMockExecutionContext(mockReq);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('TenantRoleGuard', () => {
    let reflector: Reflector;
    let guard: TenantRoleGuard;

    beforeEach(() => {
      reflector = new Reflector();
      guard = new TenantRoleGuard(reflector);
    });

    it('passes when no roles are required on the endpoint', () => {
      reflector.getAllAndOverride = () => undefined as any;
      const mockReq = { tenant: { membershipRole: 'MANAGER' } };
      const context = createMockExecutionContext(mockReq);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('allows OWNER to access OWNER, ADMIN, and MANAGER routes (hierarchical privilege)', () => {
      const mockReq = { tenant: { membershipRole: 'OWNER' } };
      const context = createMockExecutionContext(mockReq);

      // Route requiring OWNER
      reflector.getAllAndOverride = () => ['OWNER'];
      expect(guard.canActivate(context)).toBe(true);

      // Route requiring ADMIN
      reflector.getAllAndOverride = () => ['ADMIN'];
      expect(guard.canActivate(context)).toBe(true);

      // Route requiring MANAGER
      reflector.getAllAndOverride = () => ['MANAGER'];
      expect(guard.canActivate(context)).toBe(true);
    });

    it('allows ADMIN to access ADMIN and MANAGER routes, but rejects OWNER routes', () => {
      const mockReq = { tenant: { membershipRole: 'ADMIN' } };
      const context = createMockExecutionContext(mockReq);

      // Route requiring MANAGER
      reflector.getAllAndOverride = () => ['MANAGER'];
      expect(guard.canActivate(context)).toBe(true);

      // Route requiring ADMIN
      reflector.getAllAndOverride = () => ['ADMIN'];
      expect(guard.canActivate(context)).toBe(true);

      // Route requiring OWNER -> fails closed!
      reflector.getAllAndOverride = () => ['OWNER'];
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('allows MANAGER to access only MANAGER routes, rejecting ADMIN and OWNER routes', () => {
      const mockReq = { tenant: { membershipRole: 'MANAGER' } };
      const context = createMockExecutionContext(mockReq);

      // Route requiring MANAGER
      reflector.getAllAndOverride = () => ['MANAGER'];
      expect(guard.canActivate(context)).toBe(true);

      // Route requiring ADMIN -> fails closed!
      reflector.getAllAndOverride = () => ['ADMIN'];
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

      // Route requiring OWNER -> fails closed!
      reflector.getAllAndOverride = () => ['OWNER'];
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('throws 403 Forbidden when membershipRole is unassigned or missing', () => {
      reflector.getAllAndOverride = () => ['MANAGER'];
      const mockReq = { tenant: {} };
      const context = createMockExecutionContext(mockReq);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('throws 403 Forbidden when required role metadata contains invalid or unknown role (fail-closed)', () => {
      reflector.getAllAndOverride = () => ['NONEXISTENT_ROLE' as any];
      const mockReq = { tenant: { membershipRole: 'OWNER' } };
      const context = createMockExecutionContext(mockReq);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('throws 403 Forbidden when required role metadata is an empty array', () => {
      reflector.getAllAndOverride = () => [];
      const mockReq = { tenant: { membershipRole: 'OWNER' } };
      const context = createMockExecutionContext(mockReq);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('throws 403 Forbidden when caller membership role is invalid or unrecognized enum', () => {
      reflector.getAllAndOverride = () => ['MANAGER'];
      const mockReq = { tenant: { membershipRole: 'SUPER_USER' } };
      const context = createMockExecutionContext(mockReq);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
