/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@feedbackhub/database';

const hasRealPostgres = Boolean(process.env.DATABASE_URL_REAL);

describe.skipIf(!hasRealPostgres)('PostgreSQL Row-Level Security (RLS) Integration Tests', () => {
  let prisma: PrismaClient;
  let tenantA: any;
  let tenantB: any;
  let userA: any;
  let userB: any;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL_REAL },
      },
    });
    await prisma.$connect();

    // Create Tenant A and User A
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

    await prisma.companyMembership.create({
      data: {
        companyId: tenantA.id,
        userId: userA.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    // Create Tenant B and User B
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

    await prisma.companyMembership.create({
      data: {
        companyId: tenantB.id,
        userId: userB.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      // Clean up test data using RLS bypass
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`;
        if (tenantA) {
          await tx.companyMembership.deleteMany({ where: { companyId: tenantA.id } });
          await tx.company.delete({ where: { id: tenantA.id } });
        }
        if (tenantB) {
          await tx.companyMembership.deleteMany({ where: { companyId: tenantB.id } });
          await tx.company.delete({ where: { id: tenantB.id } });
        }
        if (userA) await tx.platformUser.delete({ where: { id: userA.id } });
        if (userB) await tx.platformUser.delete({ where: { id: userB.id } });
      });
      await prisma.$disconnect();
    }
  });

  it('enforces that Tenant A context can only query Tenant A memberships', async () => {
    await prisma.$transaction(async (tx) => {
      // Set transaction-local tenant context to Tenant A
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA.id}, true)`;

      const memberships = await tx.companyMembership.findMany();
      expect(memberships.length).toBeGreaterThan(0);
      for (const m of memberships) {
        expect(m.companyId).toBe(tenantA.id);
        expect(m.companyId).not.toBe(tenantB.id);
      }
    });
  });

  it('enforces that Tenant B context can only query Tenant B memberships', async () => {
    await prisma.$transaction(async (tx) => {
      // Set transaction-local tenant context to Tenant B
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantB.id}, true)`;

      const memberships = await tx.companyMembership.findMany();
      expect(memberships.length).toBeGreaterThan(0);
      for (const m of memberships) {
        expect(m.companyId).toBe(tenantB.id);
        expect(m.companyId).not.toBe(tenantA.id);
      }
    });
  });

  it('cleans up transaction context on commit/rollback so pooled connection does not leak state', async () => {
    // 1. Transaction setting Tenant A
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA.id}, true)`;
      const val = await tx.$queryRaw<Array<{ current_setting: string }>>`SELECT current_setting('app.current_tenant_id', true)`;
      expect(val[0].current_setting).toBe(tenantA.id);
    });

    // 2. New transaction without tenant setting must have empty/null setting
    await prisma.$transaction(async (tx) => {
      const val = await tx.$queryRaw<Array<{ current_setting: string }>>`SELECT current_setting('app.current_tenant_id', true)`;
      expect(val[0].current_setting === '' || val[0].current_setting === null).toBe(true);
    });
  });
});
