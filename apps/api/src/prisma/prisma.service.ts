/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@feedbackhub/database';

interface InMemoryStore {
  users: Map<string, any>;
  verificationTokens: Map<string, any>;
  resetTokens: Map<string, any>;
  sessions: Map<string, any>;
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
  };

  constructor() {
    super();
    this.setupMemoryDelegates();
  }

  async onModuleInit() {
    try {
      if (process.env.NODE_ENV === 'test' && !process.env.DATABASE_URL_REAL) {
        this.isInMemory = true;
        this.logger.log('PrismaService initialized in in-memory test mode');
        return;
      }
      await this.$connect();
      this.logger.log('Prisma connected to database');
    } catch (error: any) {
      this.logger.warn(
        `Could not connect to PostgreSQL database (${error.message}). Falling back to resilient in-memory mode for development/testing.`
      );
      this.isInMemory = true;
    }
  }

  async onModuleDestroy() {
    if (!this.isInMemory) {
      await this.$disconnect();
    }
  }

  public resetMemoryStore() {
    this.memoryStore.users.clear();
    this.memoryStore.verificationTokens.clear();
    this.memoryStore.resetTokens.clear();
    this.memoryStore.sessions.clear();
  }

  private setupMemoryDelegates() {
    const realPlatformUser = this.platformUser;
    const realEmailVerificationToken = this.emailVerificationToken;
    const realPasswordResetToken = this.passwordResetToken;
    const realAuthSession = this.authSession;

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
      update: async (args: { where: { id: string }; data: any }) => {
        if (!this.isInMemory) return realPlatformUser.update(args as any);
        const existing = this.memoryStore.users.get(args.where.id);
        if (!existing) throw new Error('User not found');
        const updated = {
          ...existing,
          ...args.data,
          updatedAt: new Date(),
        };
        this.memoryStore.users.set(args.where.id, updated);
        return { ...updated };
      },
      delete: async (args: { where: { id: string } }) => {
        if (!this.isInMemory) return realPlatformUser.delete(args as any);
        const existing = this.memoryStore.users.get(args.where.id);
        this.memoryStore.users.delete(args.where.id);
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
  }
}
