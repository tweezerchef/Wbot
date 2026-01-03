import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from '@storybook/test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import { BreathingExercise } from '@/components/BreathingExercise/BreathingExercise';
import {
  BREATHING_TECHNIQUES,
  type BreathingTechnique,
} from '@/components/BreathingExercise/types';

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
 * Interactive breathing exercise component with visual animation and audio.
 *
 * Features:
 * - Visual breathing animation with calming colors
 * - Multiple breathing techniques (Box, 4-7-8, Coherent, Deep Calm)
 * - Ambient audio (ocean waves) with volume control
 * - Progress tracking with cycle counter
 * - Pause/resume/stop controls
 * - Completion celebration
 */
const meta: Meta<typeof BreathingExercise> = {
  title: 'Interactive/BreathingExercise',
  component: BreathingExercise,
  decorators: [
    (Story): ReactElement => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'wellness' },
    docs: {
      description: {
        component: `
Interactive breathing exercise component that renders inline within the chat.

## Features
- Visual breathing animation with calming, phase-specific colors
- Multiple breathing techniques (Box, 4-7-8, Coherent, Deep Calm)
- Ambient audio (ocean waves) with volume control
- Progress tracking with cycle counter
- Pause/resume/stop controls
- Completion celebration

## Usage
This component is embedded within chat messages when the AI suggests or initiates a breathing exercise.
        `,
      },
    },
  },
  argTypes: {
    technique: {
      control: 'select',
      options: Object.keys(BREATHING_TECHNIQUES),
      mapping: BREATHING_TECHNIQUES,
      description: 'The breathing technique to use',
    },
    enableAudio: {
      control: 'boolean',
      description: 'Whether to enable ambient audio and phase chimes',
    },
    introduction: {
      control: 'text',
      description: 'Optional introduction text from the AI',
    },
  },
  args: {
    technique: BREATHING_TECHNIQUES.box,
    introduction: "Let's take a moment to practice some calming breathing together.",
    enableAudio: false, // Disabled by default for Storybook to avoid autoplay issues
    onComplete: fn(),
    onStop: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof BreathingExercise>;

/**
 * Default breathing exercise with Box Breathing technique.
 * 4-4-4-4 pattern for stress relief and improved focus.
 */
export const BoxBreathing: Story = {
  args: {
    technique: BREATHING_TECHNIQUES.box,
    introduction:
      "Box breathing is a powerful technique for stress relief. Let's practice together with a 4-4-4-4 pattern.",
  },
};

/**
 * 4-7-8 Relaxing Breath technique.
 * Extended exhale pattern for anxiety relief and better sleep.
 */
export const Relaxing478: Story = {
  args: {
    technique: BREATHING_TECHNIQUES.relaxing_478,
    introduction:
      'The 4-7-8 breath is excellent for calming anxiety. The extended exhale activates your relaxation response.',
  },
};

/**
 * Coherent Breathing technique.
 * Balanced 6-6 pattern for heart rate variability and calm.
 */
export const CoherentBreathing: Story = {
  args: {
    technique: BREATHING_TECHNIQUES.coherent,
    introduction:
      'Coherent breathing balances your nervous system. Simply breathe in for 6, out for 6.',
  },
};

/**
 * Deep Calm technique.
 * 5-2-7-2 pattern with extended exhale for deep relaxation.
 */
export const DeepCalm: Story = {
  args: {
    technique: BREATHING_TECHNIQUES.deep_calm,
    introduction:
      "Let's practice a deeply calming breath with an extended exhale to help you unwind.",
  },
};

/**
 * Exercise with no introduction text.
 * Shows the component in minimal mode.
 */
export const NoIntroduction: Story = {
  args: {
    technique: BREATHING_TECHNIQUES.box,
    introduction: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Breathing exercise without an introduction message from the AI.',
      },
    },
  },
};

/**
 * Exercise with audio enabled.
 * Note: Audio may not autoplay in Storybook due to browser restrictions.
 */
export const WithAudio: Story = {
  args: {
    technique: BREATHING_TECHNIQUES.box,
    introduction: 'This exercise includes ambient ocean sounds and phase transition chimes.',
    enableAudio: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Breathing exercise with ambient audio enabled. Click "Start Exercise" and toggle the audio button to hear ocean waves.',
      },
    },
  },
};

/**
 * All techniques shown in a grid for comparison.
 */
export const AllTechniques: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '24px',
        maxWidth: '900px',
      }}
    >
      {Object.values(BREATHING_TECHNIQUES).map((technique) => (
        <div
          key={technique.id}
          style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#404040' }}>
            {technique.name}
          </h3>
          <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#737373' }}>
            {technique.description}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#a3a3a3' }}>
            Pattern: {technique.durations.join('-')} · {technique.cycles} cycles
          </p>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all available breathing techniques with their patterns and benefits.',
      },
    },
  },
};

// ==============================================================================
// Test Stories with Play Functions
// ==============================================================================

/** Short technique for faster automated tests */
const testTechniqueShort: BreathingTechnique = {
  id: 'test_short',
  name: 'Test Short',
  durations: [2, 2, 2, 2], // 8 second cycle for demo
  description: 'Short technique for automated testing',
  cycles: 2,
};

/**
 * Test: Starting the exercise
 * Verifies that clicking Start transitions to active state
 */
export const TestStartExercise: Story = {
  args: {
    technique: testTechniqueShort,
    introduction: 'Test story for automated interaction testing',
    enableAudio: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify idle state
    await expect(canvas.getByText('Start Exercise')).toBeInTheDocument();
    await expect(canvas.getByText('Ready')).toBeInTheDocument();

    // Click start button
    const startButton = canvas.getByText('Start Exercise');
    await userEvent.click(startButton);

    // Verify active state
    await expect(canvas.getByText('Breathe In')).toBeInTheDocument();
    await expect(canvas.getByText(/Cycle 1 of/)).toBeInTheDocument();
    await expect(canvas.getByText('Pause')).toBeInTheDocument();
    await expect(canvas.getByText('Stop')).toBeInTheDocument();
  },
};

/**
 * Test: Pause and resume functionality
 * Verifies pause/resume buttons work correctly
 */
export const TestPauseResume: Story = {
  args: {
    technique: testTechniqueShort,
    enableAudio: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Start exercise
    await userEvent.click(canvas.getByText('Start Exercise'));
    await expect(canvas.getByText('Pause')).toBeInTheDocument();

    // Pause
    await userEvent.click(canvas.getByText('Pause'));
    await expect(canvas.getByText('Resume')).toBeInTheDocument();
    await expect(canvas.queryByText('Pause')).not.toBeInTheDocument();

    // Resume
    await userEvent.click(canvas.getByText('Resume'));
    await expect(canvas.getByText('Pause')).toBeInTheDocument();
    await expect(canvas.queryByText('Resume')).not.toBeInTheDocument();
  },
};

/**
 * Test: Stopping the exercise
 * Verifies that Stop button returns to idle state
 */
export const TestStopExercise: Story = {
  args: {
    technique: testTechniqueShort,
    enableAudio: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Start exercise
    await userEvent.click(canvas.getByText('Start Exercise'));
    await expect(canvas.getByText('Breathe In')).toBeInTheDocument();

    // Stop exercise
    await userEvent.click(canvas.getByText('Stop'));

    // Verify returned to idle state
    await expect(canvas.getByText('Start Exercise')).toBeInTheDocument();
    await expect(canvas.getByText('Ready')).toBeInTheDocument();

    // Verify onStop callback was called
    if (args.onStop) {
      await expect(args.onStop).toHaveBeenCalledOnce();
    }
  },
};

/**
 * Test: Audio toggle
 * Verifies audio can be toggled on and off
 */
export const TestAudioToggle: Story = {
  args: {
    technique: testTechniqueShort,
    enableAudio: true, // Enable audio for this test
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify audio toggle exists and shows "Sound On"
    await expect(canvas.getByText('Sound On')).toBeInTheDocument();

    // Toggle off
    await userEvent.click(canvas.getByText('Sound On'));
    await expect(canvas.getByText('Sound Off')).toBeInTheDocument();
    await expect(canvas.queryByText('Sound On')).not.toBeInTheDocument();

    // Toggle back on
    await userEvent.click(canvas.getByText('Sound Off'));
    await expect(canvas.getByText('Sound On')).toBeInTheDocument();
    await expect(canvas.queryByText('Sound Off')).not.toBeInTheDocument();
  },
};

/**
 * Test: Accessibility
 * Verifies ARIA labels and semantic HTML
 */
export const TestAccessibility: Story = {
  args: {
    technique: testTechniqueShort,
    enableAudio: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify button semantics
    const startButton = canvas.getByText('Start Exercise');
    await expect(startButton.tagName).toBe('BUTTON');

    // Start and verify animation ARIA label
    await userEvent.click(startButton);
    const animation = canvas.getByRole('img');
    await expect(animation).toHaveAttribute('aria-label');

    // Verify aria-label contains phase info
    const ariaLabel = animation.getAttribute('aria-label');
    await expect(ariaLabel).toMatch(/Breathe In:.*seconds remaining/);
  },
};

/**
 * Visual test: Phase transitions
 * Manual verification - watch the phases change over time
 * No assertions, just visual confirmation
 */
export const VisualPhaseTransitions: Story = {
  args: {
    technique: testTechniqueShort,
    introduction:
      'Visual test - watch the phases transition. This story has no automated assertions.',
    enableAudio: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Visual test for phase transitions. Start the exercise and manually verify that phases advance correctly (Breathe In → Hold → Breathe Out → Hold).',
      },
    },
  },
};
