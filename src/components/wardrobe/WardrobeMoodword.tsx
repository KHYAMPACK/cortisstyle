"use client";

interface WardrobeMoodwordProps {
  moodword: string;
  emptyFallback?: string;
}

export function WardrobeMoodword({
  moodword,
  emptyFallback = "EDITORIAL",
}: WardrobeMoodwordProps) {
  const displayMoodword = moodword.trim() || emptyFallback;

  return (
    <p
      aria-hidden
      className="pointer-events-none absolute top-[184px] right-4 z-10 w-[120px] text-right font-serif text-[22px] leading-none font-semibold tracking-[-0.02em] text-neutral-950 uppercase"
    >
      {displayMoodword}
    </p>
  );
}
