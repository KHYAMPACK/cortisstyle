"use client";

import Link from "next/link";
import { Package, Shield, Sparkles } from "lucide-react";
import { MinimoraFadeIn } from "@/components/tr/boutique/minimora/MinimoraMotion";
import { MinimoraMedia } from "@/components/tr/boutique/minimora/MinimoraMedia";
import {
  MINIMORA_HOME_IMAGES,
  minimoraHomeContent,
} from "@/components/tr/boutique/minimora/minimoraHomeContent";
import { minimoraDisplay } from "@/components/tr/boutique/minimora/minimoraTheme";

const FEATURE_ICONS = {
  craft: Sparkles,
  safe: Shield,
  ship: Package,
} as const;

interface MinimoraImmersiveHeroProps {
  howItWorksHref: string;
}

export function MinimoraImmersiveHero({
  howItWorksHref,
}: MinimoraImmersiveHeroProps) {
  return (
    <section className="relative min-h-[560px] overflow-hidden md:min-h-[640px]">
      <div className="absolute inset-0 scale-110">
        <MinimoraMedia
          src={MINIMORA_HOME_IMAGES.immersiveBg}
          alt=""
          tone={2}
          label=""
          className="h-full w-full blur-md"
        />
        <div className="absolute inset-0 bg-[#2C2118]/70" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col justify-between px-5 py-16 md:px-8 md:py-20 lg:min-h-[640px]">
        <MinimoraFadeIn className="ml-auto max-w-lg text-center lg:text-right">
          <h2
            className={`${minimoraDisplay} text-3xl font-bold leading-tight text-white md:text-4xl lg:text-[2.6rem]`}
          >
            {minimoraHomeContent.immersiveHeadline}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/90">
            {minimoraHomeContent.immersiveBody}
          </p>
          <Link
            href={howItWorksHref}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#F3A575] px-8 py-3 text-[14px] font-semibold text-[#3D3D3D] transition-colors hover:bg-[#E08E5C]"
          >
            {minimoraHomeContent.immersiveCta}
          </Link>
        </MinimoraFadeIn>

        <MinimoraFadeIn className="mt-14 grid gap-8 border-t border-white/20 pt-10 sm:grid-cols-3 sm:gap-10">
          {minimoraHomeContent.immersiveFeatures.map((feature) => {
            const Icon =
              FEATURE_ICONS[feature.id as keyof typeof FEATURE_ICONS] ??
              Sparkles;
            return (
              <div key={feature.id} className="text-center sm:text-left">
                <Icon
                  className="mx-auto h-7 w-7 text-white sm:mx-0"
                  strokeWidth={1.4}
                />
                <h3
                  className={`${minimoraDisplay} mt-3 text-[16px] font-bold text-white`}
                >
                  {feature.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/80">
                  {feature.body}
                </p>
              </div>
            );
          })}
        </MinimoraFadeIn>
      </div>
    </section>
  );
}
