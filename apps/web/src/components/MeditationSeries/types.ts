/* MeditationSeries Types */

export interface MeditationSeries {
  id: string;
  title: string;
  description: string;
  trackIds: string[];
  badgeName: string;
  badgeEmoji: string;
  totalDurationSeconds: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface SeriesProgress {
  seriesId: string;
  completedTrackIds: string[];
  currentTrackIndex: number;
  startedAt: string;
  completedAt: string | null;
  badgeEarned: boolean;
}

export interface UserBadge {
  id: string;
  badgeName: string;
  badgeEmoji: string;
  sourceType: 'series' | 'streak' | 'milestone';
  sourceId: string | null;
  earnedAt: string;
}
