"use client";

interface WardrobeMoodwordProps {
  moodword: string;
  emptyFallback?: string;
  onDarkCanvas?: boolean;
}

export function WardrobeMoodword({
  moodword,
  emptyFallback,
  onDarkCanvas = false,
}: WardrobeMoodwordProps) {
  const trimmed = (moodword ?? "").trim();
  const displayMoodword = trimmed || emptyFallback;

  if (!displayMoodword) {
    return null;
  }

  return (
    <p
      aria-hidden
      className={`pointer-events-none absolute top-[184px] right-4 z-10 w-[120px] text-right font-serif text-[22px] leading-none font-semibold tracking-[-0.02em] uppercase ${
        onDarkCanvas ? "text-white/90" : "text-neutral-950"
      }`}
    >
      {displayMoodword}
    </p>
  );
}
