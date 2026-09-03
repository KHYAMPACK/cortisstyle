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

interface MinimoraCenterCtaProps {
  orderHref: string;
}

export function MinimoraCenterCta({ orderHref }: MinimoraCenterCtaProps) {
  return (
    <section className="relative overflow-hidden bg-white px-5 py-16 text-center md:px-8 md:py-24">
      <MinimoraFadeIn className="relative z-10 mx-auto max-w-2xl">
        <h2 className={`${minimoraDisplay} leading-tight tracking-tight`}>
          <span className="block text-2xl font-semibold text-[#9AA3AD] md:text-3xl">
            {minimoraHomeContent.centerHeadlineStart}
          </span>
          <span className="mt-1 block text-3xl font-bold text-[#3D3D3D] md:text-5xl">
            {minimoraHomeContent.centerHeadlineEnd}
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-[#6B7280]">
          {minimoraHomeContent.centerBody}
        </p>
        <Link href={orderHref} className={`${minimoraBtnPrimary} mt-8`}>
          {minimoraHomeContent.centerCta}
        </Link>
      </MinimoraFadeIn>

      <MinimoraFadeIn className="relative mx-auto mt-12 h-[280px] w-full max-w-sm md:h-[380px]">
        <MinimoraMedia
          src={MINIMORA_HOME_IMAGES.heroProduct}
          alt="Minimora 3D figür"
          tone={1}
          label="3D Figür"
          fit="contain"
          className="h-full w-full"
          sizes="(max-width: 768px) 80vw, 380px"
        />
      </MinimoraFadeIn>
    </section>
  );
}
