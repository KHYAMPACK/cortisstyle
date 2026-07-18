"use client";

import { ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";
import { TrHeroAtmosphere } from "@/components/tr/TrHeroAtmosphere";
import { TrHeroOutfitSlots } from "@/components/tr/TrHeroOutfitSlots";
import {
  HERO_SLOT_BOTTOMS,
  HERO_SLOT_TOPS,
} from "@/data/tr/heroSlotPieces";
import { TR_LOOKS_SECTION_ID } from "@/lib/tr/looks";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";

interface TrHomeHeroProps {
  nextSectionId?: string;
  nextSectionLabel?: string;
}

export function TrHomeHero({
  nextSectionId = TR_LOOKS_SECTION_ID,
  nextSectionLabel = "Kombinler",
}: TrHomeHeroProps) {
  const reduceMotion = useReducedMotion();

  const scrollToNext = () => {
    document.getElementById(nextSectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section
      aria-label="Türkiye editorial hero"
      className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-ice-floor"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_50%_35%,#ffffff_0%,var(--ice-floor)_55%,#e8eef4_100%)]"
      />

      <TrHeroAtmosphere />

      {/* Centered outfit — visual engine */}
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 pt-4 pb-2 sm:px-5 sm:pt-6">
        <div className="w-full max-w-[min(92vw,420px)] sm:max-w-[460px] md:max-w-[520px] lg:max-w-[640px] xl:max-w-[700px]">
          <TrHeroOutfitSlots
            tops={HERO_SLOT_TOPS}
            bottoms={HERO_SLOT_BOTTOMS}
          />
        </div>
      </div>

      {/* Brand + soft DIY — in-flow over atmosphere bottom fade */}
      <div className="relative z-20 shrink-0 px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-8 md:px-10 md:pb-8">
        <motion.div
          className="max-w-md"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: trPanelEase, delay: 0.1 }}
        >
          <BrandLogo
            variant="onLight"
            className="h-9 w-auto sm:h-10 md:h-14 lg:h-16"
          />
          <p className="mt-3 max-w-sm font-serif text-[clamp(1.15rem,3.4vw,1.75rem)] leading-[1.2] font-light tracking-[-0.02em] text-neutral-900 sm:mt-4 md:mt-5">
            Kendi kombinin — butiklerden
          </p>
          <button
            type="button"
            onClick={scrollToNext}
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.28em] text-neutral-500 uppercase transition-colors hover:text-neutral-900 sm:mt-5 md:mt-6"
          >
            {nextSectionLabel}
            <ChevronDown
              strokeWidth={1.5}
              className="h-3.5 w-3.5"
              aria-hidden
            />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
