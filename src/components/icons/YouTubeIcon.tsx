interface YouTubeIconProps {
  className?: string;
  strokeWidth?: number;
}

/** Lucide no longer ships brand icons — minimal inline YouTube glyph. */
export function YouTubeIcon({
  className = "h-4 w-4",
  strokeWidth = 1.75,
}: YouTubeIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2.5" y="6" width="19" height="12" rx="3.5" />
      <path d="M10.5 9.5v5l4.5-2.5-4.5-2.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
