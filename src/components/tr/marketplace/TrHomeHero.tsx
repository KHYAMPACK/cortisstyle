"use client";

import { CaddeSplitHero } from "@/components/tr/marketplace/CaddeSplitHero";
import { TR_LOOKS_SECTION_ID } from "@/lib/tr/looks";
import type { CaddeHeroPose } from "@/lib/tr/marketplace/caddeHero";

interface TrHomeHeroProps {
  poses: CaddeHeroPose[];
  nextSectionId?: string;
  nextSectionLabel?: string;
}

export function TrHomeHero({
  poses,
  nextSectionId = TR_LOOKS_SECTION_ID,
  nextSectionLabel = "Kombinler",
}: TrHomeHeroProps) {
  const scrollToNext = () => {
    document.getElementById(nextSectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <CaddeSplitHero
      poses={poses}
      onExplore={scrollToNext}
      exploreLabel={nextSectionLabel}
    />
  );
}
