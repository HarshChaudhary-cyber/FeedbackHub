import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Enable React 19 act environment
// @ts-expect-error React 19 test environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Polyfill ResizeObserver for Radix UI primitives in jsdom
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Polyfill PointerEvent and pointer capture methods for Radix UI primitives in jsdom
if (typeof window !== 'undefined') {
  if (!window.PointerEvent) {
    class PointerEvent extends MouseEvent {
      constructor(type: string, params: PointerEventInit = {}) {
        super(type, params);
      }
    }
    window.PointerEvent = PointerEvent as unknown as typeof window.PointerEvent;
  }
}

if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}

// Polyfill scrollTo
if (typeof window !== 'undefined') {
  window.scrollTo = (() => {}) as unknown as typeof window.scrollTo;
}

afterEach(() => {
  cleanup();
});
