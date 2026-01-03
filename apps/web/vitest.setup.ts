// ============================================================================
// Vitest Setup File
// ============================================================================
// This file runs before each test file. Use it for:
// - Global test utilities (jest-dom matchers)
// - Mocking browser APIs not available in happy-dom
// - Setting up test environment
// ============================================================================

import '@testing-library/jest-dom/vitest';

// Extend Vitest's expect with jest-dom matchers
// This adds matchers like:
// - toBeInTheDocument()
// - toHaveTextContent()
// - toBeVisible()
// - toBeDisabled()
// - toHaveClass()
// etc.

// Mock window.matchMedia (not implemented in happy-dom)
// Required for components that use media queries
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

// Mock ResizeObserver (not implemented in happy-dom)
// Required for components that observe element sizes
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
