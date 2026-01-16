/* ----------------------------------------------------------------------------
   useHITLResume Hook
   ----------------------------------------------------------------------------
   Manages Human-in-the-Loop (HITL) interrupt resumption for the chat.
   Consolidates the pattern used for breathing, voice selection, and journaling
   confirmations into a single reusable hook.
   ---------------------------------------------------------------------------- */

import { useCallback, useState } from 'react';

import { createAIClient, type Message } from '@/lib/ai-client';
import { supabase } from '@/lib/supabase';

/* ----------------------------------------------------------------------------
   Types
   ---------------------------------------------------------------------------- */

/**
 * Resume payload for different HITL interrupt types.
 * The decision field is common to all, other fields are optional.
 */
export interface HITLResumePayload {
  /** The user's decision (e.g., 'start', 'confirm', 'not_now', 'cancel') */
  decision: string;
  /** Breathing technique ID (for breathing confirmations) */
  technique_id?: string;
  /** Voice ID (for meditation voice selection) */
  voice_id?: string;
  /** Prompt ID (for journaling confirmations) */
  prompt_id?: string;
}

export interface UseHITLResumeOptions {
  /** Current conversation ID */
  conversationId: string | null;
  /** Called when resume completes successfully with the assistant message */
  onSuccess?: (message: Message) => void;
  /** Called when an error occurs during resume */
  onError?: (error: string) => void;
  /** Called when streaming content updates */
  onStreamingUpdate?: (content: string) => void;
  /** Called before resuming (e.g., to clear interrupt UI) */
  onResumeStart?: () => void;
  /** Called after resume completes (success or error) */
  onResumeEnd?: () => void;
  /** Touch conversation callback for ordering */
  touchConversation?: (conversationId: string, userId: string) => Promise<void>;
}

export interface UseHITLResumeReturn {
  /** Resume the interrupted graph with the given payload */
  resume: (payload: HITLResumePayload) => Promise<void>;
  /** Whether a resume operation is currently in progress */
  isResuming: boolean;
  /** Current streaming content during resume */
  streamingContent: string;
}

/* ----------------------------------------------------------------------------
   Hook Implementation
   ---------------------------------------------------------------------------- */

/**
 * Hook to handle HITL interrupt resumption in the chat.
 *
 * This hook consolidates the common pattern used for resuming interrupted
 * graphs after user confirmation (breathing, voice selection, journaling).
 *
 * @example
 * const { resume, isResuming, streamingContent } = useHITLResume({
 *   conversationId,
 *   onSuccess: (msg) => setMessages(prev => [...prev, msg]),
 *   onError: (err) => addErrorMessage(err),
 *   onStreamingUpdate: setStreamingContent,
 *   onResumeStart: () => setInterruptData(null),
 *   touchConversation: touchConversationForUser,
 * });
 *
 * // For breathing:
 * void resume({ decision: 'start', technique_id: techniqueId });
 *
 * // For voice selection:
 * void resume({ decision: 'confirm', voice_id: voiceId });
 *
 * // For journaling:
 * void resume({ decision: 'start', prompt_id: promptId });
 */
export function useHITLResume({
  conversationId,
  onSuccess,
  onError,
  onStreamingUpdate,
  onResumeStart,
  onResumeEnd,
  touchConversation,
}: UseHITLResumeOptions): UseHITLResumeReturn {
  const [isResuming, setIsResuming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const resume = useCallback(
    async (payload: HITLResumePayload) => {
      // Notify caller that resume is starting
      onResumeStart?.();
      setIsResuming(true);
      setStreamingContent('');

      try {
        // Get session for auth
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session || !conversationId) {
          console.error('No session or conversation ID');
          setIsResuming(false);
          return;
        }

        // Resume the graph with user's decision
        const client = createAIClient(session.access_token);
        let fullResponse = '';

        for await (const event of client.resumeInterrupt(payload, conversationId)) {
          switch (event.type) {
            case 'token':
              fullResponse = event.content;
              setStreamingContent(fullResponse);
              onStreamingUpdate?.(fullResponse);
              break;

            case 'done': {
              // Create the assistant message
              const assistantMessage: Message = {
                id: `assistant-${String(Date.now())}`,
                role: 'assistant',
                content: fullResponse,
                createdAt: new Date(),
              };
              setStreamingContent('');
              onStreamingUpdate?.('');
              onSuccess?.(assistantMessage);

              // Touch conversation for ordering
              if (touchConversation) {
                void touchConversation(conversationId, session.user.id);
              }
              break;
            }

            case 'error': {
              console.error('Resume stream error:', event.error);
              setStreamingContent('');
              onStreamingUpdate?.('');
              onError?.(`Sorry, something went wrong: ${event.error}`);
              break;
            }
          }
        }
      } catch (error) {
        console.error('Failed to resume graph:', error);
        onError?.("Sorry, I couldn't continue. Please try again.");
      } finally {
        setIsResuming(false);
        onResumeEnd?.();
      }
    },
    [
      conversationId,
      onSuccess,
      onError,
      onStreamingUpdate,
      onResumeStart,
      onResumeEnd,
      touchConversation,
    ]
  );

  return {
    resume,
    isResuming,
    streamingContent,
  };
}
