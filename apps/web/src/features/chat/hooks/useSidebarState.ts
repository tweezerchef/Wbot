/**
 * useSidebarState Hook
 *
 * Manages sidebar open/close state with proper hydration handling
 * to prevent Cumulative Layout Shift (CLS) on initial render.
 *
 * Hydration Strategy:
 * 1. Sidebar starts OPEN (matching CSS default width: 280px)
 * 2. Only after hydration (isHydrated=true) can the sidebar collapse
 * 3. On mobile, closes after hydration (safe because it's overlay-based)
 */

import { useState, useEffect, useCallback } from 'react';

import { isMobileViewport } from '@/lib/constants/breakpoints';

export interface UseSidebarStateReturn {
  /** Whether the sidebar is currently open */
  isSidebarOpen: boolean;
  /** Whether hydration is complete (safe to collapse sidebar) */
  isHydrated: boolean;
  /** Opens the sidebar */
  openSidebar: () => void;
  /** Closes the sidebar */
  closeSidebar: () => void;
  /** Toggles the sidebar open/closed */
  toggleSidebar: () => void;
}

/**
 * Custom hook for managing sidebar state with hydration awareness.
 *
 * @returns Sidebar state and control functions
 */
export function useSidebarState(): UseSidebarStateReturn {
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

  // Memoized callbacks for stable references
  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  return {
    isSidebarOpen,
    isHydrated,
    openSidebar,
    closeSidebar,
    toggleSidebar,
  };
}
