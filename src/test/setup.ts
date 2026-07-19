// Vitest setup — provide IndexedDB polyfill for jsdom
import 'fake-indexeddb/auto';

// Mock matchMedia for jsdom
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Suppress React 19 act() warnings in tests
if (typeof globalThis !== 'undefined') {
  // @ts-expect-error - injected for tests
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
}
