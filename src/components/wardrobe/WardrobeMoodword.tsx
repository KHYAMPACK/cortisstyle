"use client";

import { resolveMoodwordFromOutfitName } from "@/lib/resolveMoodword";

interface WardrobeMoodwordProps {
  outfitName: string;
  emptyFallback?: string;
}

export function WardrobeMoodword({
  outfitName,
  emptyFallback = "Style",
}: WardrobeMoodwordProps) {
  const moodword = resolveMoodwordFromOutfitName(outfitName, emptyFallback);

  return (
    <p
      aria-hidden
      className="pointer-events-none absolute top-[184px] right-4 z-10 w-[120px] text-right font-serif text-[22px] leading-none font-semibold tracking-[-0.02em] text-neutral-950 uppercase"
    >
      {moodword}
    </p>
  );
}
