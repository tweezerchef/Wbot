/**
 * ChatInputArea Component
 *
 * Input field and send button for the chat interface.
 * Fixed at the bottom of the chat area.
 */

import type { RefObject, KeyboardEvent } from 'react';

import styles from './ChatInputArea.module.css';

import { SendIcon } from '@/components/ui/icons';

export interface ChatInputAreaProps {
  /** Reference to the input element for focus management */
  inputRef: RefObject<HTMLInputElement | null>;
  /** Current value of the input field */
  value: string;
  /** Handler called when the input value changes */
  onChange: (value: string) => void;
  /** Handler called when the form is submitted */
  onSubmit: () => void;
  /** Whether the input is disabled */
  disabled: boolean;
  /** Placeholder text for the input field */
  placeholder?: string;
}

/**
 * Chat input area with text field and send button.
 */
export function ChatInputArea({
  inputRef,
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = 'Type a message...',
}: ChatInputAreaProps) {
  /**
   * Handle Enter key to send message.
   * Shift+Enter allows for future textarea support (newlines).
   */
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={styles.inputArea}>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Message input"
      />
      <button
        className={styles.sendButton}
        onClick={onSubmit}
        disabled={!value.trim() || disabled}
        aria-label="Send message"
      >
        <SendIcon />
      </button>
    </div>
  );
}
