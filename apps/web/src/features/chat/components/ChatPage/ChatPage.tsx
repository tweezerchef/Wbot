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
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  startTransition,
} from 'react';

import {
  useActivityOverlays,
  type UseActivityOverlaysReturn,
} from '../../hooks/useActivityOverlays';
import { useChatInput } from '../../hooks/useChatInput';
import { useHITLResume, type UseHITLResumeOptions } from '../../hooks/useHITLResume';
import { useJournalViewer } from '../../hooks/useJournalViewer';
import { useSidebarState } from '../../hooks/useSidebarState';
import {
  chatLoaderDataSchema,
  emptyLoaderData,
  type ActivityState,
  type ChatLoaderData,
} from '../../types';
import { ChatEmptyState } from '../ChatEmptyState';
import { ChatHeader } from '../ChatHeader';
import { ChatInputArea } from '../ChatInputArea';
import { ChatSidebar } from '../ChatSidebar';
import { InterruptPrompt } from '../InterruptPrompt';
import { JournalEntryViewer } from '../JournalEntryViewer';
import { MessageBubble } from '../MessageBubble';

import styles from './ChatPage.module.css';
import {
  ImmersiveBreathing,
  ImmersiveBreathingConfirmation,
  ActivityRenderer,
  PrerecordedMeditationPlayer,
} from './lazyComponents';

import { ActivityOverlay } from '@/components/overlays';
import { ActivityLoadingSkeleton } from '@/components/skeletons';
import type { BreathingTechnique, BreathingStats } from '@/features/breathing';
import {
  createAIClient,
  isBreathingConfirmation,
  type Message,
  type InterruptPayload,
} from '@/lib/ai-client';
import { isMobileViewport } from '@/lib/constants/breakpoints';
import { createConversation, loadMessages, touchConversation } from '@/lib/conversations';
import { useSupabaseSession } from '@/lib/hooks';
import { conversationKeys } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

/* ----------------------------------------------------------------------------
   Route API for accessing loader data
   ---------------------------------------------------------------------------- */
// Note: Route ID is '/_authed/chat' (pathless layout + route name)
const routeApi = getRouteApi('/_authed/chat');

/* ----------------------------------------------------------------------------
   Type Guards for Activity State
   ---------------------------------------------------------------------------- */

/** Type guard for confirming phase activity state */
function isConfirmingActivity(
  activity: ActivityState
): activity is Extract<ActivityState, { phase: 'confirming' }> {
  return activity !== null && activity.phase === 'confirming';
}

/** Type guard for active phase activity state */
function isActiveActivity(
  activity: ActivityState
): activity is Extract<ActivityState, { phase: 'active' }> {
  return activity !== null && activity.phase === 'active';
}

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
  const loaderData = useMemo<ChatLoaderData>(() => {
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

  // Current conversation ID - initialized from loader data
  const [conversationId, setConversationId] = useState<string | null>(loaderData.conversationId);

  // Interrupt data for HITL (Human-in-the-Loop) confirmation dialogs
  const [interruptData, setInterruptData] = useState<InterruptPayload | null>(null);

  // Query client for cache invalidation after direct Supabase operations
  const queryClient = useQueryClient();

  // Reference to the message container for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* --------------------------------------------------------------------------
     Custom Hooks
     -------------------------------------------------------------------------- */

  // Sidebar state management
  const { isSidebarOpen, isHydrated, openSidebar, closeSidebar, toggleSidebar } = useSidebarState();

  // Chat input state management
  const { inputValue, inputRef, setInputValue, clearInput, focusInput } = useChatInput();

  // Journal viewer state management
  const { selectedJournalEntry, handleSelectJournalEntry, handleCloseJournalEntry } =
    useJournalViewer();

  // Activity overlays state management
  const {
    activeActivity,
    directActivity,
    selectedPrerecordedTrack,
    setActiveActivity,
    handleActivityClose,
    handleDirectComponent,
    handleDirectActivityClose,
    handleSelectPrerecordedMeditation,
    handleClosePrerecordedMeditation,
  }: UseActivityOverlaysReturn = useActivityOverlays({
    onActivityClose: focusInput,
    onCloseSidebar: closeSidebar,
  });

  /* --------------------------------------------------------------------------
     Cache Invalidation Helpers
     -------------------------------------------------------------------------- */
  const invalidateConversationCache = useCallback(
    (userId: string, convId?: string) => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list(userId) });
      if (convId) {
        void queryClient.invalidateQueries({ queryKey: conversationKeys.detail(convId) });
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
     -------------------------------------------------------------------------- */
  useEffect(() => {
    startTransition(() => {
      setMessages(loaderData.messages);
      setConversationId(loaderData.conversationId);
    });
  }, [loaderData.messages, loaderData.conversationId]);

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
      focusInput();
    },
    touchConversation: touchConversationForUser,
  };

  const { resume: hitlResume } = useHITLResume(hitlResumeOptions);

  /* --------------------------------------------------------------------------
     Auto-scroll to bottom when new messages arrive
     -------------------------------------------------------------------------- */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  /* --------------------------------------------------------------------------
     Send Message Handler
     -------------------------------------------------------------------------- */
  const handleSendMessage = async () => {
    const messageText = inputValue.trim();
    if (!messageText || isLoading) {
      return;
    }

    clearInput();

    const userMessage: Message = {
      id: `user-${String(Date.now())}`,
      role: 'user',
      content: messageText,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);
    setStreamingContent('');

    try {
      if (!session || !accessToken) {
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

      const authToken = accessToken;
      let currentConversationId = conversationId;

      if (!currentConversationId) {
        const newConversationId = await createConversationForUser(session.user.id);
        currentConversationId = newConversationId;
        setConversationId(currentConversationId);
      }

      const client = createAIClient(authToken);
      let fullResponse = '';

      for await (const event of client.streamMessage(messageText, currentConversationId)) {
        switch (event.type) {
          case 'token':
            fullResponse = event.content;
            setStreamingContent(fullResponse);
            break;

          case 'done': {
            const assistantMessage: Message = {
              id: event.messageId ?? `assistant-${String(Date.now())}`,
              role: 'assistant',
              content: fullResponse,
              createdAt: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setStreamingContent('');

            if (currentConversationId) {
              void touchConversationForUser(currentConversationId, session.user.id);
            }
            break;
          }

          case 'error': {
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
            setStreamingContent('');
            setIsLoading(false);

            // For breathing confirmations, use immersive overlay
            if (isBreathingConfirmation(event.payload)) {
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
              // For other interrupts (voice selection, journaling), use inline UI
              setInterruptData(event.payload);
            }

            return;
          }
        }
      }
    } catch (error) {
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
      focusInput();
    }
  };

  /* --------------------------------------------------------------------------
     Immersive Breathing Overlay Handlers
     -------------------------------------------------------------------------- */
  const handleImmersiveBreathingConfirm = useCallback(
    async (technique: BreathingTechnique) => {
      if (!isConfirmingActivity(activeActivity)) {
        return;
      }

      const introduction = activeActivity.data.message;
      setIsLoading(true);

      try {
        if (!session || !accessToken || !conversationId) {
          console.error('No session or conversation ID');
          setIsLoading(false);
          return;
        }

        const client = createAIClient(accessToken);

        for await (const event of client.resumeInterrupt(
          { decision: 'start', technique_id: technique.id },
          conversationId
        )) {
          switch (event.type) {
            case 'done': {
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

      setActiveActivity({
        phase: 'active',
        type: 'breathing',
        data: {
          technique,
          introduction,
        },
      });
    },
    [
      activeActivity,
      conversationId,
      touchConversationForUser,
      session,
      accessToken,
      setActiveActivity,
    ]
  );

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
      focusInput();
    }
  }, [
    conversationId,
    touchConversationForUser,
    session,
    accessToken,
    setActiveActivity,
    focusInput,
  ]);

  const handleImmersiveBreathingComplete = useCallback(
    (_stats: BreathingStats) => {
      setActiveActivity(null);
      focusInput();
    },
    [setActiveActivity, focusInput]
  );

  /* --------------------------------------------------------------------------
     Sidebar Handlers
     -------------------------------------------------------------------------- */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      void navigate({ to: '/' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNewConversation = async () => {
    try {
      if (!session) {
        return;
      }

      const newConversationId = await createConversationForUser(session.user.id);
      setConversationId(newConversationId);

      setMessages([]);
      setStreamingContent('');
      clearInput();

      if (isMobileViewport()) {
        closeSidebar();
      }

      focusInput();
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  };

  const handleSelectConversation = async (selectedConversationId: string) => {
    if (selectedConversationId === conversationId) {
      return;
    }

    try {
      setIsLoading(true);
      const loadedMessages = await loadMessages(selectedConversationId);

      setConversationId(selectedConversationId);
      setMessages(loadedMessages);
      setStreamingContent('');
      clearInput();

      if (isMobileViewport()) {
        closeSidebar();
      }

      focusInput();
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationSelection = (selectedConversationId: string) => {
    void handleSelectConversation(selectedConversationId);
  };

  const handleActivityRequest = (type: 'breathing' | 'meditation' | 'journal' | 'sleep') => {
    if (type === 'breathing') {
      setInputValue('Guide me through a breathing exercise');
    } else if (type === 'meditation') {
      setInputValue('I would like to meditate');
    } else if (type === 'sleep') {
      setInputValue('Help me wind down for sleep');
    } else {
      setInputValue('Help me with journaling');
    }
    if (isMobileViewport()) {
      closeSidebar();
    }
    focusInput();
  };

  /* --------------------------------------------------------------------------
     Render
     -------------------------------------------------------------------------- */
  return (
    <div className={styles.container}>
      {/* Overlay - closes sidebar when clicked (mobile only) */}
      {isSidebarOpen && (
        <div className={styles.overlay} onClick={closeSidebar} aria-hidden="true" />
      )}

      {/* Sidebar navigation */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
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
        onActivityRequest={handleActivityRequest}
      />

      {/* Main chat area */}
      <div className={styles.chatMain}>
        {/* Header with menu toggle */}
        <ChatHeader
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          onExpandSidebar={openSidebar}
        />

        {/* Message list - scrollable area */}
        <div className={styles.messages}>
          {/* Empty state when no messages */}
          {messages.length === 0 && !streamingContent && (
            <ChatEmptyState
              onQuickAction={handleActivityRequest}
              onStarterClick={(message) => {
                setInputValue(message);
                focusInput();
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

          {/* HITL interrupt prompts (breathing, voice, journaling) */}
          {interruptData && (
            <InterruptPrompt
              interruptData={interruptData}
              onResume={(payload) => {
                void hitlResume(payload);
              }}
            />
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
        <ChatInputArea
          inputRef={inputRef}
          value={inputValue}
          onChange={setInputValue}
          onSubmit={() => {
            void handleSendMessage();
          }}
          disabled={isLoading || !!interruptData}
          placeholder={
            interruptData ? 'Please respond to the prompt above...' : 'Type a message...'
          }
        />
      </div>

      {/* Immersive Activity Overlay */}
      <ActivityOverlay
        isOpen={activeActivity !== null}
        onClose={handleActivityClose}
        activityType="breathing"
      >
        <Suspense fallback={<ActivityLoadingSkeleton />}>
          {isConfirmingActivity(activeActivity) && (
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
          {isActiveActivity(activeActivity) && (
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
      {selectedJournalEntry && (
        <JournalEntryViewer entry={selectedJournalEntry} onClose={handleCloseJournalEntry} />
      )}
    </div>
  );
}
