/**
 * Chat Feature Types
 *
 * Shared type definitions for the chat feature.
 */

import { z } from 'zod';

import type { BreathingTechnique } from '@/features/breathing';

/* ----------------------------------------------------------------------------
   Activity State
   ---------------------------------------------------------------------------- */

/**
 * State for immersive activity overlays.
 * Phases:
 * - confirming: User is being asked to confirm starting the activity
 * - active: Activity is in progress
 */
export type ActivityState =
  | {
      phase: 'confirming';
      type: 'breathing';
      data: {
        proposedTechnique: BreathingTechnique;
        message: string;
        availableTechniques: BreathingTechnique[];
      };
    }
  | {
      phase: 'active';
      type: 'breathing';
      data: {
        technique: BreathingTechnique;
        introduction?: string;
      };
    }
  | null;

/* ----------------------------------------------------------------------------
   Loader Data
   ---------------------------------------------------------------------------- */

/**
 * Zod schema for validating chat route loader data.
 */
export const chatLoaderDataSchema = z.object({
  conversationId: z.uuid().nullable(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
      createdAt: z.coerce.date(),
    })
  ),
  userEmail: z.email().optional(),
  userId: z.uuid().optional(),
});

/**
 * Type inferred from the chat loader data schema.
 */
export type ChatLoaderData = z.infer<typeof chatLoaderDataSchema>;

/**
 * Default empty loader data for fallback scenarios.
 */
export const emptyLoaderData: ChatLoaderData = {
  conversationId: null,
  messages: [],
};
