/**
 * Activity Renderer
 *
 * Renders the appropriate component based on DirectComponent selection from sidebar.
 * Components render directly - backend integration for session tracking will be added
 * in a future iteration.
 *
 * Performance: All activity components are lazy-loaded to reduce initial bundle size.
 * This keeps the chat page light until an activity is actually selected.
 */

import { lazy, Suspense } from 'react';

// Types only - no runtime code (tree-shaken away)
import type { DirectComponent } from '../../types';

import type { WimHofTechnique } from '@/features/breathing/types';
import { BREATHING_TECHNIQUES } from '@/features/breathing/types';
import type { BadgeData } from '@/features/gamification/components/Badge/Badge';

// Constants - just data, no component imports

// Loading fallback for lazy components
const ActivityLoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '2rem',
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid #e5e5e5',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem',
        }}
      />
      <p style={{ color: '#6b7280', margin: 0 }}>Loading activity...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
);

// Lazy-loaded activity components - only loaded when selected
const ImmersiveBreathing = lazy(() =>
  import('@/features/breathing/components/ImmersiveBreathing/ImmersiveBreathing').then((m) => ({
    default: m.ImmersiveBreathing,
  }))
);
const WimHofExercise = lazy(() =>
  import('@/features/breathing/components/WimHofExercise/WimHofExercise').then((m) => ({
    default: m.WimHofExercise,
  }))
);
const TimerMeditation = lazy(() =>
  import('@/features/meditation/components/GuidedMeditation/TimerMeditation').then((m) => ({
    default: m.TimerMeditation,
  }))
);
const MeditationLibrary = lazy(() =>
  import('@/features/meditation/components/MeditationLibrary/MeditationLibrary').then((m) => ({
    default: m.MeditationLibrary,
  }))
);
const WellnessProfile = lazy(() =>
  import('@/features/wellness/components/WellnessProfile/WellnessProfile').then((m) => ({
    default: m.WellnessProfile,
  }))
);
const MoodCheck = lazy(() =>
  import('@/features/wellness/components/MoodCheck/MoodCheck').then((m) => ({
    default: m.MoodCheck,
  }))
);
const BadgeGrid = lazy(() =>
  import('@/features/gamification/components/Badge/BadgeGrid').then((m) => ({
    default: m.BadgeGrid,
  }))
);
const StreakDisplay = lazy(() =>
  import('@/features/gamification/components/StreakDisplay/StreakDisplay').then((m) => ({
    default: m.StreakDisplay,
  }))
);
const WeeklyGoals = lazy(() =>
  import('@/features/gamification/components/WeeklyGoals/WeeklyGoals').then((m) => ({
    default: m.WeeklyGoals,
  }))
);

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface ActivityRendererProps {
  /** The component to render */
  component: DirectComponent;
  /** Callback when the component is closed/completed */
  onClose: () => void;
}

/* ----------------------------------------------------------------------------
   Default Wim Hof Technique
   ---------------------------------------------------------------------------- */

const DEFAULT_WIM_HOF_TECHNIQUE: WimHofTechnique = {
  id: 'wim_hof',
  name: 'Wim Hof Method',
  type: 'wim_hof',
  description: 'Power breathing followed by breath retention for energy and focus',
  best_for: ['energy', 'focus', 'cold tolerance'],
  rounds: 3,
  breaths_per_round: 30,
  breath_tempo_ms: 1500,
  retention_target_seconds: 60,
  recovery_pause_seconds: 15,
  inhale_hold_seconds: 15,
};

/* ----------------------------------------------------------------------------
   Placeholder Badge Data
   ---------------------------------------------------------------------------- */

const PLACEHOLDER_BADGES: BadgeData[] = [
  {
    id: 'first-breath',
    name: 'First Breath',
    description: 'Complete your first breathing exercise',
    icon: 'flame',
    category: 'milestone',
    isUnlocked: true,
    unlockedAt: new Date(),
  },
  {
    id: 'week-streak',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: 'star',
    category: 'consistency',
    isUnlocked: true,
    unlockedAt: new Date(),
  },
  {
    id: 'meditation-master',
    name: 'Meditation Master',
    description: 'Complete 10 meditation sessions',
    icon: 'moon',
    category: 'mastery',
    isUnlocked: false,
    progress: 30,
  },
];

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

/**
 * Renders the component with lazy loading and Suspense.
 * All activity components are loaded on-demand for performance.
 */
export function ActivityRenderer({ component, onClose }: ActivityRendererProps) {
  return (
    <Suspense fallback={<ActivityLoadingFallback />}>
      <ActivityContent component={component} onClose={onClose} />
    </Suspense>
  );
}

/**
 * Internal component that renders based on type.
 * Wrapped by Suspense in ActivityRenderer.
 */
function ActivityContent({ component, onClose }: ActivityRendererProps) {
  switch (component.type) {
    case 'breathing':
      return <BreathingRenderer variant={component.variant} onClose={onClose} />;
    case 'meditation':
      return <MeditationRenderer variant={component.variant} onClose={onClose} />;
    case 'wellness':
      return <WellnessRenderer variant={component.variant} onClose={onClose} />;
    case 'gamification':
      return <GamificationRenderer variant={component.variant} />;
    default:
      return <div>Unknown component type</div>;
  }
}

/* ----------------------------------------------------------------------------
   Render Components
   ---------------------------------------------------------------------------- */

function BreathingRenderer({
  variant,
  onClose,
}: {
  variant: 'box' | 'relaxing_478' | 'coherent' | 'deep_calm' | 'wimhof';
  onClose: () => void;
}) {
  if (variant === 'wimhof') {
    return (
      <WimHofExercise
        technique={DEFAULT_WIM_HOF_TECHNIQUE}
        introduction="Welcome to the Wim Hof breathing method. This powerful technique combines rapid breathing with breath retention to energize your body and mind."
        isFirstTime={true}
        onComplete={() => {
          // TODO: Send completion stats to backend for session tracking
          onClose();
        }}
        onStop={onClose}
      />
    );
  }

  const technique = BREATHING_TECHNIQUES[variant];

  return (
    <ImmersiveBreathing
      technique={technique}
      introduction={`Let's practice ${technique.name}. ${technique.description}`}
      onComplete={() => {
        // TODO: Send completion stats to backend for session tracking
        onClose();
      }}
      onExit={onClose}
      autoStart={false}
    />
  );
}

function MeditationRenderer({
  variant,
  onClose,
}: {
  variant: 'timer' | 'guided' | 'library';
  onClose: () => void;
}) {
  switch (variant) {
    case 'timer':
      return (
        <TimerMeditation
          initialMinutes={5}
          onComplete={() => {
            // TODO: Send completion to backend
            onClose();
          }}
          onStop={() => {
            onClose();
          }}
        />
      );

    case 'guided':
      // Guided meditation requires a track selection
      // For now, show the library to browse and select
      return (
        <MeditationLibrary
          onPlay={(_meditation) => {
            // TODO: Start guided meditation with selected track
            // For now, just close - will integrate track playback later
            onClose();
          }}
        />
      );

    case 'library':
      return (
        <MeditationLibrary
          onPlay={(_meditation) => {
            // TODO: Handle track selection - start playback
          }}
        />
      );

    default:
      return <div>Unknown meditation variant: {variant}</div>;
  }
}

function WellnessRenderer({
  variant,
  onClose,
}: {
  variant: 'profile' | 'moodcheck';
  onClose: () => void;
}) {
  switch (variant) {
    case 'profile':
      return <WellnessProfile />;

    case 'moodcheck':
      return (
        <MoodCheck
          label="How are you feeling right now?"
          onSelect={(_mood) => {
            // TODO: Save mood to backend
            onClose();
          }}
        />
      );

    default:
      return <div>Unknown wellness variant: {variant}</div>;
  }
}

function GamificationRenderer({ variant }: { variant: 'badges' | 'streak' | 'goals' }) {
  switch (variant) {
    case 'badges':
      // TODO: Fetch actual badges from backend
      return <BadgeGrid badges={PLACEHOLDER_BADGES} />;

    case 'streak':
      // TODO: Fetch actual streak from backend
      return <StreakDisplay streakDays={7} />;

    case 'goals':
      return <WeeklyGoals completedDays={[0, 1, 2]} target={5} />;

    default:
      return <div>Unknown gamification variant: {variant}</div>;
  }
}
