/**
 * ChatInputArea Stories
 *
 * Text input and send button for the chat interface.
 * Primary user interaction point for sending messages.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { ChatInputArea } from '@/features/chat/components/ChatInputArea/ChatInputArea';

/**
 * ChatInputArea provides the text input and send button for the chat interface.
 * Handles Enter key submission and disabled states during streaming or HITL.
 */
const meta: Meta<typeof ChatInputArea> = {
  title: 'Components/Chat/ChatInputArea',
  component: ChatInputArea,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Input area with text field and send button. Supports keyboard submission (Enter) and disabled states.',
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
    disabled: {
      control: 'boolean',
      description: 'Disables input during streaming or HITL prompts',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when input is empty',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatInputArea>;

// =============================================================================
// Wrapper Component for Stateful Stories
// =============================================================================

interface ChatInputWrapperProps {
  initialValue?: string;
  disabled?: boolean;
  placeholder?: string;
  onSubmit?: () => void;
}

function ChatInputWrapper({
  initialValue = '',
  disabled = false,
  placeholder,
  onSubmit = fn(),
}: ChatInputWrapperProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialValue);

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit();
      setValue('');
    }
  };

  return (
    <ChatInputArea
      inputRef={inputRef}
      value={value}
      onChange={setValue}
      onSubmit={handleSubmit}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}

// Type for wrapper stories
type WrapperStory = StoryObj<ChatInputWrapperProps>;

// =============================================================================
// Basic States
// =============================================================================

/**
 * Default empty state - ready for user input.
 */
export const Default: WrapperStory = {
  render: (args) => <ChatInputWrapper {...args} />,
  args: {
    disabled: false,
    placeholder: 'Type a message...',
  },
};

/**
 * Input with text entered - send button should be enabled.
 */
export const WithText: WrapperStory = {
  render: (args) => <ChatInputWrapper {...args} />,
  args: {
    initialValue: 'Hello, how are you?',
    disabled: false,
  },
};

/**
 * Disabled state - used during streaming or HITL prompts.
 */
export const Disabled: WrapperStory = {
  render: (args) => <ChatInputWrapper {...args} />,
  args: {
    initialValue: '',
    disabled: true,
    placeholder: 'Waiting for response...',
  },
};

/**
 * Disabled with text - shows that existing text is preserved.
 */
export const DisabledWithText: WrapperStory = {
  render: (args) => <ChatInputWrapper {...args} />,
  args: {
    initialValue: 'My message in progress',
    disabled: true,
  },
};

/**
 * Custom placeholder text.
 */
export const CustomPlaceholder: WrapperStory = {
  render: (args) => <ChatInputWrapper {...args} />,
  args: {
    initialValue: '',
    disabled: false,
    placeholder: 'Share how you are feeling...',
  },
};

/**
 * Long text input - tests horizontal overflow behavior.
 */
export const LongText: WrapperStory = {
  render: (args) => <ChatInputWrapper {...args} />,
  args: {
    initialValue:
      'This is a very long message that might overflow the input field to test how the component handles long text content that extends beyond the visible area.',
    disabled: false,
  },
};

// =============================================================================
// Mobile View
// =============================================================================

/**
 * Mobile viewport - input should be full width.
 */
export const Mobile: WrapperStory = {
  render: (args) => <ChatInputWrapper {...args} />,
  args: {
    initialValue: '',
    disabled: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '0 8px' }}>
        <Story />
      </div>
    ),
  ],
};

// =============================================================================
// Interactive Test Stories
// =============================================================================

/**
 * Test: Type and submit with button click.
 */
export const TestButtonSubmit: Story = {
  render: () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
      if (value.trim()) {
        setSubmitted(true);
        setValue('');
      }
    };

    return (
      <div>
        <ChatInputArea
          inputRef={inputRef}
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          disabled={false}
          placeholder="Type a message..."
        />
        {submitted && (
          <p data-testid="success-message" style={{ marginTop: '8px', color: 'green' }}>
            Message sent!
          </p>
        )}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the input
    const input = canvas.getByRole('textbox', { name: /message input/i });
    await expect(input).toBeInTheDocument();

    // Type a message
    await userEvent.type(input, 'Hello world');
    await expect(input).toHaveValue('Hello world');

    // Find and click send button
    const sendButton = canvas.getByRole('button', { name: /send message/i });
    await expect(sendButton).toBeEnabled();
    await userEvent.click(sendButton);

    // Input should be cleared
    await expect(input).toHaveValue('');

    // Success message should appear
    const successMessage = canvas.getByTestId('success-message');
    await expect(successMessage).toBeInTheDocument();
  },
};

/**
 * Test: Submit with Enter key.
 */
export const TestKeyboardSubmit: Story = {
  render: () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
      if (value.trim()) {
        setSubmitted(true);
        setValue('');
      }
    };

    return (
      <div>
        <ChatInputArea
          inputRef={inputRef}
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          disabled={false}
        />
        {submitted && (
          <p data-testid="success-message" style={{ marginTop: '8px', color: 'green' }}>
            Message sent via Enter!
          </p>
        )}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the input
    const input = canvas.getByRole('textbox', { name: /message input/i });

    // Type and press Enter
    await userEvent.type(input, 'Test message{Enter}');

    // Input should be cleared
    await expect(input).toHaveValue('');

    // Success message should appear
    const successMessage = canvas.getByTestId('success-message');
    await expect(successMessage).toBeInTheDocument();
  },
};

/**
 * Test: Send button disabled when empty.
 */
export const TestSendButtonDisabled: Story = {
  render: () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState('');

    return (
      <ChatInputArea
        inputRef={inputRef}
        value={value}
        onChange={setValue}
        onSubmit={fn()}
        disabled={false}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Send button should be disabled when empty
    const sendButton = canvas.getByRole('button', { name: /send message/i });
    await expect(sendButton).toBeDisabled();

    // Type something
    const input = canvas.getByRole('textbox', { name: /message input/i });
    await userEvent.type(input, 'Hi');

    // Now button should be enabled
    await expect(sendButton).toBeEnabled();

    // Clear the input
    await userEvent.clear(input);

    // Button should be disabled again
    await expect(sendButton).toBeDisabled();
  },
};

/**
 * Test: Accessibility labels.
 */
export const TestAccessibility: Story = {
  render: () => <ChatInputWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Input should have accessible label
    const input = canvas.getByRole('textbox', { name: /message input/i });
    await expect(input).toBeInTheDocument();

    // Send button should have accessible label
    const sendButton = canvas.getByRole('button', { name: /send message/i });
    await expect(sendButton).toBeInTheDocument();
  },
};
