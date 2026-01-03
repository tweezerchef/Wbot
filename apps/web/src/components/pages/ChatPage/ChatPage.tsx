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

import { getRouteApi, useNavigate } from '@tanstack/react-router';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

import {
  createAIClient,
  type Message,
  type BreathingConfirmationPayload,
} from '../../../lib/ai-client';
import { createConversation, loadMessages, touchConversation } from '../../../lib/conversations';
import { parseActivityContent } from '../../../lib/parseActivity';
import { supabase } from '../../../lib/supabase';
import { BreathingConfirmation } from '../../BreathingConfirmation';
import { BreathingExercise, type BreathingTechnique } from '../../BreathingExercise';
import {
  MenuIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  NewChatIcon,
  LogoutIcon,
} from '../../buttons';
import { ConversationHistory } from '../../ConversationHistory';

import styles from './ChatPage.module.css';

/* ----------------------------------------------------------------------------
   Route API for accessing loader data
   ---------------------------------------------------------------------------- */
const routeApi = getRouteApi('/chat');

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
  // Get initial data from route loader (most recent conversation)
  const loaderData = routeApi.useLoaderData();

  // Navigation for redirects (e.g., after logout)
  const navigate = useNavigate();

  // Message state - initialized from loader data
  const [messages, setMessages] = useState<Message[]>(loaderData.messages);

  // Current message being streamed from AI (partial content)
  const [streamingContent, setStreamingContent] = useState<string>('');

  // Whether we're currently waiting for/receiving AI response
  const [isLoading, setIsLoading] = useState(false);

  // Input field value
  const [inputValue, setInputValue] = useState('');

  // Current conversation ID - initialized from loader data
  const [conversationId, setConversationId] = useState<string | null>(loaderData.conversationId);

  // Sidebar open/closed state
  // Default: closed on mobile, open on desktop (768px+)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });

  // Interrupt data for HITL (Human-in-the-Loop) confirmation dialogs
  // When the AI suggests an activity, it pauses for user confirmation
  const [interruptData, setInterruptData] = useState<BreathingConfirmationPayload | null>(null);

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
      id: `user-${String(Date.now())}`,
      role: 'user',
      content: messageText,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Start loading state
    setIsLoading(true);
    setStreamingContent('');

    try {
      // Get the current session from Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // User is not authenticated, show error
        const errorMessage: Message = {
          id: `error-${String(Date.now())}`,
          role: 'system',
          content: 'Please sign in to continue.',
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      // Use the Supabase access token for LangGraph authentication
      const authToken = session.access_token;

      // Get or create conversation ID (lazy creation on first message)
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        currentConversationId = await createConversation(session.user.id);
        setConversationId(currentConversationId);
      }

      // Create AI client and stream the response
      const client = createAIClient(authToken);
      let fullResponse = '';

      // Stream the AI response
      for await (const event of client.streamMessage(messageText, currentConversationId)) {
        switch (event.type) {
          case 'token':
            // Update streaming content with full response (not appending)
            // LangGraph sends accumulated content, not deltas
            fullResponse = event.content;
            setStreamingContent(fullResponse);
            break;

          case 'done': {
            // Streaming complete - add full message to list
            const assistantMessage: Message = {
              id: event.messageId ?? `assistant-${String(Date.now())}`,
              role: 'assistant',
              content: fullResponse,
              createdAt: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setStreamingContent('');

            // Update conversation timestamp for "most recent" ordering
            if (currentConversationId) {
              void touchConversation(currentConversationId);
            }
            break;
          }

          case 'error': {
            // Handle error - show in chat
            console.error('Stream error:', event.error);
            const errorMessage: Message = {
              id: `error-${String(Date.now())}`,
              role: 'system',
              content: `Sorry, something went wrong: ${event.error}`,
              createdAt: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            setStreamingContent('');
            break;
          }

          case 'interrupt': {
            // Graph paused for user confirmation (HITL pattern)
            // Show the confirmation UI and wait for user decision
            setInterruptData(event.payload);
            setStreamingContent('');
            setIsLoading(false);
            // Don't refocus input - user should interact with the confirmation
            return; // Exit the loop, handleBreathingConfirm will resume
          }
        }
      }
    } catch (error) {
      // Handle unexpected errors
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: `error-${String(Date.now())}`,
        role: 'system',
        content: "Sorry, I couldn't connect to the server. Please try again.",
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
      void handleSendMessage();
    }
  };

  /* --------------------------------------------------------------------------
     Handle Breathing Exercise Confirmation (HITL resume)
     -------------------------------------------------------------------------- */
  const handleBreathingConfirm = useCallback(
    async (decision: 'start' | 'change_technique' | 'not_now', techniqueId?: string) => {
      // Clear the interrupt UI
      setInterruptData(null);
      setIsLoading(true);
      setStreamingContent('');

      try {
        // Get session for auth
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session || !conversationId) {
          console.error('No session or conversation ID');
          setIsLoading(false);
          return;
        }

        // Resume the graph with user's decision
        const client = createAIClient(session.access_token);
        let fullResponse = '';

        for await (const event of client.resumeInterrupt(
          { decision, technique_id: techniqueId },
          conversationId
        )) {
          switch (event.type) {
            case 'token':
              fullResponse = event.content;
              setStreamingContent(fullResponse);
              break;

            case 'done': {
              // Add the activity message to the list
              const assistantMessage: Message = {
                id: `assistant-${String(Date.now())}`,
                role: 'assistant',
                content: fullResponse,
                createdAt: new Date(),
              };
              setMessages((prev) => [...prev, assistantMessage]);
              setStreamingContent('');

              // Touch conversation for ordering
              void touchConversation(conversationId);
              break;
            }

            case 'error': {
              console.error('Resume stream error:', event.error);
              const errorMessage: Message = {
                id: `error-${String(Date.now())}`,
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
        console.error('Failed to resume graph:', error);
        const errorMessage: Message = {
          id: `error-${String(Date.now())}`,
          role: 'system',
          content: "Sorry, I couldn't continue. Please try again.",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [conversationId]
  );

  /* --------------------------------------------------------------------------
     Sidebar Handlers
     -------------------------------------------------------------------------- */

  /**
   * Handle logout - signs user out via Supabase.
   * Navigation will be handled by auth state change in the router.
   */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Redirect to home page after successful logout
      void navigate({ to: '/' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  /**
   * Handle new conversation - clears current messages and resets state.
   * Closes sidebar on mobile for better UX.
   */
  const handleNewConversation = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return;
      }

      // Create a new conversation in the database
      const newId = await createConversation(session.user.id);
      setConversationId(newId);

      // Clear local state
      setMessages([]);
      setStreamingContent('');
      setInputValue('');

      // Close sidebar on mobile (but keep open on desktop)
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }

      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  };

  /**
   * Handle switching to a different conversation.
   * Loads the conversation's messages and updates state.
   */
  const handleSelectConversation = async (selectedConversationId: string) => {
    // Don't reload if already viewing this conversation
    if (selectedConversationId === conversationId) {
      return;
    }

    try {
      setIsLoading(true);

      // Load messages for the selected conversation
      const loadedMessages = await loadMessages(selectedConversationId);

      // Update state
      setConversationId(selectedConversationId);
      setMessages(loadedMessages);
      setStreamingContent('');
      setInputValue('');

      // Close sidebar on mobile
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }

      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /* --------------------------------------------------------------------------
     Escape Key Handler - closes sidebar
     -------------------------------------------------------------------------- */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isSidebarOpen]);

  /* --------------------------------------------------------------------------
     Render
     -------------------------------------------------------------------------- */
  return (
    <div className={styles.container}>
      {/* Overlay - closes sidebar when clicked (mobile only) */}
      {isSidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => {
            setIsSidebarOpen(false);
          }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        {/* Collapse button - desktop only */}
        <button
          className={styles.collapseButton}
          onClick={() => {
            setIsSidebarOpen(false);
          }}
          aria-label="Collapse sidebar"
        >
          <ChevronLeftIcon />
        </button>

        {/* Navigation buttons */}
        <nav className={styles.sidebarNav}>
          <button className={styles.sidebarButton} onClick={() => void handleNewConversation()}>
            <NewChatIcon />
            <span>New Conversation</span>
          </button>

          {/* Conversation History */}
          <ConversationHistory
            currentConversationId={conversationId}
            onSelectConversation={(id) => void handleSelectConversation(id)}
            onCloseSidebar={() => {
              setIsSidebarOpen(false);
            }}
          />
        </nav>

        {/* Footer with logout */}
        <div className={styles.sidebarFooter}>
          <button className={styles.sidebarButton} onClick={() => void handleLogout()}>
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main chat area */}
      <div className={styles.chatMain}>
        {/* Header with menu toggle */}
        <header className={styles.header}>
          {/* Mobile: hamburger menu toggle */}
          <button
            className={styles.menuButton}
            onClick={() => {
              setIsSidebarOpen(!isSidebarOpen);
            }}
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isSidebarOpen}
          >
            {isSidebarOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          {/* Desktop: expand button (only when sidebar is collapsed) */}
          {!isSidebarOpen && (
            <button
              className={styles.expandButton}
              onClick={() => {
                setIsSidebarOpen(true);
              }}
              aria-label="Expand sidebar"
            >
              <ChevronRightIcon />
            </button>
          )}

          <h1 className={styles.logo}>Wbot</h1>
        </header>

        {/* Message list - scrollable area */}
        <div className={styles.messages}>
          {/* Welcome message when empty */}
          {messages.length === 0 && !streamingContent && (
            <div className={styles.welcome}>
              <p className={styles.welcomeText}>
                Hello! I'm here to support you. Feel free to share what's on your mind, and we can
                explore breathing exercises, meditation, or journaling together.
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

          {/* Breathing exercise confirmation (HITL interrupt) */}
          {interruptData && (
            <div className={styles.messageRow}>
              <div
                className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.bubbleActivity}`}
              >
                <BreathingConfirmation
                  proposedTechnique={interruptData.proposed_technique}
                  message={interruptData.message}
                  availableTechniques={interruptData.available_techniques}
                  onConfirm={(decision, techniqueId) => {
                    void handleBreathingConfirm(decision, techniqueId);
                  }}
                />
              </div>
            </div>
          )}

          {/* Loading indicator when waiting for first token */}
          {isLoading && !streamingContent && !interruptData && (
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
            placeholder={
              interruptData ? 'Please respond to the prompt above...' : 'Type a message...'
            }
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading || !!interruptData}
            aria-label="Message input"
          />
          <button
            className={styles.sendButton}
            onClick={() => {
              void handleSendMessage();
            }}
            disabled={!inputValue.trim() || isLoading || !!interruptData}
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
      {/* End chatMain */}
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
 * For assistant messages, parses content for embedded activities
 * (breathing exercises) and renders interactive components inline.
 */
function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  // Parse message content for embedded activities (only for assistant messages)
  const parsedContent = useMemo(() => {
    if (message.role !== 'assistant') {
      return null;
    }
    return parseActivityContent(message.content);
  }, [message.content, message.role]);

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

  // Handle exercise completion
  const handleExerciseComplete = useCallback(() => {
    // TODO: Notify the AI that the exercise completed for follow-up message
  }, []);

  // Render breathing exercise inline if detected
  if (parsedContent?.hasActivity && parsedContent.activity?.activity === 'breathing') {
    const activity = parsedContent.activity;
    // Convert the parsed technique to the expected format
    const technique: BreathingTechnique = {
      id: activity.technique.id,
      name: activity.technique.name,
      durations: activity.technique.durations,
      description: activity.technique.description,
      cycles: activity.technique.cycles,
    };

    return (
      <div className={styles.messageRow}>
        <div className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.bubbleActivity}`}>
          {/* Render breathing exercise component */}
          <BreathingExercise
            technique={technique}
            introduction={activity.introduction}
            onComplete={handleExerciseComplete}
          />
        </div>
      </div>
    );
  }

  // Standard text message rendering
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
