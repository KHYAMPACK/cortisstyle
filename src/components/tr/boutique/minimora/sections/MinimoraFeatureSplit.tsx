"use client";

import { MinimoraFadeIn } from "@/components/tr/boutique/minimora/MinimoraMotion";
import { MinimoraMedia } from "@/components/tr/boutique/minimora/MinimoraMedia";
import {
  MINIMORA_HOME_IMAGES,
  minimoraHomeContent,
} from "@/components/tr/boutique/minimora/minimoraHomeContent";
import { minimoraDisplay } from "@/components/tr/boutique/minimora/minimoraTheme";

export function MinimoraFeatureSplit() {
  return (
    <section className="bg-[#FDFBF7] px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2 md:gap-16">
        <MinimoraFadeIn>
          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[28px]">
            <MinimoraMedia
              src={MINIMORA_HOME_IMAGES.cardCapture}
              alt="Çizim detayı"
              tone={0}
              label="Çizim Detayı"
              className="h-full w-full"
            />
          </div>
        </MinimoraFadeIn>

        <MinimoraFadeIn className="text-center md:text-left">
          <h2
            className={`${minimoraDisplay} text-2xl font-bold text-[#3D3D3D] md:text-3xl lg:text-4xl`}
          >
            {minimoraHomeContent.featureSplitHeadline}
            <br />
            <span className="text-[#E08E5C]">
              {minimoraHomeContent.featureSplitAccent}
            </span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-[#6B7280]">
            {minimoraHomeContent.featureSplitBody}
          </p>
        </MinimoraFadeIn>
      </div>
    </section>
  );
}
