/**
 * MessageBubble Stories
 *
 * Core chat UI component that renders all message types:
 * - User messages (right-aligned, primary color)
 * - Assistant messages (left-aligned, neutral)
 * - System messages (centered, muted)
 * - Streaming messages (with cursor animation)
 * - Inline activity components (breathing, meditation, journaling)
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  MOCK_USER_MESSAGE,
  MOCK_ASSISTANT_MESSAGE,
  MOCK_SYSTEM_MESSAGE,
  MOCK_LONG_MESSAGE,
  MOCK_STREAMING_MESSAGE,
  MOCK_BREATHING_ACTIVITY_CONTENT,
  createMockMessage,
} from '../mocks';

import { MessageBubble } from '@/features/chat/components/MessageBubble/MessageBubble';

/**
 * MessageBubble renders individual chat messages with support for
 * user, assistant, and system message styling, streaming cursor animation,
 * and inline activity components.
 */
const meta: Meta<typeof MessageBubble> = {
  title: 'Components/Chat/MessageBubble',
  component: MessageBubble,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Core chat message component. Renders text messages and inline activities. Supports user (right-aligned), assistant (left-aligned), and system (centered) roles.',
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
  argTypes: {
    isStreaming: {
      control: 'boolean',
      description: 'Whether to show the streaming cursor animation',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MessageBubble>;

// =============================================================================
// Basic Message Stories
// =============================================================================

/**
 * Standard user message - right-aligned with primary color background.
 */
export const UserMessage: Story = {
  args: {
    message: MOCK_USER_MESSAGE,
    isStreaming: false,
  },
};

/**
 * Standard assistant message - left-aligned with neutral background.
 */
export const AssistantMessage: Story = {
  args: {
    message: MOCK_ASSISTANT_MESSAGE,
    isStreaming: false,
  },
};

/**
 * System message - centered with muted styling.
 * Used for notifications like session start, errors, etc.
 */
export const SystemMessage: Story = {
  args: {
    message: MOCK_SYSTEM_MESSAGE,
    isStreaming: false,
  },
};

// =============================================================================
// Streaming Message Stories
// =============================================================================

/**
 * Streaming assistant message with blinking cursor animation.
 * Shows the typing indicator while AI is generating a response.
 */
export const StreamingMessage: Story = {
  args: {
    message: MOCK_STREAMING_MESSAGE,
    isStreaming: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays a blinking cursor at the end of the message to indicate streaming.',
      },
    },
  },
};

/**
 * Streaming message with empty content - shows just the cursor.
 */
export const StreamingEmpty: Story = {
  args: {
    message: {
      id: 'streaming-empty',
      role: 'assistant',
      content: '',
      createdAt: new Date(),
    },
    isStreaming: true,
  },
};

// =============================================================================
// Long Message Stories
// =============================================================================

/**
 * Long multi-paragraph assistant message.
 * Tests text wrapping and markdown-like formatting.
 */
export const LongMessage: Story = {
  args: {
    message: MOCK_LONG_MESSAGE,
    isStreaming: false,
  },
};

/**
 * Short user message - single line.
 */
export const ShortMessage: Story = {
  args: {
    message: {
      id: 'short-1',
      role: 'user',
      content: 'Yes',
      createdAt: new Date(),
    },
    isStreaming: false,
  },
};

// =============================================================================
// Activity Message Stories (Historical)
// =============================================================================

/**
 * Historical breathing exercise message.
 * When viewing past conversations, completed activities display as summaries.
 */
export const CompletedBreathingActivity: Story = {
  args: {
    message: createMockMessage('assistant', MOCK_BREATHING_ACTIVITY_CONTENT),
    isStreaming: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows a completed breathing exercise summary with checkmark icon. This is how activities appear when viewing conversation history.',
      },
    },
  },
};

// =============================================================================
// Multiple Messages Showcase
// =============================================================================

/**
 * Showcases multiple message types in a conversation flow.
 */
export const ConversationFlow: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <MessageBubble message={MOCK_SYSTEM_MESSAGE} />
      <MessageBubble
        message={{
          id: 'assistant-welcome',
          role: 'assistant',
          content: "Hello! I'm Wbot, your wellness companion. How are you feeling today?",
          createdAt: new Date(),
        }}
      />
      <MessageBubble message={MOCK_USER_MESSAGE} />
      <MessageBubble message={MOCK_ASSISTANT_MESSAGE} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows a typical conversation flow with system message, assistant greeting, user message, and assistant response.',
      },
    },
  },
};

// =============================================================================
// Mobile View Stories
// =============================================================================

/**
 * Mobile viewport - messages should take full width.
 */
export const MobileView: Story = {
  args: {
    message: MOCK_ASSISTANT_MESSAGE,
    isStreaming: false,
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
 * Mobile conversation flow.
 */
export const MobileConversation: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px' }}>
      <MessageBubble
        message={{
          id: 'a-1',
          role: 'assistant',
          content: 'How are you feeling today?',
          createdAt: new Date(),
        }}
      />
      <MessageBubble
        message={{
          id: 'u-1',
          role: 'user',
          content: "I've been feeling anxious about work.",
          createdAt: new Date(),
        }}
      />
      <MessageBubble message={MOCK_ASSISTANT_MESSAGE} />
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
