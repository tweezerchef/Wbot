/**
 * useActivityOverlays Hook
 *
 * Manages state for activity overlays including:
 * - Immersive breathing exercises (HITL flow)
 * - Direct activities from sidebar navigation
 * - Pre-recorded meditation player
 */

import type { MeditationTrack } from '@wbot/shared';
import { useState, useCallback } from 'react';

import type { ActivityState } from '../types';

import type { DirectComponent } from '@/features/navigation/types';
import { isMobileViewport } from '@/lib/constants/breakpoints';

export interface UseActivityOverlaysOptions {
  /** Callback to focus the input field after closing an activity */
  onActivityClose?: () => void;
  /** Callback to close the sidebar on mobile */
  onCloseSidebar?: () => void;
}

export interface UseActivityOverlaysReturn {
  /** State for immersive breathing activity overlay */
  activeActivity: ActivityState;
  /** Direct activity component from sidebar navigation */
  directActivity: DirectComponent | null;
  /** Selected pre-recorded meditation track */
  selectedPrerecordedTrack: MeditationTrack | null;
  /** Sets the active activity state */
  setActiveActivity: (activity: ActivityState) => void;
  /** Handler for closing the active activity overlay */
  handleActivityClose: () => void;
  /** Handler for opening a direct component from sidebar */
  handleDirectComponent: (component: DirectComponent) => void;
  /** Handler for closing the direct activity overlay */
  handleDirectActivityClose: () => void;
  /** Handler for selecting a pre-recorded meditation track */
  handleSelectPrerecordedMeditation: (track: MeditationTrack) => void;
  /** Handler for closing the pre-recorded meditation player */
  handleClosePrerecordedMeditation: () => void;
}

/**
 * Custom hook for managing activity overlay states.
 *
 * @param options Configuration options including callbacks
 * @returns Activity overlay states and handlers
 */
export function useActivityOverlays(
  options: UseActivityOverlaysOptions = {}
): UseActivityOverlaysReturn {
  const { onActivityClose, onCloseSidebar } = options;

  // Active activity state for immersive overlay (breathing)
  const [activeActivity, setActiveActivity] = useState<ActivityState>(null);

  // Direct activity state - for sidebar navigation
  const [directActivity, setDirectActivity] = useState<DirectComponent | null>(null);

  // Selected pre-recorded meditation track for playback
  const [selectedPrerecordedTrack, setSelectedPrerecordedTrack] = useState<MeditationTrack | null>(
    null
  );

  /**
   * Handle user exiting exercise early (stop button or X).
   */
  const handleActivityClose = useCallback(() => {
    setActiveActivity(null);
    onActivityClose?.();
  }, [onActivityClose]);

  /**
   * Handle opening a component directly from DiscoverNav.
   * Backend integration for session tracking will be added in future iteration.
   */
  const handleDirectComponent = useCallback(
    (component: DirectComponent) => {
      setDirectActivity(component);
      // Close sidebar on mobile
      if (isMobileViewport()) {
        onCloseSidebar?.();
      }
    },
    [onCloseSidebar]
  );

  /**
   * Handle closing the direct activity overlay.
   */
  const handleDirectActivityClose = useCallback(() => {
    setDirectActivity(null);
    onActivityClose?.();
  }, [onActivityClose]);

  /**
   * Handle selecting a pre-recorded meditation track from the sidebar.
   */
  const handleSelectPrerecordedMeditation = useCallback(
    (track: MeditationTrack) => {
      setSelectedPrerecordedTrack(track);
      // Close sidebar on mobile
      if (isMobileViewport()) {
        onCloseSidebar?.();
      }
    },
    [onCloseSidebar]
  );

  /**
   * Handle closing the pre-recorded meditation player.
   */
  const handleClosePrerecordedMeditation = useCallback(() => {
    setSelectedPrerecordedTrack(null);
    onActivityClose?.();
  }, [onActivityClose]);

  return {
    activeActivity,
    directActivity,
    selectedPrerecordedTrack,
    setActiveActivity,
    handleActivityClose,
    handleDirectComponent,
    handleDirectActivityClose,
    handleSelectPrerecordedMeditation,
    handleClosePrerecordedMeditation,
  };
}
