interface FacebookIconProps {
  className?: string;
  strokeWidth?: number;
}

/** Lucide no longer ships brand icons — minimal inline Facebook glyph. */
export function FacebookIcon({
  className = "h-4 w-4",
  strokeWidth = 1.75,
}: FacebookIconProps) {
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
      <path d="M15 8.5h-2a2 2 0 0 0-2 2V21" />
      <path d="M9 13h5" />
      <circle cx="12" cy="12" r="9.5" />
    </svg>
  );
}
