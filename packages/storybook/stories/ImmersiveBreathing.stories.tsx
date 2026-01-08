/* eslint-disable @typescript-eslint/no-unnecessary-condition -- Storybook action args can be undefined at runtime */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useState } from 'react';

import {
  ImmersiveBreathing,
  BreathingCircle,
  BreathingControls,
  BreathingProgress,
  BreathingBackground,
  BREATHING_TECHNIQUES,
} from '@/features/breathing';
import type { BreathingStats } from '@/features/breathing';

// Create a client for Storybook stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

/**
 * ImmersiveBreathing provides a full-screen Apple Watch-inspired
 * breathing experience with animated visuals, progress tracking,
 * and audio integration.
 *
 * The experience flows through states:
 * 1. **Intro**: Technique info and "Begin Exercise" button
 * 2. **Active**: Animated breathing circle with controls
 * 3. **Paused**: Animation paused, can resume or stop
 * 4. **Complete**: Celebration screen with stats
 */
const meta: Meta<typeof ImmersiveBreathing> = {
  title: 'Activities/ImmersiveBreathing',
  component: ImmersiveBreathing,
  decorators: [
    (Story): ReactElement => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#1a1a2e' }],
    },
    docs: {
      description: {
        component:
          'Full-screen immersive breathing exercise with Apple Watch-inspired animated visuals.',
      },
    },
  },
  argTypes: {
    technique: {
      control: 'select',
      options: Object.keys(BREATHING_TECHNIQUES),
      mapping: BREATHING_TECHNIQUES,
      description: 'Breathing technique configuration',
    },
    introduction: {
      control: 'text',
      description: 'Optional AI-generated introduction message',
    },
    audioEnabled: {
      control: 'boolean',
      description: 'Whether audio is enabled by default',
    },
    onComplete: {
      action: 'completed',
      description: 'Called when exercise completes',
    },
    onExit: {
      action: 'exited',
      description: 'Called when user exits early',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImmersiveBreathing>;

/**
 * Default box breathing technique - equal 4-second phases
 */
export const BoxBreathing: Story = {
  args: {
    technique: BREATHING_TECHNIQUES.box,
    audioEnabled: true,
  },
};

/**
 * 4-7-8 relaxing breath for anxiety relief and sleep
 */
export const RelaxingBreath: Story = {
  args: {
    technique: BREATHING_TECHNIQUES.relaxing_478,
    introduction:
      'This breathing technique helps calm your nervous system and prepare for restful sleep.',
    audioEnabled: true,
  },
};

/**
 * Coherent breathing with equal inhale/exhale
 */
export const CoherentBreathing: Story = {
  args: {
    technique: BREATHING_TECHNIQUES.coherent,
    introduction: 'Coherent breathing helps balance your heart rate variability and promotes calm.',
    audioEnabled: true,
  },
};

/**
 * Deep calm with extended exhale
 */
export const DeepCalm: Story = {
  args: {
    technique: BREATHING_TECHNIQUES.deep_calm,
    introduction: "Let's practice deep calming breaths with an extended exhale for relaxation.",
    audioEnabled: true,
  },
};

/**
 * With introduction message from the AI
 */
export const WithIntroduction: Story = {
  args: {
    technique: BREATHING_TECHNIQUES.box,
    introduction:
      'I noticed you mentioned feeling stressed. Box breathing is a simple yet powerful technique used by Navy SEALs to stay calm under pressure. Are you ready to give it a try?',
    audioEnabled: true,
  },
};

/**
 * Audio disabled by default
 */
export const AudioDisabled: Story = {
  args: {
    technique: BREATHING_TECHNIQUES.box,
    audioEnabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Audio can be disabled by default. Users can toggle it during the exercise.',
      },
    },
  },
};

/**
 * Mobile viewport simulation
 */
export const Mobile: Story = {
  args: {
    technique: BREATHING_TECHNIQUES.box,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'The breathing exercise is optimized for mobile with safe area support.',
      },
    },
  },
};

// ============================================================================
// SUB-COMPONENT STORIES
// ============================================================================

/**
 * Breathing Circle Sub-Component Stories
 */
export const CircleInhale: StoryObj<typeof BreathingCircle> = {
  render: () => (
    <div
      style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <BreathingCircle
        phase="inhale"
        progress={0.5}
        duration={4}
        isActive={true}
        timeRemaining={2}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The breathing circle during the inhale phase - expands with blue glow.',
      },
    },
  },
};

export const CircleHold: StoryObj<typeof BreathingCircle> = {
  render: () => (
    <div
      style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <BreathingCircle
        phase="holdIn"
        progress={0.5}
        duration={4}
        isActive={true}
        timeRemaining={2}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The breathing circle during the hold phase - maintains expanded state with purple glow.',
      },
    },
  },
};

export const CircleExhale: StoryObj<typeof BreathingCircle> = {
  render: () => (
    <div
      style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <BreathingCircle
        phase="exhale"
        progress={0.5}
        duration={4}
        isActive={true}
        timeRemaining={2}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The breathing circle during exhale - contracts with orange/teal glow.',
      },
    },
  },
};

export const CircleIdle: StoryObj<typeof BreathingCircle> = {
  render: () => (
    <div
      style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <BreathingCircle
        phase="inhale"
        progress={0}
        duration={4}
        isActive={false}
        timeRemaining={4}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The breathing circle in idle state before the exercise starts.',
      },
    },
  },
};

/**
 * Breathing Controls Sub-Component
 */
export const Controls: StoryObj<typeof BreathingControls> = {
  render: () => {
    const [isPaused, setIsPaused] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);

    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        <BreathingControls
          isPaused={isPaused}
          onPause={() => {
            setIsPaused(true);
          }}
          onResume={() => {
            setIsPaused(false);
          }}
          onStop={() => {
            alert('Stop clicked');
          }}
          audioEnabled={audioEnabled}
          onToggleAudio={() => {
            setAudioEnabled(!audioEnabled);
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive control bar with pause/resume, stop, and audio toggle.',
      },
    },
  },
};

/**
 * Breathing Progress Sub-Component
 */
export const Progress: StoryObj<typeof BreathingProgress> = {
  render: () => (
    <div
      style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      <BreathingProgress currentCycle={2} totalCycles={4} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Progress dots showing completed (1), current (2), and pending (3, 4) cycles.',
      },
    },
  },
};

/**
 * Animated Background Sub-Component
 */
export const Background: StoryObj<typeof BreathingBackground> = {
  render: () => (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <BreathingBackground phase="inhale" isActive={true} />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '2rem',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <h2>Animated Gradient Background</h2>
        <p>The background shifts colors slowly to create a calming atmosphere.</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Animated gradient background with floating particles.',
      },
    },
  },
};

/**
 * Interactive full experience with state tracking
 */
export const Interactive: Story = {
  render: function InteractiveStory(args) {
    const [stats, setStats] = useState<BreathingStats | null>(null);
    const [hasExited, setHasExited] = useState(false);

    if (stats) {
      return (
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            padding: '2rem',
          }}
        >
          <h2>Exercise Complete!</h2>
          <pre
            style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '1rem',
              borderRadius: '8px',
              marginTop: '1rem',
            }}
          >
            {JSON.stringify(stats, null, 2)}
          </pre>
          <button
            onClick={() => {
              setStats(null);
            }}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#4a9d9a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    if (hasExited) {
      return (
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <h2>Exited Early</h2>
          <button
            onClick={() => {
              setHasExited(false);
            }}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#4a9d9a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <ImmersiveBreathing
        {...args}
        onComplete={(s) => {
          setStats(s);
          args.onComplete?.(s);
        }}
        onExit={() => {
          setHasExited(true);
          args.onExit?.();
        }}
      />
    );
  },
  args: {
    technique: BREATHING_TECHNIQUES.box,
    introduction:
      'This is an interactive demo. Complete the exercise or stop early to see the result.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo that tracks completion and exit. Complete the exercise to see stats or stop early.',
      },
    },
  },
};
