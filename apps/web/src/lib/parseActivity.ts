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

/** Schema for Wim Hof Method technique configuration */
const wimHofTechniqueSchema = z.object({
  id: z.literal('wim_hof'),
  name: z.string(),
  type: z.literal('wim_hof'),
  description: z.string(),
  best_for: z.array(z.string()),
  rounds: z.number(),
  breaths_per_round: z.number(),
  breath_tempo_ms: z.number(),
  retention_target_seconds: z.number(),
  recovery_pause_seconds: z.number(),
  inhale_hold_seconds: z.number(),
});

/** Schema for Wim Hof activity data */
const wimHofActivitySchema = z.object({
  type: z.literal('activity'),
  activity: z.literal('breathing_wim_hof'),
  status: z.enum(['ready', 'in_progress', 'complete']),
  technique: wimHofTechniqueSchema,
  introduction: z.string(),
  is_first_time: z.boolean(),
});

/** Schema for meditation track configuration */
const meditationTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([
    'body_scan',
    'loving_kindness',
    'breathing_focus',
    'sleep',
    'anxiety_relief',
    'daily_mindfulness',
  ]),
  durationSeconds: z.number(),
  durationPreset: z.enum(['short', 'medium', 'long']),
  description: z.string(),
  audioUrl: z.string(),
  narrator: z.string().optional(),
  language: z.string(),
  bestFor: z.array(z.string()),
  attribution: z.string().optional(),
});

/** Schema for meditation activity data */
const meditationActivitySchema = z.object({
  type: z.literal('activity'),
  activity: z.literal('meditation'),
  status: z.enum(['ready', 'in_progress', 'complete']),
  track: meditationTrackSchema,
  introduction: z.string(),
});

/** Schema for personalized meditation script */
const personalizedScriptSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum([
    'body_scan',
    'loving_kindness',
    'breathing_focus',
    'sleep',
    'anxiety_relief',
    'daily_mindfulness',
  ]),
  durationEstimateSeconds: z.number(),
  scriptContent: z.string().optional(),
  placeholders: z.record(z.string(), z.string()).optional(),
  language: z.string(),
});

/** Schema for personalization options */
const meditationPersonalizationSchema = z.object({
  userName: z.string().optional(),
  userGoal: z.string().optional(),
});

/** Schema for personalized/TTS meditation activity data */
const personalizedMeditationActivitySchema = z.object({
  type: z.literal('activity'),
  activity: z.literal('meditation_personalized'),
  status: z.enum(['ready', 'generating', 'in_progress', 'complete']),
  script: personalizedScriptSchema,
  personalization: meditationPersonalizationSchema.optional(),
  introduction: z.string(),
  audioUrl: z.string().optional(),
});

/** Schema for AI-generated meditation voice */
const aiMeditationVoiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  best_for: z.array(z.string()),
  preview_url: z.string().nullable().optional(),
});

/** Schema for AI-generated meditation script */
const aiMeditationScriptSchema = z.object({
  content: z.string(),
  word_count: z.number(),
  estimated_duration_seconds: z.number(),
});

/** Schema for AI-generated meditation generation context */
const aiMeditationContextSchema = z.object({
  time_of_day: z.enum(['morning', 'afternoon', 'evening', 'night']),
  primary_intent: z.string(),
  memories_used: z.number(),
  emotional_signals: z.array(z.string()),
});

/** Schema for AI-generated meditation activity data */
const aiGeneratedMeditationActivitySchema = z.object({
  type: z.literal('activity'),
  activity: z.literal('meditation_ai_generated'),
  status: z.enum(['ready', 'generating', 'in_progress', 'complete']),
  meditation_id: z.string(),
  title: z.string(),
  meditation_type: z.enum([
    'body_scan',
    'loving_kindness',
    'breathing_focus',
    'sleep',
    'anxiety_relief',
    'daily_mindfulness',
  ]),
  duration_minutes: z.number(),
  script: aiMeditationScriptSchema,
  voice: aiMeditationVoiceSchema,
  generation_context: aiMeditationContextSchema,
  introduction: z.string(),
  audio_url: z.string().optional(),
});

/** Union of all activity types */
const activityDataSchema = z.discriminatedUnion('activity', [
  breathingActivitySchema,
  wimHofActivitySchema,
  meditationActivitySchema,
  personalizedMeditationActivitySchema,
  aiGeneratedMeditationActivitySchema,
  // Future: journalingActivitySchema
]);

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Inferred type for breathing technique configuration */
export type BreathingTechnique = z.infer<typeof breathingTechniqueSchema>;

/** Inferred type for breathing activity data */
export type BreathingActivityData = z.infer<typeof breathingActivitySchema>;

/** Inferred type for Wim Hof technique configuration */
export type WimHofTechnique = z.infer<typeof wimHofTechniqueSchema>;

/** Inferred type for Wim Hof activity data */
export type WimHofActivityData = z.infer<typeof wimHofActivitySchema>;

/** Inferred type for meditation track configuration */
export type MeditationTrack = z.infer<typeof meditationTrackSchema>;

/** Inferred type for meditation activity data */
export type MeditationActivityData = z.infer<typeof meditationActivitySchema>;

/** Inferred type for personalized script */
export type PersonalizedScript = z.infer<typeof personalizedScriptSchema>;

/** Inferred type for meditation personalization */
export type MeditationPersonalization = z.infer<typeof meditationPersonalizationSchema>;

/** Inferred type for personalized meditation activity data */
export type PersonalizedMeditationActivityData = z.infer<
  typeof personalizedMeditationActivitySchema
>;

/** Inferred type for AI-generated meditation voice */
export type AIMeditationVoice = z.infer<typeof aiMeditationVoiceSchema>;

/** Inferred type for AI-generated meditation script */
export type AIMeditationScript = z.infer<typeof aiMeditationScriptSchema>;

/** Inferred type for AI-generated meditation generation context */
export type AIMeditationContext = z.infer<typeof aiMeditationContextSchema>;

/** Inferred type for AI-generated meditation activity data */
export type AIGeneratedMeditationActivityData = z.infer<typeof aiGeneratedMeditationActivitySchema>;

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
