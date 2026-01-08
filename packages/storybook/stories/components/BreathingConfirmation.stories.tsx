import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { BreathingConfirmation } from '@/features/breathing';
import type { BreathingTechniqueInfo } from '@/lib/ai-client';

// Sample breathing techniques for stories
const BOX_BREATHING: BreathingTechniqueInfo = {
  id: 'box',
  name: 'Box Breathing',
  description: '4-4-4-4 pattern for stress relief and improved focus',
  durations: [4, 4, 4, 4],
  recommended_cycles: 5,
  best_for: ['stress', 'focus', 'anxiety'],
};

const RELAXING_478: BreathingTechniqueInfo = {
  id: 'relaxing_478',
  name: '4-7-8 Relaxing Breath',
  description: 'Extended exhale pattern for anxiety relief and better sleep',
  durations: [4, 7, 8, 0],
  recommended_cycles: 4,
  best_for: ['anxiety', 'sleep', 'relaxation'],
};

const COHERENT: BreathingTechniqueInfo = {
  id: 'coherent',
  name: 'Coherent Breathing',
  description: 'Balanced 6-6 pattern for heart rate variability and calm',
  durations: [6, 0, 6, 0],
  recommended_cycles: 5,
  best_for: ['calm', 'balance', 'hrv'],
};

const DEEP_CALM: BreathingTechniqueInfo = {
  id: 'deep_calm',
  name: 'Deep Calm',
  description: '5-2-7-2 pattern with extended exhale for deep relaxation',
  durations: [5, 2, 7, 2],
  recommended_cycles: 5,
  best_for: ['relaxation', 'stress', 'calm'],
};

const ALL_TECHNIQUES = [BOX_BREATHING, RELAXING_478, COHERENT, DEEP_CALM];

/**
 * Confirmation card for breathing exercises.
 * Displayed inline in chat when AI suggests a breathing exercise.
 */
const meta: Meta<typeof BreathingConfirmation> = {
  title: 'Components/BreathingConfirmation',
  component: BreathingConfirmation,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Confirmation card for breathing exercises. Shows technique details and allows user to start, choose a different technique, or decline.',
      },
    },
  },
  args: {
    proposedTechnique: BOX_BREATHING,
    message: "Let's take a moment to practice some calming breathing together.",
    availableTechniques: ALL_TECHNIQUES,
    onConfirm: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof BreathingConfirmation>;

/**
 * Default confirmation card with Box Breathing technique.
 */
export const Default: Story = {
  args: {
    proposedTechnique: BOX_BREATHING,
    message: "Let's try some box breathing. It's great for reducing stress and improving focus.",
  },
};

/**
 * Confirmation card with 4-7-8 Relaxing Breath technique.
 */
export const Relaxing478: Story = {
  args: {
    proposedTechnique: RELAXING_478,
    message:
      'The 4-7-8 breath is excellent for calming anxiety. The extended exhale activates your relaxation response.',
  },
};

/**
 * Confirmation card with Coherent Breathing technique.
 */
export const CoherentBreathing: Story = {
  args: {
    proposedTechnique: COHERENT,
    message: 'Coherent breathing balances your nervous system. Simply breathe in for 6, out for 6.',
  },
};

/**
 * Confirmation card with Deep Calm technique.
 */
export const DeepCalm: Story = {
  args: {
    proposedTechnique: DEEP_CALM,
    message: "Let's practice a deeply calming breath with an extended exhale to help you unwind.",
  },
};

/**
 * Card with a personalized message.
 */
export const PersonalizedMessage: Story = {
  args: {
    proposedTechnique: BOX_BREATHING,
    message:
      "I notice you've mentioned feeling stressed about work. Would you like to try a quick breathing exercise? It only takes a few minutes.",
  },
};
