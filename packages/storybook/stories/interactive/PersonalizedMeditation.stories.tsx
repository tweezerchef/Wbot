import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { fn } from 'storybook/test';

import { PersonalizedMeditation } from '@/components/GuidedMeditation';
import type {
  MeditationPersonalization,
  PersonalizedMeditationProps,
  PersonalizedScript,
} from '@/components/GuidedMeditation';
import { supabase } from '@/lib/supabase';

// Create a client for Storybook stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

// =============================================================================
// Auth Helper
// =============================================================================

/**
 * Hook to get auth token from Supabase session.
 * Storybook shares localStorage with the domain, so signing in via this helper
 * will persist the session for all stories.
 */
function useStorybookAuth() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getSession() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) {
          setError(sessionError.message);
        } else if (session) {
          setAuthToken(session.access_token);
          setUser({ email: session.user.email });
        }
        // No error if no session - user just needs to sign in
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get session');
      } finally {
        setLoading(false);
      }
    }
    void getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthToken(session.access_token);
        setUser({ email: session.user.email });
        setError(null);
      } else {
        setAuthToken(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { authToken, user, loading, error };
}

// =============================================================================
// Scripts (matching database/migrations/007_meditation_scripts.sql)
// =============================================================================

const SCRIPTS: Record<string, PersonalizedScript> = {
  breathing_custom_5min: {
    id: 'breathing_custom_5min',
    title: 'Personalized Breathing Meditation',
    type: 'breathing_focus',
    durationEstimateSeconds: 300,
    language: 'en',
    placeholders: { name: 'USER_NAME' },
  },
  body_scan_custom_10min: {
    id: 'body_scan_custom_10min',
    title: 'Personalized Body Scan',
    type: 'body_scan',
    durationEstimateSeconds: 600,
    language: 'en',
    placeholders: { name: 'USER_NAME' },
  },
  loving_kindness_custom: {
    id: 'loving_kindness_custom',
    title: 'Personalized Loving Kindness',
    type: 'loving_kindness',
    durationEstimateSeconds: 480,
    language: 'en',
    placeholders: { name: 'USER_NAME' },
  },
  sleep_custom: {
    id: 'sleep_custom',
    title: 'Personalized Sleep Meditation',
    type: 'sleep',
    durationEstimateSeconds: 900,
    language: 'en',
    placeholders: { name: 'USER_NAME' },
  },
  anxiety_relief_custom: {
    id: 'anxiety_relief_custom',
    title: 'Personalized Anxiety Relief',
    type: 'anxiety_relief',
    durationEstimateSeconds: 420,
    language: 'en',
    placeholders: { name: 'USER_NAME' },
  },
};

// =============================================================================
// Authenticated Wrapper Component
// =============================================================================

/**
 * Wrapper that handles authentication and passes the token to PersonalizedMeditation.
 * Shows sign-in prompt if not authenticated.
 */
function AuthenticatedPersonalizedMeditation(
  props: Omit<PersonalizedMeditationProps, 'authToken'>
) {
  const { authToken, user, loading, error } = useStorybookAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    setSignInError(null);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setSignInError(signInErr.message);
      }
    } catch (err) {
      setSignInError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
        Checking authentication...
      </div>
    );
  }

  // Show sign-in form if not authenticated
  if (!authToken) {
    return (
      <div
        style={{
          width: '400px',
          padding: '24px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>🔐 Sign In Required</h3>
        <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#666' }}>
          Sign in with your Supabase credentials to test TTS generation.
        </p>

        {(error ?? signInError) && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '13px',
            }}
          >
            {signInError ?? error}
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            placeholder="Email"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            placeholder="Password"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void handleSignIn();
              }
            }}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          onClick={() => {
            void handleSignIn();
          }}
          disabled={signingIn || !email || !password}
          style={{
            width: '100%',
            padding: '12px',
            background: signingIn ? '#ccc' : 'linear-gradient(135deg, #8a89c4 0%, #a6ccb2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: signingIn ? 'not-allowed' : 'pointer',
          }}
        >
          {signingIn ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={{ margin: '16px 0 0', fontSize: '12px', color: '#999', textAlign: 'center' }}>
          Use credentials from your local Supabase instance
        </p>
      </div>
    );
  }

  // Authenticated - show the meditation with sign out option
  return (
    <div style={{ width: '400px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          padding: '8px 12px',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          fontSize: '13px',
        }}
      >
        <span style={{ color: '#166534' }}>✓ Signed in as {user?.email}</span>
        <button
          onClick={() => {
            void handleSignOut();
          }}
          style={{
            padding: '4px 8px',
            background: 'transparent',
            border: '1px solid #166534',
            borderRadius: '4px',
            color: '#166534',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>
      <PersonalizedMeditation {...props} authToken={authToken} />
    </div>
  );
}

/**
 * Personalized meditation component with TTS-generated audio via OpenAI.
 *
 * **⚠️ Requirements:**
 * 1. Backend running: `pnpm dev:ai`
 * 2. `OPENAI_API_KEY` configured in `.env`
 * 3. Sign in within Storybook (form provided)
 *
 * Features:
 * - Dynamic TTS generation with loading state
 * - Personalization with user's name and goals
 * - Script placeholders ({{USER_NAME}}, {{USER_GOAL}})
 * - All standard meditation features (ambient sounds, mood tracking)
 * - Audio caching for repeated meditations
 */
const meta: Meta<typeof PersonalizedMeditation> = {
  title: 'Interactive/PersonalizedMeditation',
  component: PersonalizedMeditation,
  decorators: [
    (Story): ReactElement => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'wellness' },
    docs: {
      description: {
        component: `
Personalized meditation component with TTS-generated audio via OpenAI.

## ⚠️ Requirements

1. **Backend running:** \`pnpm dev:ai\`
2. **OpenAI API key:** Set \`OPENAI_API_KEY\` in your \`.env\`
3. **Sign in:** Use the sign-in form that appears in each story

## Authentication

Each story includes a sign-in form. Once you sign in, your session persists
across all stories (stored in localStorage).

## API Flow

\`\`\`
POST /api/meditation/stream
{
  script_id: 'breathing_custom_5min',
  user_name: 'Sarah',
  user_goal: 'reducing stress'
}

→ Streams audio chunks from OpenAI TTS
→ Caches to Supabase Storage for future instant playback
\`\`\`

## Features
- Dynamic audio generation from meditation scripts
- Personalization with user's name and goals via placeholders
- Loading state with progress indication during generation
- Audio caching - repeated scripts play instantly
- All standard meditation features (ambient, mood tracking)
        `,
      },
    },
  },
  argTypes: {
    script: {
      control: 'select',
      options: Object.keys(SCRIPTS),
      mapping: SCRIPTS,
      description: 'The meditation script to generate',
    },
    enableAmbient: {
      control: 'boolean',
      description: 'Whether to enable ambient background sounds',
    },
    introduction: {
      control: 'text',
      description: 'Optional introduction text from the AI',
    },
  },
  args: {
    script: SCRIPTS.breathing_custom_5min,
    introduction: "I've created this meditation just for you. Let's begin.",
    enableAmbient: false,
    onComplete: fn(),
    onStop: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof PersonalizedMeditation>;

// =============================================================================
// Main Stories - All use real TTS generation with auth wrapper
// =============================================================================

/**
 * Default story - triggers real TTS generation.
 * Shows sign-in form if not authenticated, then generates audio via OpenAI TTS.
 */
export const Default: Story = {
  render: (args) => <AuthenticatedPersonalizedMeditation {...args} />,
  args: {
    script: SCRIPTS.breathing_custom_5min,
    personalization: { userName: 'Sarah' },
    introduction: "I'm creating a personalized breathing meditation just for you, Sarah.",
  },
  parameters: {
    docs: {
      description: {
        story: 'Sign in, then triggers real TTS generation via the backend.',
      },
    },
  },
};

/**
 * Personalized Breathing Focus meditation.
 * A 5-minute breathing meditation with the user's name.
 */
export const BreathingFocus: Story = {
  render: (args) => <AuthenticatedPersonalizedMeditation {...args} />,
  args: {
    script: SCRIPTS.breathing_custom_5min,
    personalization: { userName: 'Alex', userGoal: 'finding calm' },
    introduction: "Alex, let's take 5 minutes to focus on your breath and find some calm together.",
  },
};

/**
 * Personalized Body Scan meditation.
 * A 10-minute progressive relaxation.
 */
export const BodyScan: Story = {
  render: (args) => <AuthenticatedPersonalizedMeditation {...args} />,
  args: {
    script: SCRIPTS.body_scan_custom_10min,
    personalization: { userName: 'Jordan' },
    introduction: 'Jordan, this body scan will help you release tension from head to toe.',
  },
};

/**
 * Personalized Loving Kindness meditation.
 * An 8-minute compassion practice.
 */
export const LovingKindness: Story = {
  render: (args) => <AuthenticatedPersonalizedMeditation {...args} />,
  args: {
    script: SCRIPTS.loving_kindness_custom,
    personalization: { userName: 'Taylor', userGoal: 'self-compassion' },
    introduction: "Taylor, let's cultivate some loving kindness for yourself and others.",
  },
};

/**
 * Personalized Sleep meditation.
 * A 15-minute relaxation for bedtime.
 */
export const SleepMeditation: Story = {
  render: (args) => <AuthenticatedPersonalizedMeditation {...args} />,
  args: {
    script: SCRIPTS.sleep_custom,
    personalization: { userName: 'Morgan' },
    introduction: 'Good night, Morgan. This meditation will help you drift into restful sleep.',
  },
};

/**
 * Personalized Anxiety Relief meditation.
 * A 7-minute grounding practice.
 */
export const AnxietyRelief: Story = {
  render: (args) => <AuthenticatedPersonalizedMeditation {...args} />,
  args: {
    script: SCRIPTS.anxiety_relief_custom,
    personalization: { userName: 'Casey', userGoal: 'managing anxiety' },
    introduction: "Casey, I'm here with you. Let's work through this anxiety together.",
  },
};

// =============================================================================
// Personalization Variants
// =============================================================================

/**
 * With full personalization (name + goal).
 */
export const FullPersonalization: Story = {
  render: (args) => <AuthenticatedPersonalizedMeditation {...args} />,
  args: {
    script: SCRIPTS.breathing_custom_5min,
    personalization: {
      userName: 'Emma',
      userGoal: 'reducing work stress',
    },
    introduction: "Emma, I've created this meditation specifically for reducing work stress.",
  },
  parameters: {
    docs: {
      description: {
        story: 'Meditation with both user name and goal placeholders filled in the script.',
      },
    },
  },
};

/**
 * Without personalization (anonymous).
 */
export const WithoutPersonalization: Story = {
  render: (args) => <AuthenticatedPersonalizedMeditation {...args} />,
  args: {
    script: SCRIPTS.breathing_custom_5min,
    personalization: undefined,
    introduction: "Here's a custom meditation I've created for you.",
  },
  parameters: {
    docs: {
      description: {
        story: 'Meditation without personalization - user name placeholder is removed from script.',
      },
    },
  },
};

/**
 * Without introduction text.
 */
export const NoIntroduction: Story = {
  render: (args) => <AuthenticatedPersonalizedMeditation {...args} />,
  args: {
    script: SCRIPTS.body_scan_custom_10min,
    personalization: { userName: 'Chris' },
    introduction: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Personalized meditation without an introduction message from the AI.',
      },
    },
  },
};

// =============================================================================
// Feature Stories
// =============================================================================

/**
 * With ambient sounds enabled.
 */
export const WithAmbientSounds: Story = {
  render: (args) => <AuthenticatedPersonalizedMeditation {...args} />,
  args: {
    script: SCRIPTS.breathing_custom_5min,
    personalization: { userName: 'Riley' },
    introduction: "Riley, let's meditate with some soothing background sounds.",
    enableAmbient: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Personalized meditation with ambient sound mixer enabled (ocean, rain, forest options).',
      },
    },
  },
};

// =============================================================================
// All Scripts Overview
// =============================================================================

/**
 * Overview of all available personalization scripts.
 */
export const AllScripts: Story = {
  render: () => {
    const scripts = Object.values(SCRIPTS);

    const TYPE_ICONS: Record<string, string> = {
      body_scan: '🧘',
      loving_kindness: '💛',
      breathing_focus: '🌬️',
      sleep: '😴',
      anxiety_relief: '🌿',
      daily_mindfulness: '✨',
    };

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          maxWidth: '700px',
        }}
      >
        {scripts.map((script) => (
          <div
            key={script.id}
            style={{
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>{TYPE_ICONS[script.type]}</span>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#404040' }}>{script.title}</h3>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '2px 8px',
                  fontSize: '12px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  borderRadius: '4px',
                }}
              >
                {Math.floor(script.durationEstimateSeconds / 60)} min
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  fontSize: '12px',
                  backgroundColor: '#e0e7ff',
                  color: '#3730a3',
                  borderRadius: '4px',
                }}
              >
                {script.type.replace(/_/g, ' ')}
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  fontSize: '12px',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  borderRadius: '4px',
                }}
              >
                ✨ TTS
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Overview of all 5 available TTS meditation scripts with their types and durations.',
      },
    },
  },
};

// =============================================================================
// Interactive Demo
// =============================================================================

/**
 * Interactive demo with script selection and personalization input.
 * Actually generates audio via the backend when you click "Generate Meditation".
 */
export const InteractiveDemo: Story = {
  render: function InteractiveDemoComponent() {
    const { authToken, user, loading } = useStorybookAuth();
    const [scriptId, setScriptId] = useState<string>('breathing_custom_5min');
    const [userName, setUserName] = useState('');
    const [userGoal, setUserGoal] = useState('');
    const [showMeditation, setShowMeditation] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [signInError, setSignInError] = useState<string | null>(null);
    const [signingIn, setSigningIn] = useState(false);

    const handleSignIn = async () => {
      setSigningIn(true);
      setSignInError(null);
      try {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
          setSignInError(signInErr.message);
        }
      } catch (err) {
        setSignInError(err instanceof Error ? err.message : 'Sign in failed');
      } finally {
        setSigningIn(false);
      }
    };

    const handleSignOut = async () => {
      await supabase.auth.signOut();
    };

    const script = SCRIPTS[scriptId];
    const personalization: MeditationPersonalization | undefined =
      userName || userGoal
        ? {
            userName: userName || undefined,
            userGoal: userGoal || undefined,
          }
        : undefined;

    if (loading) {
      return (
        <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
          Checking authentication...
        </div>
      );
    }

    if (showMeditation && authToken) {
      return (
        <div style={{ width: '400px' }}>
          <button
            onClick={() => {
              setShowMeditation(false);
            }}
            style={{
              marginBottom: '16px',
              padding: '8px 16px',
              background: '#f5f5f5',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            ← Back to configuration
          </button>
          <PersonalizedMeditation
            script={script}
            personalization={personalization}
            authToken={authToken}
            introduction={
              userName
                ? `${userName}, I've created this meditation just for you.`
                : "I've created this meditation just for you."
            }
            onComplete={() => {
              console.warn('Meditation completed!');
              setShowMeditation(false);
            }}
            onStop={() => {
              console.warn('Meditation stopped');
              setShowMeditation(false);
            }}
          />
        </div>
      );
    }

    return (
      <div
        style={{
          width: '400px',
          padding: '24px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Configure Personalized Meditation</h3>

        {/* Auth Section */}
        {!authToken ? (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#92400e' }}>
              <strong>🔐 Sign in to generate TTS audio</strong>
            </p>
            {signInError && (
              <div
                style={{
                  padding: '8px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  fontSize: '12px',
                }}
              >
                {signInError}
              </div>
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              placeholder="Email"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '13px',
                boxSizing: 'border-box',
                marginBottom: '8px',
              }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              placeholder="Password"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleSignIn();
                }
              }}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '13px',
                boxSizing: 'border-box',
                marginBottom: '8px',
              }}
            />
            <button
              onClick={() => {
                void handleSignIn();
              }}
              disabled={signingIn || !email || !password}
              style={{
                width: '100%',
                padding: '8px',
                background: signingIn ? '#ccc' : '#92400e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                cursor: signingIn ? 'not-allowed' : 'pointer',
              }}
            >
              {signingIn ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              padding: '8px 12px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            <span style={{ color: '#166534' }}>✓ {user?.email}</span>
            <button
              onClick={() => {
                void handleSignOut();
              }}
              style={{
                padding: '4px 8px',
                background: 'transparent',
                border: '1px solid #166534',
                borderRadius: '4px',
                color: '#166534',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '4px' }}>
            Script Type
          </label>
          <select
            value={scriptId}
            onChange={(e) => {
              setScriptId(e.target.value);
            }}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
            }}
          >
            {Object.entries(SCRIPTS).map(([id, s]) => (
              <option key={id} value={id}>
                {s.title} ({Math.floor(s.durationEstimateSeconds / 60)} min)
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '4px' }}>
            Your Name (optional)
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
            }}
            placeholder="e.g., Sarah"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '4px' }}>
            Your Goal (optional)
          </label>
          <input
            type="text"
            value={userGoal}
            onChange={(e) => {
              setUserGoal(e.target.value);
            }}
            placeholder="e.g., reducing stress"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          onClick={() => {
            setShowMeditation(true);
          }}
          disabled={!authToken}
          style={{
            width: '100%',
            padding: '12px',
            background: authToken ? 'linear-gradient(135deg, #8a89c4 0%, #a6ccb2 100%)' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: authToken ? 'pointer' : 'not-allowed',
          }}
        >
          🎙️ Generate Meditation via TTS
        </button>

        {!authToken && (
          <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#999', textAlign: 'center' }}>
            Sign in above to enable generation
          </p>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo - sign in, configure, and generate real TTS audio via the backend.',
      },
    },
  },
};

// =============================================================================
// Mobile View
// =============================================================================

/**
 * Mobile responsive view.
 */
export const MobileView: Story = {
  render: (args) => <AuthenticatedPersonalizedMeditation {...args} />,
  args: {
    script: SCRIPTS.breathing_custom_5min,
    personalization: { userName: 'Sam' },
    introduction: "Sam, here's your personalized meditation.",
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Personalized meditation at mobile viewport width.',
      },
    },
  },
};
