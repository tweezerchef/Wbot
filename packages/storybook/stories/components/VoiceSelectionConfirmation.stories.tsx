import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { VoiceSelectionConfirmation } from '@/features/meditation';
import type { VoiceInfo } from '@/lib/ai-client';

// ============================================================================
// Mock Data
// ============================================================================

const mockVoices: VoiceInfo[] = [
  {
    id: 'alloy',
    name: 'Alloy',
    description: 'Warm and balanced',
    best_for: ['daily_mindfulness', 'breathing_focus', 'general'],
    preview_url: null,
  },
  {
    id: 'nova',
    name: 'Nova',
    description: 'Gentle and soothing',
    best_for: ['sleep', 'anxiety_relief', 'relaxation'],
    preview_url: null,
  },
  {
    id: 'echo',
    name: 'Echo',
    description: 'Clear and calming',
    best_for: ['body_scan', 'loving_kindness', 'focus'],
    preview_url: null,
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    description: 'Soft and ethereal',
    best_for: ['sleep', 'visualization', 'deep_relaxation'],
    preview_url: null,
  },
  {
    id: 'onyx',
    name: 'Onyx',
    description: 'Deep and resonant',
    best_for: ['grounding', 'energy', 'morning_meditation'],
    preview_url: null,
  },
];

/**
 * Voice Selection Confirmation is an inline chat card that appears when
 * the AI suggests a meditation. It allows users to:
 *
 * - Start with the AI-recommended voice
 * - Choose a different voice from the dropdown
 * - Cancel with "Not now"
 *
 * The card displays the meditation preview, duration, and voice details
 * with a calming wellness-themed design.
 */
const meta: Meta<typeof VoiceSelectionConfirmation> = {
  title: 'Components/VoiceSelectionConfirmation',
  component: VoiceSelectionConfirmation,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'wellness' },
    docs: {
      description: {
        component: `
Inline chat card for confirming meditation voice selection.

## When It Appears
This component renders in the chat when the AI suggests a meditation,
giving the user control over the voice before starting.

## Features
- Displays AI's personalized message
- Shows meditation preview and duration
- Displays recommended voice with "best for" tags
- Dropdown to change voice selection
- Start button to begin meditation
- Cancel option to decline

## Voice Selection
The AI recommends a voice based on the meditation type and user preferences.
Users can override this by selecting a different voice from the dropdown.
        `,
      },
    },
  },
  argTypes: {
    message: {
      control: 'text',
      description: "AI's personalized message suggesting the meditation",
    },
    meditationPreview: {
      control: 'text',
      description: 'Brief preview of what the meditation will focus on',
    },
    durationMinutes: {
      control: { type: 'number', min: 1, max: 30 },
      description: 'Duration of the meditation in minutes',
    },
    recommendedVoice: {
      control: 'select',
      options: mockVoices.map((v) => v.id),
      description: 'The AI-recommended voice ID',
    },
    onConfirm: {
      action: 'confirmed',
      description: 'Called when user makes a decision (confirm or cancel)',
    },
  },
  args: {
    availableVoices: mockVoices,
    onConfirm: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof VoiceSelectionConfirmation>;

/**
 * Default voice selection card for a breathing focus meditation
 */
export const Default: Story = {
  args: {
    message:
      "I've created a personalized breathing meditation for you. This session focuses on deep, calming breaths to help you find your center.",
    meditationPreview:
      'A gentle breathing practice to reduce stress and find calm in the present moment.',
    durationMinutes: 10,
    recommendedVoice: 'alloy',
  },
};

/**
 * Sleep meditation with Nova voice recommended
 */
export const SleepMeditation: Story = {
  args: {
    message:
      "Based on our conversation, I've prepared a sleep meditation to help you drift off peacefully tonight.",
    meditationPreview:
      'A soothing journey to restful sleep, with progressive relaxation and peaceful imagery.',
    durationMinutes: 15,
    recommendedVoice: 'nova',
  },
};

/**
 * Anxiety relief meditation with shorter duration
 */
export const AnxietyRelief: Story = {
  args: {
    message:
      "I hear you're feeling anxious. Let's take a few minutes together to ground yourself and find relief.",
    meditationPreview:
      'Grounding techniques and gentle breathing to release anxious thoughts and return to calm.',
    durationMinutes: 7,
    recommendedVoice: 'nova',
  },
};

/**
 * Body scan meditation with Echo voice
 */
export const BodyScan: Story = {
  args: {
    message:
      "A body scan meditation can help you release tension you might not even realize you're holding. Ready to begin?",
    meditationPreview:
      'A head-to-toe journey through your body, releasing tension and cultivating awareness.',
    durationMinutes: 12,
    recommendedVoice: 'echo',
  },
};

/**
 * Loving kindness practice
 */
export const LovingKindness: Story = {
  args: {
    message:
      'I thought a loving kindness meditation might be helpful right now. This practice cultivates compassion for yourself and others.',
    meditationPreview:
      'Cultivate feelings of love and goodwill, starting with yourself and extending outward.',
    durationMinutes: 10,
    recommendedVoice: 'echo',
  },
};

/**
 * Short morning meditation
 */
export const MorningMeditation: Story = {
  args: {
    message:
      "Good morning! Let's start your day with intention. I've prepared a short mindfulness practice for you.",
    meditationPreview:
      'Wake up your mind and body with energizing breathwork and positive intentions for the day.',
    durationMinutes: 5,
    recommendedVoice: 'onyx',
  },
};

/**
 * Long form deep relaxation
 */
export const DeepRelaxation: Story = {
  args: {
    message:
      'You deserve some deep relaxation today. This longer session will guide you to a state of profound calm.',
    meditationPreview:
      'Progressive muscle relaxation, guided imagery, and deep breathing for complete unwinding.',
    durationMinutes: 20,
    recommendedVoice: 'shimmer',
  },
};

/**
 * Voice selector showcase - all voices
 */
export const AllVoices: StoryObj = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1rem',
        padding: '1rem',
      }}
    >
      {mockVoices.map((voice) => (
        <VoiceSelectionConfirmation
          key={voice.id}
          message={`Meditation with ${voice.name} voice - ${voice.description}`}
          availableVoices={mockVoices}
          recommendedVoice={voice.id}
          meditationPreview={`A meditation best suited for ${voice.best_for.slice(0, 2).join(' and ')}.`}
          durationMinutes={10}
          onConfirm={fn()}
        />
      ))}
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'All available voices with their descriptions and "best for" tags.',
      },
    },
  },
};

/**
 * Mobile viewport
 */
export const Mobile: Story = {
  args: {
    message: "I've prepared a calming meditation just for you. Ready when you are.",
    meditationPreview: 'A gentle practice to restore balance and peace.',
    durationMinutes: 8,
    recommendedVoice: 'alloy',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Voice selection card optimized for mobile viewport.',
      },
    },
  },
};
