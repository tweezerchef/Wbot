/* ============================================================================
   Signup & Onboarding Page
   ============================================================================
   Multi-step registration flow with Google Auth and preference questions.

   Flow:
   1. Google Sign In (via Supabase Auth)
   2. Multiple-choice onboarding questions (8 questions)
   3. Redirect to chat with personalized experience

   Design principles:
   - All questions are multiple choice (button selection)
   - No text input required (easy for users)
   - Responses stored in user profile for AI personalization
   - Progress indicator shows current step

   The questions are designed to help the AI:
   - Understand the user's current emotional state
   - Learn their preferences for interaction style
   - Identify their goals and challenges
   - Tailor activities (breathing, meditation) appropriately
   ============================================================================ */

import { useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';

import { supabase } from '../../../lib/supabase';

import styles from './SignupPage.module.css';

/* ----------------------------------------------------------------------------
   Onboarding Questions Configuration
   ----------------------------------------------------------------------------
   Each question has:
   - id: Unique identifier (stored in preferences JSON)
   - question: The question text
   - subtext: Optional helper text
   - multiSelect: If true, user can select multiple options
   - options: Array of button options with label and value

   These questions are carefully designed to:
   1. Build rapport (starting with current feelings)
   2. Understand goals and challenges
   3. Learn communication preferences
   4. Assess experience level with wellness practices
   ---------------------------------------------------------------------------- */
const ONBOARDING_QUESTIONS = [
  {
    id: 'current_feeling',
    question: 'How are you feeling right now?',
    subtext: 'There are no wrong answers. Just be honest.',
    options: [
      { label: 'Great, just exploring', value: 'great' },
      { label: 'Okay, but could be better', value: 'okay' },
      { label: 'Stressed or overwhelmed', value: 'stressed' },
      { label: 'Anxious or worried', value: 'anxious' },
      { label: 'Sad or down', value: 'sad' },
      { label: 'Numb or disconnected', value: 'numb' },
    ],
  },
  {
    id: 'primary_goal',
    question: 'What brings you here today?',
    subtext: 'Select your main goal',
    options: [
      { label: 'Manage stress & anxiety', value: 'stress_anxiety' },
      { label: 'Improve my mood', value: 'mood' },
      { label: 'Sleep better', value: 'sleep' },
      { label: 'Process difficult emotions', value: 'emotions' },
      { label: 'Build better habits', value: 'habits' },
      { label: 'Personal growth & self-discovery', value: 'growth' },
      { label: 'Just need someone to talk to', value: 'talk' },
    ],
  },
  {
    id: 'challenges',
    question: 'What challenges do you face most often?',
    subtext: 'Select all that apply',
    multiSelect: true,
    options: [
      { label: 'Racing thoughts', value: 'racing_thoughts' },
      { label: 'Trouble sleeping', value: 'sleep_issues' },
      { label: 'Work or school stress', value: 'work_stress' },
      { label: 'Relationship difficulties', value: 'relationships' },
      { label: 'Low motivation', value: 'low_motivation' },
      { label: 'Negative self-talk', value: 'negative_self_talk' },
      { label: 'Feeling isolated', value: 'isolation' },
      { label: 'Difficulty focusing', value: 'focus' },
    ],
  },
  {
    id: 'communication_style',
    question: 'How do you prefer to communicate?',
    options: [
      { label: 'Direct and to the point', value: 'direct' },
      { label: 'Warm and conversational', value: 'warm' },
      { label: 'Thoughtful and reflective', value: 'reflective' },
      { label: 'Structured with clear steps', value: 'structured' },
    ],
  },
  {
    id: 'support_type',
    question: 'What kind of support helps you most?',
    options: [
      { label: 'Someone to listen without judgment', value: 'listening' },
      { label: 'Practical advice and strategies', value: 'advice' },
      { label: 'Encouragement and validation', value: 'encouragement' },
      { label: 'Help understanding my feelings', value: 'understanding' },
      { label: 'Guidance through exercises', value: 'guided' },
    ],
  },
  {
    id: 'preferred_activities',
    question: 'What interests you most?',
    subtext: 'Select all that apply',
    multiSelect: true,
    options: [
      { label: 'Talking through my thoughts', value: 'chat' },
      { label: 'Breathing exercises', value: 'breathing' },
      { label: 'Guided meditation', value: 'meditation' },
      { label: 'Journaling prompts', value: 'journaling' },
      { label: 'Grounding techniques', value: 'grounding' },
      { label: 'Mood tracking', value: 'mood_tracking' },
    ],
  },
  {
    id: 'experience_level',
    question: 'Have you tried therapy or wellness apps before?',
    options: [
      { label: 'This is my first time', value: 'first_time' },
      { label: "I've tried apps but didn't stick with them", value: 'tried_apps' },
      { label: "I've done some therapy before", value: 'some_therapy' },
      { label: 'I practice wellness regularly', value: 'regular_practice' },
    ],
  },
  {
    id: 'session_length',
    question: 'How much time can you dedicate per session?',
    options: [
      { label: 'Just a few minutes', value: 'few_minutes' },
      { label: '5-10 minutes', value: 'short' },
      { label: '10-20 minutes', value: 'medium' },
      { label: '20+ minutes', value: 'long' },
      { label: 'It depends on the day', value: 'flexible' },
    ],
  },
] as const;

/* ----------------------------------------------------------------------------
   Types
   ---------------------------------------------------------------------------- */
type QuestionId = (typeof ONBOARDING_QUESTIONS)[number]['id'];
// Use a more flexible type for collecting preferences during onboarding
// These get converted to UserPreferences when saving
type OnboardingPreferences = Partial<Record<QuestionId, string | string[]>>;

/* ----------------------------------------------------------------------------
   Signup Page Component
   ---------------------------------------------------------------------------- */

export function SignupPage() {
  const navigate = useNavigate();

  // Current step: 'auth' for sign-in, or question index (0, 1, 2, ...)
  const [step, setStep] = useState<'auth' | number>('auth');

  // User's answers to onboarding questions
  const [preferences, setPreferences] = useState<OnboardingPreferences>({});

  // Loading state for async operations
  const [isLoading, setIsLoading] = useState(false);

  // Error message display
  const [error, setError] = useState<string | null>(null);

  // Email/password auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);

  /* --------------------------------------------------------------------------
     Check for existing session on mount
     --------------------------------------------------------------------------
     If user returns from OAuth redirect, they'll have a session.
     Move them to the first question.
     -------------------------------------------------------------------------- */
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // Check if user has already completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', session.user.id)
          .single();

        // If they have preferences, they've completed onboarding
        const preferences = profile?.preferences as Record<string, unknown> | null;
        if (preferences && Object.keys(preferences).length > 0) {
          void navigate({ to: '/chat' });
        } else {
          // Start onboarding questions
          setStep(0);
        }
      }
    };

    void checkSession();
  }, [navigate]);

  /* --------------------------------------------------------------------------
     Google Sign In Handler
     -------------------------------------------------------------------------- */
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Initiate Google OAuth via Supabase
      // This redirects to Google, then back to our app
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirect back to this page after auth
          redirectTo: `${window.location.origin}/signup`,
        },
      });

      if (authError) {
        throw authError;
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  /* --------------------------------------------------------------------------
     Email/Password Auth Handlers
     -------------------------------------------------------------------------- */
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Sign up with email/password
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          throw signUpError;
        }

        // After sign up, move to onboarding questions
        setStep(0);
      } else {
        // Sign in with email/password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        // Check if user has completed onboarding
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('preferences')
            .eq('id', user.id)
            .single();

          if (profile?.preferences && Object.keys(profile.preferences).length > 0) {
            void navigate({ to: '/chat' });
          } else {
            setStep(0);
          }
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  /* --------------------------------------------------------------------------
     Handle Answer Selection
     -------------------------------------------------------------------------- */
  const handleSelectOption = (questionId: QuestionId, value: string, isMultiSelect: boolean) => {
    setError(null); // Clear any previous error

    setPreferences((prev) => {
      if (isMultiSelect) {
        // For multi-select, toggle the value in an array
        const current = (prev[questionId] ?? []) as string[];
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return { ...prev, [questionId]: updated };
      }
      // For single-select, just set the value and auto-advance
      return { ...prev, [questionId]: value };
    });

    // Auto-advance for single-select questions after a brief delay
    if (!isMultiSelect && typeof step === 'number') {
      setTimeout(() => {
        if (step < ONBOARDING_QUESTIONS.length - 1) {
          setStep(step + 1);
        } else {
          void savePreferencesAndRedirect();
        }
      }, 300);
    }
  };

  /* --------------------------------------------------------------------------
     Handle Next/Continue Button (for multi-select questions)
     -------------------------------------------------------------------------- */
  const handleNext = async () => {
    if (typeof step !== 'number') {
      return;
    }

    const currentQuestion = ONBOARDING_QUESTIONS[step];
    const answer = preferences[currentQuestion.id];

    // Validate that an answer was selected
    if (!answer || (Array.isArray(answer) && answer.length === 0)) {
      setError('Please select at least one option to continue.');
      return;
    }

    setError(null);

    // Check if this is the last question
    if (step === ONBOARDING_QUESTIONS.length - 1) {
      await savePreferencesAndRedirect();
    } else {
      setStep(step + 1);
    }
  };

  /* --------------------------------------------------------------------------
     Handle Back Button
     -------------------------------------------------------------------------- */
  const handleBack = () => {
    if (typeof step === 'number' && step > 0) {
      setStep(step - 1);
      setError(null);
    }
  };

  /* --------------------------------------------------------------------------
     Save Preferences and Redirect
     -------------------------------------------------------------------------- */
  const savePreferencesAndRedirect = async () => {
    setIsLoading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Update the user's profile with their preferences
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Redirect to chat
      void navigate({ to: '/chat' });
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setError('Failed to save your preferences. Please try again.');
      setIsLoading(false);
    }
  };

  /* --------------------------------------------------------------------------
     Render: Auth Step
     -------------------------------------------------------------------------- */
  if (step === 'auth') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Header */}
          <h1 className={styles.title}>Welcome to TBot</h1>
          <p className={styles.subtitle}>
            Your personal companion for mindful reflection and wellness
          </p>

          {/* Error message */}
          {error && <p className={styles.error}>{error}</p>}

          {/* Email/Password Form */}
          <form
            onSubmit={(e) => {
              void handleEmailAuth(e);
            }}
            className={styles.authForm}
          >
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                className={styles.input}
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                className={styles.input}
                placeholder="At least 6 characters"
                minLength={6}
                required
                disabled={isLoading}
              />
            </div>

            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Log In'}
            </button>
          </form>

          {/* Toggle between Sign Up and Log In */}
          <button
            type="button"
            className={styles.toggleLink}
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            disabled={isLoading}
          >
            {isSignUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
          </button>

          {/* Divider */}
          <div className={styles.divider}>
            <span>or</span>
          </div>

          {/* Google Sign In Button */}
          <button
            className={styles.googleButton}
            onClick={() => {
              void handleGoogleSignIn();
            }}
            disabled={isLoading}
          >
            {/* Google Icon */}
            <svg className={styles.googleIcon} viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Terms disclaimer */}
          <p className={styles.terms}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------------------
     Render: Onboarding Questions
     -------------------------------------------------------------------------- */
  const currentQuestion = ONBOARDING_QUESTIONS[step];
  const currentAnswer = preferences[currentQuestion.id];
  const isMultiSelect = 'multiSelect' in currentQuestion && currentQuestion.multiSelect;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Progress indicator */}
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${String(((step + 1) / ONBOARDING_QUESTIONS.length) * 100)}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {step + 1} of {ONBOARDING_QUESTIONS.length}
          </span>
        </div>

        {/* Question */}
        <h2 className={styles.question}>{currentQuestion.question}</h2>
        {'subtext' in currentQuestion && (
          <p className={styles.subtext}>{currentQuestion.subtext}</p>
        )}

        {/* Error message */}
        {error && <p className={styles.error}>{error}</p>}

        {/* Options */}
        <div className={styles.options}>
          {currentQuestion.options.map((option) => {
            // Check if this option is selected
            const isSelected = isMultiSelect
              ? (currentAnswer as string[] | undefined)?.includes(option.value)
              : currentAnswer === option.value;

            return (
              <button
                key={option.value}
                className={`${styles.optionButton} ${isSelected ? styles.optionButtonSelected : ''}`}
                onClick={() => {
                  handleSelectOption(currentQuestion.id, option.value, isMultiSelect);
                }}
              >
                {option.label}
                {isMultiSelect && isSelected && <span className={styles.checkmark}>✓</span>}
              </button>
            );
          })}
        </div>

        {/* Navigation buttons */}
        <div className={styles.navigation}>
          {step > 0 && (
            <button className={styles.backButton} onClick={handleBack} disabled={isLoading}>
              Back
            </button>
          )}

          {/* Only show continue button for multi-select questions */}
          {isMultiSelect && (
            <button
              className={styles.continueButton}
              onClick={() => {
                void handleNext();
              }}
              disabled={
                isLoading ||
                !currentAnswer ||
                (Array.isArray(currentAnswer) && currentAnswer.length === 0)
              }
            >
              {isLoading
                ? 'Saving...'
                : step === ONBOARDING_QUESTIONS.length - 1
                  ? 'Start Chatting'
                  : 'Continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
