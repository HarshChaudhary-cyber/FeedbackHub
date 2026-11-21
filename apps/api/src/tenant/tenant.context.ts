import { AsyncLocalStorage } from 'async_hooks';
import type { TenantContext } from '@feedbackhub/types';

const tenantAsyncLocalStorage = new AsyncLocalStorage<TenantContext>();

export class TenantContextManager {
  /**
   * Executes a callback within an isolated request-scoped tenant context.
   * Concurrency-safe: cannot leak between concurrent async tasks or requests.
   */
  static run<T>(context: TenantContext, fn: () => Promise<T> | T): Promise<T> | T {
    // Immutable snapshot: prevent in-place mutation downstream
    const immutableContext = Object.freeze({ ...context });
    return tenantAsyncLocalStorage.run(immutableContext, fn);
  }

  /**
   * Retrieves the current request-scoped tenant context, or undefined if outside tenant scope.
   */
  static getContext(): TenantContext | undefined {
    return tenantAsyncLocalStorage.getStore();
  }

  /**
   * Retrieves the current tenant context, throwing if missing (fail-closed).
   */
  static getRequiredContext(): TenantContext {
    const context = tenantAsyncLocalStorage.getStore();
    if (!context || !context.companyId) {
      throw new Error('Tenant context is missing or uninitialized for this operation (fail-closed).');
    }
    return context;
  }
}
