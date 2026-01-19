/**
 * useChatInput Hook
 *
 * Manages the chat input field state and focus management.
 */

import { useState, useRef, useCallback, type RefObject, type KeyboardEvent } from 'react';

export interface UseChatInputReturn {
  /** Current value of the input field */
  inputValue: string;
  /** Reference to the input element for focus management */
  inputRef: RefObject<HTMLInputElement | null>;
  /** Sets the input value */
  setInputValue: (value: string) => void;
  /** Clears the input field */
  clearInput: () => void;
  /** Focuses the input field */
  focusInput: () => void;
  /** Keyboard handler for Enter key submission */
  handleKeyDown: (e: KeyboardEvent, onSubmit: () => void) => void;
}

/**
 * Custom hook for managing chat input state and behavior.
 *
 * @returns Input state, ref, and control functions
 */
export function useChatInput(): UseChatInputReturn {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const clearInput = useCallback(() => {
    setInputValue('');
  }, []);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Handle Enter key to send message.
   * Shift+Enter allows for future textarea support (newlines).
   */
  const handleKeyDown = useCallback((e: KeyboardEvent, onSubmit: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }, []);

  return {
    inputValue,
    inputRef,
    setInputValue,
    clearInput,
    focusInput,
    handleKeyDown,
  };
}
