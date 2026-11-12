import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

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

afterEach(() => {
  cleanup();
  if (typeof document !== 'undefined') {
    document.body.style.pointerEvents = '';
    document.body.removeAttribute('data-radix-scroll-lock');
    document.body.removeAttribute('aria-hidden');
    // Remove any leftover Radix portals from document.body
    const radixPortals = document.querySelectorAll(
      '[data-radix-popper-content-wrapper], [data-radix-portal], [data-radix-focus-guard]'
    );
    radixPortals.forEach((el) => el.remove());
  }
});
