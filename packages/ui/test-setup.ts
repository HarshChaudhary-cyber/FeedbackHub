import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Polyfill ResizeObserver for Radix UI primitives in jsdom if missing
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

afterEach(() => {
  cleanup();
});
