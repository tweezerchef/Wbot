/**
 * ============================================================================
 * User Preferences Types
 * ============================================================================
 * Types for user onboarding preferences.
 * These match the questions asked during signup.
 * ============================================================================
 */

/**
 * How the user was feeling when they signed up.
 * Used to understand their initial state.
 */
export type CurrentFeeling =
  | 'great' // Feeling great, just exploring
  | 'okay' // Okay but could be better
  | 'stressed' // Stressed or overwhelmed
  | 'anxious' // Anxious or worried
  | 'sad' // Sad or down
  | 'numb'; // Numb or disconnected

/**
 * The user's primary goal for using the app.
 */
export type PrimaryGoal =
  | 'stress_anxiety' // Managing stress and anxiety
  | 'mood' // Improving mood
  | 'sleep' // Better sleep
  | 'emotions' // Processing difficult emotions
  | 'habits' // Building better habits
  | 'growth' // Personal growth
  | 'talk'; // Just need someone to talk to

/**
 * Challenges the user faces.
 * This is a multi-select field.
 */
export type Challenge =
  | 'racing_thoughts' // Racing thoughts
  | 'sleep_issues' // Trouble sleeping
  | 'work_stress' // Work or school stress
  | 'relationships' // Relationship difficulties
  | 'low_motivation' // Low motivation
  | 'negative_self_talk' // Negative self-talk
  | 'isolation' // Feeling isolated
  | 'focus'; // Difficulty focusing

/**
 * How the user prefers to communicate.
 */
export type CommunicationStyle =
  | 'direct' // Direct and to the point
  | 'warm' // Warm and conversational
  | 'reflective' // Thoughtful and reflective
  | 'structured'; // Structured with clear steps

/**
 * What type of support helps the user most.
 */
export type SupportType =
  | 'listening' // Someone to listen
  | 'advice' // Practical advice
  | 'encouragement' // Encouragement and validation
  | 'understanding' // Help understanding feelings
  | 'guided'; // Guidance through exercises

/**
 * Activities the user is interested in.
 * This is a multi-select field.
 */
export type PreferredActivity =
  | 'chat' // Talking through thoughts
  | 'breathing' // Breathing exercises
  | 'meditation' // Guided meditation
  | 'journaling' // Journaling prompts
  | 'grounding' // Grounding techniques
  | 'mood_tracking'; // Mood tracking

/**
 * User's experience with therapy/wellness apps.
 */
export type ExperienceLevel =
  | 'first_time' // First time
  | 'tried_apps' // Tried apps before
  | 'some_therapy' // Some therapy experience
  | 'regular_practice'; // Regular wellness practice

/**
 * How much time the user has per session.
 */
export type SessionLength =
  | 'few_minutes' // Just a few minutes
  | 'short' // 5-10 minutes
  | 'medium' // 10-20 minutes
  | 'long' // 20+ minutes
  | 'flexible'; // Varies

/**
 * Complete user preferences from onboarding.
 * Stored in the profiles.preferences JSONB column.
 */
export interface UserPreferences {
  current_feeling?: CurrentFeeling;
  primary_goal?: PrimaryGoal;
  challenges?: Challenge[];
  communication_style?: CommunicationStyle;
  support_type?: SupportType;
  preferred_activities?: PreferredActivity[];
  experience_level?: ExperienceLevel;
  session_length?: SessionLength;
}
