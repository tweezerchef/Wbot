/**
 * Conversation History Panel
 *
 * Displays recent conversations and provides search functionality.
 * Renders within the sidebar below the "New Conversation" button.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import {
  getConversationsWithPreview,
  searchConversations,
  getDisplayTitle,
  getMessagePreview,
  getRelativeTime,
  type ConversationPreview,
  type SearchResult,
} from '../../lib/conversationHistory';
import { HistoryIcon, SearchIcon, ChevronDownIcon } from '../buttons';

import styles from './ConversationHistory.module.css';

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface ConversationHistoryProps {
  /** Currently active conversation ID */
  currentConversationId: string | null;
  /** Callback when a conversation is selected */
  onSelectConversation: (conversationId: string) => void;
  /** Callback to close sidebar on mobile */
  onCloseSidebar?: () => void;
}

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function ConversationHistory({
  currentConversationId,
  onSelectConversation,
  onCloseSidebar,
}: ConversationHistoryProps) {
  // Panel expansion state
  const [isExpanded, setIsExpanded] = useState(false);

  // Conversation list state
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce timer ref
  const searchTimerRef = useRef<number | null>(null);

  /* --------------------------------------------------------------------------
     Load Conversations on Expand
     -------------------------------------------------------------------------- */
  const loadConversations = useCallback(
    async (refresh = false) => {
      if (isLoading) {
        return;
      }

      setIsLoading(true);
      try {
        const offset = refresh ? 0 : conversations.length;
        const newConversations = await getConversationsWithPreview(6, offset);

        if (refresh) {
          setConversations(newConversations);
        } else {
          setConversations((prev) => [...prev, ...newConversations]);
        }

        setHasMore(newConversations.length === 6);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [conversations.length, isLoading]
  );

  // Load on first expand
  useEffect(() => {
    if (isExpanded && conversations.length === 0) {
      void loadConversations(true);
    }
  }, [isExpanded, conversations.length, loadConversations]);

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

  const handleLoadMore = () => {
    void loadConversations(false);
  };

  /* --------------------------------------------------------------------------
     Render
     -------------------------------------------------------------------------- */
  const showSearchResults = searchQuery.trim().length > 0;

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
              // Recent Conversations
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

                {/* Load More Button */}
                {hasMore && !isLoading && conversations.length > 0 && (
                  <li>
                    <button className={styles.loadMoreButton} onClick={handleLoadMore}>
                      Load more...
                    </button>
                  </li>
                )}

                {isLoading && <li className={styles.loadingState}>Loading...</li>}

                {conversations.length === 0 && !isLoading && (
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
