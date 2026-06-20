"use client";

import { resolveMoodwordFromOutfitName } from "@/lib/resolveMoodword";

interface WardrobeMoodwordProps {
  outfitName: string;
  emptyFallback?: string;
}

export function WardrobeMoodword({
  outfitName,
  emptyFallback = "Archive",
}: WardrobeMoodwordProps) {
  const moodword = resolveMoodwordFromOutfitName(outfitName, emptyFallback);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-[184px] right-4 z-10 w-[120px] text-right"
    >
      <p className="font-mono text-[8px] tracking-[0.35em] text-neutral-400 uppercase">
        Mood
      </p>
      <p className="mt-1 font-serif text-[17px] leading-[0.95] font-medium tracking-[0.06em] text-neutral-950 uppercase">
        {moodword}
      </p>
    </div>
  );
}
