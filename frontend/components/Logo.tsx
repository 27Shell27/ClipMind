/**
 * ClipMind brand mark — a play button fused with a "spark of thought".
 * Uses the brand red accent which stays consistent across themes.
 */
export function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="16" rx="5" fill="#FF0033" />
      <polygon points="9.5,8.5 9.5,15.5 16,12" fill="white" />
    </svg>
  );
}

/** Small YouTube glyph used to indicate source / active-tab state. */
export function YouTubeGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"
        fill="#FF0033"
      />
      <polygon points="9.75,15.02 15.5,12 9.75,8.98 9.75,15.02" fill="white" />
    </svg>
  );
}
