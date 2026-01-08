/**
 * Web Audio API mocks for BreathingExercise audio tests
 */

import { vi } from 'vitest';

/** Mock gain node for volume control */
export function createMockGainNode() {
  return {
    gain: {
      value: 0,
      setValueAtTime: vi.fn().mockReturnThis(),
      linearRampToValueAtTime: vi.fn().mockReturnThis(),
      exponentialRampToValueAtTime: vi.fn().mockReturnThis(),
    },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  };
}

/** Mock oscillator node for chimes */
export function createMockOscillatorNode() {
  return {
    type: 'sine' as OscillatorType,
    frequency: {
      value: 440,
      setValueAtTime: vi.fn().mockReturnThis(),
    },
    connect: vi.fn().mockReturnThis(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

/** Mock buffer source node for ambient sounds */
export function createMockBufferSourceNode() {
  return {
    buffer: null as AudioBuffer | null,
    loop: false,
    connect: vi.fn().mockReturnThis(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null as (() => void) | null,
  };
}

/** Mock audio buffer */
export function createMockAudioBuffer(): AudioBuffer {
  return {
    duration: 60,
    length: 2646000,
    numberOfChannels: 2,
    sampleRate: 44100,
    getChannelData: vi.fn().mockReturnValue(new Float32Array(44100)),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  };
}

/** Create a full mock AudioContext */
export function createMockAudioContext() {
  const gainNode = createMockGainNode();
  const oscillatorNode = createMockOscillatorNode();
  const sourceNode = createMockBufferSourceNode();
  const audioBuffer = createMockAudioBuffer();

  const mockContext = {
    state: 'running' as AudioContextState,
    currentTime: 0,
    destination: {},
    sampleRate: 44100,
    resume: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    createGain: vi.fn(() => createMockGainNode()),
    createOscillator: vi.fn(() => createMockOscillatorNode()),
    createBufferSource: vi.fn(() => createMockBufferSourceNode()),
    decodeAudioData: vi.fn().mockResolvedValue(audioBuffer),
  };

  return {
    mockContext,
    gainNode,
    oscillatorNode,
    sourceNode,
    audioBuffer,
  };
}

/** Setup global AudioContext mock for tests */
export function setupAudioContextMock() {
  const { mockContext, ...nodes } = createMockAudioContext();

  // Mock global AudioContext constructor - returns the SAME mockContext each time
  // This allows tests to check calls on the shared mock
  const MockAudioContext = vi.fn(() => mockContext);
  global.AudioContext = MockAudioContext as unknown as typeof AudioContext;

  // Mock fetch for loading audio files
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
  });

  return {
    MockAudioContext,
    mockContext,
    ...nodes,
    cleanup: () => {
      vi.restoreAllMocks();
    },
  };
}

/**
 * Create a tracked AudioContext mock for more detailed assertions
 * Use this when you need to track calls across multiple AudioContext instantiations
 */
export function createTrackedAudioContextMock() {
  const calls = {
    createOscillator: [] as unknown[],
    createGain: [] as unknown[],
    createBufferSource: [] as unknown[],
    close: [] as unknown[],
  };

  const mockContext = {
    state: 'running' as AudioContextState,
    currentTime: 0,
    destination: {},
    sampleRate: 44100,
    resume: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(() => {
      calls.close.push({});
      return Promise.resolve();
    }),
    createGain: vi.fn(() => {
      const node = createMockGainNode();
      calls.createGain.push(node);
      return node;
    }),
    createOscillator: vi.fn(() => {
      const node = createMockOscillatorNode();
      calls.createOscillator.push(node);
      return node;
    }),
    createBufferSource: vi.fn(() => {
      const node = createMockBufferSourceNode();
      calls.createBufferSource.push(node);
      return node;
    }),
    decodeAudioData: vi.fn().mockResolvedValue(createMockAudioBuffer()),
  };

  return { mockContext, calls };
}

/** Reset all audio mocks between tests */
export function resetAudioMocks() {
  vi.clearAllMocks();
}
