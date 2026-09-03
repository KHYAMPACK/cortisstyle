"use client";

import { MinimoraFadeIn } from "@/components/tr/boutique/minimora/MinimoraMotion";
import { minimoraHomeContent } from "@/components/tr/boutique/minimora/minimoraHomeContent";
import { minimoraDisplay } from "@/components/tr/boutique/minimora/minimoraTheme";

export function MinimoraTrustHeadline() {
  return (
    <MinimoraFadeIn className="px-5 pb-8 pt-14 text-center md:px-8 md:pt-20 md:pb-10">
      <div className="mx-auto max-w-3xl">
        <h2
          className={`${minimoraDisplay} text-3xl font-bold tracking-tight text-[#3D3D3D] md:text-4xl lg:text-[2.75rem]`}
        >
          {minimoraHomeContent.trustTitle}
          <br />
          <span className="text-[#F3A575]">
            {minimoraHomeContent.trustAccentTan}
          </span>{" "}
          <span className="text-[#E08E5C]">
            {minimoraHomeContent.trustAccentBlue}
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-[#6B7280] md:text-base">
          {minimoraHomeContent.trustBody}
        </p>
      </div>
    </MinimoraFadeIn>
  );
}
