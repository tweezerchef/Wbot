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

import { useQueryClient } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

import { ChatEmptyState } from '../ChatEmptyState';
import { ConversationHistory } from '../ConversationHistory';

import styles from './ChatPage.module.css';

import { ActivityOverlay } from '@/components/overlays';
import {
  MenuIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  NewChatIcon,
  LogoutIcon,
} from '@/components/ui/icons';
import {
  BreathingConfirmation,
  WimHofExercise,
  ImmersiveBreathing,
  ImmersiveBreathingConfirmation,
} from '@/features/breathing';
import type { BreathingTechnique, BreathingStats } from '@/features/breathing';
import { ProgressWidget } from '@/features/gamification';
import {
  JournalingExercise,
  JournalingConfirmation,
  JournalHistory,
  CATEGORY_INFO,
  type JournalEntry,
} from '@/features/journaling';
import {
  AIGeneratedMeditation,
  GuidedMeditation,
  VoiceSelectionConfirmation,
} from '@/features/meditation';
import { DiscoverNav, ActivityRenderer, type DirectComponent } from '@/features/navigation';
import { ThemeToggle } from '@/features/settings';
import { SidebarProfile } from '@/features/user';
import {
  createAIClient,
  isBreathingConfirmation,
  isJournalingConfirmation,
  isVoiceSelection,
  type Message,
  type InterruptPayload,
} from '@/lib/ai-client';
import { createConversation, loadMessages, touchConversation } from '@/lib/conversations';
import { parseActivityContent } from '@/lib/parseActivity';
import { conversationKeys } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

/* ----------------------------------------------------------------------------
   Route API for accessing loader data
   ---------------------------------------------------------------------------- */
// Note: Route ID is '/_authed/chat' (pathless layout + route name)
const routeApi = getRouteApi('/_authed/chat');

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

  // Query client for cache invalidation after direct Supabase operations
  const queryClient = useQueryClient();

  // Keep conversation list/detail cache in sync with manual updates
  const invalidateConversationCache = useCallback(
    (userId: string, conversationId?: string) => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list(userId) });
      if (conversationId) {
        void queryClient.invalidateQueries({ queryKey: conversationKeys.detail(conversationId) });
      }
    },
    [queryClient]
  );

  const createConversationForUser = useCallback(
    async (userId: string) => {
      const newConversationId = await createConversation(userId);
      invalidateConversationCache(userId, newConversationId);
      return newConversationId;
    },
    [invalidateConversationCache]
  );

  const touchConversationForUser = useCallback(
    async (currentConversationId: string, userId: string) => {
      await touchConversation(currentConversationId);
      invalidateConversationCache(userId, currentConversationId);
    },
    [invalidateConversationCache]
  );

  /* --------------------------------------------------------------------------
     Sync state with loader data when route is revisited
     --------------------------------------------------------------------------
     TanStack Router pattern: loader re-runs on navigation, but useState only
     uses initial value on first render. This effect syncs state when loader
     data changes (e.g., navigating away and back to the chat page).
     -------------------------------------------------------------------------- */
  useEffect(() => {
    setMessages(loaderData.messages);
    setConversationId(loaderData.conversationId);
  }, [loaderData.messages, loaderData.conversationId]);

  // Sidebar state - open by default (matches desktop CSS)
  // On mobile, we close it after hydration via useEffect
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Close sidebar on mobile after hydration (768px breakpoint matches CSS)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Interrupt data for HITL (Human-in-the-Loop) confirmation dialogs
  // When the AI suggests an activity, it pauses for user confirmation
  // InterruptPayload is a union type supporting multiple confirmation types:
  // - breathing_confirmation: for breathing exercises
  // - voice_selection: for AI-generated meditation voice selection
  const [interruptData, setInterruptData] = useState<InterruptPayload | null>(null);

  // Active activity state for immersive overlay
  // Phases: confirming -> active -> completing -> null
  type ActivityState =
    | {
        phase: 'confirming';
        type: 'breathing';
        data: {
          proposedTechnique: BreathingTechnique;
          message: string;
          availableTechniques: BreathingTechnique[];
        };
      }
    | {
        phase: 'active';
        type: 'breathing';
        data: {
          technique: BreathingTechnique;
          introduction?: string;
        };
      }
    | null;

  const [activeActivity, setActiveActivity] = useState<ActivityState>(null);

  // Direct activity state - for sidebar navigation (will integrate with backend)
  const [directActivity, setDirectActivity] = useState<DirectComponent | null>(null);

  // Selected journal entry for viewing
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<JournalEntry | null>(null);

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
        const newConversationId = await createConversationForUser(session.user.id);
        currentConversationId = newConversationId;
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
              void touchConversationForUser(currentConversationId, session.user.id);
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
            setStreamingContent('');
            setIsLoading(false);

            // For breathing confirmations, use immersive overlay
            if (isBreathingConfirmation(event.payload)) {
              // Convert available techniques to BreathingTechnique format
              // Map recommended_cycles → cycles for frontend compatibility
              const availableTechniques: BreathingTechnique[] =
                event.payload.available_techniques.map((t) => ({
                  id: t.id,
                  name: t.name,
                  durations: t.durations,
                  description: t.description,
                  cycles: t.recommended_cycles,
                }));

              const proposedTechnique: BreathingTechnique = {
                id: event.payload.proposed_technique.id,
                name: event.payload.proposed_technique.name,
                durations: event.payload.proposed_technique.durations,
                description: event.payload.proposed_technique.description,
                cycles: event.payload.proposed_technique.recommended_cycles,
              };

              setActiveActivity({
                phase: 'confirming',
                type: 'breathing',
                data: {
                  proposedTechnique,
                  message: event.payload.message,
                  availableTechniques,
                },
              });
            } else {
              // For other interrupts (voice selection), use inline UI
              setInterruptData(event.payload);
            }

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
              void touchConversationForUser(conversationId, session.user.id);
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
    [conversationId, touchConversationForUser]
  );

  /* --------------------------------------------------------------------------
     Handle Voice Selection Confirmation (HITL resume for meditation)
     -------------------------------------------------------------------------- */
  const handleVoiceSelectionConfirm = useCallback(
    async (decision: 'confirm' | 'cancel', voiceId?: string) => {
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
          { decision, voice_id: voiceId },
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
              void touchConversationForUser(conversationId, session.user.id);
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
    [conversationId, touchConversationForUser]
  );

  /* --------------------------------------------------------------------------
     Handle Journaling Prompt Confirmation (HITL resume)
     -------------------------------------------------------------------------- */
  const handleJournalingConfirm = useCallback(
    async (decision: 'start' | 'change_prompt' | 'not_now', promptId?: string) => {
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
          { decision, prompt_id: promptId },
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
              void touchConversationForUser(conversationId, session.user.id);
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
    [conversationId, touchConversationForUser]
  );

  /* --------------------------------------------------------------------------
     Immersive Breathing Overlay Handlers
     -------------------------------------------------------------------------- */

  /**
   * Handle user confirming the breathing exercise in immersive overlay.
   * Transitions from 'confirming' phase to 'active' phase.
   */
  const handleImmersiveBreathingConfirm = useCallback(
    async (technique: BreathingTechnique) => {
      if (activeActivity?.phase !== 'confirming') {
        return;
      }

      // Store the introduction message for the exercise
      const introduction = activeActivity.data.message;

      // Resume the graph with user's decision
      setIsLoading(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session || !conversationId) {
          console.error('No session or conversation ID');
          setIsLoading(false);
          return;
        }

        const client = createAIClient(session.access_token);

        // Resume with 'start' decision and the selected technique
        // Note: We don't need to capture the response content since we don't add
        // the activity message to local state during live HITL (user sees overlay)
        for await (const event of client.resumeInterrupt(
          { decision: 'start', technique_id: technique.id },
          conversationId
        )) {
          switch (event.type) {
            case 'done': {
              // During live HITL, we skip adding the activity message to local state
              // because the user sees the activity in the ImmersiveBreathing overlay.
              // The message is persisted via the backend and will appear when loading history.
              void touchConversationForUser(conversationId, session.user.id);
              break;
            }

            case 'error': {
              console.error('Resume stream error:', event.error);
              break;
            }
          }
        }
      } catch (error) {
        console.error('Failed to resume graph:', error);
      } finally {
        setIsLoading(false);
      }

      // Transition to active phase - show the breathing exercise
      setActiveActivity({
        phase: 'active',
        type: 'breathing',
        data: {
          technique,
          introduction,
        },
      });
    },
    [activeActivity, conversationId, touchConversationForUser]
  );

  /**
   * Handle user declining the breathing exercise.
   * Closes overlay and resumes graph with 'not_now'.
   */
  const handleImmersiveBreathingDecline = useCallback(async () => {
    setActiveActivity(null);
    setIsLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !conversationId) {
        console.error('No session or conversation ID');
        setIsLoading(false);
        return;
      }

      const client = createAIClient(session.access_token);
      let fullResponse = '';

      for await (const event of client.resumeInterrupt({ decision: 'not_now' }, conversationId)) {
        switch (event.type) {
          case 'token':
            fullResponse = event.content;
            setStreamingContent(fullResponse);
            break;

          case 'done': {
            const assistantMessage: Message = {
              id: `assistant-${String(Date.now())}`,
              role: 'assistant',
              content: fullResponse,
              createdAt: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setStreamingContent('');
            void touchConversationForUser(conversationId, session.user.id);
            break;
          }

          case 'error': {
            console.error('Resume stream error:', event.error);
            setStreamingContent('');
            break;
          }
        }
      }
    } catch (error) {
      console.error('Failed to resume graph:', error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [conversationId, touchConversationForUser]);

  /**
   * Handle breathing exercise completion.
   * Closes overlay and optionally logs stats.
   */
  const handleImmersiveBreathingComplete = useCallback((_stats: BreathingStats) => {
    // Close the overlay
    setActiveActivity(null);
    inputRef.current?.focus();

    // TODO: Stats could be sent to backend for tracking (future enhancement)
  }, []);

  /**
   * Handle user exiting exercise early (stop button or X).
   */
  const handleActivityClose = useCallback(() => {
    setActiveActivity(null);
    inputRef.current?.focus();
  }, []);

  /* --------------------------------------------------------------------------
     Direct Activity Handlers (sidebar navigation)
     -------------------------------------------------------------------------- */

  /**
   * Handle opening a component directly from DiscoverNav.
   * Backend integration for session tracking will be added in future iteration.
   */
  const handleDirectComponent = useCallback((component: DirectComponent) => {
    setDirectActivity(component);
    // Close sidebar on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  /**
   * Handle closing the direct activity overlay.
   */
  const handleDirectActivityClose = useCallback(() => {
    setDirectActivity(null);
    inputRef.current?.focus();
  }, []);

  /* --------------------------------------------------------------------------
     Journal Entry Handlers
     -------------------------------------------------------------------------- */

  /**
   * Handle selecting a journal entry from JournalHistory.
   */
  const handleSelectJournalEntry = useCallback((entry: JournalEntry) => {
    setSelectedJournalEntry(entry);
  }, []);

  /**
   * Handle closing the journal entry viewer.
   */
  const handleCloseJournalEntry = useCallback(() => {
    setSelectedJournalEntry(null);
  }, []);

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

      // Create a new conversation in the database using mutation
      const newConversationId = await createConversationForUser(session.user.id);
      setConversationId(newConversationId);

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
      <aside
        className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}
      >
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

        {/* User Profile Section */}
        <div className={styles.sidebarProfile}>
          <SidebarProfile email={loaderData.userEmail} streakDays={0} />
        </div>

        {/* Navigation buttons */}
        <nav className={styles.sidebarNav}>
          <button className={styles.sidebarButton} onClick={() => void handleNewConversation()}>
            <NewChatIcon />
            <span>New Conversation</span>
          </button>

          {/* Discover Section */}
          <div className={styles.sidebarSection}>
            <DiscoverNav
              onItemClick={(item) => {
                // Handle activity navigation - send as message
                if (item === 'breathing') {
                  setInputValue('Guide me through a breathing exercise');
                } else if (item === 'meditation') {
                  setInputValue('I would like to meditate');
                } else if (item === 'journal') {
                  setInputValue('Help me with journaling');
                }
                // Close sidebar on mobile
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  setIsSidebarOpen(false);
                }
                inputRef.current?.focus();
              }}
              onTestComponent={handleDirectComponent}
            />
          </div>

          {/* Conversation History */}
          <div className={styles.sidebarSection}>
            <ConversationHistory
              userId={loaderData.userId}
              currentConversationId={conversationId}
              onSelectConversation={(id) => void handleSelectConversation(id)}
              onCloseSidebar={() => {
                setIsSidebarOpen(false);
              }}
            />
          </div>

          {/* Journal Entries */}
          <div className={styles.sidebarSection}>
            <JournalHistory
              onSelectEntry={handleSelectJournalEntry}
              onCloseSidebar={() => {
                setIsSidebarOpen(false);
              }}
            />
          </div>

          {/* Progress Widget */}
          <div className={styles.sidebarSection}>
            <ProgressWidget streakDays={0} weeklyGoalCompleted={0} weeklyGoalTarget={5} />
          </div>
        </nav>

        {/* Footer with theme toggle and logout */}
        <div className={styles.sidebarFooter}>
          <div className={styles.themeToggleWrapper}>
            <ThemeToggle />
          </div>
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

          {/* Desktop: expand button (when sidebar is not open) */}
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
          {/* Empty state when no messages */}
          {messages.length === 0 && !streamingContent && (
            <ChatEmptyState
              onQuickAction={(action) => {
                if (action === 'breathing') {
                  setInputValue('Guide me through a breathing exercise');
                } else if (action === 'meditation') {
                  setInputValue('I would like to meditate');
                } else {
                  // action === 'journal'
                  setInputValue('Help me with journaling');
                }
                inputRef.current?.focus();
              }}
              onStarterClick={(message) => {
                setInputValue(message);
                inputRef.current?.focus();
              }}
            />
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
          {interruptData && isBreathingConfirmation(interruptData) && (
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

          {/* Meditation voice selection confirmation (HITL interrupt) */}
          {interruptData && isVoiceSelection(interruptData) && (
            <div className={styles.messageRow}>
              <div
                className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.bubbleActivity}`}
              >
                <VoiceSelectionConfirmation
                  message={interruptData.message}
                  availableVoices={interruptData.available_voices}
                  recommendedVoice={interruptData.recommended_voice}
                  meditationPreview={interruptData.meditation_preview}
                  durationMinutes={interruptData.duration_minutes}
                  onConfirm={(decision, voiceId) => {
                    void handleVoiceSelectionConfirm(decision, voiceId);
                  }}
                />
              </div>
            </div>
          )}

          {/* Journaling prompt confirmation (HITL interrupt) */}
          {interruptData && isJournalingConfirmation(interruptData) && (
            <div className={styles.messageRow}>
              <div
                className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.bubbleActivity}`}
              >
                <JournalingConfirmation
                  proposedPrompt={interruptData.proposed_prompt}
                  message={interruptData.message}
                  availablePrompts={interruptData.available_prompts}
                  onConfirm={(prompt) => {
                    void handleJournalingConfirm('start', prompt.id);
                  }}
                  onDecline={() => {
                    void handleJournalingConfirm('not_now');
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

      {/* Immersive Activity Overlay */}
      <ActivityOverlay
        isOpen={activeActivity !== null}
        onClose={handleActivityClose}
        activityType="breathing"
      >
        {activeActivity?.phase === 'confirming' && (
          <ImmersiveBreathingConfirmation
            proposedTechnique={activeActivity.data.proposedTechnique}
            message={activeActivity.data.message}
            availableTechniques={activeActivity.data.availableTechniques}
            onConfirm={(technique) => {
              void handleImmersiveBreathingConfirm(technique);
            }}
            onDecline={() => {
              void handleImmersiveBreathingDecline();
            }}
          />
        )}
        {activeActivity?.phase === 'active' && (
          <ImmersiveBreathing
            technique={activeActivity.data.technique}
            introduction={activeActivity.data.introduction}
            onComplete={handleImmersiveBreathingComplete}
            onExit={handleActivityClose}
          />
        )}
      </ActivityOverlay>

      {/* Direct Activity Overlay - for sidebar navigation */}
      {directActivity && (
        <ActivityOverlay
          isOpen={true}
          onClose={handleDirectActivityClose}
          activityType={directActivity.type}
        >
          <ActivityRenderer component={directActivity} onClose={handleDirectActivityClose} />
        </ActivityOverlay>
      )}

      {/* Journal Entry Viewer Overlay */}
      {selectedJournalEntry &&
        (() => {
          const categoryInfo = CATEGORY_INFO[selectedJournalEntry.prompt_category];
          return (
            <div
              className={styles.journalOverlay}
              onClick={handleCloseJournalEntry}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleCloseJournalEntry();
                }
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Journal entry viewer"
            >
              <div
                className={styles.journalViewer}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
                role="document"
              >
                <button
                  className={styles.journalCloseButton}
                  onClick={handleCloseJournalEntry}
                  aria-label="Close journal entry"
                >
                  <CloseIcon />
                </button>
                <div className={styles.journalHeader}>
                  <span
                    className={styles.journalCategory}
                    style={{ backgroundColor: categoryInfo.color }}
                  >
                    {categoryInfo.emoji} {categoryInfo.label}
                  </span>
                  <span className={styles.journalDate}>
                    {new Date(selectedJournalEntry.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className={styles.journalPrompt}>{selectedJournalEntry.prompt_text}</div>
                <div className={styles.journalContent}>{selectedJournalEntry.entry_text}</div>
                <div className={styles.journalMeta}>
                  <span>{String(selectedJournalEntry.word_count)} words</span>
                  {selectedJournalEntry.is_favorite && (
                    <span className={styles.favorite}>★ Favorite</span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
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

  // Render Wim Hof exercise inline if detected
  if (parsedContent?.hasActivity && parsedContent.activity?.activity === 'breathing_wim_hof') {
    const activity = parsedContent.activity;

    return (
      <div className={styles.messageRow}>
        <div className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.bubbleActivity}`}>
          <WimHofExercise
            technique={activity.technique}
            introduction={activity.introduction}
            isFirstTime={activity.is_first_time}
            onComplete={handleExerciseComplete}
          />
        </div>
      </div>
    );
  }

  // Render continuous breathing exercise as completed summary (historical)
  // During live HITL, activity messages are NOT added to messages state,
  // so any activity messages here are from history (previous sessions/reloads).
  // We render them as static summaries rather than interactive components.
  if (parsedContent?.hasActivity && parsedContent.activity?.activity === 'breathing') {
    const activity = parsedContent.activity;
    const timingPattern = activity.technique.durations.join('-');

    return (
      <div className={styles.messageRow}>
        <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
          <div className={styles.completedActivity}>
            <div className={styles.completedIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className={styles.completedInfo}>
              <span className={styles.completedTitle}>Breathing Exercise</span>
              <span className={styles.completedDetail}>
                {activity.technique.name} ({timingPattern})
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render guided meditation inline if detected
  if (parsedContent?.hasActivity && parsedContent.activity?.activity === 'meditation') {
    const activity = parsedContent.activity;

    return (
      <div className={styles.messageRow}>
        <div className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.bubbleActivity}`}>
          <GuidedMeditation
            track={activity.track}
            introduction={activity.introduction}
            onComplete={handleExerciseComplete}
          />
        </div>
      </div>
    );
  }

  // Render AI-generated meditation inline if detected
  if (
    parsedContent?.hasActivity &&
    parsedContent.activity?.activity === 'meditation_ai_generated'
  ) {
    const activity = parsedContent.activity;

    return (
      <div className={styles.messageRow}>
        <div className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.bubbleActivity}`}>
          <AIGeneratedMeditation activityData={activity} onComplete={handleExerciseComplete} />
        </div>
      </div>
    );
  }

  // Render journaling exercise inline if detected
  if (parsedContent?.hasActivity && parsedContent.activity?.activity === 'journaling') {
    const activity = parsedContent.activity;

    return (
      <div className={styles.messageRow}>
        <div className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.bubbleActivity}`}>
          <JournalingExercise
            prompt={activity.prompt}
            introduction={activity.introduction}
            enableSharing={activity.enable_sharing}
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
