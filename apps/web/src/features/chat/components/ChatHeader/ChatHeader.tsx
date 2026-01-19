/**
 * ChatHeader Component
 *
 * Header bar for the chat interface containing the logo and sidebar controls.
 * On mobile: Shows hamburger menu button to toggle sidebar.
 * On desktop: Shows expand button when sidebar is collapsed.
 */

import styles from './ChatHeader.module.css';

import { MenuIcon, CloseIcon, ChevronRightIcon } from '@/components/ui/icons';

export interface ChatHeaderProps {
  /** Whether the sidebar is currently open */
  isSidebarOpen: boolean;
  /** Handler for toggling the sidebar (mobile) */
  onToggleSidebar: () => void;
  /** Handler for expanding the sidebar (desktop) */
  onExpandSidebar: () => void;
}

/**
 * Chat interface header with logo and sidebar controls.
 */
export function ChatHeader({ isSidebarOpen, onToggleSidebar, onExpandSidebar }: ChatHeaderProps) {
  return (
    <header className={styles.header}>
      {/* Mobile: hamburger menu toggle */}
      <button
        className={styles.menuButton}
        onClick={onToggleSidebar}
        aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isSidebarOpen}
      >
        {isSidebarOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Desktop: expand button (when sidebar is not open) */}
      {!isSidebarOpen && (
        <button
          className={styles.expandButton}
          onClick={onExpandSidebar}
          aria-label="Expand sidebar"
        >
          <ChevronRightIcon />
        </button>
      )}

      <h1 className={styles.logo}>Wbot</h1>
    </header>
  );
}
