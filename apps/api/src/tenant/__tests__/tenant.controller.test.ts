/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { TenantController } from '../tenant.controller';
import { TenantMembershipService } from '../tenant-membership.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TenantController', () => {
  let controller: TenantController;
  let service: TenantMembershipService;
  let prisma: PrismaService;
  let company: any;
  let ownerUser: any;
  let adminUser: any;
  let _ownerMembership: any;
  let _adminMembership: any;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    prisma = new PrismaService();
    prisma.isInMemory = true;
    prisma.resetMemoryStore();

    service = new TenantMembershipService(prisma);
    controller = new TenantController(service);

    company = await prisma.company.create({
      data: {
        name: 'Apex Group',
        slug: 'apex-group',
        status: 'ACTIVE',
        isActive: true,
      },
    });

    ownerUser = await prisma.platformUser.create({
      data: {
        email: 'owner@apex.com',
        fullName: 'Apex Owner',
        passwordHash: 'hash',
        isEmailVerified: true,
        status: 'ACTIVE',
      },
    });

    adminUser = await prisma.platformUser.create({
      data: {
        email: 'admin@apex.com',
        fullName: 'Apex Admin',
        passwordHash: 'hash',
        isEmailVerified: true,
        status: 'ACTIVE',
      },
    });

    _ownerMembership = await prisma.companyMembership.create({
      data: {
        companyId: company.id,
        userId: ownerUser.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    _adminMembership = await prisma.companyMembership.create({
      data: {
        companyId: company.id,
        userId: adminUser.id,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
  });

  describe('Endpoints', () => {
    it('GET /tenant/context returns tenant context and caller role', async () => {
      const mockTenant: any = {
        companyId: company.id,
        companySlug: 'apex-group',
        companyName: 'Apex Group',
        companyStatus: 'ACTIVE',
        membershipRole: 'OWNER',
      };

      const result = await controller.getTenantContext(mockTenant);
      expect(result.tenant.companySlug).toBe('apex-group');
      expect(result.role).toBe('OWNER');
    });

    it('GET /tenant/members returns member list', async () => {
      const members = await controller.getMembers(company.id, 'OWNER');
      expect(members).toHaveLength(2);
      expect(members.map((m) => m.email)).toContain('owner@apex.com');
      expect(members.map((m) => m.email)).toContain('admin@apex.com');
    });

    it('POST /tenant/invitations creates invitation', async () => {
      const result = await controller.createInvitation(
        company.id,
        ownerUser.id,
        'OWNER',
        {
          email: 'controller.invitee@apex.com',
          role: 'MANAGER',
        }
      );

      expect(result.email).toBe('controller.invitee@apex.com');
      expect(result.role).toBe('MANAGER');
      expect(result.invitationToken).toBeDefined();
    });

    it('POST /tenant/invitations/accept accepts invitation', async () => {
      const invite = await controller.createInvitation(
        company.id,
        ownerUser.id,
        'OWNER',
        {
          email: 'acceptor@apex.com',
          role: 'MANAGER',
        }
      );

      const acceptorUser = await prisma.platformUser.create({
        data: {
          email: 'acceptor@apex.com',
          fullName: 'Acceptor Candidate',
          passwordHash: 'hash',
          isEmailVerified: true,
          status: 'ACTIVE',
        },
      });

      const acceptRes = await controller.acceptInvitation(
        acceptorUser.id,
        acceptorUser.email,
        { token: invite.invitationToken }
      );

      expect(acceptRes.companyId).toBe(company.id);
      expect(acceptRes.role).toBe('MANAGER');
    });

    it('POST /tenant/transfer-ownership transfers ownership', async () => {
      const res = await controller.transferOwnership(
        company.id,
        ownerUser.id,
        { targetUserId: adminUser.id, retainedRole: 'ADMIN' }
      );

      expect(res.newOwnerId).toBe(adminUser.id);
    });
  });
});
