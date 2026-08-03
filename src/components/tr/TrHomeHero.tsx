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
      className="relative min-h-dvh w-full overflow-hidden bg-ice-floor"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_50%_35%,#ffffff_0%,var(--ice-floor)_55%,#e8eef4_100%)]"
      />

      <TrHeroAtmosphere />

      {/* One centered composition: outfit first, then brand */}
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[900px] flex-col items-center justify-center px-4 pt-20 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 md:px-10 md:pt-24 md:pb-12">
        <motion.div
          className="w-full max-w-[min(92vw,420px)] sm:max-w-[480px] md:max-w-[560px] lg:max-w-[620px]"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: trPanelEase, delay: 0.08 }}
        >
          <TrHeroOutfitSlots
            tops={HERO_SLOT_TOPS}
            bottoms={HERO_SLOT_BOTTOMS}
          />
        </motion.div>

        <motion.div
          className="mt-6 flex w-full flex-col items-center text-center sm:mt-8 md:mt-10"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: trPanelEase, delay: 0.16 }}
        >
          <BrandLogo
            variant="onLight"
            className="h-9 w-auto sm:h-10 md:h-12 lg:h-14"
          />
          <p className="mt-3 max-w-md font-serif text-[clamp(1.15rem,3.2vw,1.75rem)] leading-[1.2] font-light tracking-[-0.02em] text-neutral-900 sm:mt-4">
            Kendi kombinin — butiklerden
          </p>
          <button
            type="button"
            onClick={scrollToNext}
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.28em] text-neutral-500 uppercase transition-colors hover:text-neutral-900 sm:mt-5"
          >
            {nextSectionLabel}
            <motion.span
              className="inline-flex"
              aria-hidden
              animate={reduceMotion ? { y: 0 } : { y: [0, 4, 0] }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 1.6,
                      ease: "easeInOut",
                      repeat: Infinity,
                    }
              }
            >
              <ChevronDown
                strokeWidth={1.5}
                className="h-3.5 w-3.5"
              />
            </motion.span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
