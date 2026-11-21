import { AsyncLocalStorage } from 'async_hooks';
import type { TenantContext } from '@feedbackhub/types';

interface TenantStore {
  current: TenantContext;
}

const tenantAsyncLocalStorage = new AsyncLocalStorage<TenantStore>();

export class TenantContextManager {
  /**
   * Executes a callback within an isolated request-scoped tenant context.
   * Concurrency-safe: cannot leak between concurrent async tasks or requests.
   */
  static run<T>(context: TenantContext, fn: () => Promise<T> | T): Promise<T> | T {
    // Immutable snapshot: prevent in-place mutation downstream
    const immutableContext = Object.freeze({ ...context });
    return tenantAsyncLocalStorage.run({ current: immutableContext }, fn);
  }

  /**
   * Retrieves the current request-scoped tenant context, or undefined if outside tenant scope.
   */
  static getContext(): TenantContext | undefined {
    return tenantAsyncLocalStorage.getStore()?.current;
  }

  /**
   * Retrieves the current tenant context, throwing if missing (fail-closed).
   */
  static getRequiredContext(): TenantContext {
    const context = tenantAsyncLocalStorage.getStore()?.current;
    if (!context || !context.companyId) {
      throw new Error('Tenant context is missing or uninitialized for this operation (fail-closed).');
    }
    return context;
  }

  /**
   * Atomically enriches the active request tenant context (e.g. after membership verification).
   * Ensures AsyncLocalStorage and request.tenant remain 100% consistent.
   * If called outside an active AsyncLocalStorage boundary (e.g. standalone unit tests),
   * returns undefined gracefully.
   */
  static enrich(patch: Partial<TenantContext>): TenantContext | undefined {
    const store = tenantAsyncLocalStorage.getStore();
    if (store && store.current) {
      const enriched = Object.freeze({
        ...store.current,
        ...patch,
      });
      store.current = enriched;
      return enriched;
    }
    return undefined;
  }
}
