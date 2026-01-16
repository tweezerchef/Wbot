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
import type { MeditationTrack } from '@wbot/shared';
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
  startTransition,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { z } from 'zod';

import { useHITLResume, type UseHITLResumeOptions } from '../../hooks/useHITLResume';
import { ChatEmptyState } from '../ChatEmptyState';
import { ChatSidebar } from '../ChatSidebar';
import { MessageBubble } from '../MessageBubble';

import styles from './ChatPage.module.css';

import { ErrorFallback } from '@/components/feedback/ErrorFallback/ErrorFallback';
import { ActivityOverlay } from '@/components/overlays';
import { ActivityLoadingSkeleton } from '@/components/skeletons';
import { MenuIcon, CloseIcon, ChevronRightIcon, SendIcon } from '@/components/ui/icons';
import type { BreathingTechnique, BreathingStats } from '@/features/breathing/types';
import { CATEGORY_INFO, type JournalEntry } from '@/features/journaling/types';
import type { DirectComponent } from '@/features/navigation/types';
import {
  createAIClient,
  isBreathingConfirmation,
  isJournalingConfirmation,
  isVoiceSelection,
  type Message,
  type InterruptPayload,
} from '@/lib/ai-client';
import { isMobileViewport } from '@/lib/constants/breakpoints';
import { createConversation, loadMessages, touchConversation } from '@/lib/conversations';
import { useSupabaseSession } from '@/lib/hooks';
import { conversationKeys } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

// Lazy load activity components to reduce initial bundle size
// These are only loaded when the user triggers an activity
const ImmersiveBreathing = lazy(() =>
  import('@/features/breathing/components/ImmersiveBreathing/ImmersiveBreathing').then((m) => ({
    default: m.ImmersiveBreathing,
  }))
);
const ImmersiveBreathingConfirmation = lazy(() =>
  import('@/features/breathing/components/ImmersiveBreathing/ImmersiveBreathingConfirmation').then(
    (m) => ({ default: m.ImmersiveBreathingConfirmation })
  )
);
const BreathingConfirmation = lazy(() =>
  import('@/features/breathing/components/BreathingConfirmation/BreathingConfirmation').then(
    (m) => ({ default: m.BreathingConfirmation })
  )
);
const VoiceSelectionConfirmation = lazy(() =>
  import('@/features/meditation/components/VoiceSelectionConfirmation/VoiceSelectionConfirmation').then(
    (m) => ({ default: m.VoiceSelectionConfirmation })
  )
);
const JournalingConfirmation = lazy(() =>
  import('@/features/journaling/components/JournalingConfirmation/JournalingConfirmation').then(
    (m) => ({ default: m.JournalingConfirmation })
  )
);
// Lazy-load direct activity renderer for sidebar navigation
const ActivityRenderer = lazy(() =>
  import('@/features/navigation/components/ActivityRenderer/ActivityRenderer').then((m) => ({
    default: m.ActivityRenderer,
  }))
);
// Lazy-load pre-recorded meditation player
const PrerecordedMeditationPlayer = lazy(() =>
  import('@/features/meditation/components/PrerecordedMeditationPlayer/PrerecordedMeditationPlayer').then(
    (m) => ({
      default: m.PrerecordedMeditationPlayer,
    })
  )
);

/* ----------------------------------------------------------------------------
   Route API for accessing loader data
   ---------------------------------------------------------------------------- */
// Note: Route ID is '/_authed/chat' (pathless layout + route name)
const routeApi = getRouteApi('/_authed/chat');

/* ----------------------------------------------------------------------------
   Loader Data Validation
   ---------------------------------------------------------------------------- */
const chatLoaderDataSchema = z.object({
  conversationId: z.uuid().nullable(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
      createdAt: z.coerce.date(),
    })
  ),
  userEmail: z.email().optional(),
  userId: z.uuid().optional(),
});

type ChatLoaderData = z.infer<typeof chatLoaderDataSchema>;

const emptyLoaderData: ChatLoaderData = {
  conversationId: null,
  messages: [],
};

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
  // Memoize to prevent new object references on every render (would cause infinite loop)
  const rawLoaderData = routeApi.useLoaderData();
  const loaderData = useMemo(() => {
    const result = chatLoaderDataSchema.safeParse(rawLoaderData);
    if (!result.success) {
      console.error('Invalid chat loader data:', result.error);
      return emptyLoaderData;
    }
    return result.data;
  }, [rawLoaderData]);

  // Navigation for redirects (e.g., after logout)
  const navigate = useNavigate();

  // Supabase session - provides reactive access to auth state
  const { session, accessToken } = useSupabaseSession();

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

     Using startTransition marks these updates as non-urgent, allowing the
     browser to prioritize layout stability over state updates (reduces CLS).
     -------------------------------------------------------------------------- */
  useEffect(() => {
    startTransition(() => {
      setMessages(loaderData.messages);
      setConversationId(loaderData.conversationId);
    });
  }, [loaderData.messages, loaderData.conversationId]);

  // Hydration tracking - prevents CLS by deferring width collapse until after paint
  // The CSS .sidebarHydrated class is required for width:0 to take effect on desktop
  const [isHydrated, setIsHydrated] = useState(false);

  // Sidebar state - starts OPEN to match CSS default (prevents 280px layout shift)
  // CSS sets sidebar width: 280px on desktop by default.
  // Only after hydration (isHydrated=true) can the sidebar collapse via .sidebarClosed.sidebarHydrated
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  /* --------------------------------------------------------------------------
     Hydration Effect - Enable sidebar collapse and set mobile initial state
     --------------------------------------------------------------------------
     CRITICAL FOR CLS: This effect runs after the first paint, ensuring:
     1. The page renders with sidebar open (matching CSS default)
     2. Only AFTER paint do we enable the collapse behavior (via isHydrated)
     3. On mobile, we close the sidebar (but width doesn't shift since it's overlay)
     -------------------------------------------------------------------------- */
  useEffect(() => {
    // Enable sidebar collapse behavior (CSS: .sidebarClosed.sidebarHydrated)
    setIsHydrated(true);

    // On mobile, close the sidebar after hydration
    // This is safe because mobile uses position:fixed (overlay), not flex width
    if (isMobileViewport()) {
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

  // Selected pre-recorded meditation track for playback
  const [selectedPrerecordedTrack, setSelectedPrerecordedTrack] = useState<MeditationTrack | null>(
    null
  );

  // Reference to the message container for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reference to the input field for focus management
  const inputRef = useRef<HTMLInputElement>(null);

  /* --------------------------------------------------------------------------
     HITL Resume Hook - handles all interrupt confirmations
     -------------------------------------------------------------------------- */
  const hitlResumeOptions: UseHITLResumeOptions = {
    conversationId,
    onSuccess: (message: Message) => {
      setMessages((prev) => [...prev, message]);
    },
    onError: (error: string) => {
      const errorMessage: Message = {
        id: `error-${String(Date.now())}`,
        role: 'system',
        content: error,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
    onStreamingUpdate: (content: string) => {
      setStreamingContent(content);
    },
    onResumeStart: () => {
      setInterruptData(null);
      setIsLoading(true);
      setStreamingContent('');
    },
    onResumeEnd: () => {
      setIsLoading(false);
      inputRef.current?.focus();
    },
    touchConversation: touchConversationForUser,
  };

  const {
    resume: hitlResume,
    isResuming: _isResuming,
    streamingContent: _resumeStreamingContent,
  } = useHITLResume(hitlResumeOptions);

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
      // Check session from hook (reactive, always current)
      if (!session || !accessToken) {
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
      const authToken = accessToken;

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
            return; // Exit the loop, hitlResume will continue
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
        if (!session || !accessToken || !conversationId) {
          console.error('No session or conversation ID');
          setIsLoading(false);
          return;
        }

        const client = createAIClient(accessToken);

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
    [activeActivity, conversationId, touchConversationForUser, session, accessToken]
  );

  /**
   * Handle user declining the breathing exercise.
   * Closes overlay and resumes graph with 'not_now'.
   */
  const handleImmersiveBreathingDecline = useCallback(async () => {
    setActiveActivity(null);
    setIsLoading(true);

    try {
      if (!session || !accessToken || !conversationId) {
        console.error('No session or conversation ID');
        setIsLoading(false);
        return;
      }

      const client = createAIClient(accessToken);
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
  }, [conversationId, touchConversationForUser, session, accessToken]);

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
    if (isMobileViewport()) {
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
     Pre-recorded Meditation Handlers
     -------------------------------------------------------------------------- */

  /**
   * Handle selecting a pre-recorded meditation track from the sidebar.
   */
  const handleSelectPrerecordedMeditation = useCallback((track: MeditationTrack) => {
    setSelectedPrerecordedTrack(track);
    // Close sidebar on mobile
    if (isMobileViewport()) {
      setIsSidebarOpen(false);
    }
  }, []);

  /**
   * Handle closing the pre-recorded meditation player.
   */
  const handleClosePrerecordedMeditation = useCallback(() => {
    setSelectedPrerecordedTrack(null);
    inputRef.current?.focus();
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
      if (isMobileViewport()) {
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
      if (isMobileViewport()) {
        setIsSidebarOpen(false);
      }

      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Typed wrapper keeps JSX callback inference safe.
  const handleConversationSelection = (selectedConversationId: string) => {
    void handleSelectConversation(selectedConversationId);
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
      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
        }}
        isHydrated={isHydrated}
        userEmail={loaderData.userEmail}
        userId={loaderData.userId}
        currentConversationId={conversationId}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleConversationSelection}
        onLogout={handleLogout}
        onDirectComponent={handleDirectComponent}
        onSelectJournalEntry={handleSelectJournalEntry}
        onSelectPrerecordedMeditation={handleSelectPrerecordedMeditation}
        onActivityRequest={(type) => {
          // Handle activity navigation - send as message
          if (type === 'breathing') {
            setInputValue('Guide me through a breathing exercise');
          } else if (type === 'meditation') {
            setInputValue('I would like to meditate');
          } else {
            // type === 'journal' is the only other option
            setInputValue('Help me with journaling');
          }
          // Close sidebar on mobile
          if (isMobileViewport()) {
            setIsSidebarOpen(false);
          }
          inputRef.current?.focus();
        }}
      />

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
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <Suspense fallback={<ActivityLoadingSkeleton />}>
                    <BreathingConfirmation
                      proposedTechnique={interruptData.proposed_technique}
                      message={interruptData.message}
                      availableTechniques={interruptData.available_techniques}
                      onConfirm={(decision, techniqueId) => {
                        void hitlResume({ decision, technique_id: techniqueId });
                      }}
                    />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* Meditation voice selection confirmation (HITL interrupt) */}
          {interruptData && isVoiceSelection(interruptData) && (
            <div className={styles.messageRow}>
              <div
                className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.bubbleActivity}`}
              >
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <Suspense fallback={<ActivityLoadingSkeleton />}>
                    <VoiceSelectionConfirmation
                      message={interruptData.message}
                      availableVoices={interruptData.available_voices}
                      recommendedVoice={interruptData.recommended_voice}
                      meditationPreview={interruptData.meditation_preview}
                      durationMinutes={interruptData.duration_minutes}
                      onConfirm={(decision, voiceId) => {
                        void hitlResume({ decision, voice_id: voiceId });
                      }}
                    />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* Journaling prompt confirmation (HITL interrupt) */}
          {interruptData && isJournalingConfirmation(interruptData) && (
            <div className={styles.messageRow}>
              <div
                className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.bubbleActivity}`}
              >
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <Suspense fallback={<ActivityLoadingSkeleton />}>
                    <JournalingConfirmation
                      proposedPrompt={interruptData.proposed_prompt}
                      message={interruptData.message}
                      availablePrompts={interruptData.available_prompts}
                      onConfirm={(prompt) => {
                        void hitlResume({ decision: 'start', prompt_id: prompt.id });
                      }}
                      onDecline={() => {
                        void hitlResume({ decision: 'not_now' });
                      }}
                    />
                  </Suspense>
                </ErrorBoundary>
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
            <SendIcon />
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
        <Suspense fallback={<ActivityLoadingSkeleton />}>
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
        </Suspense>
      </ActivityOverlay>

      {/* Direct Activity Overlay - for sidebar navigation */}
      {directActivity && (
        <ActivityOverlay
          isOpen={true}
          onClose={handleDirectActivityClose}
          activityType={directActivity.type}
        >
          <Suspense fallback={<ActivityLoadingSkeleton />}>
            <ActivityRenderer component={directActivity} onClose={handleDirectActivityClose} />
          </Suspense>
        </ActivityOverlay>
      )}

      {/* Pre-recorded Meditation Player Overlay */}
      {selectedPrerecordedTrack && (
        <ActivityOverlay
          isOpen={true}
          onClose={handleClosePrerecordedMeditation}
          activityType="meditation"
        >
          <Suspense fallback={<ActivityLoadingSkeleton />}>
            <PrerecordedMeditationPlayer
              track={selectedPrerecordedTrack}
              onClose={handleClosePrerecordedMeditation}
              onComplete={handleClosePrerecordedMeditation}
            />
          </Suspense>
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
