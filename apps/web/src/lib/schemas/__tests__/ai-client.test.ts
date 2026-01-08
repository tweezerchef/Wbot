/**
 * AI Client Schema Tests
 *
 * Tests for Zod validation schemas used in the AI client.
 */

import { describe, expect, it } from 'vitest';

import {
  breathingConfirmationPayloadSchema,
  breathingTechniqueInfoSchema,
  errorEventDataSchema,
  historyMessageSchema,
  historyResponseSchema,
  interruptPayloadSchema,
  isBreathingConfirmation,
  isVoiceSelection,
  parseErrorMessage,
  parseHistoryResponse,
  parseInterruptPayload,
  parseSSEEvent,
  parseSSEMessages,
  sseEventSchema,
  sseMessageSchema,
  updatesEventDataSchema,
  voiceInfoSchema,
  voiceSelectionPayloadSchema,
} from '../ai-client';

describe('AI Client Schemas', () => {
  describe('sseMessageSchema', () => {
    it('validates a complete SSE message', () => {
      const validMessage = {
        role: 'assistant',
        content: 'Hello there!',
        id: 'msg_123',
      };

      const result = sseMessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it('validates partial SSE message (all fields optional)', () => {
      const partialMessage = { role: 'user' };
      const result = sseMessageSchema.safeParse(partialMessage);
      expect(result.success).toBe(true);
    });

    it('validates empty object', () => {
      const result = sseMessageSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('sseEventSchema', () => {
    it('validates SSE event with data', () => {
      const validEvent = {
        event: 'messages/partial',
        data: [{ role: 'assistant', content: 'Hello' }],
      };

      const result = sseEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('rejects event without event field', () => {
      const invalidEvent = { data: {} };
      const result = sseEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe('breathingTechniqueInfoSchema', () => {
    it('validates complete breathing technique', () => {
      const technique = {
        id: 'box',
        name: 'Box Breathing',
        description: 'A calming technique',
        durations: [4, 4, 4, 4] as [number, number, number, number],
        recommended_cycles: 4,
        best_for: ['stress', 'anxiety'],
      };

      const result = breathingTechniqueInfoSchema.safeParse(technique);
      expect(result.success).toBe(true);
    });

    it('rejects invalid durations tuple', () => {
      const technique = {
        id: 'box',
        name: 'Box Breathing',
        description: 'A calming technique',
        durations: [4, 4, 4], // Missing one element
        recommended_cycles: 4,
        best_for: ['stress'],
      };

      const result = breathingTechniqueInfoSchema.safeParse(technique);
      expect(result.success).toBe(false);
    });
  });

  describe('breathingConfirmationPayloadSchema', () => {
    it('validates complete breathing confirmation', () => {
      const payload = {
        type: 'breathing_confirmation' as const,
        proposed_technique: {
          id: 'box',
          name: 'Box Breathing',
          description: 'A calming technique',
          durations: [4, 4, 4, 4] as [number, number, number, number],
          recommended_cycles: 4,
          best_for: ['stress'],
        },
        message: 'Would you like to try box breathing?',
        available_techniques: [],
        options: ['start' as const, 'not_now' as const],
      };

      const result = breathingConfirmationPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects wrong type literal', () => {
      const payload = {
        type: 'wrong_type',
        proposed_technique: {
          id: 'box',
          name: 'Box Breathing',
          description: 'A calming technique',
          durations: [4, 4, 4, 4],
          recommended_cycles: 4,
          best_for: ['stress'],
        },
        message: 'Test',
        available_techniques: [],
        options: ['start'],
      };

      const result = breathingConfirmationPayloadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('voiceInfoSchema', () => {
    it('validates complete voice info', () => {
      const voice = {
        id: 'nova',
        name: 'Nova',
        description: 'A warm voice',
        best_for: ['meditation', 'sleep'],
        preview_url: 'https://example.com/preview.mp3',
      };

      const result = voiceInfoSchema.safeParse(voice);
      expect(result.success).toBe(true);
    });

    it('accepts null preview_url', () => {
      const voice = {
        id: 'nova',
        name: 'Nova',
        description: 'A warm voice',
        best_for: ['meditation'],
        preview_url: null,
      };

      const result = voiceInfoSchema.safeParse(voice);
      expect(result.success).toBe(true);
    });
  });

  describe('voiceSelectionPayloadSchema', () => {
    it('validates complete voice selection', () => {
      const payload = {
        type: 'voice_selection' as const,
        message: 'Choose a voice',
        available_voices: [
          {
            id: 'nova',
            name: 'Nova',
            description: 'A warm voice',
            best_for: ['meditation'],
            preview_url: null,
          },
        ],
        recommended_voice: 'nova',
        meditation_preview: 'This is a preview...',
        duration_minutes: 10,
      };

      const result = voiceSelectionPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  describe('interruptPayloadSchema (discriminated union)', () => {
    it('validates breathing confirmation', () => {
      const payload = {
        type: 'breathing_confirmation' as const,
        proposed_technique: {
          id: 'box',
          name: 'Box Breathing',
          description: 'Calming',
          durations: [4, 4, 4, 4] as [number, number, number, number],
          recommended_cycles: 4,
          best_for: ['stress'],
        },
        message: 'Test',
        available_techniques: [],
        options: ['start' as const],
      };

      const result = interruptPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('validates voice selection', () => {
      const payload = {
        type: 'voice_selection' as const,
        message: 'Choose',
        available_voices: [],
        recommended_voice: 'nova',
        meditation_preview: 'Preview',
        duration_minutes: 5,
      };

      const result = interruptPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects unknown type', () => {
      const payload = {
        type: 'unknown_type',
        message: 'Test',
      };

      const result = interruptPayloadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('historyMessageSchema', () => {
    it('validates history message', () => {
      const message = {
        id: 'msg_123',
        role: 'assistant',
        content: 'Hello!',
      };

      const result = historyMessageSchema.safeParse(message);
      expect(result.success).toBe(true);
    });

    it('rejects missing fields', () => {
      const message = { id: 'msg_123' };
      const result = historyMessageSchema.safeParse(message);
      expect(result.success).toBe(false);
    });
  });

  describe('historyResponseSchema', () => {
    it('validates history response', () => {
      const response = {
        messages: [
          { id: 'msg_1', role: 'user', content: 'Hi' },
          { id: 'msg_2', role: 'assistant', content: 'Hello!' },
        ],
      };

      const result = historyResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('rejects non-array messages', () => {
      const response = { messages: 'not an array' };
      const result = historyResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });

  describe('updatesEventDataSchema', () => {
    it('validates updates with interrupt', () => {
      const data = {
        __interrupt__: [
          {
            value: {
              type: 'breathing_confirmation' as const,
              proposed_technique: {
                id: 'box',
                name: 'Box',
                description: 'Desc',
                durations: [4, 4, 4, 4] as [number, number, number, number],
                recommended_cycles: 4,
                best_for: [],
              },
              message: 'Test',
              available_techniques: [],
              options: ['start' as const],
            },
          },
        ],
      };

      const result = updatesEventDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates updates without interrupt', () => {
      const data = {};
      const result = updatesEventDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('errorEventDataSchema', () => {
    it('validates error with message', () => {
      const data = { message: 'Something went wrong' };
      const result = errorEventDataSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe('Something went wrong');
      }
    });

    it('validates error without message', () => {
      const data = {};
      const result = errorEventDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

describe('Type Guards', () => {
  describe('isBreathingConfirmation', () => {
    it('returns true for breathing confirmation', () => {
      const payload = {
        type: 'breathing_confirmation' as const,
        proposed_technique: {
          id: 'box',
          name: 'Box',
          description: 'Desc',
          durations: [4, 4, 4, 4] as [number, number, number, number],
          recommended_cycles: 4,
          best_for: [],
        },
        message: 'Test',
        available_techniques: [],
        options: ['start' as const],
      };

      expect(isBreathingConfirmation(payload)).toBe(true);
    });

    it('returns false for voice selection', () => {
      const payload = {
        type: 'voice_selection' as const,
        message: 'Choose',
        available_voices: [],
        recommended_voice: 'nova',
        meditation_preview: 'Preview',
        duration_minutes: 5,
      };

      expect(isBreathingConfirmation(payload)).toBe(false);
    });
  });

  describe('isVoiceSelection', () => {
    it('returns true for voice selection', () => {
      const payload = {
        type: 'voice_selection' as const,
        message: 'Choose',
        available_voices: [],
        recommended_voice: 'nova',
        meditation_preview: 'Preview',
        duration_minutes: 5,
      };

      expect(isVoiceSelection(payload)).toBe(true);
    });

    it('returns false for breathing confirmation', () => {
      const payload = {
        type: 'breathing_confirmation' as const,
        proposed_technique: {
          id: 'box',
          name: 'Box',
          description: 'Desc',
          durations: [4, 4, 4, 4] as [number, number, number, number],
          recommended_cycles: 4,
          best_for: [],
        },
        message: 'Test',
        available_techniques: [],
        options: ['start' as const],
      };

      expect(isVoiceSelection(payload)).toBe(false);
    });
  });
});

describe('Validation Helpers', () => {
  describe('parseSSEEvent', () => {
    it('parses valid SSE event JSON', () => {
      const json = '{"event": "messages/partial", "data": []}';
      const result = parseSSEEvent(json);
      expect(result).toEqual({ event: 'messages/partial', data: [] });
    });

    it('returns null for invalid JSON', () => {
      const result = parseSSEEvent('not valid json');
      expect(result).toBeNull();
    });

    it('returns null for invalid schema', () => {
      const json = '{"data": []}'; // Missing event field
      const result = parseSSEEvent(json);
      expect(result).toBeNull();
    });
  });

  describe('parseSSEMessages', () => {
    it('parses array of messages', () => {
      const data = [
        { role: 'assistant', content: 'Hello' },
        { role: 'user', content: 'Hi' },
      ];
      const result = parseSSEMessages(data);
      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('assistant');
    });

    it('returns empty array for non-array', () => {
      const result = parseSSEMessages('not an array');
      expect(result).toEqual([]);
    });

    it('returns empty array for null', () => {
      const result = parseSSEMessages(null);
      expect(result).toEqual([]);
    });
  });

  describe('parseInterruptPayload', () => {
    it('extracts interrupt payload from updates', () => {
      const data = {
        __interrupt__: [
          {
            value: {
              type: 'voice_selection' as const,
              message: 'Choose',
              available_voices: [],
              recommended_voice: 'nova',
              meditation_preview: 'Preview',
              duration_minutes: 5,
            },
          },
        ],
      };

      const result = parseInterruptPayload(data);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('voice_selection');
    });

    it('returns null for no interrupt', () => {
      const result = parseInterruptPayload({});
      expect(result).toBeNull();
    });

    it('returns null for empty interrupt array', () => {
      const result = parseInterruptPayload({ __interrupt__: [] });
      expect(result).toBeNull();
    });
  });

  describe('parseErrorMessage', () => {
    it('extracts error message', () => {
      const result = parseErrorMessage({ message: 'Test error' });
      expect(result).toBe('Test error');
    });

    it('returns Unknown error for missing message', () => {
      const result = parseErrorMessage({});
      expect(result).toBe('Unknown error');
    });

    it('returns Unknown error for invalid data', () => {
      const result = parseErrorMessage('not an object');
      expect(result).toBe('Unknown error');
    });
  });

  describe('parseHistoryResponse', () => {
    it('extracts messages from response', () => {
      const data = {
        messages: [
          { id: '1', role: 'user', content: 'Hi' },
          { id: '2', role: 'assistant', content: 'Hello' },
        ],
      };

      const result = parseHistoryResponse(data);
      expect(result).toHaveLength(2);
    });

    it('returns empty array for invalid response', () => {
      const result = parseHistoryResponse({ invalid: 'data' });
      expect(result).toEqual([]);
    });
  });
});
