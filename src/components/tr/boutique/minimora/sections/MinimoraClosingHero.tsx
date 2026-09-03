"use client";

import Link from "next/link";
import { MinimoraFadeIn } from "@/components/tr/boutique/minimora/MinimoraMotion";
import { MinimoraMedia } from "@/components/tr/boutique/minimora/MinimoraMedia";
import {
  MINIMORA_HOME_IMAGES,
  minimoraHomeContent,
} from "@/components/tr/boutique/minimora/minimoraHomeContent";
import {
  minimoraBtnPrimary,
  minimoraDisplay,
} from "@/components/tr/boutique/minimora/minimoraTheme";

interface MinimoraClosingHeroProps {
  howItWorksHref: string;
}

export function MinimoraClosingHero({
  howItWorksHref,
}: MinimoraClosingHeroProps) {
  return (
    <section className="relative min-h-[420px] overflow-hidden md:min-h-[520px]">
      <MinimoraMedia
        src={MINIMORA_HOME_IMAGES.closingHero}
        alt=""
        tone={0}
        label="Aile"
        className="absolute inset-0"
      />
      <div className="absolute inset-0 bg-black/40" />

      <MinimoraFadeIn className="relative flex min-h-[420px] flex-col items-center justify-center px-5 py-16 text-center md:min-h-[520px] md:px-8">
        <h2
          className={`${minimoraDisplay} max-w-2xl text-2xl font-bold leading-snug text-white md:text-4xl`}
        >
          {minimoraHomeContent.closingHeadline}
        </h2>
        <Link
          href={howItWorksHref}
          className={`${minimoraBtnPrimary} mt-8 bg-white text-[#E08E5C] hover:bg-white/90`}
        >
          {minimoraHomeContent.closingCta}
        </Link>
      </MinimoraFadeIn>
    </section>
  );
}
