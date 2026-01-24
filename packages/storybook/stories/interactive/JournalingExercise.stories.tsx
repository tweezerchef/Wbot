/**
 * JournalingExercise Stories
 *
 * Main interactive component for the journaling activity.
 * Manages the full flow: Idle -> Writing -> Mood After -> Complete.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import {
  MOCK_PROMPT_REFLECTION,
  MOCK_PROMPT_GRATITUDE,
  MOCK_PROMPT_PROCESSING,
  MOCK_PROMPT_GROWTH,
  MOCK_PROMPT_SELF_COMPASSION,
} from '../mocks';

import { JournalingExercise } from '@/features/journaling/components/JournalingExercise/JournalingExercise';

/**
 * JournalingExercise is the main interactive journaling component.
 * It guides users through the full journaling flow with AI-selected prompts,
 * focused text editing, optional mood tracking, and sharing with AI.
 */
const meta: Meta<typeof JournalingExercise> = {
  title: 'Interactive/JournalingExercise',
  component: JournalingExercise,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Interactive journaling component that manages the full flow:
1. **Idle**: Shows prompt card and start button
2. **Writing**: Focused text editor with word count
3. **Mood After**: Optional mood check after writing
4. **Complete**: Success screen with share option

Supports all five journaling categories: Reflection, Gratitude, Processing, Growth, and Self-Compassion.`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    enableSharing: {
      control: 'boolean',
      description: 'Whether to show the "Share with AI" option after completion',
    },
  },
  args: {
    onComplete: fn(),
    onStop: fn(),
    onShare: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof JournalingExercise>;

// =============================================================================
// Category Variants (Idle State)
// =============================================================================

/**
 * Reflection prompt - daily awareness and pattern recognition.
 */
export const Reflection: Story = {
  args: {
    prompt: MOCK_PROMPT_REFLECTION,
    introduction: 'Taking time to reflect can help you notice patterns and gain valuable insights.',
    enableSharing: true,
  },
};

/**
 * Gratitude prompt - appreciation and positive perspective.
 */
export const Gratitude: Story = {
  args: {
    prompt: MOCK_PROMPT_GRATITUDE,
    introduction: 'Gratitude journaling can shift your perspective and boost your mood.',
    enableSharing: true,
  },
};

/**
 * Processing prompt - working through emotions and situations.
 */
export const Processing: Story = {
  args: {
    prompt: MOCK_PROMPT_PROCESSING,
    introduction:
      'Sometimes writing helps us process difficult emotions. Take your time with this.',
    enableSharing: true,
  },
};

/**
 * Growth prompt - personal development and aspirations.
 */
export const Growth: Story = {
  args: {
    prompt: MOCK_PROMPT_GROWTH,
    introduction: 'Reflecting on challenges helps us grow and build resilience for the future.',
    enableSharing: true,
  },
};

/**
 * Self-compassion prompt - self-kindness and inner healing.
 */
export const SelfCompassion: Story = {
  args: {
    prompt: MOCK_PROMPT_SELF_COMPASSION,
    introduction:
      "Being kind to yourself is a practice. Let's explore some self-compassion together.",
    enableSharing: true,
  },
};

// =============================================================================
// State Variants
// =============================================================================

/**
 * Without AI introduction text.
 */
export const NoIntroduction: Story = {
  args: {
    prompt: MOCK_PROMPT_REFLECTION,
    introduction: undefined,
    enableSharing: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'When no introduction is provided, the component shows only the prompt card.',
      },
    },
  },
};

/**
 * With sharing disabled.
 */
export const SharingDisabled: Story = {
  args: {
    prompt: MOCK_PROMPT_GRATITUDE,
    introduction: 'Write freely without worrying about sharing.',
    enableSharing: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'When sharing is disabled, the "Share with AI" button is hidden after completion.',
      },
    },
  },
};

/**
 * With long introduction text.
 */
export const LongIntroduction: Story = {
  args: {
    prompt: MOCK_PROMPT_PROCESSING,
    introduction:
      "I noticed you mentioned feeling overwhelmed by recent events. Journaling can be a powerful way to process these feelings. There's no right or wrong way to do this - just write whatever comes to mind. I'll be here when you're ready to talk about it, but there's no pressure to share.",
    enableSharing: true,
  },
};

// =============================================================================
// Mobile Views
// =============================================================================

/**
 * Mobile viewport - idle state.
 */
export const MobileIdle: Story = {
  args: {
    prompt: MOCK_PROMPT_REFLECTION,
    introduction: 'Taking time to reflect can help you gain clarity.',
    enableSharing: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '12px' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Mobile viewport - compact layout.
 */
export const MobileGratitude: Story = {
  args: {
    prompt: MOCK_PROMPT_GRATITUDE,
    introduction: 'Gratitude journaling can boost your mood.',
    enableSharing: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '12px' }}>
        <Story />
      </div>
    ),
  ],
};

// =============================================================================
// All Categories Showcase
// =============================================================================

/**
 * Showcases all five journaling categories side by side.
 */
export const AllCategories: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '500px' }}>
      <div>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>Reflection</h3>
        <JournalingExercise prompt={MOCK_PROMPT_REFLECTION} onComplete={fn()} />
      </div>
      <div>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>Gratitude</h3>
        <JournalingExercise prompt={MOCK_PROMPT_GRATITUDE} onComplete={fn()} />
      </div>
      <div>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>Processing</h3>
        <JournalingExercise prompt={MOCK_PROMPT_PROCESSING} onComplete={fn()} />
      </div>
      <div>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>Growth</h3>
        <JournalingExercise prompt={MOCK_PROMPT_GROWTH} onComplete={fn()} />
      </div>
      <div>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>Self-Compassion</h3>
        <JournalingExercise prompt={MOCK_PROMPT_SELF_COMPASSION} onComplete={fn()} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All five journaling categories displayed together for visual comparison.',
      },
    },
  },
};

// =============================================================================
// Edge Cases
// =============================================================================

/**
 * Prompt with no follow-up questions.
 */
export const NoFollowUpQuestions: Story = {
  args: {
    prompt: {
      ...MOCK_PROMPT_REFLECTION,
      follow_up_questions: [],
    },
    introduction: 'Write freely about your day.',
    enableSharing: true,
  },
};

/**
 * Prompt with long text.
 */
export const LongPromptText: Story = {
  args: {
    prompt: {
      ...MOCK_PROMPT_REFLECTION,
      text: 'Think about a moment from today or this week that challenged you. What happened? How did you feel in that moment? What did you do? Looking back now, what would you tell yourself if you could go back to that moment? What did you learn that you can carry forward?',
    },
    introduction: 'This prompt invites deeper reflection.',
    enableSharing: true,
  },
};

/**
 * Prompt with many best_for tags.
 */
export const ManyTags: Story = {
  args: {
    prompt: {
      ...MOCK_PROMPT_REFLECTION,
      best_for: ['awareness', 'patterns', 'growth', 'clarity', 'mindfulness', 'reflection'],
    },
    enableSharing: true,
  },
};
