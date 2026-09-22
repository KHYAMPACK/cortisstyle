interface TikTokIconProps {
  className?: string;
  strokeWidth?: number;
}

/** Lucide no longer ships brand icons — minimal inline TikTok glyph. */
export function TikTokIcon({
  className = "h-4 w-4",
  strokeWidth = 1.75,
}: TikTokIconProps) {
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
      <path d="M15 3v10.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M15 3c.5 2.5 2 4 5 4.2" />
    </svg>
  );
}
