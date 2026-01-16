/**
 * Meditation icon - lotus flower symbol.
 * Used for the meditation library button in the sidebar.
 */
export function MeditationIcon() {
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
      {/* Lotus petals */}
      <path d="M12 3c-1.2 0-2.4.6-3 1.5A3.5 3.5 0 0 0 5.5 9c-.6.6-.5 1.5-.5 2 0 1.5 1 3 3 4" />
      <path d="M12 3c1.2 0 2.4.6 3 1.5A3.5 3.5 0 0 1 18.5 9c.6.6.5 1.5.5 2 0 1.5-1 3-3 4" />
      {/* Center petal */}
      <path d="M12 3c0 2 .5 4 1.5 5.5a5.5 5.5 0 0 1 0 7" />
      <path d="M12 3c0 2-.5 4-1.5 5.5a5.5 5.5 0 0 0 0 7" />
      {/* Base */}
      <path d="M8 15c-1 1-1.5 2-1.5 3.5A2.5 2.5 0 0 0 9 21h6a2.5 2.5 0 0 0 2.5-2.5c0-1.5-.5-2.5-1.5-3.5" />
      {/* Center stem */}
      <line x1="12" y1="15" x2="12" y2="21" />
    </svg>
  );
}
