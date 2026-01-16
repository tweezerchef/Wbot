/* ----------------------------------------------------------------------------
   Message Bubble Component
   ----------------------------------------------------------------------------
   Renders individual chat messages with support for:
   - User, assistant, and system message styling
   - Streaming cursor animation
   - Inline activity components (breathing, meditation, journaling)
   ---------------------------------------------------------------------------- */

import { Suspense, lazy, useCallback, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import styles from './MessageBubble.module.css';

import { ErrorFallback } from '@/components/feedback';
import { ActivityLoadingSkeleton } from '@/components/skeletons';
import type { Message } from '@/lib/ai-client';
import { parseActivityContent } from '@/lib/parseActivity';

// Lazy load activity components to reduce initial bundle size
const WimHofExercise = lazy(() =>
  import('@/features/breathing/components/WimHofExercise/WimHofExercise').then((m) => ({
    default: m.WimHofExercise,
  }))
);
const GuidedMeditation = lazy(() =>
  import('@/features/meditation/components/GuidedMeditation/GuidedMeditation').then((m) => ({
    default: m.GuidedMeditation,
  }))
);
const AIGeneratedMeditation = lazy(() =>
  import('@/features/meditation/components/GuidedMeditation/AIGeneratedMeditation').then((m) => ({
    default: m.AIGeneratedMeditation,
  }))
);
const JournalingExercise = lazy(() =>
  import('@/features/journaling/components/JournalingExercise/JournalingExercise').then((m) => ({
    default: m.JournalingExercise,
  }))
);

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

export interface MessageBubbleProps {
  /** The message to display */
  message: Message;
  /** Whether this message is currently being streamed */
  isStreaming?: boolean;
}

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

/**
 * Renders a single message bubble.
 *
 * Styles differ based on role:
 * - user: Right-aligned, primary color background
 * - assistant: Left-aligned, neutral background
 * - system: Centered, muted styling
 *
 * For assistant messages, parses content for embedded activities
 * (breathing exercises) and renders interactive components inline.
 */
export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  // Parse message content for embedded activities (only for assistant messages)
  const parsedContent = useMemo(() => {
    if (message.role !== 'assistant') {
      return null;
    }
    return parseActivityContent(message.content);
  }, [message.content, message.role]);

  // Determine CSS classes based on role
  const bubbleClass = [
    styles.bubble,
    message.role === 'user' && styles.bubbleUser,
    message.role === 'assistant' && styles.bubbleAssistant,
    message.role === 'system' && styles.bubbleSystem,
    isStreaming && styles.bubbleStreaming,
  ]
    .filter(Boolean)
    .join(' ');

  // Handle exercise completion
  const handleExerciseComplete = useCallback(() => {
    // TODO: Notify the AI that the exercise completed for follow-up message
  }, []);

  // Render Wim Hof exercise inline if detected
  if (parsedContent?.hasActivity && parsedContent.activity?.activity === 'breathing_wim_hof') {
    const activity = parsedContent.activity;

    return (
      <div className={styles.messageRow}>
        <div className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.bubbleActivity}`}>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<ActivityLoadingSkeleton />}>
              <WimHofExercise
                technique={activity.technique}
                introduction={activity.introduction}
                isFirstTime={activity.is_first_time}
                onComplete={handleExerciseComplete}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  // Render continuous breathing exercise as completed summary (historical)
  // During live HITL, activity messages are NOT added to messages state,
  // so any activity messages here are from history (previous sessions/reloads).
  // We render them as static summaries rather than interactive components.
  if (parsedContent?.hasActivity && parsedContent.activity?.activity === 'breathing') {
    const activity = parsedContent.activity;
    const timingPattern = activity.technique.durations.join('-');

    return (
      <div className={styles.messageRow}>
        <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
          <div className={styles.completedActivity}>
            <div className={styles.completedIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className={styles.completedInfo}>
              <span className={styles.completedTitle}>Breathing Exercise</span>
              <span className={styles.completedDetail}>
                {activity.technique.name} ({timingPattern})
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render guided meditation inline if detected
  if (parsedContent?.hasActivity && parsedContent.activity?.activity === 'meditation') {
    const activity = parsedContent.activity;

    return (
      <div className={styles.messageRow}>
        <div className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.bubbleActivity}`}>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<ActivityLoadingSkeleton />}>
              <GuidedMeditation
                track={activity.track}
                introduction={activity.introduction}
                onComplete={handleExerciseComplete}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  // Render AI-generated meditation inline if detected
  if (
    parsedContent?.hasActivity &&
    parsedContent.activity?.activity === 'meditation_ai_generated'
  ) {
    const activity = parsedContent.activity;

    return (
      <div className={styles.messageRow}>
        <div className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.bubbleActivity}`}>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<ActivityLoadingSkeleton />}>
              <AIGeneratedMeditation activityData={activity} onComplete={handleExerciseComplete} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  // Render journaling exercise inline if detected
  if (parsedContent?.hasActivity && parsedContent.activity?.activity === 'journaling') {
    const activity = parsedContent.activity;

    return (
      <div className={styles.messageRow}>
        <div className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.bubbleActivity}`}>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<ActivityLoadingSkeleton />}>
              <JournalingExercise
                prompt={activity.prompt}
                introduction={activity.introduction}
                enableSharing={activity.enable_sharing}
                onComplete={handleExerciseComplete}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  // Standard text message rendering
  return (
    <div className={`${styles.messageRow} ${message.role === 'user' ? styles.messageRowUser : ''}`}>
      <div className={bubbleClass}>
        {/* Message content */}
        <p className={styles.messageContent}>{message.content}</p>

        {/* Streaming cursor */}
        {isStreaming && <span className={styles.cursor}>|</span>}
      </div>
    </div>
  );
}
