import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { BreathingExercise } from '@/components/BreathingExercise/BreathingExercise';
import { BREATHING_TECHNIQUES } from '@/components/BreathingExercise/types';

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
