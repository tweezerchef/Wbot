/**
 * History icon - clock symbol.
 * Used for the conversation history button in the sidebar.
 */
export function HistoryIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Clock circle */}
      <circle cx="12" cy="12" r="10" />
      {/* Clock hands */}
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
