/**
 * Search icon - magnifying glass.
 * Used in the search input for conversation history.
 */
export function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Magnifying glass circle */}
      <circle cx="11" cy="11" r="8" />
      {/* Handle */}
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
