/**
 * Lazy-loaded Activity Components
 *
 * These components are loaded on-demand to reduce the initial bundle size.
 * They are only loaded when the user triggers an activity.
 */

import { lazy } from 'react';

/* ----------------------------------------------------------------------------
   Breathing Components
   ---------------------------------------------------------------------------- */

export const ImmersiveBreathing = lazy(() =>
  import('@/features/breathing/components/ImmersiveBreathing/ImmersiveBreathing').then((m) => ({
    default: m.ImmersiveBreathing,
  }))
);

export const ImmersiveBreathingConfirmation = lazy(() =>
  import('@/features/breathing/components/ImmersiveBreathing/ImmersiveBreathingConfirmation').then(
    (m) => ({ default: m.ImmersiveBreathingConfirmation })
  )
);

export const BreathingConfirmation = lazy(() =>
  import('@/features/breathing/components/BreathingConfirmation/BreathingConfirmation').then(
    (m) => ({ default: m.BreathingConfirmation })
  )
);

/* ----------------------------------------------------------------------------
   Meditation Components
   ---------------------------------------------------------------------------- */

export const VoiceSelectionConfirmation = lazy(() =>
  import('@/features/meditation/components/VoiceSelectionConfirmation/VoiceSelectionConfirmation').then(
    (m) => ({ default: m.VoiceSelectionConfirmation })
  )
);

export const PrerecordedMeditationPlayer = lazy(() =>
  import('@/features/meditation/components/PrerecordedMeditationPlayer/PrerecordedMeditationPlayer').then(
    (m) => ({
      default: m.PrerecordedMeditationPlayer,
    })
  )
);

/* ----------------------------------------------------------------------------
   Journaling Components
   ---------------------------------------------------------------------------- */

export const JournalingConfirmation = lazy(() =>
  import('@/features/journaling/components/JournalingConfirmation/JournalingConfirmation').then(
    (m) => ({ default: m.JournalingConfirmation })
  )
);

/* ----------------------------------------------------------------------------
   Navigation Components
   ---------------------------------------------------------------------------- */

export const ActivityRenderer = lazy(() =>
  import('@/features/navigation/components/ActivityRenderer/ActivityRenderer').then((m) => ({
    default: m.ActivityRenderer,
  }))
);
