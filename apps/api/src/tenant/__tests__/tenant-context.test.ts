import { describe, it, expect } from 'vitest';
import { TenantContextManager } from '../tenant.context';
import type { TenantContext } from '@feedbackhub/types';

describe('TenantContextManager', () => {
  it('runs within request-scoped tenant context and retrieves it correctly', async () => {
    const context: TenantContext = {
      companyId: 'comp-1234',
      companySlug: 'test-co',
      companyName: 'Test Co',
      companyStatus: 'ACTIVE',
    };

    await TenantContextManager.run(context, async () => {
      const current = TenantContextManager.getContext();
      expect(current).toBeDefined();
      expect(current?.companyId).toBe('comp-1234');
      expect(current?.companySlug).toBe('test-co');
    });

    // Outside the execution scope, context is undefined
    expect(TenantContextManager.getContext()).toBeUndefined();
  });

  it('guarantees immutability of tenant context', async () => {
    const context: TenantContext = {
      companyId: 'immutable-123',
      companySlug: 'immutable-co',
      companyName: 'Immutable Co',
      companyStatus: 'ACTIVE',
    };

    await TenantContextManager.run(context, () => {
      const stored = TenantContextManager.getContext();
      expect(Object.isFrozen(stored)).toBe(true);

      // Attempting to mutate in strict mode should throw TypeError
      expect(() => {
        (stored as unknown as Record<string, unknown>).companySlug = 'hacked-slug';
      }).toThrow();
    });
  });

  it('prevents context leakage across concurrent asynchronous tasks', async () => {
    const tasks = Array.from({ length: 50 }, (_, i) => ({
      companyId: `comp-concurrent-${i}`,
      companySlug: `slug-${i}`,
      companyName: `Company ${i}`,
      companyStatus: 'ACTIVE',
    }));

    const results = await Promise.all(
      tasks.map((taskContext) =>
        TenantContextManager.run(taskContext, async () => {
          // Add artificial jitter to simulate async database/network operations
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 20));

          const current = TenantContextManager.getContext();
          return {
            expected: taskContext.companyId,
            actual: current?.companyId,
          };
        })
      )
    );

    for (const r of results) {
      expect(r.actual).toBe(r.expected);
    }
  });

  it('getRequiredContext throws fail-closed error if context is missing', () => {
    expect(() => TenantContextManager.getRequiredContext()).toThrow(
      'Tenant context is missing or uninitialized for this operation (fail-closed).'
    );
  });
});
