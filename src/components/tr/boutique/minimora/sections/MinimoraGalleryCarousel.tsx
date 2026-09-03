"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useRef, useState } from "react";
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

interface MinimoraGalleryCarouselProps {
  orderHref: string;
}

export function MinimoraGalleryCarousel({
  orderHref,
}: MinimoraGalleryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const images = MINIMORA_HOME_IMAGES.gallery;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / images.length;
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, images.length - 1));
  };

  return (
    <section
      id={minimoraHomeContent.galleryAnchorId}
      className="scroll-mt-24 px-5 pb-14 md:px-8 md:pb-20"
    >
      <MinimoraFadeIn>
        <h2
          className={`${minimoraDisplay} mb-8 text-center text-2xl font-bold text-[#3D3D3D] md:text-3xl`}
        >
          {minimoraHomeContent.galleryTitle}
        </h2>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0 md:pb-0"
        >
          {images.map((src, index) => (
            <div
              key={src}
              className="relative aspect-[4/5] w-[72vw] shrink-0 snap-center overflow-hidden rounded-[28px] md:w-auto"
            >
              <MinimoraMedia
                src={src}
                alt={`Galeri ${index + 1}`}
                tone={index}
                label={`Örnek ${index + 1}`}
                className="h-full w-full"
              />
              <Link
                href={orderHref}
                className="absolute right-3 bottom-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#F3A575] text-[#3D3D3D] shadow-md transition-opacity hover:opacity-90"
                aria-label={minimoraHomeContent.galleryCta}
              >
                <Plus className="h-5 w-5" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-center gap-2 md:hidden">
          {images.map((_, index) => (
            <span
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === activeIndex ? "bg-[#3D3D3D]" : "bg-[#D1D5DB]"
              }`}
              aria-hidden
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link href={orderHref} className={minimoraBtnPrimary}>
            {minimoraHomeContent.galleryCta}
          </Link>
        </div>
      </MinimoraFadeIn>
    </section>
  );
}
