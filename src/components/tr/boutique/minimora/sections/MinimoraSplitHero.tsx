"use client";

import Link from "next/link";
import { Calendar, Check, Star } from "lucide-react";
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

interface MinimoraSplitHeroProps {
  orderHref: string;
}

export function MinimoraSplitHero({ orderHref }: MinimoraSplitHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="grid lg:min-h-[min(88vh,760px)] lg:grid-cols-2">
        <div className="relative order-2 flex flex-col justify-center bg-gradient-to-br from-[#EEF3F8] via-[#F7F9FB] to-white px-6 py-12 sm:px-10 lg:order-1 lg:px-14 lg:py-16 xl:px-20">
          <MinimoraFadeIn className="mx-auto w-full max-w-lg space-y-6 text-center lg:mx-0 lg:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                ))}
              </div>
              <p className="text-[13px] text-[#6B7280]">
                <span className="font-semibold text-[#3D3D3D]">
                  {minimoraHomeContent.rating}
                </span>{" "}
                {minimoraHomeContent.ratingLabel}
              </p>
            </div>

            <h1
              className={`${minimoraDisplay} text-[2.15rem] font-bold leading-[1.1] tracking-tight text-[#3D3D3D] sm:text-4xl lg:text-[2.75rem]`}
            >
              {minimoraHomeContent.heroHeadlineLine1}
              <br />
              {minimoraHomeContent.heroHeadlineLine2}
            </h1>

            <ul className="space-y-3 text-left">
              {minimoraHomeContent.heroBullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3B71D8] text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-[14px] text-[#3D3D3D]">{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-3 pt-1">
              <Link
                href={orderHref}
                className={`${minimoraBtnPrimary} w-full sm:w-auto sm:min-w-[260px]`}
              >
                {minimoraHomeContent.heroCta}
              </Link>
              <p className="flex items-center justify-center gap-2 text-[12px] text-[#6B7280] lg:justify-start">
                <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                {minimoraHomeContent.heroGuarantee}
              </p>
            </div>
          </MinimoraFadeIn>
        </div>

        <div className="relative order-1 min-h-[46vh] sm:min-h-[52vh] lg:order-2 lg:min-h-full">
          <MinimoraMedia
            src={MINIMORA_HOME_IMAGES.heroLifestyle}
            alt="Çocuk ve çizim anı"
            tone={2}
            label="Çizim Anı"
            priority
            className="absolute inset-0"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}
