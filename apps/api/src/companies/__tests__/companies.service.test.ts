/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { CompaniesService } from '../companies.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let prisma: PrismaService;
  let ownerUser: { id: string; email: string; fullName: string };
  let secondUser: { id: string; email: string; fullName: string };

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    prisma = new PrismaService();
    prisma.isInMemory = true;
    prisma.resetMemoryStore();

    service = new CompaniesService(prisma);

    ownerUser = await prisma.platformUser.create({
      data: {
        email: 'owner@example.com',
        fullName: 'Owner User',
        passwordHash: 'dummy-hashed-pw',
        isEmailVerified: true,
        status: 'ACTIVE',
      },
    });

    secondUser = await prisma.platformUser.create({
      data: {
        email: 'second@example.com',
        fullName: 'Second User',
        passwordHash: 'dummy-hashed-pw',
        isEmailVerified: true,
        status: 'ACTIVE',
      },
    });
  });

  describe('Company Creation', () => {
    it('successfully creates a company and assigns creator OWNER membership', async () => {
      const response = await service.createCompany(ownerUser.id, {
        name: 'Acme Technologies',
      });

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe('Acme Technologies');
      expect(response.slug).toBe('acme-technologies');
      expect(response.role).toBe('OWNER');
      expect(response.status).toBe('ACTIVE');
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();

      // Verify Company exists in database
      const dbCompany = await prisma.company.findUnique({
        where: { id: response.id },
      });
      expect(dbCompany).toBeDefined();
      expect(dbCompany?.name).toBe('Acme Technologies');
      expect(dbCompany?.slug).toBe('acme-technologies');

      // Verify explicit CompanyMembership exists in database
      const dbMembership = await prisma.companyMembership.findUnique({
        where: {
          companyId_userId: {
            companyId: response.id,
            userId: ownerUser.id,
          },
        },
      });
      expect(dbMembership).toBeDefined();
      expect(dbMembership?.role).toBe('OWNER');
      expect(dbMembership?.status).toBe('ACTIVE');
    });

    it('generates normalized slug from company name', async () => {
      const response = await service.createCompany(ownerUser.id, {
        name: '  Cyber-Dyne Systems, LLC!  ',
      });

      expect(response.slug).toBe('cyber-dyne-systems-llc');
    });

    it('pads very short company name slug to meet minimum length requirement', async () => {
      const response = await service.createCompany(ownerUser.id, {
        name: 'AI',
      });

      expect(response.slug).toBe('ai-co');
      expect(response.slug.length).toBeGreaterThanOrEqual(3);
    });

    it('accepts a valid custom slug when provided', async () => {
      const response = await service.createCompany(ownerUser.id, {
        name: 'Globex Corporation',
        slug: 'globex-hq',
      });

      expect(response.slug).toBe('globex-hq');
    });

    it('rejects duplicate custom slug with ConflictException (409)', async () => {
      await service.createCompany(ownerUser.id, {
        name: 'Alpha Company',
        slug: 'alpha-org',
      });

      await expect(
        service.createCompany(secondUser.id, {
          name: 'Another Company',
          slug: 'alpha-org',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('rejects duplicate auto-generated slug with ConflictException (409)', async () => {
      await service.createCompany(ownerUser.id, {
        name: 'Duplicate Name Corp',
      });

      await expect(
        service.createCompany(secondUser.id, {
          name: 'Duplicate Name Corp',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('rejects invalid company names (too short or empty)', async () => {
      await expect(
        service.createCompany(ownerUser.id, {
          name: ' ',
        })
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createCompany(ownerUser.id, {
          name: 'A',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects company names exceeding 100 characters', async () => {
      const longName = 'A'.repeat(101);
      await expect(
        service.createCompany(ownerUser.id, {
          name: longName,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid slug formats', async () => {
      // Uppercase
      await expect(
        service.createCompany(ownerUser.id, {
          name: 'Acme Test',
          slug: 'ACME-SLUG',
        })
      ).rejects.toThrow(BadRequestException);

      // Leading hyphen
      await expect(
        service.createCompany(ownerUser.id, {
          name: 'Acme Test',
          slug: '-acme',
        })
      ).rejects.toThrow(BadRequestException);

      // Trailing hyphen
      await expect(
        service.createCompany(ownerUser.id, {
          name: 'Acme Test',
          slug: 'acme-',
        })
      ).rejects.toThrow(BadRequestException);

      // Consecutive hyphens
      await expect(
        service.createCompany(ownerUser.id, {
          name: 'Acme Test',
          slug: 'acme--corp',
        })
      ).rejects.toThrow(BadRequestException);

      // Special characters
      await expect(
        service.createCompany(ownerUser.id, {
          name: 'Acme Test',
          slug: 'acme$corp',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects reserved platform slugs', async () => {
      const reservedList = [
        'admin',
        'api',
        'app',
        'auth',
        'billing',
        'dashboard',
        'feedback',
        'help',
        'login',
        'mail',
        'portal',
        'public',
        'root',
        'signup',
        'status',
        'support',
        'system',
        'test',
        'web',
        'www',
      ];

      for (const reserved of reservedList) {
        await expect(
          service.createCompany(ownerUser.id, {
            name: `Reserved ${reserved}`,
            slug: reserved,
          })
        ).rejects.toThrow(BadRequestException);
      }
    });

    it('rolls back company creation if membership creation fails in transaction', async () => {
      // Simulate transaction failure by corrupting membership creation
      const originalCreate = prisma.companyMembership.create;
      prisma.companyMembership.create = (async () => {
        throw new Error('Simulated membership database constraint failure');
      }) as any;

      await expect(
        service.createCompany(ownerUser.id, {
          name: 'Rollback Inc',
          slug: 'rollback-inc',
        })
      ).rejects.toThrow('Simulated membership database constraint failure');

      // Verify Company was NOT saved in database due to atomic rollback
      const dbCompany = await prisma.company.findUnique({
        where: { slug: 'rollback-inc' },
      });
      expect(dbCompany).toBeNull();

      // Restore delegate
      prisma.companyMembership.create = originalCreate;
    });

    it('rejects company creation by unauthenticated user ID', async () => {
      await expect(
        service.createCompany('', { name: 'Anonymous Corp' })
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        service.createCompany('non-existent-user-id', { name: 'Ghost Corp' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects company creation for all non-ACTIVE user statuses and ensures no records are created', async () => {
      const nonActiveStatuses = ['PENDING', 'SUSPENDED', 'DEACTIVATED', 'DELETED', 'ARCHIVED', 'UNKNOWN_STATUS'];

      for (const status of nonActiveStatuses) {
        const testUser = await prisma.platformUser.create({
          data: {
            email: `user-${status.toLowerCase()}@example.com`,
            fullName: `${status} User`,
            passwordHash: 'hash',
            isEmailVerified: true,
            status,
          },
        });

        const slug = `slug-for-${status.toLowerCase()}`;
        await expect(
          service.createCompany(testUser.id, { name: `Company ${status}`, slug })
        ).rejects.toThrow(UnauthorizedException);

        // Fail-closed verification: ensure neither company nor membership was created
        const company = await prisma.company.findUnique({ where: { slug } });
        expect(company).toBeNull();

        const membership = await prisma.companyMembership.findFirst({
          where: { userId: testUser.id },
        });
        expect(membership).toBeNull();
      }
    });

    it('ignores client-supplied ownerId and strictly enforces authenticated user as OWNER', async () => {
      // Attacker attempts to pass a different ownerId in the payload
      const payloadWithAttackerOwner = {
        name: 'Security Test Co',
        ownerId: secondUser.id,
        userId: secondUser.id,
        role: 'ADMIN',
      };

      const response = await service.createCompany(ownerUser.id, payloadWithAttackerOwner);

      expect(response.role).toBe('OWNER');

      // Verify the database membership belongs to ownerUser, NOT secondUser
      const ownerMembership = await prisma.companyMembership.findUnique({
        where: {
          companyId_userId: {
            companyId: response.id,
            userId: ownerUser.id,
          },
        },
      });
      expect(ownerMembership).toBeDefined();
      expect(ownerMembership?.userId).toBe(ownerUser.id);
      expect(ownerMembership?.role).toBe('OWNER');

      // Verify secondUser was NOT assigned membership
      const attackerMembership = await prisma.companyMembership.findUnique({
        where: {
          companyId_userId: {
            companyId: response.id,
            userId: secondUser.id,
          },
        },
      });
      expect(attackerMembership).toBeNull();
    });
  });

  describe('Company Listing (getUserCompanies)', () => {
    it('returns empty array when user has no companies', async () => {
      const companies = await service.getUserCompanies(ownerUser.id);
      expect(companies).toEqual([]);
    });

    it('returns only the companies the user belongs to', async () => {
      // User 1 creates Company 1
      const comp1 = await service.createCompany(ownerUser.id, {
        name: 'First Company',
        slug: 'first-comp',
      });

      // User 2 creates Company 2
      const comp2 = await service.createCompany(secondUser.id, {
        name: 'Second Company',
        slug: 'second-comp',
      });

      // User 1 queries their companies
      const user1Companies = await service.getUserCompanies(ownerUser.id);
      expect(user1Companies).toHaveLength(1);
      expect(user1Companies[0].id).toBe(comp1.id);
      expect(user1Companies[0].name).toBe('First Company');
      expect(user1Companies[0].slug).toBe('first-comp');
      expect(user1Companies[0].role).toBe('OWNER');

      // User 2 queries their companies
      const user2Companies = await service.getUserCompanies(secondUser.id);
      expect(user2Companies).toHaveLength(1);
      expect(user2Companies[0].id).toBe(comp2.id);
      expect(user2Companies[0].name).toBe('Second Company');
      expect(user2Companies[0].slug).toBe('second-comp');
      expect(user2Companies[0].role).toBe('OWNER');
    });

    it('returns all companies when user has multiple memberships with different roles', async () => {
      // Owner creates Company A
      const compA = await service.createCompany(ownerUser.id, {
        name: 'Company Alpha',
        slug: 'comp-alpha',
      });

      // Owner creates Company B
      const compB = await service.createCompany(ownerUser.id, {
        name: 'Company Beta',
        slug: 'comp-beta',
      });

      expect(compA.id).toBeDefined();
      expect(compB.id).toBeDefined();

      // Second user creates Company C, then owner is added to Company C as ADMIN
      const compC = await service.createCompany(secondUser.id, {
        name: 'Company Gamma',
        slug: 'comp-gamma',
      });

      await prisma.companyMembership.create({
        data: {
          companyId: compC.id,
          userId: ownerUser.id,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });

      const ownerCompanies = await service.getUserCompanies(ownerUser.id);
      expect(ownerCompanies).toHaveLength(3);

      const roles = ownerCompanies.map((c) => ({ slug: c.slug, role: c.role }));
      expect(roles).toContainEqual({ slug: 'comp-alpha', role: 'OWNER' });
      expect(roles).toContainEqual({ slug: 'comp-beta', role: 'OWNER' });
      expect(roles).toContainEqual({ slug: 'comp-gamma', role: 'ADMIN' });
    });

    it('excludes suspended or inactive memberships and handles company lifecycle fail-closed', async () => {
      // 1. Suspended membership
      const comp1 = await service.createCompany(ownerUser.id, {
        name: 'Comp Suspended Member',
        slug: 'comp-susp-member',
      });
      const membership1 = await prisma.companyMembership.findUnique({
        where: { companyId_userId: { companyId: comp1.id, userId: ownerUser.id } },
      });
      await prisma.companyMembership.update({
        where: { id: membership1!.id },
        data: { status: 'SUSPENDED' },
      });

      // 2. Invited membership
      const comp2 = await service.createCompany(ownerUser.id, {
        name: 'Comp Invited Member',
        slug: 'comp-inv-member',
      });
      const membership2 = await prisma.companyMembership.findUnique({
        where: { companyId_userId: { companyId: comp2.id, userId: ownerUser.id } },
      });
      await prisma.companyMembership.update({
        where: { id: membership2!.id },
        data: { status: 'INVITED' },
      });

      // 3. Company with status SUSPENDED
      const comp3 = await service.createCompany(ownerUser.id, {
        name: 'Comp Status Suspended',
        slug: 'comp-status-susp',
      });
      await prisma.company.update({
        where: { id: comp3.id },
        data: { status: 'SUSPENDED' },
      });

      // 4. Company with isActive = false
      const comp4 = await service.createCompany(ownerUser.id, {
        name: 'Comp Inactive Flag',
        slug: 'comp-inactive-flag',
      });
      await prisma.company.update({
        where: { id: comp4.id },
        data: { isActive: false },
      });

      // 5. Company with unexpected status
      const comp5 = await service.createCompany(ownerUser.id, {
        name: 'Comp Unexpected Status',
        slug: 'comp-unexp-status',
      });
      await prisma.company.update({
        where: { id: comp5.id },
        data: { status: 'DECOMMISSIONED' },
      });

      // 6. Valid ACTIVE company with ACTIVE membership
      const comp6 = await service.createCompany(ownerUser.id, {
        name: 'Comp Fully Active',
        slug: 'comp-fully-active',
      });

      // Query listings: ONLY comp6 should be returned
      const companies = await service.getUserCompanies(ownerUser.id);
      expect(companies).toHaveLength(1);
      expect(companies[0].id).toBe(comp6.id);
      expect(companies[0].slug).toBe('comp-fully-active');
      expect(companies[0].status).toBe('ACTIVE');
    });

    it('excludes membership when associated company relation is missing', async () => {
      // Create valid membership pointing to non-existent company
      await prisma.companyMembership.create({
        data: {
          companyId: 'non-existent-comp-id-1234',
          userId: ownerUser.id,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      });

      const companies = await service.getUserCompanies(ownerUser.id);
      expect(companies).toHaveLength(0);
    });

    it('does not expose sensitive internal fields or other users in company listing', async () => {
      await service.createCompany(ownerUser.id, {
        name: 'Safe Output Co',
        slug: 'safe-output-co',
      });

      const companies = await service.getUserCompanies(ownerUser.id);
      expect(companies).toHaveLength(1);

      const company = companies[0];
      const keys = Object.keys(company);

      // Verify allowed fields
      expect(keys).toContain('id');
      expect(keys).toContain('name');
      expect(keys).toContain('slug');
      expect(keys).toContain('role');

      // Verify no sensitive fields leaked
      const record = company as unknown as Record<string, unknown>;
      expect(record.passwordHash).toBeUndefined();
      expect(record.sessionToken).toBeUndefined();
      expect(record.tokens).toBeUndefined();
      expect(record.users).toBeUndefined();
    });
  });
});
