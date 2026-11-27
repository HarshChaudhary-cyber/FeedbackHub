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
  invitations: Map<string, any>;
  forms: Map<string, any>;
  questions: Map<string, any>;
  options: Map<string, any>;
  responses: Map<string, any>;
  answers: Map<string, any>;
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
    invitations: new Map(),
    forms: new Map(),
    questions: new Map(),
    options: new Map(),
    responses: new Map(),
    answers: new Map(),
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
        invitations: new Map(
          Array.from(this.memoryStore.invitations.entries()).map(([k, v]) => [k, { ...v }])
        ),
        forms: new Map(Array.from(this.memoryStore.forms.entries()).map(([k, v]) => [k, { ...v }])),
        questions: new Map(Array.from(this.memoryStore.questions.entries()).map(([k, v]) => [k, { ...v }])),
        options: new Map(Array.from(this.memoryStore.options.entries()).map(([k, v]) => [k, { ...v }])),
        responses: new Map(Array.from(this.memoryStore.responses.entries()).map(([k, v]) => [k, { ...v }])),
        answers: new Map(Array.from(this.memoryStore.answers.entries()).map(([k, v]) => [k, { ...v }])),
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

  /**
   * Executes database operations bound to a transaction-local tenant context.
   * In PostgreSQL mode, sets transaction-local `app.current_tenant_id` (and optionally `app.current_user_id`)
   * safely within an atomic transaction block so connection pooling never leaks tenant state.
   */
  async withTenantContext<T>(
    tenantId: string,
    userId: string | undefined,
    fn: (tx: PrismaService) => Promise<T>
  ): Promise<T> {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      throw new Error('Tenant context required: tenantId is missing or empty (fail-closed).');
    }
    const cleanTenantId = tenantId.trim();
    const cleanUserId = userId && typeof userId === 'string' && userId.trim() !== '' ? userId.trim() : undefined;

    return this.$transaction(async (tx) => {
      if (!this.isInMemory) {
        await (tx as any).$executeRaw`SELECT set_config('app.current_tenant_id', ${cleanTenantId}, true)`;
        if (cleanUserId) {
          await (tx as any).$executeRaw`SELECT set_config('app.current_user_id', ${cleanUserId}, true)`;
        }
      }
      return fn(tx as PrismaService);
    });
  }

  /**
   * Executes pre-membership invitation operations bound to an invitation token context.
   * Allows safely resolving an invitation by token hash without an unrestricted bypass.
   */
  async withInvitationTokenContext<T>(
    tokenHash: string,
    userId: string | undefined,
    fn: (tx: PrismaService) => Promise<T>
  ): Promise<T> {
    if (!tokenHash || typeof tokenHash !== 'string' || tokenHash.trim() === '') {
      throw new Error('Invitation token context required: tokenHash is missing or empty (fail-closed).');
    }
    const cleanTokenHash = tokenHash.trim();
    const cleanUserId = userId && typeof userId === 'string' && userId.trim() !== '' ? userId.trim() : undefined;

    return this.$transaction(async (tx) => {
      if (!this.isInMemory) {
        await (tx as any).$executeRaw`SELECT set_config('app.invitation_token_hash', ${cleanTokenHash}, true)`;
        if (cleanUserId) {
          await (tx as any).$executeRaw`SELECT set_config('app.current_user_id', ${cleanUserId}, true)`;
        }
      }
      return fn(tx as PrismaService);
    });
  }

  /**
   * Transitions an existing active transaction into tenant context.
   * Used during invitation acceptance after the invitation has been resolved and verified.
   */
  async setTransactionTenantContext(
    tx: PrismaService,
    tenantId: string,
    userId?: string
  ): Promise<void> {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      throw new Error('Tenant context required: tenantId is missing or empty.');
    }
    const cleanTenantId = tenantId.trim();
    const cleanUserId = userId && typeof userId === 'string' && userId.trim() !== '' ? userId.trim() : undefined;

    if (!this.isInMemory) {
      await (tx as any).$executeRaw`SELECT set_config('app.current_tenant_id', ${cleanTenantId}, true)`;
      if (cleanUserId) {
        await (tx as any).$executeRaw`SELECT set_config('app.current_user_id', ${cleanUserId}, true)`;
      }
    }
  }

  /**
   * Executes platform-level operations for a user across tenants.
   * Sets transaction-local `app.current_user_id` so the user can only see their own memberships.
   */
  async withUserContext<T>(
    userId: string,
    fn: (tx: PrismaService) => Promise<T>
  ): Promise<T> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('User context required: userId is missing or empty (fail-closed).');
    }
    const cleanUserId = userId.trim();

    return this.$transaction(async (tx) => {
      if (!this.isInMemory) {
        await (tx as any).$executeRaw`SELECT set_config('app.current_user_id', ${cleanUserId}, true)`;
      }
      return fn(tx as PrismaService);
    });
  }

  /**
   * Executes public feedback submission operations within a dedicated, transaction-scoped public submission context.
   * In PostgreSQL mode, sets `app.is_public_submission = 'true'`, `app.public_submission_company_id`,
   * and `app.public_submission_form_id` strictly via transaction-local `set_config` (is_local = true)
   * so connection pooling never leaks submission state.
   * When `lockKey` is provided, serializes concurrent submissions atomically via PostgreSQL transaction-scoped advisory locks.
   */
  async withPublicSubmissionContext<T>(
    companyId: string,
    formId: string,
    lockKeyOrFn: string | null | ((tx: PrismaService) => Promise<T>),
    maybeFn?: (tx: PrismaService) => Promise<T>
  ): Promise<T> {
    const fn = typeof lockKeyOrFn === 'function' ? lockKeyOrFn : maybeFn!;
    const lockKey = typeof lockKeyOrFn === 'string' ? lockKeyOrFn : null;

    if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
      throw new Error('Public submission context required: companyId is missing or empty.');
    }
    if (!formId || typeof formId !== 'string' || formId.trim() === '') {
      throw new Error('Public submission context required: formId is missing or empty.');
    }
    const cleanCompanyId = companyId.trim();
    const cleanFormId = formId.trim();

    const executeTx = async () => {
      return this.$transaction(async (tx) => {
        if (!this.isInMemory) {
          await (tx as any).$executeRaw`SELECT set_config('app.is_public_submission', 'true', true)`;
          await (tx as any).$executeRaw`SELECT set_config('app.public_submission_company_id', ${cleanCompanyId}, true)`;
          await (tx as any).$executeRaw`SELECT set_config('app.public_submission_form_id', ${cleanFormId}, true)`;
          if (lockKey) {
            await (tx as any).$executeRawUnsafe(
              'SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))',
              `feedbackhub_form:${cleanFormId}`,
              lockKey
            );
          }
        }
        return fn(tx as PrismaService);
      });
    };

    if (this.isInMemory && lockKey) {
      const releaseLock = await this.acquireSubmissionAdvisoryLock(null, cleanFormId, lockKey);
      try {
        return await executeTx();
      } finally {
        releaseLock();
      }
    }

    return executeTx();
  }

  /**
   * Acquires a fine-grained, transaction-scoped advisory lock for submission serialization.
   * In PostgreSQL mode, calls `pg_advisory_xact_lock(hashtext($1), hashtext($2))` inside the transaction,
   * which automatically releases when the transaction commits or rolls back.
   * In in-memory mode, uses an in-memory lock map with timeout protection.
   */
  async acquireSubmissionAdvisoryLock(
    tx: any,
    formId: string,
    targetKey: string,
    timeoutMs = 5000
  ): Promise<() => void> {
    const key1 = `feedbackhub_form:${formId}`;
    const key2 = targetKey;

    if (!this.isInMemory) {
      await tx.$executeRawUnsafe(
        'SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))',
        key1,
        key2
      );
      return () => {};
    }

    const lockKey = `${key1}:${key2}`;
    const start = Date.now();
    while (this.inMemoryLocks.has(lockKey)) {
      if (Date.now() - start > timeoutMs) {
        throw new Error(`Advisory lock acquisition timed out for key: ${lockKey}`);
      }
      const existingPromise = this.inMemoryLocks.get(lockKey);
      if (existingPromise) {
        await Promise.race([
          existingPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Lock acquisition timeout')), timeoutMs)),
        ]).catch(() => {
          // Re-evaluate loop
        });
      }
    }

    let unlockFn: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      unlockFn = resolve;
    });
    this.inMemoryLocks.set(lockKey, lockPromise);

    return () => {
      this.inMemoryLocks.delete(lockKey);
      unlockFn();
    };
  }

  private inMemoryLocks = new Map<string, Promise<void>>();

  public resetMemoryStore() {
    this.inMemoryLocks.clear();
    this.memoryStore.users.clear();
    this.memoryStore.verificationTokens.clear();
    this.memoryStore.resetTokens.clear();
    this.memoryStore.sessions.clear();
    this.memoryStore.companies.clear();
    this.memoryStore.companyMemberships.clear();
    this.memoryStore.invitations.clear();
    this.memoryStore.forms.clear();
    this.memoryStore.questions.clear();
    this.memoryStore.options.clear();
    this.memoryStore.responses.clear();
    this.memoryStore.answers.clear();
  }

  private setupMemoryDelegates() {
    const realPlatformUser = this.platformUser;
    const realEmailVerificationToken = this.emailVerificationToken;
    const realPasswordResetToken = this.passwordResetToken;
    const realAuthSession = this.authSession;
    const realCompany = this.company;
    const realCompanyMembership = this.companyMembership;
    const realCompanyInvitation = this.companyInvitation;
    const realFeedbackForm = this.feedbackForm;
    const realFormQuestion = this.formQuestion;
    const realFormQuestionOption = this.formQuestionOption;
    const realFeedbackResponse = this.feedbackResponse;
    const realFeedbackAnswer = this.feedbackAnswer;

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
      findUnique: async (args: { where: { id?: string; slug?: string; customDomain?: string } }) => {
        if (!this.isInMemory) return realCompany.findUnique(args as any);
        if (args.where.id) return this.memoryStore.companies.get(args.where.id) || null;
        if (args.where.slug) {
          const lower = args.where.slug.toLowerCase();
          for (const c of this.memoryStore.companies.values()) {
            if (c.slug.toLowerCase() === lower) return { ...c };
          }
        }
        if (args.where.customDomain) {
          const lower = args.where.customDomain.toLowerCase();
          for (const c of this.memoryStore.companies.values()) {
            if (c.customDomain && c.customDomain.toLowerCase() === lower) return { ...c };
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
      updateMany: async (args: { where: any; data: any }) => {
        if (!this.isInMemory) return realCompanyMembership.updateMany(args as any);
        let count = 0;
        for (const [key, m] of this.memoryStore.companyMemberships.entries()) {
          let match = true;
          if (args.where?.id && m.id !== args.where.id) match = false;
          if (args.where?.companyId && m.companyId !== args.where.companyId) match = false;
          if (args.where?.userId && m.userId !== args.where.userId) match = false;
          if (args.where?.role && m.role !== args.where.role) match = false;
          if (args.where?.status && m.status !== args.where.status) match = false;
          if (match) {
            const updated = { ...m, ...args.data, updatedAt: new Date() };
            this.memoryStore.companyMemberships.set(key, updated);
            count++;
          }
        }
        return { count };
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

    // CompanyInvitation memory delegate
    const memoryCompanyInvitation = {
      findUnique: async (args: { where: { id?: string; tokenHash?: string } }) => {
        if (!this.isInMemory) return realCompanyInvitation.findUnique(args as any);
        if (args.where.id) return this.memoryStore.invitations.get(args.where.id) || null;
        if (args.where.tokenHash) {
          for (const inv of this.memoryStore.invitations.values()) {
            if (inv.tokenHash === args.where.tokenHash) return { ...inv };
          }
        }
        return null;
      },
      findFirst: async (args: { where: any }) => {
        if (!this.isInMemory) return realCompanyInvitation.findFirst(args as any);
        for (const inv of this.memoryStore.invitations.values()) {
          let match = true;
          if (args.where?.id && inv.id !== args.where.id) match = false;
          if (args.where?.companyId && inv.companyId !== args.where.companyId) match = false;
          if (args.where?.email && inv.email.toLowerCase() !== args.where.email.toLowerCase()) match = false;
          if (args.where?.tokenHash && inv.tokenHash !== args.where.tokenHash) match = false;
          if (args.where?.status && inv.status !== args.where.status) match = false;
          if (match) return { ...inv };
        }
        return null;
      },
      findMany: async (args?: { where?: any; orderBy?: any }) => {
        if (!this.isInMemory) return realCompanyInvitation.findMany(args as any);
        const results: any[] = [];
        for (const inv of this.memoryStore.invitations.values()) {
          let match = true;
          if (args?.where?.companyId && inv.companyId !== args.where.companyId) match = false;
          if (args?.where?.email && inv.email.toLowerCase() !== args.where.email.toLowerCase()) match = false;
          if (args?.where?.status && inv.status !== args.where.status) match = false;
          if (match) results.push({ ...inv });
        }
        return results;
      },
      create: async (args: { data: any }) => {
        if (!this.isInMemory) return realCompanyInvitation.create(args as any);
        for (const existing of this.memoryStore.invitations.values()) {
          if (existing.tokenHash === args.data.tokenHash) {
            const error: any = new Error('Unique constraint failed on the fields: (`tokenHash`)');
            error.code = 'P2002';
            error.meta = { target: ['tokenHash'] };
            throw error;
          }
          if (
            existing.companyId === args.data.companyId &&
            existing.email.toLowerCase() === args.data.email.toLowerCase() &&
            existing.status === 'PENDING' &&
            (!args.data.status || args.data.status === 'PENDING')
          ) {
            const error: any = new Error('Unique constraint failed on partial index (`companyId`, `email`) WHERE status = PENDING');
            error.code = 'P2002';
            error.meta = { target: ['companyId', 'email'] };
            throw error;
          }
        }
        const id = args.data.id || `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const invitation = {
          id,
          companyId: args.data.companyId,
          invitedByUserId: args.data.invitedByUserId,
          email: args.data.email.toLowerCase(),
          role: args.data.role || 'MANAGER',
          tokenHash: args.data.tokenHash,
          status: args.data.status || 'PENDING',
          expiresAt: args.data.expiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memoryStore.invitations.set(id, invitation);
        return { ...invitation };
      },
      update: async (args: { where: { id?: string; tokenHash?: string }; data: any }) => {
        if (!this.isInMemory) return realCompanyInvitation.update(args as any);
        let targetId = args.where.id;
        if (!targetId && args.where.tokenHash) {
          for (const inv of this.memoryStore.invitations.values()) {
            if (inv.tokenHash === args.where.tokenHash) {
              targetId = inv.id;
              break;
            }
          }
        }
        if (!targetId) throw new Error('Invitation not found');
        const existing = this.memoryStore.invitations.get(targetId);
        if (!existing) throw new Error('Invitation not found');
        const updated = {
          ...existing,
          ...args.data,
          updatedAt: new Date(),
        };
        this.memoryStore.invitations.set(targetId, updated);
        return { ...updated };
      },
      updateMany: async (args: { where: any; data: any }) => {
        if (!this.isInMemory) return realCompanyInvitation.updateMany(args as any);
        let count = 0;
        for (const [key, inv] of this.memoryStore.invitations.entries()) {
          let match = true;
          if (args.where?.id && inv.id !== args.where.id) match = false;
          if (args.where?.companyId && inv.companyId !== args.where.companyId) match = false;
          if (args.where?.status && inv.status !== args.where.status) match = false;
          if (args.where?.tokenHash && inv.tokenHash !== args.where.tokenHash) match = false;
          if (args.where?.expiresAt?.gt) {
            const expTime = inv.expiresAt instanceof Date ? inv.expiresAt.getTime() : new Date(inv.expiresAt).getTime();
            const gtTime = args.where.expiresAt.gt instanceof Date ? args.where.expiresAt.gt.getTime() : new Date(args.where.expiresAt.gt).getTime();
            if (!(expTime > gtTime)) match = false;
          }
          if (args.where?.expiresAt?.lte) {
            const expTime = inv.expiresAt instanceof Date ? inv.expiresAt.getTime() : new Date(inv.expiresAt).getTime();
            const lteTime = args.where.expiresAt.lte instanceof Date ? args.where.expiresAt.lte.getTime() : new Date(args.where.expiresAt.lte).getTime();
            if (!(expTime <= lteTime)) match = false;
          }
          if (args.where?.expiresAt?.lt) {
            const expTime = inv.expiresAt instanceof Date ? inv.expiresAt.getTime() : new Date(inv.expiresAt).getTime();
            const ltTime = args.where.expiresAt.lt instanceof Date ? args.where.expiresAt.lt.getTime() : new Date(args.where.expiresAt.lt).getTime();
            if (!(expTime < ltTime)) match = false;
          }
          if (match) {
            const updated = { ...inv, ...args.data, updatedAt: new Date() };
            this.memoryStore.invitations.set(key, updated);
            count++;
          }
        }
        return { count };
      },
      delete: async (args: { where: { id: string } }) => {
        if (!this.isInMemory) return realCompanyInvitation.delete(args as any);
        const existing = this.memoryStore.invitations.get(args.where.id);
        this.memoryStore.invitations.delete(args.where.id);
        return existing || null;
      },
      deleteMany: async (args?: { where?: any }) => {
        if (!this.isInMemory) return realCompanyInvitation.deleteMany(args as any);
        let count = 0;
        if (!args?.where) {
          count = this.memoryStore.invitations.size;
          this.memoryStore.invitations.clear();
          return { count };
        }
        for (const [key, inv] of this.memoryStore.invitations.entries()) {
          let match = true;
          if (args.where.companyId && inv.companyId !== args.where.companyId) match = false;
          if (args.where.email && inv.email !== args.where.email) match = false;
          if (match) {
            this.memoryStore.invitations.delete(key);
            count++;
          }
        }
        return { count };
      },
    };

    // FeedbackForm memory delegates
    const enrichForm = (form: any, includeOrSelect?: any) => {
      if (!form) return null;
      const copy = { ...form };
      if (includeOrSelect?.questions) {
        const formQuestions = Array.from(this.memoryStore.questions.values())
          .filter((q) => {
            if (q.formId !== form.id) return false;
            const qActive = q.isActive ?? true;
            if (includeOrSelect?.questions?.where?.isActive !== undefined) {
              return qActive === includeOrSelect.questions.where.isActive;
            }
            if (includeOrSelect?.questions?.where?.questionType?.in) {
              if (!includeOrSelect.questions.where.questionType.in.includes(q.questionType)) return false;
            }
            return qActive !== false;
          })
          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
          .map((q) => {
            const qCopy = { ...q, isActive: q.isActive ?? true, version: q.version ?? 1 };
            if (includeOrSelect.questions === true || includeOrSelect.questions?.include?.options || includeOrSelect.questions?.select?.options) {
              qCopy.options = Array.from(this.memoryStore.options.values())
                .filter((o) => {
                  if (o.questionId !== q.id) return false;
                  const oActive = o.isActive ?? true;
                  const optWhere = includeOrSelect?.questions?.include?.options?.where || includeOrSelect?.questions?.select?.options?.where;
                  if (optWhere?.isActive !== undefined) {
                    return oActive === optWhere.isActive;
                  }
                  return oActive !== false;
                })
                .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                .map((o) => ({ ...o, isActive: o.isActive ?? true }));
            }
            return qCopy;
          });
        copy.questions = formQuestions;
      }
      if (includeOrSelect?.company) {
        copy.company = this.memoryStore.companies.get(form.companyId) || null;
      }
      if (includeOrSelect?.responses) {
        copy.responses = Array.from(this.memoryStore.responses.values()).filter((r) => r.formId === form.id);
      }
      if (includeOrSelect?._count) {
        const qCount = Array.from(this.memoryStore.questions.values()).filter((q) => q.formId === form.id && (q.isActive ?? true)).length;
        const rCount = Array.from(this.memoryStore.responses.values()).filter((r) => r.formId === form.id).length;
        copy._count = { questions: qCount, responses: rCount };
      }
      return copy;
    };

    const memoryFeedbackForm = {
      findUnique: async (args: { where: any; include?: any }) => {
        if (!this.isInMemory) return realFeedbackForm.findUnique(args as any);
        let form: any = null;
        if (args.where.id) {
          form = this.memoryStore.forms.get(args.where.id) || null;
        } else if (args.where.slug) {
          for (const f of this.memoryStore.forms.values()) {
            if (f.slug === args.where.slug) {
              form = f;
              break;
            }
          }
        } else if (args.where.companyId_slug) {
          for (const f of this.memoryStore.forms.values()) {
            if (f.companyId === args.where.companyId_slug.companyId && f.slug === args.where.companyId_slug.slug) {
              form = f;
              break;
            }
          }
        }
        return enrichForm(form, args?.include || (args as any)?.select);
      },
      findFirst: async (args: { where: any; include?: any; select?: any }) => {
        if (!this.isInMemory) return realFeedbackForm.findFirst(args as any);
        for (const f of this.memoryStore.forms.values()) {
          let match = true;
          if (args.where?.id && f.id !== args.where.id) match = false;
          if (args.where?.slug && f.slug !== args.where.slug) match = false;
          if (args.where?.companyId && f.companyId !== args.where.companyId) match = false;
          if (args.where?.status && f.status !== args.where.status) match = false;
          if (match) return enrichForm(f, args?.include || args?.select);
        }
        return null;
      },
      findMany: async (args?: { where?: any; include?: any; select?: any; orderBy?: any; skip?: number; take?: number }) => {
        if (!this.isInMemory) return realFeedbackForm.findMany(args as any);
        let list = Array.from(this.memoryStore.forms.values());
        if (args?.where) {
          list = list.filter((f) => {
            if (args.where.id) {
              if (typeof args.where.id === 'string' && f.id !== args.where.id) return false;
              if (args.where.id?.in && Array.isArray(args.where.id.in) && !args.where.id.in.includes(f.id)) return false;
            }
            if (args.where.companyId && f.companyId !== args.where.companyId) return false;
            if (args.where.status) {
              if (typeof args.where.status === 'string' && f.status !== args.where.status) return false;
              if (args.where.status?.in && Array.isArray(args.where.status.in) && !args.where.status.in.includes(f.status)) return false;
            }
            if (args.where.OR) {
              const matchesOr = args.where.OR.some((clause: any) => {
                if (clause.title?.contains) {
                  return f.title.toLowerCase().includes(clause.title.contains.toLowerCase());
                }
                if (clause.internalName?.contains) {
                  return (f.internalName || '').toLowerCase().includes(clause.internalName.contains.toLowerCase());
                }
                return false;
              });
              if (!matchesOr) return false;
            }
            return true;
          });
        }
        if (args?.orderBy) {
          const field = Object.keys(args.orderBy)[0];
          const direction = args.orderBy[field] === 'asc' ? 1 : -1;
          list.sort((a, b) => {
            const valA = a[field] instanceof Date ? a[field].getTime() : (a[field] ?? 0);
            const valB = b[field] instanceof Date ? b[field].getTime() : (b[field] ?? 0);
            if (valA < valB) return -1 * direction;
            if (valA > valB) return 1 * direction;
            return 0;
          });
        } else {
          list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }
        if (args?.skip !== undefined) {
          list = list.slice(args.skip);
        }
        if (args?.take !== undefined) {
          list = list.slice(0, args.take);
        }
        return list.map((f) => enrichForm(f, args?.include || args?.select));
      },
      create: async (args: { data: any; include?: any }) => {
        if (!this.isInMemory) return realFeedbackForm.create(args as any);
        const id = args.data.id || `form_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const form = {
          id,
          companyId: args.data.companyId,
          internalName: args.data.internalName || null,
          title: args.data.title,
          slug: args.data.slug,
          description: args.data.description || null,
          welcomeMessage: args.data.welcomeMessage || null,
          thankYouMessage: args.data.thankYouMessage || null,
          audienceType: args.data.audienceType || 'CUSTOMER',
          anonymityMode: args.data.anonymityMode || 'ANONYMOUS_ONLY',
          status: args.data.status || 'DRAFT',
          allowMultipleSubmissions: args.data.allowMultipleSubmissions || false,
          themeSettings: args.data.themeSettings || null,
          publishedAt: args.data.publishedAt || null,
          closedAt: args.data.closedAt || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memoryStore.forms.set(id, form);

        if (args.data.questions?.create && Array.isArray(args.data.questions.create)) {
          for (let i = 0; i < args.data.questions.create.length; i++) {
            const qData = args.data.questions.create[i];
            const qId = qData.id || `q_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 9)}`;
            const question = {
              id: qId,
              formId: id,
              questionType: qData.questionType,
              title: qData.title,
              helpText: qData.helpText || null,
              placeholder: qData.placeholder || null,
              isRequired: qData.isRequired ?? true,
              orderIndex: qData.orderIndex ?? i,
              validationRules: qData.validationRules || null,
              branchingLogic: qData.branchingLogic || null,
              isActive: qData.isActive ?? true,
              version: qData.version ?? 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            this.memoryStore.questions.set(qId, question);

            if (qData.options?.create && Array.isArray(qData.options.create)) {
              for (let j = 0; j < qData.options.create.length; j++) {
                const optData = qData.options.create[j];
                const optId = optData.id || `opt_${Date.now()}_${j}_${Math.random().toString(36).slice(2, 9)}`;
                this.memoryStore.options.set(optId, {
                  id: optId,
                  questionId: qId,
                  label: optData.label,
                  value: optData.value,
                  orderIndex: optData.orderIndex ?? j,
                  isActive: optData.isActive ?? true,
                });
              }
            }
          }
        }

        return enrichForm(form, args.include);
      },
      update: async (args: { where: any; data: any; include?: any }) => {
        if (!this.isInMemory) return realFeedbackForm.update(args as any);
        let targetId = args.where.id;
        if (!targetId && args.where.slug) {
          for (const f of this.memoryStore.forms.values()) {
            if (f.slug === args.where.slug) {
              targetId = f.id;
              break;
            }
          }
        }
        if (!targetId) throw new Error('Form not found');
        const existing = this.memoryStore.forms.get(targetId);
        if (!existing) throw new Error('Form not found');

        const { questions: _q, ...restData } = args.data;
        const updated = {
          ...existing,
          ...restData,
          updatedAt: new Date(),
        };
        this.memoryStore.forms.set(targetId, updated);
        return enrichForm(updated, args.include);
      },
      delete: async (args: { where: { id: string } }) => {
        if (!this.isInMemory) return realFeedbackForm.delete(args as any);
        const existing = this.memoryStore.forms.get(args.where.id);
        if (existing) {
          this.memoryStore.forms.delete(args.where.id);
          for (const [qId, q] of Array.from(this.memoryStore.questions.entries())) {
            if (q.formId === args.where.id) {
              this.memoryStore.questions.delete(qId);
              for (const [optId, opt] of Array.from(this.memoryStore.options.entries())) {
                if (opt.questionId === qId) this.memoryStore.options.delete(optId);
              }
            }
          }
          for (const [rId, r] of Array.from(this.memoryStore.responses.entries())) {
            if (r.formId === args.where.id) {
              this.memoryStore.responses.delete(rId);
              for (const [aId, a] of Array.from(this.memoryStore.answers.entries())) {
                if (a.responseId === rId) this.memoryStore.answers.delete(aId);
              }
            }
          }
        }
        return existing || null;
      },
      count: async (args?: { where?: any }) => {
        if (!this.isInMemory) return realFeedbackForm.count(args as any);
        if (!args?.where) return this.memoryStore.forms.size;
        let count = 0;
        for (const f of this.memoryStore.forms.values()) {
          let match = true;
          if (args.where.companyId && f.companyId !== args.where.companyId) match = false;
          if (args.where.status && f.status !== args.where.status) match = false;
          if (match) count++;
        }
        return count;
      },
    };

    const memoryFormQuestion = {
      findMany: async (args?: { where?: any; include?: any; orderBy?: any }) => {
        if (!this.isInMemory) return realFormQuestion.findMany(args as any);
        let list = Array.from(this.memoryStore.questions.values());
        if (args?.where?.formId) {
          list = list.filter((q) => q.formId === args.where.formId);
        }
        if (args?.where?.isActive !== undefined) {
          list = list.filter((q) => q.isActive === args.where.isActive);
        }
        list.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        return list.map((q) => {
          const item: any = { ...q };
          if (args?.include?.options) {
            item.options = Array.from(this.memoryStore.options.values())
              .filter((o) => o.questionId === q.id && (args.include.options.where?.isActive !== undefined ? o.isActive === args.include.options.where.isActive : o.isActive !== false))
              .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
          }
          if (args?.include?.answers) {
            item.answers = Array.from(this.memoryStore.answers.values()).filter((a) => a.questionId === q.id);
          }
          return item;
        });
      },
      findUnique: async (args: { where: { id: string }; include?: any }) => {
        if (!this.isInMemory) return realFormQuestion.findUnique(args as any);
        const q = this.memoryStore.questions.get(args.where.id);
        if (!q) return null;
        const item: any = { ...q };
        if (args?.include?.options) {
          const optWhere = typeof args.include.options === 'object' ? args.include.options.where : undefined;
          item.options = Array.from(this.memoryStore.options.values())
            .filter((o) => o.questionId === q.id && (optWhere?.isActive !== undefined ? o.isActive === optWhere.isActive : true))
            .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        }
        if (args.include?.answers) {
          item.answers = Array.from(this.memoryStore.answers.values()).filter((a) => a.questionId === q.id);
        }
        return item;
      },
      create: async (args: { data: any; include?: any }) => {
        if (!this.isInMemory) return realFormQuestion.create(args as any);
        const id = args.data.id || `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const q = {
          id,
          formId: args.data.formId,
          questionType: args.data.questionType,
          title: args.data.title,
          helpText: args.data.helpText || null,
          placeholder: args.data.placeholder || null,
          isRequired: args.data.isRequired ?? true,
          orderIndex: args.data.orderIndex ?? 0,
          validationRules: args.data.validationRules || null,
          branchingLogic: args.data.branchingLogic || null,
          isActive: args.data.isActive ?? true,
          version: args.data.version ?? 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memoryStore.questions.set(id, q);

        if (args.data.options?.create && Array.isArray(args.data.options.create)) {
          for (let j = 0; j < args.data.options.create.length; j++) {
            const optData = args.data.options.create[j];
            const optId = optData.id || `opt_${Date.now()}_${j}_${Math.random().toString(36).slice(2, 9)}`;
            this.memoryStore.options.set(optId, {
              id: optId,
              questionId: id,
              label: optData.label,
              value: optData.value,
              orderIndex: optData.orderIndex ?? j,
              isActive: optData.isActive ?? true,
            });
          }
        }

        if (args.include?.options) {
          return {
            ...q,
            options: Array.from(this.memoryStore.options.values())
              .filter((o) => o.questionId === id && o.isActive !== false)
              .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)),
          };
        }
        return { ...q };
      },
      update: async (args: { where: { id: string }; data: any; include?: any }) => {
        if (!this.isInMemory) return realFormQuestion.update(args as any);
        const existing = this.memoryStore.questions.get(args.where.id);
        if (!existing) throw new Error('Question not found');
        const updated = {
          ...existing,
          ...args.data,
          updatedAt: new Date(),
        };
        this.memoryStore.questions.set(args.where.id, updated);
        return { ...updated };
      },
      updateMany: async (args: { where: any; data: any }) => {
        if (!this.isInMemory) return realFormQuestion.updateMany(args as any);
        let count = 0;
        for (const [id, q] of Array.from(this.memoryStore.questions.entries())) {
          let match = true;
          if (args.where?.formId && q.formId !== args.where.formId) match = false;
          if (args.where?.id && q.id !== args.where.id) match = false;
          if (match) {
            const updated = { ...q, ...args.data, updatedAt: new Date() };
            this.memoryStore.questions.set(id, updated);
            count++;
          }
        }
        return { count };
      },
      delete: async (args: { where: { id: string } }) => {
        if (!this.isInMemory) return realFormQuestion.delete(args as any);
        const existing = this.memoryStore.questions.get(args.where.id);
        if (existing) {
          // Emulate ON DELETE RESTRICT
          const answers = Array.from(this.memoryStore.answers.values()).filter((a) => a.questionId === args.where.id);
          if (answers.length > 0) {
            const error: any = new Error('Foreign key constraint violated: FeedbackAnswer restricts FormQuestion deletion');
            error.code = 'P2003';
            throw error;
          }
          this.memoryStore.questions.delete(args.where.id);
          for (const [optId, opt] of Array.from(this.memoryStore.options.entries())) {
            if (opt.questionId === args.where.id) this.memoryStore.options.delete(optId);
          }
        }
        return existing || null;
      },
      deleteMany: async (args?: { where?: any }) => {
        if (!this.isInMemory) return realFormQuestion.deleteMany(args as any);
        let count = 0;
        if (!args?.where) {
          count = this.memoryStore.questions.size;
          this.memoryStore.questions.clear();
          return { count };
        }
        for (const [id, q] of Array.from(this.memoryStore.questions.entries())) {
          if (args.where.formId && q.formId !== args.where.formId) continue;
          // Emulate ON DELETE RESTRICT
          const answers = Array.from(this.memoryStore.answers.values()).filter((a) => a.questionId === id);
          if (answers.length > 0) {
            const error: any = new Error('Foreign key constraint violated: FeedbackAnswer restricts FormQuestion deletion');
            error.code = 'P2003';
            throw error;
          }
          this.memoryStore.questions.delete(id);
          for (const [optId, opt] of Array.from(this.memoryStore.options.entries())) {
            if (opt.questionId === id) this.memoryStore.options.delete(optId);
          }
          count++;
        }
        return { count };
      },
    };

    const memoryFormQuestionOption = {
      create: async (args: { data: any }) => {
        if (!this.isInMemory) return realFormQuestionOption.create(args as any);
        const id = args.data.id || `opt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const opt = {
          id,
          questionId: args.data.questionId,
          label: args.data.label,
          value: args.data.value,
          orderIndex: args.data.orderIndex ?? 0,
          isActive: args.data.isActive ?? true,
        };
        this.memoryStore.options.set(id, opt);
        return { ...opt };
      },
      update: async (args: { where: { id: string }; data: any }) => {
        if (!this.isInMemory) return realFormQuestionOption.update(args as any);
        const existing = this.memoryStore.options.get(args.where.id);
        if (!existing) throw new Error('Option not found');
        const updated = { ...existing, ...args.data };
        this.memoryStore.options.set(args.where.id, updated);
        return { ...updated };
      },
      updateMany: async (args: { where: any; data: any }) => {
        if (!this.isInMemory) return realFormQuestionOption.updateMany(args as any);
        let count = 0;
        for (const [id, opt] of Array.from(this.memoryStore.options.entries())) {
          let match = true;
          if (args.where?.questionId && opt.questionId !== args.where.questionId) match = false;
          if (args.where?.id && opt.id !== args.where.id) match = false;
          if (match) {
            const updated = { ...opt, ...args.data };
            this.memoryStore.options.set(id, updated);
            count++;
          }
        }
        return { count };
      },
      deleteMany: async (args?: { where?: any }) => {
        if (!this.isInMemory) return realFormQuestionOption.deleteMany(args as any);
        let count = 0;
        for (const [id, opt] of Array.from(this.memoryStore.options.entries())) {
          if (args?.where?.questionId && opt.questionId !== args.where.questionId) continue;
          this.memoryStore.options.delete(id);
          count++;
        }
        return { count };
      },
    };

    const memoryFeedbackResponse = {
      create: async (args: { data: any; include?: any }) => {
        if (!this.isInMemory) return realFeedbackResponse.create(args as any);
        const id = args.data.id || `resp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const resp = {
          id,
          companyId: args.data.companyId,
          formId: args.data.formId,
          submissionToken: args.data.submissionToken,
          isAnonymous: args.data.isAnonymous ?? true,
          respondentUserId: args.data.respondentUserId || null,
          respondentEmail: args.data.respondentEmail || null,
          respondentName: args.data.respondentName || null,
          ipHash: args.data.ipHash || null,
          status: args.data.status || 'NEW',
          sentimentScore: args.data.sentimentScore || null,
          tags: args.data.tags || null,
          submittedAt: args.data.submittedAt || new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.memoryStore.responses.set(id, resp);

        if (args.data.answers?.create && Array.isArray(args.data.answers.create)) {
          for (let i = 0; i < args.data.answers.create.length; i++) {
            const ansData = args.data.answers.create[i];
            const aId = ansData.id || `ans_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 9)}`;
            this.memoryStore.answers.set(aId, {
              id: aId,
              responseId: id,
              questionId: ansData.questionId,
              questionTitle: ansData.questionTitle || null,
              questionType: ansData.questionType || null,
              selectedOptionLabel: ansData.selectedOptionLabel || null,
              selectedOptionValue: ansData.selectedOptionValue || null,
              selectedOptions: ansData.selectedOptions || null,
              textValue: ansData.textValue || null,
              numberValue: ansData.numberValue ?? null,
              booleanValue: ansData.booleanValue ?? null,
              jsonValue: ansData.jsonValue || null,
              createdAt: new Date(),
            });
          }
        }

        if (args.include?.answers) {
          return {
            ...resp,
            answers: Array.from(this.memoryStore.answers.values()).filter((a) => a.responseId === id),
          };
        }
        return { ...resp };
      },
      findFirst: async (args: { where: any; include?: any; select?: any }) => {
        if (!this.isInMemory) return realFeedbackResponse.findFirst(args as any);
        for (const r of this.memoryStore.responses.values()) {
          let match = true;
          if (args.where?.id && r.id !== args.where.id) match = false;
          if (args.where?.formId) {
            if (typeof args.where.formId === 'string' && r.formId !== args.where.formId) match = false;
            if (args.where.formId?.in && Array.isArray(args.where.formId.in) && !args.where.formId.in.includes(r.formId)) match = false;
          }
          if (args.where?.companyId && r.companyId !== args.where.companyId) match = false;
          if (args.where?.status && r.status !== args.where.status) match = false;
          if (args.where?.respondentEmail && r.respondentEmail?.toLowerCase() !== args.where.respondentEmail.toLowerCase()) match = false;
          if (args.where?.ipHash && r.ipHash !== args.where.ipHash) match = false;
          if (args.where?.submittedAt) {
            const subTime = r.submittedAt instanceof Date ? r.submittedAt.getTime() : new Date(r.submittedAt).getTime();
            if (args.where.submittedAt.gte) {
              const gteTime = args.where.submittedAt.gte instanceof Date ? args.where.submittedAt.gte.getTime() : new Date(args.where.submittedAt.gte).getTime();
              if (!(subTime >= gteTime)) match = false;
            }
            if (args.where.submittedAt.gt) {
              const gtTime = args.where.submittedAt.gt instanceof Date ? args.where.submittedAt.gt.getTime() : new Date(args.where.submittedAt.gt).getTime();
              if (!(subTime > gtTime)) match = false;
            }
            if (args.where.submittedAt.lte) {
              const lteTime = args.where.submittedAt.lte instanceof Date ? args.where.submittedAt.lte.getTime() : new Date(args.where.submittedAt.lte).getTime();
              if (!(subTime <= lteTime)) match = false;
            }
            if (args.where.submittedAt.lt) {
              const ltTime = args.where.submittedAt.lt instanceof Date ? args.where.submittedAt.lt.getTime() : new Date(args.where.submittedAt.lt).getTime();
              if (!(subTime < ltTime)) match = false;
            }
          }
          if (match) {
            const res: any = { ...r };
            if (args.include?.answers) {
              res.answers = Array.from(this.memoryStore.answers.values()).filter((a) => a.responseId === r.id);
            }
            if (args.include?.form) {
              res.form = this.memoryStore.forms.get(r.formId) || null;
            }
            return res;
          }
        }
        return null;
      },
      findMany: async (args?: { where?: any; include?: any; select?: any; orderBy?: any; skip?: number; take?: number }) => {
        if (!this.isInMemory) return realFeedbackResponse.findMany(args as any);
        let list = Array.from(this.memoryStore.responses.values());
        if (args?.where) {
          list = list.filter((r) => {
            if (args.where.id && r.id !== args.where.id) return false;
            if (args.where.companyId && r.companyId !== args.where.companyId) return false;
            if (args.where.formId) {
              if (typeof args.where.formId === 'string' && r.formId !== args.where.formId) return false;
              if (args.where.formId?.in && Array.isArray(args.where.formId.in) && !args.where.formId.in.includes(r.formId)) return false;
            }
            if (args.where.status) {
              if (typeof args.where.status === 'string' && r.status !== args.where.status) return false;
              if (args.where.status?.in && Array.isArray(args.where.status.in) && !args.where.status.in.includes(r.status)) return false;
            }
            if (args.where.submittedAt) {
              const subTime = r.submittedAt instanceof Date ? r.submittedAt.getTime() : new Date(r.submittedAt).getTime();
              if (args.where.submittedAt.gte) {
                const gteTime = args.where.submittedAt.gte instanceof Date ? args.where.submittedAt.gte.getTime() : new Date(args.where.submittedAt.gte).getTime();
                if (!(subTime >= gteTime)) return false;
              }
              if (args.where.submittedAt.gt) {
                const gtTime = args.where.submittedAt.gt instanceof Date ? args.where.submittedAt.gt.getTime() : new Date(args.where.submittedAt.gt).getTime();
                if (!(subTime > gtTime)) return false;
              }
              if (args.where.submittedAt.lte) {
                const lteTime = args.where.submittedAt.lte instanceof Date ? args.where.submittedAt.lte.getTime() : new Date(args.where.submittedAt.lte).getTime();
                if (!(subTime <= lteTime)) return false;
              }
              if (args.where.submittedAt.lt) {
                const ltTime = args.where.submittedAt.lt instanceof Date ? args.where.submittedAt.lt.getTime() : new Date(args.where.submittedAt.lt).getTime();
                if (!(subTime < ltTime)) return false;
              }
            }
            return true;
          });
        }
        if (args?.orderBy) {
          const field = Object.keys(args.orderBy)[0];
          const direction = args.orderBy[field] === 'asc' ? 1 : -1;
          list.sort((a, b) => {
            const valA = a[field] instanceof Date ? a[field].getTime() : a[field];
            const valB = b[field] instanceof Date ? b[field].getTime() : b[field];
            if (valA < valB) return -1 * direction;
            if (valA > valB) return 1 * direction;
            return 0;
          });
        }
        if (args?.skip !== undefined) {
          list = list.slice(args.skip);
        }
        if (args?.take !== undefined) {
          list = list.slice(0, args.take);
        }
        return list.map((r) => {
          const res: any = { ...r };
          if (args?.include?.answers || args?.select?.answers) {
            let ansList = Array.from(this.memoryStore.answers.values()).filter((a) => a.responseId === r.id);
            const ansWhere = args.select?.answers?.where || args.include?.answers?.where;
            if (ansWhere?.questionType?.in && Array.isArray(ansWhere.questionType.in)) {
              ansList = ansList.filter((a) => ansWhere.questionType.in.includes(a.questionType));
            }
            const needsQuestion = Boolean(args.select?.answers?.select?.question || args.include?.answers?.include?.question);
            if (needsQuestion) {
              ansList = ansList.map((a) => ({
                ...a,
                question: this.memoryStore.questions.get(a.questionId) || null,
              }));
            }
            res.answers = ansList;
          }
          if (args?.include?.form || args?.select?.form) {
            res.form = this.memoryStore.forms.get(r.formId) || null;
          }
          return res;
        });
      },
      findUnique: async (args: { where: any; include?: any }) => {
        if (!this.isInMemory) return realFeedbackResponse.findUnique(args as any);
        let r: any = null;
        if (args.where.id) r = this.memoryStore.responses.get(args.where.id);
        if (!r && args.where.submissionToken) {
          for (const item of this.memoryStore.responses.values()) {
            if (item.submissionToken === args.where.submissionToken) {
              r = item;
              break;
            }
          }
        }
        if (!r) return null;
        const res: any = { ...r };
        if (args.include?.answers) {
          res.answers = Array.from(this.memoryStore.answers.values()).filter((a) => a.responseId === r.id);
        }
        if (args.include?.form) {
          res.form = this.memoryStore.forms.get(r.formId) || null;
        }
        return res;
      },
      count: async (args?: { where?: any }) => {
        if (!this.isInMemory) return realFeedbackResponse.count(args as any);
        if (!args?.where) return this.memoryStore.responses.size;
        let count = 0;
        for (const r of this.memoryStore.responses.values()) {
          let match = true;
          if (args.where.companyId && r.companyId !== args.where.companyId) match = false;
          if (args.where.formId) {
            if (typeof args.where.formId === 'string' && r.formId !== args.where.formId) match = false;
            if (args.where.formId?.in && Array.isArray(args.where.formId.in) && !args.where.formId.in.includes(r.formId)) match = false;
          }
          if (args.where.status) {
            if (typeof args.where.status === 'string' && r.status !== args.where.status) match = false;
            if (args.where.status?.in && Array.isArray(args.where.status.in) && !args.where.status.in.includes(r.status)) match = false;
          }
          if (args.where.submittedAt) {
            const subTime = r.submittedAt instanceof Date ? r.submittedAt.getTime() : new Date(r.submittedAt).getTime();
            if (args.where.submittedAt.gte) {
              const gteTime = args.where.submittedAt.gte instanceof Date ? args.where.submittedAt.gte.getTime() : new Date(args.where.submittedAt.gte).getTime();
              if (!(subTime >= gteTime)) match = false;
            }
            if (args.where.submittedAt.gt) {
              const gtTime = args.where.submittedAt.gt instanceof Date ? args.where.submittedAt.gt.getTime() : new Date(args.where.submittedAt.gt).getTime();
              if (!(subTime > gtTime)) match = false;
            }
            if (args.where.submittedAt.lte) {
              const lteTime = args.where.submittedAt.lte instanceof Date ? args.where.submittedAt.lte.getTime() : new Date(args.where.submittedAt.lte).getTime();
              if (!(subTime <= lteTime)) match = false;
            }
            if (args.where.submittedAt.lt) {
              const ltTime = args.where.submittedAt.lt instanceof Date ? args.where.submittedAt.lt.getTime() : new Date(args.where.submittedAt.lt).getTime();
              if (!(subTime < ltTime)) match = false;
            }
          }
          if (match) count++;
        }
        return count;
      },
      deleteMany: async (args?: { where?: any }) => {
        if (!this.isInMemory) return realFeedbackResponse.deleteMany(args as any);
        let count = 0;
        for (const [id, resp] of Array.from(this.memoryStore.responses.entries())) {
          let match = true;
          if (args?.where?.formId && resp.formId !== args.where.formId) match = false;
          if (args?.where?.companyId && resp.companyId !== args.where.companyId) match = false;
          if (match) {
            for (const [aId, ans] of Array.from(this.memoryStore.answers.entries())) {
              if (ans.responseId === id) {
                this.memoryStore.answers.delete(aId);
              }
            }
            this.memoryStore.responses.delete(id);
            count++;
          }
        }
        return { count };
      },
    };

    const memoryFeedbackAnswer = {
      create: async (args: { data: any }) => {
        if (!this.isInMemory) return realFeedbackAnswer.create(args as any);
        const id = args.data.id || `ans_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const ans = {
          id,
          responseId: args.data.responseId,
          questionId: args.data.questionId,
          questionTitle: args.data.questionTitle || null,
          questionType: args.data.questionType || null,
          selectedOptionLabel: args.data.selectedOptionLabel || null,
          selectedOptionValue: args.data.selectedOptionValue || null,
          selectedOptions: args.data.selectedOptions || null,
          textValue: args.data.textValue || null,
          numberValue: args.data.numberValue ?? null,
          booleanValue: args.data.booleanValue ?? null,
          jsonValue: args.data.jsonValue || null,
          createdAt: new Date(),
        };
        this.memoryStore.answers.set(id, ans);
        return { ...ans };
      },
      findMany: async (args?: { where?: any; include?: any }) => {
        if (!this.isInMemory) return realFeedbackAnswer.findMany(args as any);
        let list = Array.from(this.memoryStore.answers.values());
        if (args?.where) {
          list = list.filter((a) => {
            if (args.where.responseId) {
              if (typeof args.where.responseId === 'string' && a.responseId !== args.where.responseId) return false;
              if (args.where.responseId?.in && Array.isArray(args.where.responseId.in) && !args.where.responseId.in.includes(a.responseId)) return false;
            }
            if (args.where.questionId) {
              if (typeof args.where.questionId === 'string' && a.questionId !== args.where.questionId) return false;
              if (args.where.questionId?.in && Array.isArray(args.where.questionId.in) && !args.where.questionId.in.includes(a.questionId)) return false;
            }
            if (args.where.questionType) {
              if (typeof args.where.questionType === 'string' && a.questionType !== args.where.questionType) return false;
              if (args.where.questionType?.in && Array.isArray(args.where.questionType.in) && !args.where.questionType.in.includes(a.questionType)) return false;
            }
            if (args.where.response) {
              const resp = this.memoryStore.responses.get(a.responseId);
              if (!resp) return false;
              if (args.where.response.companyId && resp.companyId !== args.where.response.companyId) return false;
              if (args.where.response.formId && resp.formId !== args.where.response.formId) return false;
              if (args.where.response.submittedAt) {
                const subTime = resp.submittedAt instanceof Date ? resp.submittedAt.getTime() : new Date(resp.submittedAt).getTime();
                if (args.where.response.submittedAt.gte) {
                  const gteTime = args.where.response.submittedAt.gte instanceof Date ? args.where.response.submittedAt.gte.getTime() : new Date(args.where.response.submittedAt.gte).getTime();
                  if (!(subTime >= gteTime)) return false;
                }
                if (args.where.response.submittedAt.lte) {
                  const lteTime = args.where.response.submittedAt.lte instanceof Date ? args.where.response.submittedAt.lte.getTime() : new Date(args.where.response.submittedAt.lte).getTime();
                  if (!(subTime <= lteTime)) return false;
                }
              }
            }
            return true;
          });
        }
        return list.map((a) => {
          const res: any = { ...a };
          if (args?.include?.response) {
            res.response = this.memoryStore.responses.get(a.responseId) || null;
          }
          if (args?.include?.question) {
            res.question = this.memoryStore.questions.get(a.questionId) || null;
          }
          return res;
        });
      },
      count: async (args?: { where?: any }) => {
        if (!this.isInMemory) return realFeedbackAnswer.count(args as any);
        if (!args?.where) return this.memoryStore.answers.size;
        let count = 0;
        for (const a of this.memoryStore.answers.values()) {
          let match = true;
          if (args.where.responseId) {
            if (typeof args.where.responseId === 'string' && a.responseId !== args.where.responseId) match = false;
            if (args.where.responseId?.in && Array.isArray(args.where.responseId.in) && !args.where.responseId.in.includes(a.responseId)) match = false;
          }
          if (args.where.questionId) {
            if (typeof args.where.questionId === 'string' && a.questionId !== args.where.questionId) match = false;
            if (args.where.questionId?.in && Array.isArray(args.where.questionId.in) && !args.where.questionId.in.includes(a.questionId)) match = false;
          }
          if (match) count++;
        }
        return count;
      },
      deleteMany: async (args?: { where?: any }) => {
        if (!this.isInMemory) return realFeedbackAnswer.deleteMany(args as any);
        let count = 0;
        for (const [id, ans] of Array.from(this.memoryStore.answers.entries())) {
          let match = true;
          if (args?.where?.responseId && ans.responseId !== args.where.responseId) match = false;
          if (args?.where?.questionId && ans.questionId !== args.where.questionId) match = false;
          if (match) {
            this.memoryStore.answers.delete(id);
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
    Object.defineProperty(this, 'companyInvitation', {
      get: () => (this.isInMemory ? memoryCompanyInvitation : realCompanyInvitation),
      configurable: true,
    });
    Object.defineProperty(this, 'feedbackForm', {
      get: () => (this.isInMemory ? memoryFeedbackForm : realFeedbackForm),
      configurable: true,
    });
    Object.defineProperty(this, 'formQuestion', {
      get: () => (this.isInMemory ? memoryFormQuestion : realFormQuestion),
      configurable: true,
    });
    Object.defineProperty(this, 'formQuestionOption', {
      get: () => (this.isInMemory ? memoryFormQuestionOption : realFormQuestionOption),
      configurable: true,
    });
    Object.defineProperty(this, 'feedbackResponse', {
      get: () => (this.isInMemory ? memoryFeedbackResponse : realFeedbackResponse),
      configurable: true,
    });
    Object.defineProperty(this, 'feedbackAnswer', {
      get: () => (this.isInMemory ? memoryFeedbackAnswer : realFeedbackAnswer),
      configurable: true,
    });
  }
}
