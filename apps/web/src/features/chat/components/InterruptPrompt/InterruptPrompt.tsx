/**
 * InterruptPrompt Component
 *
 * Renders HITL (Human-in-the-Loop) confirmation prompts for various activity types.
 * Consolidates breathing, voice selection, and journaling confirmations into a single component.
 */

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import {
  BreathingConfirmation,
  VoiceSelectionConfirmation,
  JournalingConfirmation,
} from '../ChatPage/lazyComponents';

import styles from './InterruptPrompt.module.css';

import { ErrorFallback } from '@/components/feedback/ErrorFallback/ErrorFallback';
import { ActivityLoadingSkeleton } from '@/components/skeletons';
import type { HITLResumePayload } from '@/features/chat/hooks/useHITLResume';
import {
  isBreathingConfirmation,
  isVoiceSelection,
  isJournalingConfirmation,
  type InterruptPayload,
} from '@/lib/ai-client';

export interface InterruptPromptProps {
  /** The interrupt payload data from the AI */
  interruptData: InterruptPayload;
  /** Handler called when the user responds to the prompt */
  onResume: (payload: HITLResumePayload) => void;
}

/**
 * Renders the appropriate confirmation UI based on the interrupt type.
 * Each interrupt type has its own specialized confirmation component.
 */
export function InterruptPrompt({ interruptData, onResume }: InterruptPromptProps) {
  return (
    <div className={styles.messageRow}>
      <div className={styles.bubble}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<ActivityLoadingSkeleton />}>
            {isBreathingConfirmation(interruptData) && (
              <BreathingConfirmation
                proposedTechnique={interruptData.proposed_technique}
                message={interruptData.message}
                availableTechniques={interruptData.available_techniques}
                onConfirm={(decision, techniqueId) => {
                  onResume({ decision, technique_id: techniqueId });
                }}
              />
            )}

            {isVoiceSelection(interruptData) && (
              <VoiceSelectionConfirmation
                message={interruptData.message}
                availableVoices={interruptData.available_voices}
                recommendedVoice={interruptData.recommended_voice}
                meditationPreview={interruptData.meditation_preview}
                durationMinutes={interruptData.duration_minutes}
                onConfirm={(decision, voiceId) => {
                  onResume({ decision, voice_id: voiceId });
                }}
              />
            )}

            {isJournalingConfirmation(interruptData) && (
              <JournalingConfirmation
                proposedPrompt={interruptData.proposed_prompt}
                message={interruptData.message}
                availablePrompts={interruptData.available_prompts}
                onConfirm={(prompt) => {
                  onResume({ decision: 'start', prompt_id: prompt.id });
                }}
                onDecline={() => {
                  onResume({ decision: 'not_now' });
                }}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
