"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { MinimoraFadeIn } from "@/components/tr/boutique/minimora/MinimoraMotion";
import { MinimoraMedia } from "@/components/tr/boutique/minimora/MinimoraMedia";
import {
  MINIMORA_HOME_IMAGES,
  minimoraHomeContent,
} from "@/components/tr/boutique/minimora/minimoraHomeContent";
import { minimoraDisplay } from "@/components/tr/boutique/minimora/minimoraTheme";

interface MinimoraDualCardsProps {
  orderHref: string;
  galleryHref: string;
}

export function MinimoraDualCards({
  orderHref,
  galleryHref,
}: MinimoraDualCardsProps) {
  return (
    <section className="px-5 pb-14 md:px-8 md:pb-20">
      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 md:gap-6">
        <MinimoraFadeIn>
          <div className="relative min-h-[300px] overflow-hidden rounded-[28px] md:min-h-[400px]">
            <MinimoraMedia
              src={MINIMORA_HOME_IMAGES.cardCapture}
              alt={minimoraHomeContent.cardCapture.title}
              tone={0}
              label="Çizim Anı"
              className="absolute inset-0"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/20" />
            <h3
              className={`${minimoraDisplay} absolute top-0 left-0 p-6 text-xl font-bold text-white md:p-8 md:text-2xl`}
            >
              {minimoraHomeContent.cardCapture.title}
            </h3>
            <Link
              href={galleryHref}
              className="absolute right-4 bottom-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#F3A575] text-[#3D3D3D] shadow-md transition-opacity hover:opacity-90"
              aria-label={minimoraHomeContent.galleryTitle}
            >
              <Plus className="h-5 w-5" />
            </Link>
          </div>
        </MinimoraFadeIn>

        <MinimoraFadeIn>
          <div className="relative min-h-[300px] overflow-hidden rounded-[28px] bg-[#F0EBE4] md:min-h-[400px]">
            <h3
              className={`${minimoraDisplay} absolute top-0 left-0 z-10 p-6 text-xl font-bold text-[#3D3D3D] md:p-8 md:text-2xl`}
            >
              {minimoraHomeContent.cardConnected.title}
            </h3>
            <MinimoraMedia
              src={MINIMORA_HOME_IMAGES.cardConnected}
              alt={minimoraHomeContent.cardConnected.title}
              tone={1}
              label="3D Model"
              fit="contain"
              className="absolute inset-x-4 bottom-4 top-16 md:inset-x-6 md:top-20"
            />
            <span className="absolute right-6 bottom-8 z-10 flex h-20 w-20 items-center justify-center rounded-full bg-[#E5A377]/90 px-3 text-center text-[10px] font-bold tracking-wide text-white uppercase">
              {minimoraHomeContent.cardConnected.badge}
            </span>
            <Link
              href={orderHref}
              className="absolute top-5 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-[#F3A575] text-[#3D3D3D] shadow-md transition-opacity hover:opacity-90"
              aria-label={minimoraHomeContent.nav.order}
            >
              <Plus className="h-5 w-5" />
            </Link>
          </div>
        </MinimoraFadeIn>
      </div>
    </section>
  );
}
