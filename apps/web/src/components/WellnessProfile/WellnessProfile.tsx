/* ============================================================================
   WellnessProfile Component
   ============================================================================
   Displays the user's wellness profile with stats, trends, and insights.

   Features:
   - Emotional baseline indicator
   - Conversation and activity stats
   - Recurring topics and triggers
   - Activity effectiveness recommendations
   ============================================================================ */

import { useEffect, useState, useMemo } from 'react';

import type {
  WellnessProfile as WellnessProfileType,
  WellnessProfileProps,
  WellnessStats,
} from './types';
import { getBaselineLabel, getBaselineColor } from './types';
import styles from './WellnessProfile.module.css';

import { supabase } from '@/lib/supabase';

/**
 * WellnessProfile - Displays user wellness data
 *
 * Fetches and displays the user's wellness profile including:
 * - Emotional baseline with visual indicator
 * - Usage statistics (conversations, activities, engagement)
 * - Recurring topics and triggers
 * - Recommended activities based on effectiveness
 */
export function WellnessProfile({
  userId,
  onLoaded,
  showLoading = true,
  compact = false,
}: WellnessProfileProps) {
  const [profile, setProfile] = useState<WellnessProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile on mount or when userId changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        // Get current user if no userId provided
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          setError('Not authenticated');
          return;
        }
        await loadProfile(user.id);
      } else {
        await loadProfile(userId);
      }
    };

    const loadProfile = async (uid: string) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('user_wellness_profiles')
          .select('*')
          .eq('user_id', uid)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        setProfile(data);
        onLoaded?.(data);
      } catch (err) {
        console.error('Failed to fetch wellness profile:', err);
        setError('Failed to load wellness profile');
        onLoaded?.(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [userId, onLoaded]);

  // Calculate stats from profile
  const stats = useMemo((): WellnessStats | null => {
    if (!profile) {
      return null;
    }

    const firstInteractionAt = profile.first_interaction_at
      ? new Date(profile.first_interaction_at)
      : null;

    const daysActive = firstInteractionAt
      ? Math.floor((Date.now() - firstInteractionAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      totalConversations: profile.total_conversations ?? 0,
      totalActivitiesCompleted: profile.total_activities_completed ?? 0,
      totalEngagementMinutes: profile.total_engagement_minutes ?? 0,
      emotionalBaseline: profile.emotional_baseline ?? 'neutral',
      firstInteractionAt,
      daysActive,
    };
  }, [profile]);

  // Loading state
  if (loading && showLoading) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  // No profile yet
  if (!profile || !stats) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No wellness data yet</p>
          <p className={styles.emptyMessage}>
            Your wellness profile will build as you have more conversations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      {/* Header with emotional baseline */}
      <div className={styles.header}>
        <h3 className={styles.title}>Your Wellness Profile</h3>
        <div className={styles.baseline}>
          <span
            className={styles.baselineIndicator}
            style={{ backgroundColor: getBaselineColor(stats.emotionalBaseline) }}
          />
          <span className={styles.baselineLabel}>{getBaselineLabel(stats.emotionalBaseline)}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.totalConversations}</span>
          <span className={styles.statLabel}>Conversations</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.totalActivitiesCompleted}</span>
          <span className={styles.statLabel}>Activities</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.daysActive}</span>
          <span className={styles.statLabel}>Days Active</span>
        </div>
      </div>

      {/* Recurring topics */}
      {profile.recurring_topics && profile.recurring_topics.length > 0 && !compact && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Topics You Discuss</h4>
          <div className={styles.tags}>
            {profile.recurring_topics.slice(0, 5).map((topic) => (
              <span key={topic} className={styles.tag}>
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recurring triggers */}
      {profile.recurring_triggers && profile.recurring_triggers.length > 0 && !compact && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Identified Triggers</h4>
          <div className={styles.tags}>
            {profile.recurring_triggers.slice(0, 5).map((trigger) => (
              <span key={trigger} className={`${styles.tag} ${styles.triggerTag}`}>
                {trigger}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Current concern */}
      {profile.current_primary_concern && !compact && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Current Focus</h4>
          <p className={styles.concern}>{profile.current_primary_concern}</p>
        </div>
      )}

      {/* Improvements noted */}
      {profile.improvements_noted && profile.improvements_noted.length > 0 && !compact && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Progress Made</h4>
          <ul className={styles.improvementsList}>
            {profile.improvements_noted.slice(0, 3).map((improvement, index) => (
              <li key={index} className={styles.improvement}>
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
