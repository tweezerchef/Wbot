/**
 * Conversation History Panel
 *
 * Displays recent conversations and provides search functionality.
 * Renders within the sidebar below the "New Conversation" button.
 *
 * Uses TanStack Query for conversation list fetching, which provides:
 * - Automatic cache invalidation when conversations are created/deleted
 * - Consistent data across components
 * - Better loading/error states
 */

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';

import styles from './ConversationHistory.module.css';

import { HistoryIcon, SearchIcon, ChevronDownIcon } from '@/components/ui/icons';
import { searchConversations, getRelativeTime, type SearchResult } from '@/lib/conversationHistory';
import { conversationListOptions, type ConversationWithPreview } from '@/lib/queries';

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface ConversationHistoryProps {
  /** User ID for fetching conversations (undefined if not authenticated) */
  userId: string | undefined;
  /** Currently active conversation ID */
  currentConversationId: string | null;
  /** Callback when a conversation is selected */
  onSelectConversation: (conversationId: string) => void;
  /** Callback to close sidebar on mobile */
  onCloseSidebar?: () => void;
}

/* ----------------------------------------------------------------------------
   Helper Functions
   ---------------------------------------------------------------------------- */

/** Get display title for a conversation */
function getDisplayTitle(conv: ConversationWithPreview): string {
  if (conv.title) {
    return conv.title;
  }

  if (conv.last_message_content) {
    // Use first message as title (truncated)
    const preview = conv.last_message_content.slice(0, 40);
    return preview.length < conv.last_message_content.length ? `${preview}...` : preview;
  }

  return 'New Conversation';
}

/** Get message preview for a conversation */
function getMessagePreview(conv: ConversationWithPreview): string {
  if (!conv.last_message_content) {
    return 'No messages yet';
  }

  const role = conv.last_message_role === 'user' ? 'You: ' : '';
  const content = conv.last_message_content.slice(0, 50);
  const truncated = content.length < conv.last_message_content.length ? '...' : '';

  return `${role}${content}${truncated}`;
}

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function ConversationHistory({
  userId,
  currentConversationId,
  onSelectConversation,
  onCloseSidebar,
}: ConversationHistoryProps) {
  // Panel expansion state
  const [isExpanded, setIsExpanded] = useState(false);

  // Use TanStack Query for conversation list
  // Only fetch when panel is expanded and userId is available
  const {
    data: conversations = [],
    isLoading,
    isFetching,
  } = useQuery({
    // Use empty string fallback - query won't run if userId is falsy anyway
    ...conversationListOptions(userId ?? '', { limit: 50 }),
    enabled: isExpanded && Boolean(userId),
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce timer ref
  const searchTimerRef = useRef<number | null>(null);

  /* --------------------------------------------------------------------------
     Search Handler with Debounce
     -------------------------------------------------------------------------- */
  useEffect(() => {
    // Clear previous timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // Empty query - clear results
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Debounce search (300ms)
    setIsSearching(true);
    searchTimerRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          const results = await searchConversations(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Search failed:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      })();
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery]);

  /* --------------------------------------------------------------------------
     Handlers
     -------------------------------------------------------------------------- */
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSelect = (conversationId: string) => {
    onSelectConversation(conversationId);
    setSearchQuery('');
    setSearchResults([]);
    // Close sidebar on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onCloseSidebar?.();
    }
  };

  /* --------------------------------------------------------------------------
     Render
     -------------------------------------------------------------------------- */
  const showSearchResults = searchQuery.trim().length > 0;
  const showLoading = isLoading || isFetching;

  return (
    <div className={styles.container}>
      {/* Toggle Button */}
      <button
        className={`${styles.toggleButton} ${isExpanded ? styles.expanded : ''}`}
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls="conversation-history-panel"
      >
        <HistoryIcon />
        <span>Conversation History</span>
        <ChevronDownIcon />
      </button>

      {/* Expandable Panel */}
      {isExpanded && (
        <div
          id="conversation-history-panel"
          className={styles.panel}
          role="region"
          aria-label="Conversation history"
        >
          {/* Search Input */}
          <div className={styles.searchContainer}>
            <SearchIcon />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              aria-label="Search conversations"
            />
            {isSearching && <span className={styles.searchSpinner} aria-hidden="true" />}
          </div>

          {/* Conversation List */}
          <ul className={styles.list} role="listbox">
            {showSearchResults ? (
              // Search Results
              searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <li key={`${result.type}-${result.conversationId}`}>
                    <button
                      className={`${styles.conversationItem} ${
                        result.conversationId === currentConversationId ? styles.active : ''
                      }`}
                      onClick={() => {
                        handleSelect(result.conversationId);
                      }}
                      role="option"
                      aria-selected={result.conversationId === currentConversationId}
                    >
                      <span className={styles.itemTitle}>
                        {result.conversationTitle ?? 'Conversation'}
                      </span>
                      <span className={styles.itemPreview}>{result.preview}</span>
                      <span className={styles.searchBadge}>Match</span>
                    </button>
                  </li>
                ))
              ) : (
                <li className={styles.emptyState}>
                  {isSearching ? 'Searching...' : 'No results found'}
                </li>
              )
            ) : (
              // Recent Conversations (from Query cache)
              <>
                {conversations.map((conv) => (
                  <li key={conv.id}>
                    <button
                      className={`${styles.conversationItem} ${
                        conv.id === currentConversationId ? styles.active : ''
                      }`}
                      onClick={() => {
                        handleSelect(conv.id);
                      }}
                      role="option"
                      aria-selected={conv.id === currentConversationId}
                    >
                      <span className={styles.itemTitle}>{getDisplayTitle(conv)}</span>
                      <span className={styles.itemPreview}>{getMessagePreview(conv)}</span>
                      <span className={styles.itemTime}>{getRelativeTime(conv.updated_at)}</span>
                    </button>
                  </li>
                ))}

                {showLoading && <li className={styles.loadingState}>Loading...</li>}

                {conversations.length === 0 && !showLoading && (
                  <li className={styles.emptyState}>No conversations yet</li>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
