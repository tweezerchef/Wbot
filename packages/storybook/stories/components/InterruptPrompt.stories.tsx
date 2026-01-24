/**
 * InterruptPrompt Stories
 *
 * HITL (Human-in-the-Loop) confirmation prompts for activities.
 * Renders different confirmation UIs based on interrupt type:
 * - BreathingConfirmation: Technique selection for breathing exercises
 * - VoiceSelectionConfirmation: Voice choice for AI meditation
 * - JournalingConfirmation: Prompt selection for journaling
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import {
  MOCK_BREATHING_INTERRUPT,
  MOCK_VOICE_INTERRUPT,
  MOCK_JOURNALING_INTERRUPT,
  MOCK_RELAXING_478,
  MOCK_PROMPT_GRATITUDE,
  MOCK_PROMPT_PROCESSING,
} from '../mocks';

import { InterruptPrompt } from '@/features/chat/components/InterruptPrompt/InterruptPrompt';

/**
 * InterruptPrompt consolidates HITL confirmation UIs for breathing,
 * meditation voice selection, and journaling activities.
 */
const meta: Meta<typeof InterruptPrompt> = {
  title: 'Components/Chat/InterruptPrompt',
  component: InterruptPrompt,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays HITL confirmation prompts inline in chat. Each interrupt type has a specialized UI for making activity-specific choices.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    onResume: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof InterruptPrompt>;

// =============================================================================
// Breathing Confirmation Stories
// =============================================================================

/**
 * Breathing confirmation with Box Breathing technique.
 */
export const BreathingConfirmation: Story = {
  args: {
    interruptData: MOCK_BREATHING_INTERRUPT,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Displays when AI suggests a breathing exercise. Shows technique details and allows starting, changing technique, or declining.',
      },
    },
  },
};

/**
 * Breathing confirmation with 4-7-8 technique for sleep/anxiety.
 */
export const BreathingRelaxing: Story = {
  args: {
    interruptData: {
      ...MOCK_BREATHING_INTERRUPT,
      proposed_technique: MOCK_RELAXING_478,
      message:
        'The 4-7-8 breath is excellent for calming anxiety. The extended exhale activates your relaxation response.',
    },
  },
};

/**
 * Breathing confirmation with personalized message.
 */
export const BreathingPersonalized: Story = {
  args: {
    interruptData: {
      ...MOCK_BREATHING_INTERRUPT,
      message:
        'I notice you mentioned feeling stressed about work. Would you like to try a quick breathing exercise? Box breathing is particularly helpful for focus and stress relief.',
    },
  },
};

// =============================================================================
// Voice Selection Stories
// =============================================================================

/**
 * Voice selection for AI-generated meditation.
 */
export const VoiceSelection: Story = {
  args: {
    interruptData: MOCK_VOICE_INTERRUPT,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Displays when AI is creating a personalized meditation. Allows user to choose their preferred voice.',
      },
    },
  },
};

/**
 * Voice selection with different meditation preview.
 */
export const VoiceSelectionSleep: Story = {
  args: {
    interruptData: {
      ...MOCK_VOICE_INTERRUPT,
      message: "I'll create a sleep meditation to help you unwind. Which voice would you prefer?",
      meditation_preview: 'A soothing meditation to guide you into peaceful, restful sleep...',
      duration_minutes: 10,
    },
  },
};

// =============================================================================
// Journaling Confirmation Stories
// =============================================================================

/**
 * Journaling confirmation with reflection prompt.
 */
export const JournalingConfirmation: Story = {
  args: {
    interruptData: MOCK_JOURNALING_INTERRUPT,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Displays when AI suggests journaling. Shows prompt preview and allows starting, changing prompt, or declining.',
      },
    },
  },
};

/**
 * Journaling confirmation with gratitude prompt.
 */
export const JournalingGratitude: Story = {
  args: {
    interruptData: {
      ...MOCK_JOURNALING_INTERRUPT,
      proposed_prompt: MOCK_PROMPT_GRATITUDE,
      message:
        'Gratitude journaling can shift your perspective. I have a prompt that might help you appreciate the small things today.',
    },
  },
};

/**
 * Journaling confirmation with processing prompt.
 */
export const JournalingProcessing: Story = {
  args: {
    interruptData: {
      ...MOCK_JOURNALING_INTERRUPT,
      proposed_prompt: MOCK_PROMPT_PROCESSING,
      message:
        "Sometimes writing helps us process difficult emotions. This prompt might help you work through what's on your mind.",
    },
  },
};

// =============================================================================
// Mobile Views
// =============================================================================

/**
 * Breathing confirmation on mobile.
 */
export const MobileBreathing: Story = {
  args: {
    interruptData: MOCK_BREATHING_INTERRUPT,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '8px' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Voice selection on mobile.
 */
export const MobileVoice: Story = {
  args: {
    interruptData: MOCK_VOICE_INTERRUPT,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '8px' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Journaling confirmation on mobile.
 */
export const MobileJournaling: Story = {
  args: {
    interruptData: MOCK_JOURNALING_INTERRUPT,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '8px' }}>
        <Story />
      </div>
    ),
  ],
};

// =============================================================================
// All Types Showcase
// =============================================================================

/**
 * Showcases all three interrupt types.
 */
export const AllTypes: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
          Breathing Confirmation
        </h3>
        <InterruptPrompt interruptData={MOCK_BREATHING_INTERRUPT} onResume={fn()} />
      </div>
      <div>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>Voice Selection</h3>
        <InterruptPrompt interruptData={MOCK_VOICE_INTERRUPT} onResume={fn()} />
      </div>
      <div>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
          Journaling Confirmation
        </h3>
        <InterruptPrompt interruptData={MOCK_JOURNALING_INTERRUPT} onResume={fn()} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All three interrupt types displayed together for comparison.',
      },
    },
  },
};
