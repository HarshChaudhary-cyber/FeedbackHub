import { describe, it, expect, beforeEach } from 'vitest';
import { CompaniesController } from '../companies.controller';
import { CompaniesService } from '../companies.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('CompaniesController', () => {
  let controller: CompaniesController;
  let service: CompaniesService;
  let prisma: PrismaService;
  let testUserId: string;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    prisma = new PrismaService();
    prisma.isInMemory = true;
    prisma.resetMemoryStore();

    service = new CompaniesService(prisma);
    controller = new CompaniesController(service);

    const user = await prisma.platformUser.create({
      data: {
        email: 'controller.user@example.com',
        fullName: 'Controller User',
        passwordHash: 'dummy-hashed-pw',
        isEmailVerified: true,
        status: 'ACTIVE',
      },
    });

    testUserId = user.id;
  });

  describe('POST /companies', () => {
    it('creates a company for authenticated user and returns 201 response', async () => {
      const response = await controller.createCompany(testUserId, {
        name: 'Controller Company Inc',
      });

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe('Controller Company Inc');
      expect(response.slug).toBe('controller-company-inc');
      expect(response.role).toBe('OWNER');
      expect(response.status).toBe('ACTIVE');
    });

    it('rejects unauthenticated requests missing user context with 401 Unauthorized', async () => {
      await expect(
        controller.createCompany(undefined, {
          name: 'Unauthenticated Co',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('derives company ownership strictly from authenticated context and ignores payload ownerId', async () => {
      const response = await controller.createCompany(testUserId, {
        name: 'Untrusted Payload Co',
        ownerId: 'spoofed-owner-id-1234',
        userId: 'spoofed-user-id-5678',
      });

      expect(response.role).toBe('OWNER');

      // Verify the real authenticated user is the owner
      const membership = await prisma.companyMembership.findUnique({
        where: {
          companyId_userId: {
            companyId: response.id,
            userId: testUserId,
          },
        },
      });
      expect(membership?.userId).toBe(testUserId);
      expect(membership?.role).toBe('OWNER');
    });
  });

  describe('GET /companies/me', () => {
    it('returns companies list for authenticated user', async () => {
      await controller.createCompany(testUserId, {
        name: 'My Personal Co',
        slug: 'my-personal-co',
      });

      const result = await controller.getMyCompanies(testUserId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('My Personal Co');
      expect(result[0].slug).toBe('my-personal-co');
      expect(result[0].role).toBe('OWNER');
    });

    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      await expect(controller.getMyCompanies(undefined)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('enforces multi-tenant isolation across different users', async () => {
      const otherUser = await prisma.platformUser.create({
        data: {
          email: 'other.tenant@example.com',
          fullName: 'Other Tenant',
          passwordHash: 'dummy-hashed-pw',
          isEmailVerified: true,
          status: 'ACTIVE',
        },
      });

      // User 1 creates Company 1
      await controller.createCompany(testUserId, {
        name: 'User 1 Company',
        slug: 'user-1-co',
      });

      // Other user creates Company 2
      await controller.createCompany(otherUser.id, {
        name: 'User 2 Company',
        slug: 'user-2-co',
      });

      // User 1 should only see Company 1
      const user1Companies = await controller.getMyCompanies(testUserId);
      expect(user1Companies).toHaveLength(1);
      expect(user1Companies[0].slug).toBe('user-1-co');

      // Other user should only see Company 2
      const user2Companies = await controller.getMyCompanies(otherUser.id);
      expect(user2Companies).toHaveLength(1);
      expect(user2Companies[0].slug).toBe('user-2-co');
    });
  });
});
