/**
 * AI Client Zod Schemas
 *
 * Validation schemas for all API responses from the AI backend.
 * These ensure type safety at runtime when parsing API responses.
 */

import { z } from 'zod';

// ----------------------------------------------------------------------------
// SSE Event Schemas
// ----------------------------------------------------------------------------

/** Schema for SSE message content */
export const sseMessageSchema = z.object({
  role: z.string().optional(),
  content: z.string().optional(),
  id: z.string().optional(),
});

export type SSEMessage = z.infer<typeof sseMessageSchema>;

/** Schema for SSE event wrapper */
export const sseEventSchema = z.object({
  event: z.string(),
  data: z.unknown(),
});

export type SSEEvent = z.infer<typeof sseEventSchema>;

// ----------------------------------------------------------------------------
// Breathing Confirmation Schemas
// ----------------------------------------------------------------------------

/** Schema for breathing technique info from the backend */
export const breathingTechniqueInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  durations: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  recommended_cycles: z.number(),
  best_for: z.array(z.string()),
});

export type BreathingTechniqueInfo = z.infer<typeof breathingTechniqueInfoSchema>;

/** Schema for breathing confirmation interrupt payload */
export const breathingConfirmationPayloadSchema = z.object({
  type: z.literal('breathing_confirmation'),
  proposed_technique: breathingTechniqueInfoSchema,
  message: z.string(),
  available_techniques: z.array(breathingTechniqueInfoSchema),
  options: z.array(z.enum(['start', 'change_technique', 'not_now'])),
});

export type BreathingConfirmationPayload = z.infer<typeof breathingConfirmationPayloadSchema>;

// ----------------------------------------------------------------------------
// Journaling Confirmation Schemas
// ----------------------------------------------------------------------------

/** Schema for journaling prompt info from the backend */
export const journalingPromptInfoSchema = z.object({
  id: z.string(),
  category: z.enum(['reflection', 'gratitude', 'processing', 'growth', 'self_compassion']),
  text: z.string(),
  follow_up_questions: z.array(z.string()),
  estimated_time_minutes: z.number(),
  best_for: z.array(z.string()),
});

export type JournalingPromptInfo = z.infer<typeof journalingPromptInfoSchema>;

/** Schema for journaling confirmation interrupt payload */
export const journalingConfirmationPayloadSchema = z.object({
  type: z.literal('journaling_confirmation'),
  proposed_prompt: journalingPromptInfoSchema,
  message: z.string(),
  available_prompts: z.array(journalingPromptInfoSchema),
  options: z.array(z.enum(['start', 'change_prompt', 'not_now'])),
});

export type JournalingConfirmationPayload = z.infer<typeof journalingConfirmationPayloadSchema>;

// ----------------------------------------------------------------------------
// Voice Selection Schemas
// ----------------------------------------------------------------------------

/** Schema for voice info from the backend */
export const voiceInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  best_for: z.array(z.string()),
  preview_url: z.string().nullable(),
});

export type VoiceInfo = z.infer<typeof voiceInfoSchema>;

/** Schema for voice selection interrupt payload */
export const voiceSelectionPayloadSchema = z.object({
  type: z.literal('voice_selection'),
  message: z.string(),
  available_voices: z.array(voiceInfoSchema),
  recommended_voice: z.string(),
  meditation_preview: z.string(),
  duration_minutes: z.number(),
});

export type VoiceSelectionPayload = z.infer<typeof voiceSelectionPayloadSchema>;

// ----------------------------------------------------------------------------
// Interrupt Union Schema
// ----------------------------------------------------------------------------

/** Schema for any interrupt payload */
export const interruptPayloadSchema = z.discriminatedUnion('type', [
  breathingConfirmationPayloadSchema,
  journalingConfirmationPayloadSchema,
  voiceSelectionPayloadSchema,
]);

export type InterruptPayload = z.infer<typeof interruptPayloadSchema>;

// ----------------------------------------------------------------------------
// SSE Event Data Schemas
// ----------------------------------------------------------------------------

/** Schema for updates event data (may contain interrupt) */
export const updatesEventDataSchema = z.object({
  __interrupt__: z
    .array(
      z.object({
        value: interruptPayloadSchema,
      })
    )
    .optional(),
});

export type UpdatesEventData = z.infer<typeof updatesEventDataSchema>;

/** Schema for error event data */
export const errorEventDataSchema = z.object({
  message: z.string().optional(),
});

export type ErrorEventData = z.infer<typeof errorEventDataSchema>;

// ----------------------------------------------------------------------------
// History API Schemas
// ----------------------------------------------------------------------------

/** Schema for a single history message */
export const historyMessageSchema = z.object({
  id: z.string(),
  role: z.string(),
  content: z.string(),
});

export type HistoryMessage = z.infer<typeof historyMessageSchema>;

/** Schema for the history API response */
export const historyResponseSchema = z.object({
  messages: z.array(historyMessageSchema),
});

export type HistoryResponse = z.infer<typeof historyResponseSchema>;

// ----------------------------------------------------------------------------
// Type Guards (using Zod)
// ----------------------------------------------------------------------------

/**
 * Type guard for breathing confirmation payload
 */
export function isBreathingConfirmation(
  payload: InterruptPayload
): payload is BreathingConfirmationPayload {
  return payload.type === 'breathing_confirmation';
}

/**
 * Type guard for journaling confirmation payload
 */
export function isJournalingConfirmation(
  payload: InterruptPayload
): payload is JournalingConfirmationPayload {
  return payload.type === 'journaling_confirmation';
}

/**
 * Type guard for voice selection payload
 */
export function isVoiceSelection(payload: InterruptPayload): payload is VoiceSelectionPayload {
  return payload.type === 'voice_selection';
}

// ----------------------------------------------------------------------------
// Validation Helpers
// ----------------------------------------------------------------------------

/**
 * Safely parse SSE event data
 */
export function parseSSEEvent(data: string): SSEEvent | null {
  try {
    const parsed: unknown = JSON.parse(data);
    const result = sseEventSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Safely parse an array of SSE messages
 */
export function parseSSEMessages(data: unknown): SSEMessage[] {
  const result = z.array(sseMessageSchema).safeParse(data);
  return result.success ? result.data : [];
}

/**
 * Safely parse interrupt payload from updates event
 */
export function parseInterruptPayload(data: unknown): InterruptPayload | null {
  const updatesResult = updatesEventDataSchema.safeParse(data);
  if (!updatesResult.success) {
    return null;
  }

  const interrupts = updatesResult.data.__interrupt__;
  if (!interrupts || interrupts.length === 0) {
    return null;
  }

  return interrupts[0].value;
}

/**
 * Safely parse error message from error event
 */
export function parseErrorMessage(data: unknown): string {
  const result = errorEventDataSchema.safeParse(data);
  return result.success ? (result.data.message ?? 'Unknown error') : 'Unknown error';
}

/**
 * Safely parse history response
 */
export function parseHistoryResponse(data: unknown): HistoryMessage[] {
  const result = historyResponseSchema.safeParse(data);
  return result.success ? result.data.messages : [];
}
