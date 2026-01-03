/* ============================================================================
   Activity Content Parser
   ============================================================================
   Parses AI message content to extract embedded activity configurations.

   The backend sends activity data wrapped in special markers:
   [ACTIVITY_START]{...json...}[ACTIVITY_END]

   This parser extracts and validates the JSON, returning typed activity data
   that the frontend can use to render interactive components.
   ============================================================================ */

import { z } from 'zod';

// -----------------------------------------------------------------------------
// Activity Schemas (using Zod for validation)
// -----------------------------------------------------------------------------

/** Schema for breathing technique configuration */
const breathingTechniqueSchema = z.object({
  id: z.string(),
  name: z.string(),
  durations: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  phases: z.array(z.string()).optional(),
  description: z.string(),
  cycles: z.number(),
});

/** Schema for breathing activity data */
const breathingActivitySchema = z.object({
  type: z.literal('activity'),
  activity: z.literal('breathing'),
  status: z.enum(['ready', 'in_progress', 'complete']),
  technique: breathingTechniqueSchema,
  introduction: z.string(),
});

/** Union of all activity types */
const activityDataSchema = z.discriminatedUnion('activity', [
  breathingActivitySchema,
  // Future: meditationActivitySchema, journalingActivitySchema
]);

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Inferred type for breathing activity data */
export type BreathingActivityData = z.infer<typeof breathingActivitySchema>;

/** Inferred type for any activity data */
export type ActivityData = z.infer<typeof activityDataSchema>;

/** Result of parsing message content */
export interface ParsedContent {
  /** The text content before the activity (if any) */
  textBefore: string;
  /** The parsed activity data (if found) */
  activity: ActivityData | null;
  /** The text content after the activity (if any) */
  textAfter: string;
  /** Whether the message contains an activity */
  hasActivity: boolean;
}

// -----------------------------------------------------------------------------
// Parser Implementation
// -----------------------------------------------------------------------------

/** Markers used to delimit activity JSON in message content */
const ACTIVITY_START = '[ACTIVITY_START]';
const ACTIVITY_END = '[ACTIVITY_END]';

/**
 * Parses message content to extract activity configurations.
 *
 * @param content - The raw message content from the AI
 * @returns Parsed content with activity data if present
 *
 * @example
 * const result = parseActivityContent(message.content);
 * if (result.hasActivity && result.activity?.activity === 'breathing') {
 *   // Render BreathingExercise component
 * }
 */
export function parseActivityContent(content: string): ParsedContent {
  const result: ParsedContent = {
    textBefore: '',
    activity: null,
    textAfter: '',
    hasActivity: false,
  };

  // Find activity markers
  const startIndex = content.indexOf(ACTIVITY_START);
  const endIndex = content.indexOf(ACTIVITY_END);

  // No activity markers found - return as plain text
  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    result.textBefore = content;
    return result;
  }

  // Extract the parts
  result.textBefore = content.slice(0, startIndex).trim();
  result.textAfter = content.slice(endIndex + ACTIVITY_END.length).trim();

  // Extract and parse the JSON
  const jsonContent = content.slice(startIndex + ACTIVITY_START.length, endIndex);

  try {
    const parsed: unknown = JSON.parse(jsonContent);
    const validated = activityDataSchema.safeParse(parsed);

    if (validated.success) {
      result.activity = validated.data;
      result.hasActivity = true;
    } else {
      console.warn('Activity data validation failed:', z.treeifyError(validated.error));
    }
  } catch (error) {
    console.warn('Failed to parse activity JSON:', error);
  }

  return result;
}

/**
 * Checks if a message contains activity content without fully parsing it.
 * Useful for quick checks before rendering.
 *
 * @param content - The raw message content
 * @returns True if the content contains activity markers
 */
export function hasActivityContent(content: string): boolean {
  return content.includes(ACTIVITY_START) && content.includes(ACTIVITY_END);
}

/**
 * Extracts just the text content from a message, removing activity markers.
 * Useful when you want to display the text portion only.
 *
 * @param content - The raw message content
 * @returns The text content without activity markers
 */
export function extractTextContent(content: string): string {
  const parsed = parseActivityContent(content);
  return [parsed.textBefore, parsed.textAfter].filter(Boolean).join('\n\n');
}
