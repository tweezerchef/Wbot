/**
 * Shared Mock Data for Storybook Stories
 *
 * Centralized mock data used across multiple story files.
 * Includes messages, activities, interrupts, and journal entries.
 */

import type {
  JournalingPrompt,
  JournalingCategory,
  JournalEntry,
} from '@/features/journaling/types';
import type { Message, BreathingTechniqueInfo, VoiceInfo } from '@/lib/ai-client';

// =============================================================================
// Message Mocks
// =============================================================================

/** Basic user message */
export const MOCK_USER_MESSAGE: Message = {
  id: 'msg-user-1',
  role: 'user',
  content: "I've been feeling stressed about work lately.",
  createdAt: new Date('2024-01-15T10:30:00'),
};

/** Basic assistant message */
export const MOCK_ASSISTANT_MESSAGE: Message = {
  id: 'msg-assistant-1',
  role: 'assistant',
  content:
    "I understand that work stress can be really challenging. It's completely normal to feel this way, especially during busy periods. Would you like to try a breathing exercise to help you feel more centered?",
  createdAt: new Date('2024-01-15T10:30:15'),
};

/** System notification message */
export const MOCK_SYSTEM_MESSAGE: Message = {
  id: 'msg-system-1',
  role: 'system',
  content: 'Session started. Your conversation will be saved.',
  createdAt: new Date('2024-01-15T10:00:00'),
};

/** Long multi-paragraph assistant message */
export const MOCK_LONG_MESSAGE: Message = {
  id: 'msg-long-1',
  role: 'assistant',
  content: `That's a great question about stress management. Let me share some insights with you.

First, it's important to understand that stress is a natural response to challenging situations. Our bodies are designed to handle short-term stress, but chronic stress can take a toll on our physical and mental health.

There are several evidence-based techniques that can help:

1. **Breathing exercises** - Deep, controlled breathing activates your parasympathetic nervous system, helping you feel calmer.

2. **Mindfulness meditation** - Regular practice can help you become more aware of your thoughts and feelings without getting caught up in them.

3. **Physical activity** - Even a short walk can help reduce stress hormones and boost your mood.

Would you like to try any of these techniques today?`,
  createdAt: new Date('2024-01-15T10:31:00'),
};

/** Streaming message (empty, cursor shown) */
export const MOCK_STREAMING_MESSAGE: Message = {
  id: 'msg-streaming-1',
  role: 'assistant',
  content: 'Let me think about that for a moment...',
  createdAt: new Date(),
};

// =============================================================================
// Breathing Technique Mocks
// =============================================================================

export const MOCK_BOX_BREATHING: BreathingTechniqueInfo = {
  id: 'box',
  name: 'Box Breathing',
  description: '4-4-4-4 pattern for stress relief and improved focus',
  durations: [4, 4, 4, 4],
  recommended_cycles: 5,
  best_for: ['stress', 'focus', 'anxiety'],
};

export const MOCK_RELAXING_478: BreathingTechniqueInfo = {
  id: 'relaxing_478',
  name: '4-7-8 Relaxing Breath',
  description: 'Extended exhale pattern for anxiety relief and better sleep',
  durations: [4, 7, 8, 0],
  recommended_cycles: 4,
  best_for: ['anxiety', 'sleep', 'relaxation'],
};

export const MOCK_COHERENT: BreathingTechniqueInfo = {
  id: 'coherent',
  name: 'Coherent Breathing',
  description: 'Balanced 6-6 pattern for heart rate variability and calm',
  durations: [6, 0, 6, 0],
  recommended_cycles: 5,
  best_for: ['calm', 'balance', 'hrv'],
};

export const MOCK_DEEP_CALM: BreathingTechniqueInfo = {
  id: 'deep_calm',
  name: 'Deep Calm',
  description: '5-2-7-2 pattern with extended exhale for deep relaxation',
  durations: [5, 2, 7, 2],
  recommended_cycles: 5,
  best_for: ['relaxation', 'stress', 'calm'],
};

export const MOCK_ALL_BREATHING_TECHNIQUES: BreathingTechniqueInfo[] = [
  MOCK_BOX_BREATHING,
  MOCK_RELAXING_478,
  MOCK_COHERENT,
  MOCK_DEEP_CALM,
];

// =============================================================================
// Voice Mocks (for Meditation)
// =============================================================================

export const MOCK_VOICE_NOVA: VoiceInfo = {
  id: 'nova',
  name: 'Nova',
  description: 'Warm, calming female voice with a gentle pace',
  best_for: ['relaxation', 'sleep', 'anxiety'],
  preview_url: null,
};

export const MOCK_VOICE_ECHO: VoiceInfo = {
  id: 'echo',
  name: 'Echo',
  description: 'Deep, resonant male voice with grounding presence',
  best_for: ['focus', 'grounding', 'strength'],
  preview_url: null,
};

export const MOCK_VOICE_SHIMMER: VoiceInfo = {
  id: 'shimmer',
  name: 'Shimmer',
  description: 'Soft, ethereal voice perfect for visualization',
  best_for: ['visualization', 'creativity', 'peace'],
  preview_url: null,
};

export const MOCK_ALL_VOICES: VoiceInfo[] = [MOCK_VOICE_NOVA, MOCK_VOICE_ECHO, MOCK_VOICE_SHIMMER];

// =============================================================================
// Journaling Prompt Mocks
// =============================================================================

export const MOCK_PROMPT_REFLECTION: JournalingPrompt = {
  id: 'reflection-1',
  category: 'reflection',
  text: 'What moment from today stands out to you, and what made it significant?',
  follow_up_questions: ['How did this moment make you feel?', 'What did you learn about yourself?'],
  estimated_time_minutes: 10,
  best_for: ['daily awareness', 'self-discovery'],
};

export const MOCK_PROMPT_GRATITUDE: JournalingPrompt = {
  id: 'gratitude-1',
  category: 'gratitude',
  text: "Write about three things you're grateful for today and why each one matters to you.",
  follow_up_questions: [
    'How can you express appreciation for these things?',
    'What small joys did you notice?',
  ],
  estimated_time_minutes: 8,
  best_for: ['positivity', 'mindfulness'],
};

export const MOCK_PROMPT_PROCESSING: JournalingPrompt = {
  id: 'processing-1',
  category: 'processing',
  text: "What's weighing on your mind right now? Write freely about your thoughts and feelings.",
  follow_up_questions: [
    'What would you tell a friend in this situation?',
    'What do you need right now?',
  ],
  estimated_time_minutes: 15,
  best_for: ['emotional release', 'clarity'],
};

export const MOCK_PROMPT_GROWTH: JournalingPrompt = {
  id: 'growth-1',
  category: 'growth',
  text: 'Describe a recent challenge you faced. How did you handle it and what would you do differently?',
  follow_up_questions: [
    'What strengths did you discover?',
    'How will this shape future decisions?',
  ],
  estimated_time_minutes: 12,
  best_for: ['learning', 'resilience'],
};

export const MOCK_PROMPT_SELF_COMPASSION: JournalingPrompt = {
  id: 'self-compassion-1',
  category: 'self_compassion',
  text: "Write a kind letter to yourself about something you've been struggling with.",
  follow_up_questions: [
    'What would you say to comfort a friend in this situation?',
    'How can you show yourself more kindness?',
  ],
  estimated_time_minutes: 10,
  best_for: ['self-kindness', 'healing'],
};

export const MOCK_ALL_PROMPTS: JournalingPrompt[] = [
  MOCK_PROMPT_REFLECTION,
  MOCK_PROMPT_GRATITUDE,
  MOCK_PROMPT_PROCESSING,
  MOCK_PROMPT_GROWTH,
  MOCK_PROMPT_SELF_COMPASSION,
];

/** Get prompts by category */
export function getPromptsByCategory(category: JournalingCategory): JournalingPrompt[] {
  return MOCK_ALL_PROMPTS.filter((p) => p.category === category);
}

// =============================================================================
// Journal Entry Mocks
// =============================================================================

export const MOCK_JOURNAL_ENTRY_1: JournalEntry = {
  id: 'entry-1',
  user_id: 'user-123',
  conversation_id: 'conv-456',
  prompt_category: 'gratitude',
  prompt_text: "Write about three things you're grateful for today.",
  entry_text:
    "Today I'm grateful for the quiet morning I had with my coffee before everyone woke up. The stillness of those early hours gives me space to think and prepare for the day ahead. I'm also thankful for the supportive message my colleague sent me after a tough meeting - it reminded me that I'm not alone in navigating workplace challenges. Finally, I appreciate my body for getting me through another day, even when I felt tired.",
  mood_before: 3,
  mood_after: 4,
  shared_with_ai: true,
  word_count: 85,
  writing_duration_seconds: 420,
  is_favorite: true,
  created_at: '2024-01-15T08:30:00Z',
  updated_at: '2024-01-15T08:37:00Z',
};

export const MOCK_JOURNAL_ENTRY_2: JournalEntry = {
  id: 'entry-2',
  user_id: 'user-123',
  conversation_id: 'conv-789',
  prompt_category: 'processing',
  prompt_text: "What's weighing on your mind right now?",
  entry_text:
    "I've been feeling overwhelmed with the project deadline approaching. There's so much to do and not enough time. I keep second-guessing my decisions and wondering if I'm on the right track. Writing this out helps me see that a lot of my stress comes from fear of disappointing others rather than actual problems with the work itself.",
  mood_before: 2,
  mood_after: 3,
  shared_with_ai: false,
  word_count: 72,
  writing_duration_seconds: 380,
  is_favorite: false,
  created_at: '2024-01-14T19:45:00Z',
  updated_at: '2024-01-14T19:51:00Z',
};

export const MOCK_JOURNAL_ENTRY_3: JournalEntry = {
  id: 'entry-3',
  user_id: 'user-123',
  conversation_id: null,
  prompt_category: 'growth',
  prompt_text: 'Describe a recent challenge you faced.',
  entry_text:
    'Last week I had to give a presentation to the executive team. I was terrified beforehand, but I prepared thoroughly and practiced several times. During the presentation, I noticed my voice was shaky at first, but I took a deep breath and focused on my key points. By the end, I felt more confident. The feedback was positive, and I learned that I can handle high-pressure situations better than I thought.',
  mood_before: null,
  mood_after: 5,
  shared_with_ai: true,
  word_count: 89,
  writing_duration_seconds: 540,
  is_favorite: true,
  created_at: '2024-01-12T12:00:00Z',
  updated_at: '2024-01-12T12:09:00Z',
};

export const MOCK_JOURNAL_ENTRIES: JournalEntry[] = [
  MOCK_JOURNAL_ENTRY_1,
  MOCK_JOURNAL_ENTRY_2,
  MOCK_JOURNAL_ENTRY_3,
];

// =============================================================================
// Activity Content Mocks (JSON strings for MessageBubble)
// =============================================================================

/** Creates a JSON activity string for embedding in messages */
function createActivityContent(activity: object): string {
  return JSON.stringify(activity);
}

/** Breathing activity content (continuous style - historical) */
export const MOCK_BREATHING_ACTIVITY_CONTENT = createActivityContent({
  type: 'activity',
  activity: 'breathing',
  technique: {
    id: 'box',
    name: 'Box Breathing',
    description: 'Equal inhale, hold, exhale, hold pattern',
    durations: [4, 4, 4, 4],
  },
  introduction: "Let's practice some calming box breathing together.",
});

/** Wim Hof breathing activity content */
export const MOCK_WIM_HOF_ACTIVITY_CONTENT = createActivityContent({
  type: 'activity',
  activity: 'breathing_wim_hof',
  technique: {
    id: 'wim_hof_beginner',
    name: 'Beginner Wim Hof',
    description: 'Introduction to Wim Hof breathing method',
    breathing_rounds: 2,
    breaths_per_round: 15,
    retention_target_seconds: 30,
    recovery_breath_seconds: 15,
    breathing_pace: 'moderate',
  },
  introduction: "Ready to energize? Let's try the Wim Hof breathing technique.",
  is_first_time: true,
});

/** Meditation activity content */
export const MOCK_MEDITATION_ACTIVITY_CONTENT = createActivityContent({
  type: 'activity',
  activity: 'meditation',
  track: {
    id: 'calm-morning',
    title: 'Calm Morning',
    description: 'Start your day with peace and clarity',
    duration_minutes: 5,
    audio_url: '/audio/meditations/calm-morning.mp3',
    category: 'morning',
    voice: 'nova',
  },
  introduction: 'Here is a gentle meditation to help you start your day.',
});

/** AI-generated meditation activity content */
export const MOCK_AI_MEDITATION_ACTIVITY_CONTENT = createActivityContent({
  type: 'activity',
  activity: 'meditation_ai_generated',
  meditation_text:
    'Close your eyes and take a deep breath. Feel the tension in your shoulders begin to release...',
  voice_id: 'nova',
  duration_minutes: 5,
  theme: 'stress_relief',
  introduction: "I've created a personalized meditation just for you.",
});

/** Journaling activity content */
export const MOCK_JOURNALING_ACTIVITY_CONTENT = createActivityContent({
  type: 'activity',
  activity: 'journaling',
  status: 'ready',
  prompt: MOCK_PROMPT_REFLECTION,
  introduction: 'Taking time to reflect can help you gain clarity and insight.',
  enable_sharing: true,
  conversation_context: 'User mentioned wanting to process their thoughts.',
});

// =============================================================================
// Interrupt Payload Mocks
// =============================================================================

/** Breathing confirmation HITL payload */
export const MOCK_BREATHING_INTERRUPT = {
  type: 'breathing_confirmation' as const,
  proposed_technique: MOCK_BOX_BREATHING,
  message: "Let's take a moment to practice some calming breathing together.",
  available_techniques: MOCK_ALL_BREATHING_TECHNIQUES,
  options: ['start', 'change_technique', 'not_now'] as ('start' | 'change_technique' | 'not_now')[],
};

/** Voice selection HITL payload */
export const MOCK_VOICE_INTERRUPT = {
  type: 'voice_selection' as const,
  message: "I'll create a personalized meditation for you. Which voice would you like?",
  available_voices: MOCK_ALL_VOICES,
  recommended_voice: 'nova',
  meditation_preview: 'A calming meditation to help you find peace and release tension...',
  duration_minutes: 5,
};

/** Journaling confirmation HITL payload */
export const MOCK_JOURNALING_INTERRUPT = {
  type: 'journaling_confirmation' as const,
  proposed_prompt: MOCK_PROMPT_REFLECTION,
  message:
    'Writing can be a powerful way to process your thoughts. I have a prompt that might help.',
  available_prompts: MOCK_ALL_PROMPTS,
  options: ['start', 'change_prompt', 'not_now'] as ('start' | 'change_prompt' | 'not_now')[],
};

// =============================================================================
// Conversation Mocks
// =============================================================================

/** Sample conversation with multiple messages */
export const MOCK_CONVERSATION_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: "Hello! I'm Wbot, your wellness companion. How are you feeling today?",
    createdAt: new Date('2024-01-15T10:00:00'),
  },
  {
    id: 'msg-2',
    role: 'user',
    content: "I've been feeling a bit anxious about an upcoming presentation.",
    createdAt: new Date('2024-01-15T10:00:30'),
  },
  {
    id: 'msg-3',
    role: 'assistant',
    content:
      'I understand - presentation anxiety is really common. It shows you care about doing well. Would you like to try a quick breathing exercise? It can help calm your nervous system before big moments.',
    createdAt: new Date('2024-01-15T10:01:00'),
  },
  {
    id: 'msg-4',
    role: 'user',
    content: 'Yes, that sounds helpful.',
    createdAt: new Date('2024-01-15T10:01:30'),
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

/** Create a message with activity content embedded */
export function createActivityMessage(activityContent: string, intro?: string): Message {
  return {
    id: `msg-activity-${String(Date.now())}`,
    role: 'assistant',
    content: intro ? `${intro}\n\n${activityContent}` : activityContent,
    createdAt: new Date(),
  };
}

/** Create a mock message with custom content */
export function createMockMessage(role: 'user' | 'assistant' | 'system', content: string): Message {
  return {
    id: `msg-${role}-${String(Date.now())}`,
    role,
    content,
    createdAt: new Date(),
  };
}
