/**
 * JournalingConfirmation Stories
 *
 * HITL (Human-in-the-Loop) confirmation card for journaling prompt selection.
 * Displayed inline in chat when AI suggests a journaling activity.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import {
  MOCK_ALL_PROMPTS,
  MOCK_PROMPT_REFLECTION,
  MOCK_PROMPT_GRATITUDE,
  MOCK_PROMPT_PROCESSING,
  MOCK_PROMPT_GROWTH,
  MOCK_PROMPT_SELF_COMPASSION,
} from '../mocks';

import { JournalingConfirmation } from '@/features/journaling/components/JournalingConfirmation/JournalingConfirmation';

/**
 * JournalingConfirmation displays when the AI suggests a journaling prompt.
 * Users can start with the suggested prompt, choose a different one, or decline.
 */
const meta: Meta<typeof JournalingConfirmation> = {
  title: 'Components/Journaling/JournalingConfirmation',
  component: JournalingConfirmation,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `HITL confirmation card for journaling. Shows:
- AI's personalized message
- Proposed prompt with category badge and details
- "Start Writing" button
- Dropdown to select different prompts
- "Maybe later" decline option`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '420px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    availablePrompts: MOCK_ALL_PROMPTS,
    onConfirm: fn(),
    onDecline: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof JournalingConfirmation>;

// =============================================================================
// Category Variants
// =============================================================================

/**
 * Reflection prompt suggestion.
 */
export const Reflection: Story = {
  args: {
    proposedPrompt: MOCK_PROMPT_REFLECTION,
    message:
      'Taking time to reflect can help you notice patterns and gain valuable insights about your day.',
  },
};

/**
 * Gratitude prompt suggestion.
 */
export const Gratitude: Story = {
  args: {
    proposedPrompt: MOCK_PROMPT_GRATITUDE,
    message:
      'Gratitude journaling can shift your perspective and boost your mood. Even small things count!',
  },
};

/**
 * Processing prompt suggestion.
 */
export const Processing: Story = {
  args: {
    proposedPrompt: MOCK_PROMPT_PROCESSING,
    message:
      "It sounds like you have a lot on your mind. Writing can help process these feelings. There's no pressure - just write what comes naturally.",
  },
};

/**
 * Growth prompt suggestion.
 */
export const Growth: Story = {
  args: {
    proposedPrompt: MOCK_PROMPT_GROWTH,
    message:
      'Reflecting on challenges helps us grow stronger. This prompt might help you see your recent experience from a new angle.',
  },
};

/**
 * Self-compassion prompt suggestion.
 */
export const SelfCompassion: Story = {
  args: {
    proposedPrompt: MOCK_PROMPT_SELF_COMPASSION,
    message:
      "I noticed you've been hard on yourself lately. Being kind to yourself is a skill worth practicing.",
  },
};

// =============================================================================
// Message Variants
// =============================================================================

/**
 * With personalized context-aware message.
 */
export const PersonalizedMessage: Story = {
  args: {
    proposedPrompt: MOCK_PROMPT_PROCESSING,
    message:
      "You mentioned feeling overwhelmed with the project deadline approaching. Sometimes writing about what's weighing on us can provide clarity and relief. Would you like to try a brief journaling session?",
  },
};

/**
 * With short, simple message.
 */
export const ShortMessage: Story = {
  args: {
    proposedPrompt: MOCK_PROMPT_GRATITUDE,
    message: 'Would you like to journal about gratitude today?',
  },
};

/**
 * With long, detailed message.
 */
export const LongMessage: Story = {
  args: {
    proposedPrompt: MOCK_PROMPT_REFLECTION,
    message:
      "Based on our conversation, I think some reflection might be helpful right now. Journaling has been shown to help process thoughts, reduce stress, and gain new perspectives. The prompt I've selected focuses on daily awareness - it's a good way to pause and notice what's happening in your life. Take as much or as little time as you need.",
  },
};

// =============================================================================
// Mobile Views
// =============================================================================

/**
 * Mobile viewport.
 */
export const Mobile: Story = {
  args: {
    proposedPrompt: MOCK_PROMPT_REFLECTION,
    message: 'Taking time to reflect can help you gain clarity and insight.',
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
 * Mobile with processing prompt.
 */
export const MobileProcessing: Story = {
  args: {
    proposedPrompt: MOCK_PROMPT_PROCESSING,
    message: "Sometimes writing helps us process what we're feeling.",
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
// Interactive Test Stories
// =============================================================================

/**
 * Test: Start button confirms with proposed prompt.
 */
export const TestStartButton: Story = {
  args: {
    proposedPrompt: MOCK_PROMPT_REFLECTION,
    message: 'Would you like to journal?',
    onConfirm: fn(),
    onDecline: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find and click start button
    const startButton = canvas.getByRole('button', { name: /start writing/i });
    await expect(startButton).toBeInTheDocument();
    await userEvent.click(startButton);

    // Verify callback was called with the proposed prompt
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
    await expect(args.onConfirm).toHaveBeenCalledWith(MOCK_PROMPT_REFLECTION);
  },
};

/**
 * Test: Decline button calls onDecline.
 */
export const TestDeclineButton: Story = {
  args: {
    proposedPrompt: MOCK_PROMPT_REFLECTION,
    message: 'Would you like to journal?',
    onConfirm: fn(),
    onDecline: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find and click decline button
    const declineButton = canvas.getByRole('button', { name: /maybe later/i });
    await expect(declineButton).toBeInTheDocument();
    await userEvent.click(declineButton);

    // Verify callback was called
    await expect(args.onDecline).toHaveBeenCalledTimes(1);
  },
};

/**
 * Test: Dropdown opens and shows categories.
 */
export const TestDropdownOpens: Story = {
  args: {
    proposedPrompt: MOCK_PROMPT_REFLECTION,
    message: 'Would you like to journal?',
    onConfirm: fn(),
    onDecline: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and click dropdown button
    const dropdownButton = canvas.getByRole('button', { name: /try different/i });
    await expect(dropdownButton).toBeInTheDocument();
    await expect(dropdownButton).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(dropdownButton);

    // Dropdown should be expanded
    await expect(dropdownButton).toHaveAttribute('aria-expanded', 'true');

    // Should show category headers
    const gratitudeCategory = canvas.getByText(/gratitude/i);
    await expect(gratitudeCategory).toBeInTheDocument();
  },
};

/**
 * Test: Category badge displays correctly.
 */
export const TestCategoryBadge: Story = {
  args: {
    proposedPrompt: MOCK_PROMPT_GRATITUDE,
    message: 'Practice gratitude today.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Category badge should show emoji and label
    const badge = canvas.getByText(/🙏/);
    await expect(badge).toBeInTheDocument();
  },
};

/**
 * Test: Time estimate is displayed.
 */
export const TestTimeEstimate: Story = {
  args: {
    proposedPrompt: MOCK_PROMPT_REFLECTION,
    message: 'Would you like to journal?',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Time estimate should be visible
    const timeEstimate = canvas.getByText(
      new RegExp(`~${String(args.proposedPrompt.estimated_time_minutes)} min`)
    );
    await expect(timeEstimate).toBeInTheDocument();
  },
};

// =============================================================================
// All Categories Showcase
// =============================================================================

/**
 * Showcases all category confirmations.
 */
export const AllCategories: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '420px' }}>
      {[
        MOCK_PROMPT_REFLECTION,
        MOCK_PROMPT_GRATITUDE,
        MOCK_PROMPT_PROCESSING,
        MOCK_PROMPT_GROWTH,
        MOCK_PROMPT_SELF_COMPASSION,
      ].map((prompt) => (
        <div key={prompt.id}>
          <JournalingConfirmation
            proposedPrompt={prompt}
            message={`Would you like to try ${prompt.category} journaling?`}
            availablePrompts={MOCK_ALL_PROMPTS}
            onConfirm={fn()}
            onDecline={fn()}
          />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All five category confirmations displayed together for visual comparison.',
      },
    },
  },
};
