import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaService } from '../prisma.service';

describe('PrismaService Resilience & Production Persistence Guardrails', () => {
  let service: PrismaService;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    if (service) {
      await service.onModuleDestroy();
    }
    vi.restoreAllMocks();
  });

  it('initializes in-memory mode in test environment', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.DATABASE_URL_REAL;

    service = new PrismaService();
    await service.onModuleInit();

    expect(service.isInMemory).toBe(true);
  });

  it('fails startup in development by default when database connection fails', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ALLOW_DEV_IN_MEMORY_DB;

    service = new PrismaService();
    vi.spyOn(service, '$connect').mockRejectedValueOnce(new Error('Connection refused: 5432'));

    await expect(service.onModuleInit()).rejects.toThrow(
      /Database connection failed. Ensure PostgreSQL is running/i
    );
    expect(service.isInMemory).toBe(false);
  });

  it('allows in-memory fallback in development only when explicitly enabled', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ALLOW_DEV_IN_MEMORY_DB = 'true';

    service = new PrismaService();
    vi.spyOn(service, '$connect').mockRejectedValueOnce(new Error('Connection refused: 5432'));

    await service.onModuleInit();
    expect(service.isInMemory).toBe(true);
  });

  it('strictly aborts startup in production when database connection fails and never enters in-memory mode', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_DEV_IN_MEMORY_DB = 'true'; // Should be ignored in production!

    service = new PrismaService();
    vi.spyOn(service, '$connect').mockRejectedValueOnce(new Error('Connection refused: 5432'));

    await expect(service.onModuleInit()).rejects.toThrow(
      /Database connection failed. Service cannot start without a persistent PostgreSQL connection in production/i
    );
    expect(service.isInMemory).toBe(false);
  });

  it('sanitizes error output during connection failure without leaking database credentials', async () => {
    process.env.NODE_ENV = 'production';

    service = new PrismaService();
    // Simulate raw error with sensitive connection string
    vi.spyOn(service, '$connect').mockRejectedValueOnce(
      new Error('FATAL: password authentication failed for user "superadmin" at postgresql://superadmin:SecretPass123@db.prod:5432')
    );

    try {
      await service.onModuleInit();
      expect.unreachable('Should have thrown sanitized error');
    } catch (err: unknown) {
      const message = (err as Error).message;
      expect(message).not.toContain('SecretPass123');
      expect(message).not.toContain('postgresql://');
      expect(message).toMatch(/Database connection failed/i);
    }
  });

  describe('In-Memory ACID Transaction Simulation', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      service = new PrismaService();
      service.isInMemory = true;
    });

    it('commits state when transaction completes successfully', async () => {
      await service.$transaction(async (tx) => {
        await tx.platformUser.create({
          data: {
            id: 'tx-user-1',
            email: 'tx1@example.com',
            fullName: 'Tx User',
            passwordHash: 'hash',
          },
        });
      });

      const user = await service.platformUser.findUnique({ where: { id: 'tx-user-1' } });
      expect(user).not.toBeNull();
      expect(user?.email).toBe('tx1@example.com');
    });

    it('rolls back state cleanly when transaction throws an error', async () => {
      await expect(
        service.$transaction(async (tx) => {
          await tx.platformUser.create({
            data: {
              id: 'tx-user-rollback',
              email: 'rollback@example.com',
              fullName: 'Rollback User',
              passwordHash: 'hash',
            },
          });

          // Simulate mid-transaction failure
          throw new Error('Mid-transaction simulated database error');
        })
      ).rejects.toThrow('Mid-transaction simulated database error');

      // The created user must be completely rolled back!
      const user = await service.platformUser.findUnique({ where: { id: 'tx-user-rollback' } });
      expect(user).toBeNull();
    });
  });
});
