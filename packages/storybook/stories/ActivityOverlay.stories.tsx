/* eslint-disable @typescript-eslint/no-unnecessary-condition -- Storybook action args can be undefined at runtime even if TypeScript thinks otherwise */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { ActivityOverlay } from '@/components/ActivityOverlay';
import {
  ImmersiveBreathing,
  ImmersiveBreathingConfirmation,
  BREATHING_TECHNIQUES,
  type BreathingTechnique,
  type BreathingStats,
} from '@/components/ImmersiveBreathing';

/**
 * ActivityOverlay provides a full-screen immersive experience for
 * wellness activities. It replaces the previous inline card-based
 * rendering in chat messages.
 *
 * - **Mobile**: Full-screen takeover
 * - **Tablet**: Centered card with backdrop blur
 * - **Desktop**: Larger centered card
 */
const meta: Meta<typeof ActivityOverlay> = {
  title: 'Overlay/ActivityOverlay',
  component: ActivityOverlay,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full-screen overlay for immersive wellness activities like breathing exercises and meditation.',
      },
    },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the overlay is visible',
    },
    activityType: {
      control: 'select',
      options: ['breathing', 'meditation', 'library', 'series'],
      description: 'Type of activity being displayed',
    },
    onClose: {
      action: 'closed',
      description: 'Called when user requests to close',
    },
    onExitComplete: {
      action: 'exit complete',
      description: 'Called when exit animation finishes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ActivityOverlay>;

/**
 * Placeholder content to simulate an activity inside the overlay
 */
function PlaceholderContent({ title }: { title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '2rem',
        color: 'white',
        textAlign: 'center',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{title}</h2>
      <p style={{ opacity: 0.7, maxWidth: '300px' }}>
        This is placeholder content. In the real app, this would be an ImmersiveBreathing or
        ImmersiveMeditation component.
      </p>
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(126, 200, 227, 0.3)',
          marginTop: '2rem',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/**
 * Default overlay with breathing activity placeholder
 */
export const Default: Story = {
  args: {
    isOpen: true,
    activityType: 'breathing',
    children: <PlaceholderContent title="Breathing Exercise" />,
  },
};

/**
 * Meditation activity type
 */
export const Meditation: Story = {
  args: {
    isOpen: true,
    activityType: 'meditation',
    children: <PlaceholderContent title="Guided Meditation" />,
  },
};

/**
 * Library activity type (for browsing meditations)
 */
export const Library: Story = {
  args: {
    isOpen: true,
    activityType: 'library',
    children: <PlaceholderContent title="Meditation Library" />,
  },
};

/**
 * Series activity type (for meditation series)
 */
export const Series: Story = {
  args: {
    isOpen: true,
    activityType: 'series',
    children: <PlaceholderContent title="Meditation Series" />,
  },
};

/**
 * Interactive story demonstrating open/close toggle
 */
export const Interactive: Story = {
  render: function InteractiveStory(args) {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div style={{ padding: '2rem' }}>
        <button
          onClick={() => {
            setIsOpen(true);
          }}
          style={{
            padding: '1rem 2rem',
            fontSize: '1rem',
            background: '#4a9d9a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Open Activity Overlay
        </button>
        <ActivityOverlay
          {...args}
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            args.onClose?.();
          }}
        >
          <PlaceholderContent title="Interactive Demo" />
        </ActivityOverlay>
      </div>
    );
  },
  args: {
    activityType: 'breathing',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click the button to open the overlay. Close by clicking the X button, pressing Escape, or clicking the backdrop.',
      },
    },
  },
};

/**
 * Mobile viewport simulation (375px width)
 */
export const Mobile: Story = {
  args: {
    isOpen: true,
    activityType: 'breathing',
    children: <PlaceholderContent title="Mobile View" />,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'On mobile, the overlay takes over the entire screen.',
      },
    },
  },
};

/**
 * Tablet viewport simulation (768px width)
 */
export const Tablet: Story = {
  args: {
    isOpen: true,
    activityType: 'breathing',
    children: <PlaceholderContent title="Tablet View" />,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'On tablet, the overlay appears as a centered card with backdrop blur.',
      },
    },
  },
};

/**
 * Closed state (overlay not visible)
 */
export const Closed: Story = {
  args: {
    isOpen: false,
    activityType: 'breathing',
    children: <PlaceholderContent title="You should not see this" />,
  },
  parameters: {
    docs: {
      description: {
        story: 'When isOpen is false, nothing is rendered.',
      },
    },
  },
};

// ============================================================================
// INTEGRATED STORIES - Overlay + ImmersiveBreathing together
// ============================================================================

/**
 * Full Integration: Confirmation → Breathing Exercise
 *
 * This story demonstrates the complete HITL (Human-in-the-Loop) flow:
 * 1. User clicks button to trigger AI's breathing suggestion
 * 2. Overlay opens with ImmersiveBreathingConfirmation
 * 3. User can select technique and confirm/decline
 * 4. On confirm, transitions to ImmersiveBreathing exercise
 * 5. Exercise completes or user exits
 */
export const FullIntegrationFlow: Story = {
  render: function FullIntegrationFlowStory(args) {
    type Phase = 'idle' | 'confirming' | 'active' | 'completed';
    const [phase, setPhase] = useState<Phase>('idle');
    const [selectedTechnique, setSelectedTechnique] = useState<BreathingTechnique>(
      BREATHING_TECHNIQUES.box
    );
    const [stats, setStats] = useState<BreathingStats | null>(null);

    const availableTechniques = [
      BREATHING_TECHNIQUES.box,
      BREATHING_TECHNIQUES.relaxing_478,
      BREATHING_TECHNIQUES.coherent,
      BREATHING_TECHNIQUES.deep_calm,
    ];

    const handleConfirm = (technique: BreathingTechnique) => {
      setSelectedTechnique(technique);
      setPhase('active');
    };

    const handleDecline = () => {
      setPhase('idle');
    };

    const handleComplete = (s: BreathingStats) => {
      setStats(s);
      setPhase('completed');
    };

    const handleExit = () => {
      setPhase('idle');
    };

    const handleClose = () => {
      setPhase('idle');
      args.onClose?.();
    };

    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Full Integration Demo</h2>
        <p style={{ marginBottom: '1rem', opacity: 0.7 }}>
          This demonstrates the complete flow from AI suggestion to exercise completion.
        </p>

        <button
          onClick={() => {
            setPhase('confirming');
          }}
          style={{
            padding: '1rem 2rem',
            fontSize: '1rem',
            background: '#4a9d9a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '1rem',
          }}
        >
          Trigger AI Breathing Suggestion
        </button>

        {stats && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#f0f0f0',
              borderRadius: '8px',
            }}
          >
            <h3>Last Exercise Stats:</h3>
            <pre>{JSON.stringify(stats, null, 2)}</pre>
          </div>
        )}

        <ActivityOverlay
          {...args}
          isOpen={phase === 'confirming' || phase === 'active'}
          onClose={handleClose}
        >
          {phase === 'confirming' && (
            <ImmersiveBreathingConfirmation
              proposedTechnique={BREATHING_TECHNIQUES.box}
              message="I noticed you mentioned feeling stressed. Would you like to try a calming breathing exercise? Box breathing is a simple yet powerful technique used by Navy SEALs to stay calm under pressure."
              availableTechniques={availableTechniques}
              onConfirm={handleConfirm}
              onDecline={handleDecline}
            />
          )}
          {phase === 'active' && (
            <ImmersiveBreathing
              technique={selectedTechnique}
              introduction="Take a moment to find a comfortable position. We'll begin with a few calming breaths."
              onComplete={handleComplete}
              onExit={handleExit}
            />
          )}
        </ActivityOverlay>
      </div>
    );
  },
  args: {
    activityType: 'breathing',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Complete integration showing the full HITL flow: AI suggestion → confirmation → breathing exercise → completion.',
      },
    },
  },
};

/**
 * Overlay with ImmersiveBreathingConfirmation
 *
 * Shows the HITL confirmation screen inside the overlay.
 */
export const WithBreathingConfirmation: Story = {
  render: function WithBreathingConfirmationStory(args) {
    const [isOpen, setIsOpen] = useState(true);
    const [confirmed, setConfirmed] = useState<string | null>(null);

    const availableTechniques = [
      BREATHING_TECHNIQUES.box,
      BREATHING_TECHNIQUES.relaxing_478,
      BREATHING_TECHNIQUES.coherent,
      BREATHING_TECHNIQUES.deep_calm,
    ];

    return (
      <div style={{ padding: '2rem' }}>
        {!isOpen && (
          <>
            <p style={{ marginBottom: '1rem' }}>
              {confirmed ? `User confirmed: ${confirmed}` : 'User declined the exercise'}
            </p>
            <button
              onClick={() => {
                setIsOpen(true);
                setConfirmed(null);
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#4a9d9a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Show Again
            </button>
          </>
        )}
        <ActivityOverlay
          {...args}
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            args.onClose?.();
          }}
        >
          <ImmersiveBreathingConfirmation
            proposedTechnique={BREATHING_TECHNIQUES.box}
            message="It sounds like you could use a moment to relax. Would you like to try box breathing? It's a simple technique that helps calm your nervous system."
            availableTechniques={availableTechniques}
            onConfirm={(technique) => {
              setConfirmed(technique.name);
              setIsOpen(false);
            }}
            onDecline={() => {
              setIsOpen(false);
            }}
          />
        </ActivityOverlay>
      </div>
    );
  },
  args: {
    activityType: 'breathing',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The HITL confirmation screen inside the overlay. User can select a technique and confirm or decline.',
      },
    },
  },
};

/**
 * Overlay with ImmersiveBreathing Exercise
 *
 * Shows the active breathing exercise inside the overlay.
 */
export const WithBreathingExercise: Story = {
  render: function WithBreathingExerciseStory(args) {
    const [isOpen, setIsOpen] = useState(true);
    const [stats, setStats] = useState<BreathingStats | null>(null);

    return (
      <div style={{ padding: '2rem' }}>
        {!isOpen && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              {stats ? (
                <>
                  <p>Exercise completed!</p>
                  <pre
                    style={{
                      background: '#f0f0f0',
                      padding: '1rem',
                      borderRadius: '4px',
                      marginTop: '0.5rem',
                    }}
                  >
                    {JSON.stringify(stats, null, 2)}
                  </pre>
                </>
              ) : (
                <p>Exercise exited early</p>
              )}
            </div>
            <button
              onClick={() => {
                setIsOpen(true);
                setStats(null);
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#4a9d9a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Start Again
            </button>
          </>
        )}
        <ActivityOverlay
          {...args}
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            args.onClose?.();
          }}
        >
          <ImmersiveBreathing
            technique={BREATHING_TECHNIQUES.box}
            introduction="Let's practice box breathing together. This technique is used by Navy SEALs to stay calm under pressure."
            onComplete={(s) => {
              setStats(s);
              setIsOpen(false);
            }}
            onExit={() => {
              setIsOpen(false);
            }}
          />
        </ActivityOverlay>
      </div>
    );
  },
  args: {
    activityType: 'breathing',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The active breathing exercise inside the overlay. Click Begin to start the exercise.',
      },
    },
  },
};

/**
 * Mobile Integration View
 *
 * Full integration on mobile viewport.
 */
export const MobileIntegration: Story = {
  render: function MobileIntegrationStory(args) {
    const [phase, setPhase] = useState<'confirming' | 'active'>('confirming');

    return (
      <ActivityOverlay
        {...args}
        isOpen={true}
        onClose={() => {
          args.onClose?.();
        }}
      >
        {phase === 'confirming' && (
          <ImmersiveBreathingConfirmation
            proposedTechnique={BREATHING_TECHNIQUES.box}
            message="Would you like to try a quick breathing exercise?"
            availableTechniques={[BREATHING_TECHNIQUES.box, BREATHING_TECHNIQUES.relaxing_478]}
            onConfirm={() => {
              setPhase('active');
            }}
            onDecline={() => {
              args.onClose?.();
            }}
          />
        )}
        {phase === 'active' && (
          <ImmersiveBreathing
            technique={BREATHING_TECHNIQUES.box}
            onComplete={() => {
              args.onClose?.();
            }}
            onExit={() => {
              args.onClose?.();
            }}
          />
        )}
      </ActivityOverlay>
    );
  },
  args: {
    activityType: 'breathing',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Full integration flow on mobile viewport - confirmation screen first, then exercise.',
      },
    },
  },
};
