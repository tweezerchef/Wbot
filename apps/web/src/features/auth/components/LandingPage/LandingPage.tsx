/* ============================================================================
   Landing Page - Entry Point
   ============================================================================
   This is the entry point for the application.

   Behavior:
   - Unauthenticated users: See welcome page with "Get Started" button
   - Authenticated users: Automatically redirected to /chat

   The page checks for an existing Supabase session on load and redirects
   accordingly.
   ============================================================================ */

import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { supabase } from '../../../../lib/supabase';

import styles from './LandingPage.module.css';

/* ----------------------------------------------------------------------------
   Landing Page Component
   ---------------------------------------------------------------------------- */

/**
 * Landing page with session-based routing.
 *
 * Behavior:
 * - Checks for existing Supabase session on mount
 * - If authenticated, redirects to /chat
 * - If not authenticated, shows welcome content with signup button
 *
 * This ensures users who are already logged in don't see the landing page.
 */
export function LandingPage() {
  const navigate = useNavigate();

  // Loading state while checking session
  const [isLoading, setIsLoading] = useState(true);

  /* --------------------------------------------------------------------------
     Session Check on Mount
     --------------------------------------------------------------------------
     Check if user is already authenticated. If so, redirect to chat.
     This prevents showing the landing page to logged-in users.
     -------------------------------------------------------------------------- */
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // User is authenticated, check if they completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', session.user.id)
          .single();

        // Check if preferences exist and have content
        const preferences = profile?.preferences as Record<string, unknown> | null;
        if (preferences && Object.keys(preferences).length > 0) {
          // Completed onboarding, go to chat
          void navigate({ to: '/chat' });
        } else {
          // Needs to complete onboarding
          void navigate({ to: '/signup' });
        }
      } else {
        // Not authenticated, show landing page
        setIsLoading(false);
      }
    };

    void checkSession();
  }, [navigate]);

  // Show nothing while checking session to prevent flash
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hero section with app branding */}
      <section className={styles.hero}>
        {/* App logo/name */}
        <h1 className={styles.title}>Wbot</h1>

        {/* App tagline - calming and welcoming */}
        <p className={styles.tagline}>
          Your personal companion for mindful reflection and wellness
        </p>

        {/* Brief description of what the app offers */}
        <p className={styles.description}>
          Chat with an AI wellness companion, practice breathing exercises, guided meditation, and
          reflective journaling — all in one supportive space.
        </p>
      </section>

      {/* Call to action */}
      <section className={styles.cta}>
        {/* Link to signup/onboarding flow */}
        <a href="/signup" className={styles.button}>
          Get Started
        </a>

        <p className={styles.disclaimer}>Free to use. Your conversations are private.</p>
      </section>
    </div>
  );
}
