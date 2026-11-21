/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@feedbackhub/database';

interface InMemoryStore {
  users: Map<string, any>;
  verificationTokens: Map<string, any>;
  resetTokens: Map<string, any>;
  sessions: Map<string, any>;
  companies: Map<string, any>;
  companyMemberships: Map<string, any>;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isInMemory = false;
  private memoryStore: InMemoryStore = {
    users: new Map(),
    verificationTokens: new Map(),
    resetTokens: new Map(),
    sessions: new Map(),
    companies: new Map(),
    companyMemberships: new Map(),
  };

  constructor() {
    super();
    this.setupMemoryDelegates();
  }

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test' && !process.env.DATABASE_URL_REAL) {
      this.isInMemory = true;
      this.logger.log('PrismaService initialized in in-memory test mode');
      return;
    }

    try {
      await this.$connect();
      this.logger.log('Prisma connected to database');
    } catch (_error: unknown) {
      // Production must NEVER fall back to in-memory mode under any circumstances
      if (process.env.NODE_ENV === 'production') {
        this.isInMemory = false;
        this.logger.error('Failed to connect to production PostgreSQL database. Service startup aborted.');
        throw new Error(
          'Database connection failed. Service cannot start without a persistent PostgreSQL connection in production.'
        );
      }

      // Development fallback is disabled by default and requires explicit opt-in
      if (process.env.ALLOW_DEV_IN_MEMORY_DB === 'true') {
        this.isInMemory = true;
        this.logger.warn(
          'WARNING: PostgreSQL connection failed. Running in explicitly permitted in-memory fallback mode for development. DATA WILL NOT PERSIST.'
        );
        return;
      }

      this.isInMemory = false;
      this.logger.error(
        'Failed to connect to PostgreSQL database. Development in-memory fallback is disabled by default.'
      );
      throw new Error(
        'Database connection failed. Ensure PostgreSQL is running, or set ALLOW_DEV_IN_MEMORY_DB="true" for ephemeral local development.'
      );
    }
  }

  async onModuleDestroy() {
    if (!this.isInMemory) {
      await this.$disconnect();
    }
  }

  override async $transaction<T>(
    fnOrArray: ((tx: PrismaService) => Promise<T>) | Promise<unknown>[],
    options?: unknown
  ): Promise<T> {
    if (!this.isInMemory) {
      return (await super.$transaction(fnOrArray as any, options as any)) as T;
    }

    if (typeof fnOrArray === 'function') {
      // Snapshot state for atomic transaction rollback in memory mode
      const snapshot: InMemoryStore = {
        users: new Map(Array.from(this.memoryStore.users.entries()).map(([k, v]) => [k, { ...v }])),
        verificationTokens: new Map(
          Array.from(this.memoryStore.verificationTokens.entries()).map(([k, v]) => [k, { ...v }])
        ),
        resetTokens: new Map(
          Array.from(this.memoryStore.resetTokens.entries()).map(([k, v]) => [k, { ...v }])
        ),
        sessions: new Map(
          Array.from(this.memoryStore.sessions.entries()).map(([k, v]) => [k, { ...v }])
        ),
        companies: new Map(
          Array.from(this.memoryStore.companies.entries()).map(([k, v]) => [k, { ...v }])
        ),
        companyMemberships: new Map(
          Array.from(this.memoryStore.companyMemberships.entries()).map(([k, v]) => [k, { ...v }])
        ),
      };

      try {
        return await fnOrArray(this);
      } catch (err) {
        this.memoryStore = snapshot;
        throw err;
      }
    }

    return (await Promise.all(fnOrArray)) as unknown as T;
  }

  public resetMemoryStore() {
    this.memoryStore.users.clear();
    this.memoryStore.verificationTokens.clear();
    this.memoryStore.resetTokens.clear();
    this.memoryStore.sessions.clear();
    this.memoryStore.companies.clear();
    this.memoryStore.companyMemberships.clear();
  }

  private setupMemoryDelegates() {
    const realPlatformUser = this.platformUser;
    const realEmailVerificationToken = this.emailVerificationToken;
    const realPasswordResetToken = this.passwordResetToken;
    const realAuthSession = this.authSession;
    const realCompany = this.company;
    const realCompanyMembership = this.companyMembership;

    // PlatformUser memory delegate
    const memoryPlatformUser = {
      findUnique: async (args: { where: { id?: string; email?: string } }) => {
        if (!this.isInMemory) return realPlatformUser.findUnique(args as any);
        if (args.where.id) return this.memoryStore.users.get(args.where.id) || null;
        if (args.where.email) {
          const lower = args.where.email.toLowerCase();
          for (const u of this.memoryStore.users.values()) {
            if (u.email.toLowerCase() === lower) return { ...u };
          }
        }
        return null;
      },
      findFirst: async (args: { where: any }) => {
        if (!this.isInMemory) return realPlatformUser.findFirst(args as any);
        for (const u of this.memoryStore.users.values()) {
          let match = true;
          if (args.where?.email && u.email.toLowerCase() !== args.where.email.toLowerCase()) match = false;
          if (args.where?.id && u.id !== args.where.id) match = false;
          if (match) return { ...u };
        }
        return null;
      },
      create: async (args: { data: any }) => {
        if (!this.isInMemory) return realPlatformUser.create(args as any);
        const id = args.data.id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const user = {
          id,
          email: args.data.email.toLowerCase(),
          passwordHash: args.data.passwordHash,
          fullName: args.data.fullName,
          avatarUrl: args.data.avatarUrl || null,
          isSuperAdmin: args.data.isSuperAdmin || false,
          isEmailVerified: args.data.isEmailVerified || false,
          emailVerifiedAt: args.data.emailVerifiedAt || null,
          status: args.data.status || 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memoryStore.users.set(id, user);
        return { ...user };
      },
      update: async (args: { where: { id?: string; email?: string }; data: any }) => {
        if (!this.isInMemory) return realPlatformUser.update(args as any);
        let targetId = args.where.id;
        if (!targetId && args.where.email) {
          for (const u of this.memoryStore.users.values()) {
            if (u.email.toLowerCase() === args.where.email.toLowerCase()) {
              targetId = u.id;
              break;
            }
          }
        }
        if (!targetId) throw new Error('User not found');
        const existing = this.memoryStore.users.get(targetId);
        if (!existing) throw new Error('User not found');
        const updated = {
          ...existing,
          ...args.data,
          updatedAt: new Date(),
        };
        this.memoryStore.users.set(targetId, updated);
        return { ...updated };
      },
      delete: async (args: { where: { id?: string; email?: string } }) => {
        if (!this.isInMemory) return realPlatformUser.delete(args as any);
        let targetId = args.where.id;
        if (!targetId && args.where.email) {
          for (const u of this.memoryStore.users.values()) {
            if (u.email.toLowerCase() === args.where.email.toLowerCase()) {
              targetId = u.id;
              break;
            }
          }
        }
        if (!targetId) return null;
        const existing = this.memoryStore.users.get(targetId);
        this.memoryStore.users.delete(targetId);
        return existing || null;
      },
    };

    // EmailVerificationToken memory delegate
    const memoryEmailVerificationToken = {
      findFirst: async (args: { where: { tokenHash?: string; userId?: string } }) => {
        if (!this.isInMemory) return realEmailVerificationToken.findFirst(args as any);
        for (const t of this.memoryStore.verificationTokens.values()) {
          let match = true;
          if (args.where.tokenHash && t.tokenHash !== args.where.tokenHash) match = false;
          if (args.where.userId && t.userId !== args.where.userId) match = false;
          if (match) return { ...t };
        }
        return null;
      },
      create: async (args: { data: any }) => {
        if (!this.isInMemory) return realEmailVerificationToken.create(args as any);
        const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const token = {
          id,
          userId: args.data.userId,
          tokenHash: args.data.tokenHash,
          expiresAt: args.data.expiresAt,
          createdAt: new Date(),
        };
        this.memoryStore.verificationTokens.set(id, token);
        return { ...token };
      },
      delete: async (args: { where: { id: string } }) => {
        if (!this.isInMemory) return realEmailVerificationToken.delete(args as any);
        const existing = this.memoryStore.verificationTokens.get(args.where.id);
        this.memoryStore.verificationTokens.delete(args.where.id);
        return existing || null;
      },
      update: async (args: { where: { id: string }; data: any }) => {
        if (!this.isInMemory) return realEmailVerificationToken.update(args as any);
        const existing = this.memoryStore.verificationTokens.get(args.where.id);
        if (!existing) throw new Error('Token not found');
        const updated = { ...existing, ...args.data };
        this.memoryStore.verificationTokens.set(args.where.id, updated);
        return { ...updated };
      },
      deleteMany: async (args: { where: { userId?: string; tokenHash?: string } }) => {
        if (!this.isInMemory) return realEmailVerificationToken.deleteMany(args as any);
        let count = 0;
        for (const [key, t] of this.memoryStore.verificationTokens.entries()) {
          if (args.where?.userId && t.userId === args.where.userId) {
            this.memoryStore.verificationTokens.delete(key);
            count++;
          } else if (args.where?.tokenHash && t.tokenHash === args.where.tokenHash) {
            this.memoryStore.verificationTokens.delete(key);
            count++;
          }
        }
        return { count };
      },
    };

    // PasswordResetToken memory delegate
    const memoryPasswordResetToken = {
      findFirst: async (args: { where: { tokenHash?: string; userId?: string } }) => {
        if (!this.isInMemory) return realPasswordResetToken.findFirst(args as any);
        for (const t of this.memoryStore.resetTokens.values()) {
          let match = true;
          if (args.where.tokenHash && t.tokenHash !== args.where.tokenHash) match = false;
          if (args.where.userId && t.userId !== args.where.userId) match = false;
          if (match) return { ...t };
        }
        return null;
      },
      create: async (args: { data: any }) => {
        if (!this.isInMemory) return realPasswordResetToken.create(args as any);
        const id = `prt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const token = {
          id,
          userId: args.data.userId,
          tokenHash: args.data.tokenHash,
          expiresAt: args.data.expiresAt,
          createdAt: new Date(),
        };
        this.memoryStore.resetTokens.set(id, token);
        return { ...token };
      },
      delete: async (args: { where: { id: string } }) => {
        if (!this.isInMemory) return realPasswordResetToken.delete(args as any);
        const existing = this.memoryStore.resetTokens.get(args.where.id);
        this.memoryStore.resetTokens.delete(args.where.id);
        return existing || null;
      },
      update: async (args: { where: { id: string }; data: any }) => {
        if (!this.isInMemory) return realPasswordResetToken.update(args as any);
        const existing = this.memoryStore.resetTokens.get(args.where.id);
        if (!existing) throw new Error('Token not found');
        const updated = { ...existing, ...args.data };
        this.memoryStore.resetTokens.set(args.where.id, updated);
        return { ...updated };
      },
      deleteMany: async (args: { where: { userId?: string; tokenHash?: string } }) => {
        if (!this.isInMemory) return realPasswordResetToken.deleteMany(args as any);
        let count = 0;
        for (const [key, t] of this.memoryStore.resetTokens.entries()) {
          if (args.where?.userId && t.userId === args.where.userId) {
            this.memoryStore.resetTokens.delete(key);
            count++;
          } else if (args.where?.tokenHash && t.tokenHash === args.where.tokenHash) {
            this.memoryStore.resetTokens.delete(key);
            count++;
          }
        }
        return { count };
      },
    };

    // AuthSession memory delegate
    const memoryAuthSession = {
      findFirst: async (args: { where: { sessionTokenHash?: string; userId?: string } }) => {
        if (!this.isInMemory) return realAuthSession.findFirst(args as any);
        for (const s of this.memoryStore.sessions.values()) {
          let match = true;
          if (args.where.sessionTokenHash && s.sessionTokenHash !== args.where.sessionTokenHash) match = false;
          if (args.where.userId && s.userId !== args.where.userId) match = false;
          if (match) return { ...s };
        }
        return null;
      },
      findMany: async (args?: { where?: { userId?: string } }) => {
        if (!this.isInMemory) return realAuthSession.findMany(args as any);
        const results = [];
        for (const s of this.memoryStore.sessions.values()) {
          if (!args?.where?.userId || s.userId === args.where.userId) {
            results.push({ ...s });
          }
        }
        return results;
      },
      findUnique: async (args: { where: { id: string } }) => {
        if (!this.isInMemory) return realAuthSession.findUnique(args as any);
        return this.memoryStore.sessions.get(args.where.id) || null;
      },
      create: async (args: { data: any }) => {
        if (!this.isInMemory) return realAuthSession.create(args as any);
        const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const session = {
          id,
          userId: args.data.userId,
          sessionTokenHash: args.data.sessionTokenHash,
          ipAddress: args.data.ipAddress || null,
          userAgent: args.data.userAgent || null,
          expiresAt: args.data.expiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memoryStore.sessions.set(id, session);
        return { ...session };
      },
      update: async (args: { where: { id: string }; data: any }) => {
        if (!this.isInMemory) return realAuthSession.update(args as any);
        const existing = this.memoryStore.sessions.get(args.where.id);
        if (!existing) throw new Error('Session not found');
        const updated = {
          ...existing,
          ...args.data,
          updatedAt: new Date(),
        };
        this.memoryStore.sessions.set(args.where.id, updated);
        return { ...updated };
      },
      delete: async (args: { where: { id: string } }) => {
        if (!this.isInMemory) return realAuthSession.delete(args as any);
        const existing = this.memoryStore.sessions.get(args.where.id);
        this.memoryStore.sessions.delete(args.where.id);
        return existing || null;
      },
      deleteMany: async (args: { where: { userId?: string; id?: { not?: string }; sessionTokenHash?: string } }) => {
        if (!this.isInMemory) return realAuthSession.deleteMany(args as any);
        let count = 0;
        for (const [key, s] of this.memoryStore.sessions.entries()) {
          let matches = true;
          if (args.where?.userId && s.userId !== args.where.userId) matches = false;
          if (args.where?.sessionTokenHash && s.sessionTokenHash !== args.where.sessionTokenHash) matches = false;
          if (args.where?.id?.not && s.id === args.where.id.not) matches = false;

          if (matches) {
            this.memoryStore.sessions.delete(key);
            count++;
          }
        }
        return { count };
      },
    };

    // Company memory delegate
    const memoryCompany = {
      findUnique: async (args: { where: { id?: string; slug?: string } }) => {
        if (!this.isInMemory) return realCompany.findUnique(args as any);
        if (args.where.id) return this.memoryStore.companies.get(args.where.id) || null;
        if (args.where.slug) {
          const lower = args.where.slug.toLowerCase();
          for (const c of this.memoryStore.companies.values()) {
            if (c.slug.toLowerCase() === lower) return { ...c };
          }
        }
        return null;
      },
      findFirst: async (args: { where: any }) => {
        if (!this.isInMemory) return realCompany.findFirst(args as any);
        for (const c of this.memoryStore.companies.values()) {
          let match = true;
          if (args.where?.id && c.id !== args.where.id) match = false;
          if (args.where?.slug && c.slug.toLowerCase() !== args.where.slug.toLowerCase()) match = false;
          if (args.where?.status && c.status !== args.where.status) match = false;
          if (match) return { ...c };
        }
        return null;
      },
      findMany: async (args?: { where?: any; orderBy?: any }) => {
        if (!this.isInMemory) return realCompany.findMany(args as any);
        const result: any[] = [];
        for (const c of this.memoryStore.companies.values()) {
          let match = true;
          if (args?.where?.status && c.status !== args.where.status) match = false;
          if (match) result.push({ ...c });
        }
        return result;
      },
      create: async (args: { data: any }) => {
        if (!this.isInMemory) return realCompany.create(args as any);
        const lowerSlug = args.data.slug.toLowerCase();
        for (const existing of this.memoryStore.companies.values()) {
          if (existing.slug.toLowerCase() === lowerSlug) {
            const error: any = new Error('Unique constraint failed on the fields: (`slug`)');
            error.code = 'P2002';
            error.meta = { target: ['slug'] };
            throw error;
          }
        }
        const id = args.data.id || `comp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const company = {
          id,
          name: args.data.name,
          slug: lowerSlug,
          customDomain: args.data.customDomain || null,
          logoUrl: args.data.logoUrl || null,
          brandColorHex: args.data.brandColorHex || '#8B5CF6',
          accentColorHex: args.data.accentColorHex || '#EC4899',
          settings: args.data.settings || {
            allowPublicCustomerFeedback: true,
            allowAnonymousEmployeeFeedback: true,
            minimumEmployeePrivacyThreshold: 5,
          },
          status: args.data.status || 'ACTIVE',
          isActive: args.data.isActive !== undefined ? args.data.isActive : true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memoryStore.companies.set(id, company);
        return { ...company };
      },
      update: async (args: { where: { id?: string; slug?: string }; data: any }) => {
        if (!this.isInMemory) return realCompany.update(args as any);
        let targetId = args.where.id;
        if (!targetId && args.where.slug) {
          for (const c of this.memoryStore.companies.values()) {
            if (c.slug.toLowerCase() === args.where.slug.toLowerCase()) {
              targetId = c.id;
              break;
            }
          }
        }
        if (!targetId) throw new Error('Company not found');
        const existing = this.memoryStore.companies.get(targetId);
        if (!existing) throw new Error('Company not found');
        const updated = {
          ...existing,
          ...args.data,
          updatedAt: new Date(),
        };
        this.memoryStore.companies.set(targetId, updated);
        return { ...updated };
      },
      delete: async (args: { where: { id?: string; slug?: string } }) => {
        if (!this.isInMemory) return realCompany.delete(args as any);
        let targetId = args.where.id;
        if (!targetId && args.where.slug) {
          for (const c of this.memoryStore.companies.values()) {
            if (c.slug.toLowerCase() === args.where.slug.toLowerCase()) {
              targetId = c.id;
              break;
            }
          }
        }
        if (!targetId) return null;
        const existing = this.memoryStore.companies.get(targetId);
        this.memoryStore.companies.delete(targetId);
        return existing || null;
      },
      deleteMany: async (args?: { where?: any }) => {
        if (!this.isInMemory) return realCompany.deleteMany(args as any);
        let count = 0;
        if (!args?.where) {
          count = this.memoryStore.companies.size;
          this.memoryStore.companies.clear();
          return { count };
        }
        for (const [key, c] of this.memoryStore.companies.entries()) {
          let match = true;
          if (args.where.slug && c.slug !== args.where.slug) match = false;
          if (match) {
            this.memoryStore.companies.delete(key);
            count++;
          }
        }
        return { count };
      },
    };

    // CompanyMembership memory delegate
    const memoryCompanyMembership = {
      findUnique: async (args: {
        where: { id?: string; companyId_userId?: { companyId: string; userId: string } };
      }) => {
        if (!this.isInMemory) return realCompanyMembership.findUnique(args as any);
        if (args.where.id) return this.memoryStore.companyMemberships.get(args.where.id) || null;
        if (args.where.companyId_userId) {
          const { companyId, userId } = args.where.companyId_userId;
          for (const m of this.memoryStore.companyMemberships.values()) {
            if (m.companyId === companyId && m.userId === userId) {
              return { ...m };
            }
          }
        }
        return null;
      },
      findFirst: async (args: { where: any }) => {
        if (!this.isInMemory) return realCompanyMembership.findFirst(args as any);
        for (const m of this.memoryStore.companyMemberships.values()) {
          let match = true;
          if (args.where?.id && m.id !== args.where.id) match = false;
          if (args.where?.companyId && m.companyId !== args.where.companyId) match = false;
          if (args.where?.userId && m.userId !== args.where.userId) match = false;
          if (args.where?.role && m.role !== args.where.role) match = false;
          if (args.where?.status && m.status !== args.where.status) match = false;
          if (match) return { ...m };
        }
        return null;
      },
      findMany: async (args?: { where?: any; include?: any; orderBy?: any }) => {
        if (!this.isInMemory) return realCompanyMembership.findMany(args as any);
        const results: any[] = [];
        for (const m of this.memoryStore.companyMemberships.values()) {
          let match = true;
          if (args?.where?.companyId && m.companyId !== args.where.companyId) match = false;
          if (args?.where?.userId && m.userId !== args.where.userId) match = false;
          if (args?.where?.role && m.role !== args.where.role) match = false;
          if (args?.where?.status && m.status !== args.where.status) match = false;
          if (
            args?.where?.company?.status &&
            this.memoryStore.companies.get(m.companyId)?.status !== args.where.company.status
          ) {
            match = false;
          }
          if (match) {
            const item: any = { ...m };
            if (args?.include?.company) {
              item.company = this.memoryStore.companies.get(m.companyId) || null;
            }
            if (args?.include?.user) {
              item.user = this.memoryStore.users.get(m.userId) || null;
            }
            results.push(item);
          }
        }
        return results;
      },
      create: async (args: { data: any }) => {
        if (!this.isInMemory) return realCompanyMembership.create(args as any);
        for (const existing of this.memoryStore.companyMemberships.values()) {
          if (existing.companyId === args.data.companyId && existing.userId === args.data.userId) {
            const error: any = new Error('Unique constraint failed on the fields: (`companyId`,`userId`)');
            error.code = 'P2002';
            error.meta = { target: ['companyId', 'userId'] };
            throw error;
          }
        }
        const id = args.data.id || `cm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const membership = {
          id,
          companyId: args.data.companyId,
          userId: args.data.userId,
          role: args.data.role || 'OWNER',
          roleId: args.data.roleId || null,
          jobTitle: args.data.jobTitle || null,
          department: args.data.department || null,
          status: args.data.status || 'ACTIVE',
          joinedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memoryStore.companyMemberships.set(id, membership);
        return { ...membership };
      },
      update: async (args: { where: { id: string }; data: any }) => {
        if (!this.isInMemory) return realCompanyMembership.update(args as any);
        const existing = this.memoryStore.companyMemberships.get(args.where.id);
        if (!existing) throw new Error('Company membership not found');
        const updated = {
          ...existing,
          ...args.data,
          updatedAt: new Date(),
        };
        this.memoryStore.companyMemberships.set(args.where.id, updated);
        return { ...updated };
      },
      delete: async (args: { where: { id: string } }) => {
        if (!this.isInMemory) return realCompanyMembership.delete(args as any);
        const existing = this.memoryStore.companyMemberships.get(args.where.id);
        this.memoryStore.companyMemberships.delete(args.where.id);
        return existing || null;
      },
      deleteMany: async (args?: { where?: any }) => {
        if (!this.isInMemory) return realCompanyMembership.deleteMany(args as any);
        let count = 0;
        if (!args?.where) {
          count = this.memoryStore.companyMemberships.size;
          this.memoryStore.companyMemberships.clear();
          return { count };
        }
        for (const [key, m] of this.memoryStore.companyMemberships.entries()) {
          let match = true;
          if (args.where.companyId && m.companyId !== args.where.companyId) match = false;
          if (args.where.userId && m.userId !== args.where.userId) match = false;
          if (match) {
            this.memoryStore.companyMemberships.delete(key);
            count++;
          }
        }
        return { count };
      },
    };

    // Override the getters on this instance
    Object.defineProperty(this, 'platformUser', {
      get: () => (this.isInMemory ? memoryPlatformUser : realPlatformUser),
      configurable: true,
    });
    Object.defineProperty(this, 'emailVerificationToken', {
      get: () => (this.isInMemory ? memoryEmailVerificationToken : realEmailVerificationToken),
      configurable: true,
    });
    Object.defineProperty(this, 'passwordResetToken', {
      get: () => (this.isInMemory ? memoryPasswordResetToken : realPasswordResetToken),
      configurable: true,
    });
    Object.defineProperty(this, 'authSession', {
      get: () => (this.isInMemory ? memoryAuthSession : realAuthSession),
      configurable: true,
    });
    Object.defineProperty(this, 'company', {
      get: () => (this.isInMemory ? memoryCompany : realCompany),
      configurable: true,
    });
    Object.defineProperty(this, 'companyMembership', {
      get: () => (this.isInMemory ? memoryCompanyMembership : realCompanyMembership),
      configurable: true,
    });
  }
}
