/* eslint-disable @typescript-eslint/no-empty-function */
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

// Mock AudioContext (not implemented in happy-dom)
// Required for BreathingExercise audio features
const createMockGainNode = () => ({
  gain: {
    value: 0,
    setValueAtTime: () => ({ value: 0 }),
    linearRampToValueAtTime: () => ({ value: 0 }),
    exponentialRampToValueAtTime: () => ({ value: 0 }),
  },
  connect: () => ({}),
  disconnect: () => {},
});

const createMockOscillatorNode = () => ({
  type: 'sine',
  frequency: { value: 440, setValueAtTime: () => ({}) },
  connect: () => ({}),
  start: () => {},
  stop: () => {},
});

const createMockBufferSourceNode = () => ({
  buffer: null,
  loop: false,
  connect: () => ({}),
  start: () => {},
  stop: () => {},
});

global.AudioContext = class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  sampleRate = 44100;
  resume() {
    return Promise.resolve();
  }
  suspend() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
  createGain() {
    return createMockGainNode();
  }
  createOscillator() {
    return createMockOscillatorNode();
  }
  createBufferSource() {
    return createMockBufferSourceNode();
  }
  decodeAudioData() {
    return Promise.resolve({
      duration: 60,
      length: 2646000,
      numberOfChannels: 2,
      sampleRate: 44100,
    });
  }
} as unknown as typeof AudioContext;
