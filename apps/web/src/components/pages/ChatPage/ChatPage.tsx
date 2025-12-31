/* ============================================================================
   Chat Page - Full-Screen Chatbot Interface
   ============================================================================
   This is the main interface of the application.

   Architecture:
   - Full-screen chat experience (mobile and desktop)
   - Messages stream from LangGraph in real-time
   - Interactive activities (breathing, meditation, journal) render INLINE
     within the chat, triggered by the AI during conversation
   - The AI decides when to show activities based on conversation context

   Components:
   - Message list (scrollable, auto-scrolls to bottom)
   - Message input (fixed at bottom)
   - Activity components render within message bubbles

   State management:
   - Messages stored in component state
   - Persisted to Supabase via the AI backend
   - Conversation history loaded on mount
   ============================================================================ */

import React, { useState, useRef, useEffect, useCallback } from 'react';

import { createAIClient, type StreamEvent, type Message } from '../../../lib/ai-client';

import styles from './ChatPage.module.css';

/* ----------------------------------------------------------------------------
   Chat Page Component
   ---------------------------------------------------------------------------- */

/**
 * Full-screen chat interface.
 *
 * Layout:
 * - Header with minimal branding
 * - Scrollable message area (flex-grow)
 * - Fixed input area at bottom
 *
 * The chat fills the entire viewport for an immersive experience.
 */
export function ChatPage() {
  // Message state - array of messages in the conversation
  const [messages, setMessages] = useState<Message[]>([]);

  // Current message being streamed from AI (partial content)
  const [streamingContent, setStreamingContent] = useState<string>('');

  // Whether we're currently waiting for/receiving AI response
  const [isLoading, setIsLoading] = useState(false);

  // Input field value
  const [inputValue, setInputValue] = useState('');

  // Reference to the message container for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reference to the input field for focus management
  const inputRef = useRef<HTMLInputElement>(null);

  /* --------------------------------------------------------------------------
     Auto-scroll to bottom when new messages arrive
     -------------------------------------------------------------------------- */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Scroll when messages change or streaming content updates
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  /* --------------------------------------------------------------------------
     Send Message Handler
     -------------------------------------------------------------------------- */
  const handleSendMessage = async () => {
    // Don't send empty messages
    const messageText = inputValue.trim();
    if (!messageText || isLoading) {
      return;
    }

    // Clear input immediately for better UX
    setInputValue('');

    // Add user message to the list
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Start loading state
    setIsLoading(true);
    setStreamingContent('');

    try {
      // TODO: Get actual auth token from Supabase session
      // For now, using a placeholder token for development
      const authToken = 'dev-token';

      // TODO: Get or create conversation ID from Supabase
      // For now, using a placeholder conversation ID
      const conversationId = 'dev-conversation';

      // Create AI client and stream the response
      const client = createAIClient(authToken);
      let fullResponse = '';

      // Stream the AI response
      for await (const event of client.streamMessage(messageText, conversationId) as AsyncGenerator<StreamEvent>) {
        switch (event.type) {
          case 'token':
            // Append token to streaming content
            fullResponse += event.content;
            setStreamingContent(fullResponse);
            break;

          case 'done': {
            // Streaming complete - add full message to list
            const assistantMessage: Message = {
              id: event.messageId || `assistant-${Date.now()}`,
              role: 'assistant',
              content: fullResponse,
              createdAt: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setStreamingContent('');
            break;
          }

          case 'error': {
            // Handle error - show in chat
            console.error('Stream error:', event.error);
            const errorMessage: Message = {
              id: `error-${Date.now()}`,
              role: 'system',
              content: `Sorry, something went wrong: ${event.error}`,
              createdAt: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            setStreamingContent('');
            break;
          }
        }
      }
    } catch (error) {
      // Handle unexpected errors
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'Sorry, I couldn\'t connect to the server. Please try again.',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Refocus input for convenience
      inputRef.current?.focus();
    }
  };

  /* --------------------------------------------------------------------------
     Handle Enter key to send message
     -------------------------------------------------------------------------- */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Enter (without Shift for newlines in future textarea)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /* --------------------------------------------------------------------------
     Render
     -------------------------------------------------------------------------- */
  return (
    <div className={styles.container}>
      {/* Minimal header - just branding */}
      <header className={styles.header}>
        <h1 className={styles.logo}>TBot</h1>
      </header>

      {/* Message list - scrollable area */}
      <div className={styles.messages}>
        {/* Welcome message when empty */}
        {messages.length === 0 && !streamingContent && (
          <div className={styles.welcome}>
            <p className={styles.welcomeText}>
              Hello! I'm here to support you. Feel free to share what's on your mind,
              and we can explore breathing exercises, meditation, or journaling together.
            </p>
          </div>
        )}

        {/* Render each message */}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Show streaming content as it arrives */}
        {streamingContent && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              createdAt: new Date(),
            }}
            isStreaming
          />
        )}

        {/* Loading indicator when waiting for first token */}
        {isLoading && !streamingContent && (
          <div className={styles.loadingIndicator}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - fixed at bottom */}
      <div className={styles.inputArea}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-label="Message input"
        />
        <button
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          aria-label="Send message"
        >
          {/* Simple arrow icon */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Message Bubble Component
   ---------------------------------------------------------------------------- */

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

/**
 * Renders a single message bubble.
 *
 * Styles differ based on role:
 * - user: Right-aligned, primary color background
 * - assistant: Left-aligned, neutral background
 * - system: Centered, muted styling
 *
 * Future: This component will also render inline activities
 * (breathing, meditation, journal) when the AI triggers them.
 */
function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  // Determine CSS classes based on role
  const bubbleClass = [
    styles.bubble,
    message.role === 'user' && styles.bubbleUser,
    message.role === 'assistant' && styles.bubbleAssistant,
    message.role === 'system' && styles.bubbleSystem,
    isStreaming && styles.bubbleStreaming,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`${styles.messageRow} ${message.role === 'user' ? styles.messageRowUser : ''}`}>
      <div className={bubbleClass}>
        {/* Message content */}
        <p className={styles.messageContent}>{message.content}</p>

        {/* Streaming cursor */}
        {isStreaming && <span className={styles.cursor}>|</span>}
      </div>
    </div>
  );
}

