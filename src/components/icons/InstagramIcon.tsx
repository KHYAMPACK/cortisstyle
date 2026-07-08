interface InstagramIconProps {
  className?: string;
  strokeWidth?: number;
}

/** Lucide no longer ships brand icons — minimal inline Instagram glyph. */
export function InstagramIcon({
  className = "h-4 w-4",
  strokeWidth = 1.75,
}: InstagramIconProps) {
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
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
