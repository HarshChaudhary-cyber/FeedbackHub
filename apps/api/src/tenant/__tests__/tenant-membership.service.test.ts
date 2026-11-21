/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { TenantMembershipService } from '../tenant-membership.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

describe('TenantMembershipService', () => {
  let service: TenantMembershipService;
  let prisma: PrismaService;
  let company: any;
  let ownerUser: any;
  let adminUser: any;
  let managerUser: any;
  let secondAdminUser: any;
  let ownerMembership: any;
  let adminMembership: any;
  let managerMembership: any;
  let secondAdminMembership: any;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    prisma = new PrismaService();
    prisma.isInMemory = true;
    prisma.resetMemoryStore();

    service = new TenantMembershipService(prisma);

    // Create Company
    company = await prisma.company.create({
      data: {
        name: 'Nexus Tech',
        slug: 'nexus-tech',
        status: 'ACTIVE',
        isActive: true,
      },
    });

    // Create Users
    ownerUser = await prisma.platformUser.create({
      data: {
        email: 'owner@nexus.com',
        fullName: 'Nexus Owner',
        passwordHash: 'hash',
        isEmailVerified: true,
        status: 'ACTIVE',
      },
    });

    adminUser = await prisma.platformUser.create({
      data: {
        email: 'admin@nexus.com',
        fullName: 'Nexus Admin',
        passwordHash: 'hash',
        isEmailVerified: true,
        status: 'ACTIVE',
      },
    });

    secondAdminUser = await prisma.platformUser.create({
      data: {
        email: 'admin2@nexus.com',
        fullName: 'Nexus Admin Two',
        passwordHash: 'hash',
        isEmailVerified: true,
        status: 'ACTIVE',
      },
    });

    managerUser = await prisma.platformUser.create({
      data: {
        email: 'manager@nexus.com',
        fullName: 'Nexus Manager',
        passwordHash: 'hash',
        isEmailVerified: true,
        status: 'ACTIVE',
      },
    });

    // Create Memberships
    ownerMembership = await prisma.companyMembership.create({
      data: {
        companyId: company.id,
        userId: ownerUser.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    adminMembership = await prisma.companyMembership.create({
      data: {
        companyId: company.id,
        userId: adminUser.id,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    secondAdminMembership = await prisma.companyMembership.create({
      data: {
        companyId: company.id,
        userId: secondAdminUser.id,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    managerMembership = await prisma.companyMembership.create({
      data: {
        companyId: company.id,
        userId: managerUser.id,
        role: 'MANAGER',
        status: 'ACTIVE',
      },
    });
  });

  describe('Member Listing', () => {
    it('returns all company members with safe fields only', async () => {
      const members = await service.getCompanyMembers(company.id, 'OWNER');
      expect(members).toHaveLength(4);

      for (const m of members) {
        expect(m.id).toBeDefined();
        expect(m.companyId).toBe(company.id);
        expect(m.email).toBeDefined();
        expect(m.fullName).toBeDefined();
        expect(m.role).toBeDefined();
        expect(m.status).toBe('ACTIVE');

        // Verify security: no hashes or tokens exposed
        const record = m as unknown as Record<string, unknown>;
        expect(record.passwordHash).toBeUndefined();
        expect(record.token).toBeUndefined();
        expect(record.sessionToken).toBeUndefined();
      }
    });
  });

  describe('Member Role Management & Hierarchy Rules', () => {
    it('allows OWNER to promote MANAGER to ADMIN', async () => {
      const result = await service.updateMemberRole(
        company.id,
        ownerUser.id,
        'OWNER',
        managerMembership.id,
        { role: 'ADMIN' }
      );

      expect(result.role).toBe('ADMIN');

      const updatedDb = await prisma.companyMembership.findUnique({
        where: { id: managerMembership.id },
      });
      expect(updatedDb?.role).toBe('ADMIN');
    });

    it('prevents demoting or modifying the company OWNER role (Owner Protection)', async () => {
      await expect(
        service.updateMemberRole(
          company.id,
          adminUser.id,
          'ADMIN',
          ownerMembership.id,
          { role: 'MANAGER' }
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('prevents ADMIN from elevating roles to OWNER', async () => {
      await expect(
        service.updateMemberRole(
          company.id,
          adminUser.id,
          'ADMIN',
          managerMembership.id,
          { role: 'OWNER' }
        )
      ).rejects.toThrow();
    });

    it('prevents members from modifying their own role', async () => {
      await expect(
        service.updateMemberRole(
          company.id,
          adminUser.id,
          'ADMIN',
          adminMembership.id,
          { role: 'MANAGER' }
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('prevents ADMIN from modifying another ADMIN role (peer protection)', async () => {
      await expect(
        service.updateMemberRole(
          company.id,
          adminUser.id,
          'ADMIN',
          secondAdminMembership.id,
          { role: 'MANAGER' }
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Member Status Management (Suspension)', () => {
    it('allows OWNER to suspend a member', async () => {
      const updated = await service.updateMemberStatus(
        company.id,
        ownerUser.id,
        'OWNER',
        managerMembership.id,
        { status: 'SUSPENDED' }
      );

      expect(updated.status).toBe('SUSPENDED');
    });

    it('prevents suspending the company OWNER (Owner Protection)', async () => {
      await expect(
        service.updateMemberStatus(
          company.id,
          adminUser.id,
          'ADMIN',
          ownerMembership.id,
          { status: 'SUSPENDED' }
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('prevents members from suspending themselves', async () => {
      await expect(
        service.updateMemberStatus(
          company.id,
          adminUser.id,
          'ADMIN',
          adminMembership.id,
          { status: 'SUSPENDED' }
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('prevents ADMIN from suspending another ADMIN', async () => {
      await expect(
        service.updateMemberStatus(
          company.id,
          adminUser.id,
          'ADMIN',
          secondAdminMembership.id,
          { status: 'SUSPENDED' }
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Member Removal', () => {
    it('allows OWNER to remove a member', async () => {
      const result = await service.removeMember(
        company.id,
        ownerUser.id,
        'OWNER',
        managerMembership.id
      );

      expect(result.message).toContain('successfully removed');

      const deleted = await prisma.companyMembership.findUnique({
        where: { id: managerMembership.id },
      });
      expect(deleted).toBeNull();
    });

    it('prevents removing the company OWNER (cannot leave company ownerless)', async () => {
      await expect(
        service.removeMember(
          company.id,
          ownerUser.id,
          'OWNER',
          ownerMembership.id
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows a member to voluntarily leave the company if not OWNER', async () => {
      const result = await service.removeMember(
        company.id,
        adminUser.id,
        'ADMIN',
        adminMembership.id
      );

      expect(result.message).toContain('successfully removed');
    });

    it('prevents ADMIN from removing another ADMIN', async () => {
      await expect(
        service.removeMember(
          company.id,
          adminUser.id,
          'ADMIN',
          secondAdminMembership.id
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Ownership Transfer', () => {
    it('atomically transfers ownership to an active member', async () => {
      const result = await service.transferOwnership(company.id, ownerUser.id, {
        targetUserId: adminUser.id,
        retainedRole: 'ADMIN',
      });

      expect(result.newOwnerId).toBe(adminUser.id);

      // Verify previous owner is now ADMIN
      const prevOwnerMem = await prisma.companyMembership.findUnique({
        where: { id: ownerMembership.id },
      });
      expect(prevOwnerMem?.role).toBe('ADMIN');

      // Verify target member is now OWNER
      const newOwnerMem = await prisma.companyMembership.findUnique({
        where: { id: adminMembership.id },
      });
      expect(newOwnerMem?.role).toBe('OWNER');
    });

    it('rejects ownership transfer if caller is not the company OWNER', async () => {
      await expect(
        service.transferOwnership(company.id, adminUser.id, {
          targetUserId: managerUser.id,
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects ownership transfer to target user who is not an active member', async () => {
      const externalUser = await prisma.platformUser.create({
        data: {
          email: 'external@example.com',
          fullName: 'External Person',
          passwordHash: 'hash',
          isEmailVerified: true,
          status: 'ACTIVE',
        },
      });

      await expect(
        service.transferOwnership(company.id, ownerUser.id, {
          targetUserId: externalUser.id,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects ownership transfer to self', async () => {
      await expect(
        service.transferOwnership(company.id, ownerUser.id, {
          targetUserId: ownerUser.id,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Invitations & Member Acceptance Lifecycle', () => {
    it('creates invitation with secure random token and hashed storage', async () => {
      const result = await service.createInvitation(
        company.id,
        ownerUser.id,
        'OWNER',
        {
          email: 'newhire@nexus.com',
          role: 'MANAGER',
        }
      );

      expect(result.id).toBeDefined();
      expect(result.email).toBe('newhire@nexus.com');
      expect(result.role).toBe('MANAGER');
      expect(result.status).toBe('PENDING');
      expect(result.invitationToken).toBeDefined();
      expect(result.invitationToken?.length).toBe(64);

      // Verify database stored SHA-256 hash, NOT raw token
      const dbInv = await prisma.companyInvitation.findUnique({
        where: { id: result.id },
      });
      expect(dbInv?.tokenHash).not.toBe(result.invitationToken);
      expect(dbInv?.tokenHash.length).toBe(64);
    });

    it('rejects duplicate pending invitation for the same email', async () => {
      await service.createInvitation(company.id, ownerUser.id, 'OWNER', {
        email: 'duplicate.invite@nexus.com',
        role: 'MANAGER',
      });

      await expect(
        service.createInvitation(company.id, ownerUser.id, 'OWNER', {
          email: 'duplicate.invite@nexus.com',
          role: 'ADMIN',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('rejects invitation if user is already an active member of the company', async () => {
      await expect(
        service.createInvitation(company.id, ownerUser.id, 'OWNER', {
          email: 'admin@nexus.com',
          role: 'MANAGER',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('accepts invitation and establishes active membership for matching authenticated user', async () => {
      const inviteResult = await service.createInvitation(
        company.id,
        ownerUser.id,
        'OWNER',
        {
          email: 'invitee@nexus.com',
          role: 'ADMIN',
        }
      );

      const inviteeUser = await prisma.platformUser.create({
        data: {
          email: 'invitee@nexus.com',
          fullName: 'Invitee Candidate',
          passwordHash: 'hash',
          isEmailVerified: true,
          status: 'ACTIVE',
        },
      });

      const acceptResult = await service.acceptInvitation(
        inviteeUser.id,
        inviteeUser.email,
        { token: inviteResult.invitationToken! }
      );

      expect(acceptResult.companyId).toBe(company.id);
      expect(acceptResult.role).toBe('ADMIN');

      // Verify membership created in database
      const membership = await prisma.companyMembership.findUnique({
        where: {
          companyId_userId: {
            companyId: company.id,
            userId: inviteeUser.id,
          },
        },
      });
      expect(membership).toBeDefined();
      expect(membership?.role).toBe('ADMIN');
      expect(membership?.status).toBe('ACTIVE');

      // Verify invitation status updated to ACCEPTED
      const dbInv = await prisma.companyInvitation.findUnique({
        where: { id: inviteResult.id },
      });
      expect(dbInv?.status).toBe('ACCEPTED');
    });

    it('rejects invitation acceptance if caller email does not match invitation email (Identity Protection)', async () => {
      const inviteResult = await service.createInvitation(
        company.id,
        ownerUser.id,
        'OWNER',
        {
          email: 'targeted.person@nexus.com',
          role: 'MANAGER',
        }
      );

      const attackerUser = await prisma.platformUser.create({
        data: {
          email: 'attacker@nexus.com',
          fullName: 'Attacker Impersonator',
          passwordHash: 'hash',
          isEmailVerified: true,
          status: 'ACTIVE',
        },
      });

      await expect(
        service.acceptInvitation(attackerUser.id, attackerUser.email, {
          token: inviteResult.invitationToken!,
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects expired invitation token', async () => {
      const inviteResult = await service.createInvitation(
        company.id,
        ownerUser.id,
        'OWNER',
        {
          email: 'expired.candidate@nexus.com',
          role: 'MANAGER',
        }
      );

      // Artificially expire the token in database
      await prisma.companyInvitation.update({
        where: { id: inviteResult.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const user = await prisma.platformUser.create({
        data: {
          email: 'expired.candidate@nexus.com',
          fullName: 'Expired Candidate',
          passwordHash: 'hash',
          isEmailVerified: true,
          status: 'ACTIVE',
        },
      });

      await expect(
        service.acceptInvitation(user.id, user.email, {
          token: inviteResult.invitationToken!,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('revokes an invitation and prevents acceptance', async () => {
      const inviteResult = await service.createInvitation(
        company.id,
        ownerUser.id,
        'OWNER',
        {
          email: 'revocation.candidate@nexus.com',
          role: 'MANAGER',
        }
      );

      // Revoke invitation
      const revokeRes = await service.revokeInvitation(
        company.id,
        'OWNER',
        inviteResult.id
      );
      expect(revokeRes.message).toContain('successfully revoked');

      const user = await prisma.platformUser.create({
        data: {
          email: 'revocation.candidate@nexus.com',
          fullName: 'Revocation Candidate',
          passwordHash: 'hash',
          isEmailVerified: true,
          status: 'ACTIVE',
        },
      });

      await expect(
        service.acceptInvitation(user.id, user.email, {
          token: inviteResult.invitationToken!,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });
});
