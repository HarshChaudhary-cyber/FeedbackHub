/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import { PrismaClient } from '@feedbackhub/database';

const hasRealPostgres = Boolean(process.env.DATABASE_URL_REAL);

describe.skipIf(!hasRealPostgres)('PostgreSQL Row-Level Security (RLS) Integration Tests', () => {
  let prisma: PrismaClient;
  let tenantA: any;
  let tenantB: any;
  let userA: any;
  let userB: any;
  let userPreMember: any;
  let invitationA: any;
  let rawTokenA: string;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL_REAL },
      },
    });
    await prisma.$connect();

    // 1. Create Tenant A and User A
    tenantA = await prisma.company.create({
      data: {
        name: 'Tenant Alpha (RLS)',
        slug: `alpha-rls-${Date.now()}`,
        status: 'ACTIVE',
        isActive: true,
      },
    });

    userA = await prisma.platformUser.create({
      data: {
        email: `usera-${Date.now()}@alpha.com`,
        fullName: 'User Alpha',
        passwordHash: 'hash',
        isEmailVerified: true,
        status: 'ACTIVE',
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA.id}, true)`;
      await tx.companyMembership.create({
        data: {
          companyId: tenantA.id,
          userId: userA.id,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      });
    });

    // 2. Create Tenant B and User B
    tenantB = await prisma.company.create({
      data: {
        name: 'Tenant Beta (RLS)',
        slug: `beta-rls-${Date.now()}`,
        status: 'ACTIVE',
        isActive: true,
      },
    });

    userB = await prisma.platformUser.create({
      data: {
        email: `userb-${Date.now()}@beta.com`,
        fullName: 'User Beta',
        passwordHash: 'hash',
        isEmailVerified: true,
        status: 'ACTIVE',
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantB.id}, true)`;
      await tx.companyMembership.create({
        data: {
          companyId: tenantB.id,
          userId: userB.id,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      });
    });

    // 3. Create Pre-membership invitee user (not a member of any company yet)
    userPreMember = await prisma.platformUser.create({
      data: {
        email: `invitee-${Date.now()}@invited.com`,
        fullName: 'Pre-membership Invitee',
        passwordHash: 'hash',
        isEmailVerified: true,
        status: 'ACTIVE',
      },
    });

    // 4. Create an invitation in Tenant A
    rawTokenA = crypto.randomBytes(32).toString('hex');
    const tokenHashA = crypto.createHash('sha256').update(rawTokenA).digest('hex');

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA.id}, true)`;
      invitationA = await tx.companyInvitation.create({
        data: {
          companyId: tenantA.id,
          invitedByUserId: userA.id,
          email: userPreMember.email,
          role: 'MANAGER',
          tokenHash: tokenHashA,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    });
  });

  afterAll(async () => {
    if (prisma) {
      // Clean up Tenant A records within Tenant A context
      if (tenantA) {
        await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA.id}, true)`;
          await tx.companyInvitation.deleteMany({ where: { companyId: tenantA.id } });
          await tx.companyMembership.deleteMany({ where: { companyId: tenantA.id } });
          await tx.company.delete({ where: { id: tenantA.id } });
        });
      }

      // Clean up Tenant B records within Tenant B context
      if (tenantB) {
        await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantB.id}, true)`;
          await tx.companyMembership.deleteMany({ where: { companyId: tenantB.id } });
          await tx.company.delete({ where: { id: tenantB.id } });
        });
      }

      // Clean up platform users
      if (userA) await prisma.platformUser.delete({ where: { id: userA.id } }).catch(() => {});
      if (userB) await prisma.platformUser.delete({ where: { id: userB.id } }).catch(() => {});
      if (userPreMember) await prisma.platformUser.delete({ where: { id: userPreMember.id } }).catch(() => {});

      await prisma.$disconnect();
    }
  });

  describe('Tenant Membership RLS Isolation', () => {
    it('enforces that Tenant A context can only query Tenant A memberships', async () => {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA.id}, true)`;

        const memberships = await tx.companyMembership.findMany();
        expect(memberships.length).toBeGreaterThan(0);
        for (const m of memberships) {
          expect(m.companyId).toBe(tenantA.id);
          expect(m.companyId).not.toBe(tenantB.id);
        }
      });
    });

    it('enforces that Tenant A context cannot read, update, or delete Tenant B memberships', async () => {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA.id}, true)`;

        // Read Tenant B's membership row -> should return null
        const crossTenantRead = await tx.companyMembership.findFirst({
          where: { companyId: tenantB.id },
        });
        expect(crossTenantRead).toBeNull();

        // Update Tenant B's membership row -> should affect 0 rows
        const crossTenantUpdate = await tx.companyMembership.updateMany({
          where: { companyId: tenantB.id },
          data: { role: 'MANAGER' },
        });
        expect(crossTenantUpdate.count).toBe(0);

        // Delete Tenant B's membership row -> should affect 0 rows
        const crossTenantDelete = await tx.companyMembership.deleteMany({
          where: { companyId: tenantB.id },
        });
        expect(crossTenantDelete.count).toBe(0);
      });
    });

    it('fails closed when tenant context is missing (returns 0 rows for un-scoped queries)', async () => {
      await prisma.$transaction(async (tx) => {
        // No app.current_tenant_id and no app.current_user_id set!
        const memberships = await tx.companyMembership.findMany();
        expect(memberships).toEqual([]);
      });
    });

    it('allows a user to query their own memberships across tenants using platform user context', async () => {
      await prisma.$transaction(async (tx) => {
        // Platform user context: app.current_user_id set, no app.current_tenant_id
        await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userA.id}, true)`;

        const userMemberships = await tx.companyMembership.findMany();
        expect(userMemberships.length).toBeGreaterThan(0);
        for (const m of userMemberships) {
          expect(m.userId).toBe(userA.id);
          expect(m.userId).not.toBe(userB.id);
        }
      });
    });
  });

  describe('Company Invitation RLS & Pre-Membership Acceptance', () => {
    it('enforces that Tenant A context can access Tenant A invitations but not Tenant B invitations', async () => {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA.id}, true)`;

        const invitations = await tx.companyInvitation.findMany();
        expect(invitations.length).toBeGreaterThan(0);
        for (const inv of invitations) {
          expect(inv.companyId).toBe(tenantA.id);
        }

        // Attempting to query Tenant B invitations returns empty
        const crossInv = await tx.companyInvitation.findMany({
          where: { companyId: tenantB.id },
        });
        expect(crossInv).toEqual([]);
      });
    });

    it('enforces that Tenant B context cannot see, revoke, or mutate Tenant A invitations', async () => {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantB.id}, true)`;

        const inv = await tx.companyInvitation.findUnique({
          where: { id: invitationA.id },
        });
        expect(inv).toBeNull();

        const updateRes = await tx.companyInvitation.updateMany({
          where: { id: invitationA.id },
          data: { status: 'REVOKED' },
        });
        expect(updateRes.count).toBe(0);
      });
    });

    it('allows a pre-membership user to resolve and accept an invitation under app.invitation_token_hash', async () => {
      const tokenHash = crypto.createHash('sha256').update(rawTokenA).digest('hex');

      // Pre-membership acceptance workflow
      await prisma.$transaction(async (tx) => {
        // 1. Set invitation token context (pre-membership pathway)
        await tx.$executeRaw`SELECT set_config('app.invitation_token_hash', ${tokenHash}, true)`;
        await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userPreMember.id}, true)`;

        // Resolve invitation by tokenHash
        const resolved = await tx.companyInvitation.findUnique({
          where: { tokenHash },
        });
        expect(resolved).toBeDefined();
        expect(resolved?.id).toBe(invitationA.id);
        expect(resolved?.email).toBe(userPreMember.email);

        // 2. Transition transaction into tenant context
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${resolved!.companyId}, true)`;

        // Mark accepted
        const acceptUpdate = await tx.companyInvitation.updateMany({
          where: { id: resolved!.id, status: 'PENDING' },
          data: { status: 'ACCEPTED' },
        });
        expect(acceptUpdate.count).toBe(1);

        // Create membership
        const createdMembership = await tx.companyMembership.create({
          data: {
            companyId: resolved!.companyId,
            userId: userPreMember.id,
            role: resolved!.role,
            status: 'ACTIVE',
          },
        });
        expect(createdMembership.status).toBe('ACTIVE');
        expect(createdMembership.role).toBe('MANAGER');
      });

      // Verify that after acceptance, the new member can access Tenant A within Tenant A context
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA.id}, true)`;
        const memberRow = await tx.companyMembership.findUnique({
          where: {
            companyId_userId: {
              companyId: tenantA.id,
              userId: userPreMember.id,
            },
          },
        });
        expect(memberRow).toBeDefined();
        expect(memberRow?.status).toBe('ACTIVE');
      });
    });

    it('fails closed when invitation token context is missing (returns 0 invitations)', async () => {
      await prisma.$transaction(async (tx) => {
        // No tenant context and no token hash set
        const invitations = await tx.companyInvitation.findMany();
        expect(invitations).toEqual([]);
      });
    });

    it('persists EXPIRED status under app.invitation_token_hash when an expired invitation is processed and commits without rollback', async () => {
      const expiredRawToken = crypto.randomBytes(32).toString('hex');
      const expiredTokenHash = crypto.createHash('sha256').update(expiredRawToken).digest('hex');

      const expiredInv = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA.id}, true)`;
        return tx.companyInvitation.create({
          data: {
            companyId: tenantA.id,
            invitedByUserId: userA.id,
            email: 'expired-pg-test@example.com',
            role: 'MANAGER',
            tokenHash: expiredTokenHash,
            status: 'PENDING',
            expiresAt: new Date(Date.now() - 10_000),
          },
        });
      });

      // Execute atomic conditional expiration update under token hash context
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.invitation_token_hash', ${expiredTokenHash}, true)`;
        const now = new Date();
        const updateRes = await tx.companyInvitation.updateMany({
          where: {
            id: expiredInv.id,
            tokenHash: expiredTokenHash,
            status: 'PENDING',
            expiresAt: { lte: now },
          },
          data: { status: 'EXPIRED' },
        });
        expect(updateRes.count).toBe(1);
      });

      // Confirm committed status is EXPIRED under Tenant A context
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA.id}, true)`;
        const persisted = await tx.companyInvitation.findUnique({
          where: { id: expiredInv.id },
        });
        expect(persisted?.status).toBe('EXPIRED');
      });
    });
  });

  describe('Tenant Context Transaction Isolation & Connection Pooling', () => {
    it('sets context strictly inside transaction and clears immediately upon commit/rollback', async () => {
      // 1. Transaction sets context
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA.id}, true)`;
        const val = await tx.$queryRaw<Array<{ current_setting: string }>>`SELECT current_setting('app.current_tenant_id', true)`;
        expect(val[0].current_setting).toBe(tenantA.id);
      });

      // 2. Next transaction on connection pool must see empty setting
      await prisma.$transaction(async (tx) => {
        const val = await tx.$queryRaw<Array<{ current_setting: string }>>`SELECT current_setting('app.current_tenant_id', true)`;
        expect(val[0].current_setting === '' || val[0].current_setting === null).toBe(true);
      });
    });

    it('clears context immediately upon transaction rollback', async () => {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA.id}, true)`;
          throw new Error('Intentional Rollback');
        });
      } catch (err: any) {
        expect(err.message).toBe('Intentional Rollback');
      }

      // Next transaction must see empty setting
      await prisma.$transaction(async (tx) => {
        const val = await tx.$queryRaw<Array<{ current_setting: string }>>`SELECT current_setting('app.current_tenant_id', true)`;
        expect(val[0].current_setting === '' || val[0].current_setting === null).toBe(true);
      });
    });

    it('maintains independent contexts across concurrent transactions without cross-contamination', async () => {
      const taskA = prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA.id}, true)`;
        // Artificial delay to allow concurrent execution overlap
        await new Promise((resolve) => setTimeout(resolve, 50));
        const val = await tx.$queryRaw<Array<{ current_setting: string }>>`SELECT current_setting('app.current_tenant_id', true)`;
        return val[0].current_setting;
      });

      const taskB = prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantB.id}, true)`;
        await new Promise((resolve) => setTimeout(resolve, 50));
        const val = await tx.$queryRaw<Array<{ current_setting: string }>>`SELECT current_setting('app.current_tenant_id', true)`;
        return val[0].current_setting;
      });

      const [resA, resB] = await Promise.all([taskA, taskB]);
      expect(resA).toBe(tenantA.id);
      expect(resB).toBe(tenantB.id);
    });
  });

  describe('Analytics APIs Row-Level Security (RLS) Integration', () => {
    let analyticsService: any;
    let formA: any;
    let formB: any;
    let questionA: any;

    beforeAll(async () => {
      const { AnalyticsService } = await import('../../analytics/analytics.service');
      const { PrismaService } = await import('../../prisma/prisma.service');
      const apiPrisma = new PrismaService();
      (apiPrisma as any).isInMemory = false;
      analyticsService = new AnalyticsService(apiPrisma);

      // Seed form for Tenant A under Tenant A context
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA.id}, true)`;
        formA = await tx.feedbackForm.create({
          data: {
            companyId: tenantA.id,
            title: 'Tenant Alpha CSAT',
            slug: `alpha-csat-${Date.now()}`,
            status: 'PUBLISHED',
          },
        });

        questionA = await tx.formQuestion.create({
          data: {
            formId: formA.id,
            questionType: 'RATING',
            title: 'Rate your experience',
            orderIndex: 0,
            validationRules: { minRating: 1, maxRating: 5 },
          },
        });

        const respA = await tx.feedbackResponse.create({
          data: {
            companyId: tenantA.id,
            formId: formA.id,
            submissionToken: `tok_a_${Date.now()}`,
            isAnonymous: true,
          },
        });

        await tx.feedbackAnswer.create({
          data: {
            responseId: respA.id,
            questionId: questionA.id,
            questionTitle: 'Rate your experience',
            questionType: 'RATING',
            numberValue: 5,
          },
        });
      });

      // Seed form for Tenant B under Tenant B context
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantB.id}, true)`;
        formB = await tx.feedbackForm.create({
          data: {
            companyId: tenantB.id,
            title: 'Tenant Beta Feedback',
            slug: `beta-feedback-${Date.now()}`,
            status: 'PUBLISHED',
          },
        });

        await tx.feedbackResponse.create({
          data: {
            companyId: tenantB.id,
            formId: formB.id,
            submissionToken: `tok_b_${Date.now()}`,
            isAnonymous: true,
          },
        });
      });
    });

    it('allows Tenant A to retrieve its own analytics with correct response counts', async () => {
      const overviewA = await analyticsService.getOverview(tenantA.id, {});
      expect(overviewA.totalResponses).toBe(1);
      expect(overviewA.publishedFormsCount).toBeGreaterThanOrEqual(1);
      expect(overviewA.averageRating).toBe(5);
    });

    it('allows Tenant B to retrieve its own analytics strictly isolated from Tenant A', async () => {
      const overviewB = await analyticsService.getOverview(tenantB.id, {});
      expect(overviewB.totalResponses).toBe(1);
    });

    it('prevents Tenant A from retrieving question analytics for Tenant B form', async () => {
      await expect(
        analyticsService.getQuestionAnalytics(tenantA.id, formB.id, { formId: formB.id })
      ).rejects.toThrow();
    });

    it('fails closed when tenantId is missing or empty', async () => {
      await expect(analyticsService.getOverview('', {})).rejects.toThrow();
    });
  });
});
