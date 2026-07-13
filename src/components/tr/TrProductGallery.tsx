"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import { isLookbookPieceImage } from "@/lib/tr/lookbookImages";
import type { TrProduct } from "@/types/tr-marketplace";

interface TrProductGalleryProps {
  product: Pick<TrProduct, "title" | "images">;
}

export function TrProductGallery({ product }: TrProductGalleryProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (product.images.length === 0) {
    return (
      <div className="flex aspect-[2/3] items-center justify-center border border-black/10 bg-neutral-100 px-8 text-center">
        <p className="font-serif text-2xl tracking-[-0.02em] text-neutral-700">
          {product.title}
        </p>
      </div>
    );
  }

  if (product.images.every((image) => isTrDemoIconSrc(image))) {
    return (
      <div className="relative aspect-[2/3] overflow-hidden border border-black/10 bg-ice-floor">
        <TrDemoGarmentVisual
          src={product.images[0]}
          showLabel
          iconClassName="h-20 w-20 md:h-24 md:w-24"
        />
      </div>
    );
  }

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(
      Math.min(Math.max(next, 0), product.images.length - 1),
    );
  };

  const scrollToIndex = (index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({
      left: index * el.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex aspect-[2/3] snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain bg-[#f3f1ec] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={`${product.title} görselleri`}
      >
        {product.images.map((image, index) => {
          const lookbookCutout = isLookbookPieceImage(image);
          return (
            <div
              key={`${image}-${index}`}
              className="relative h-full w-full shrink-0 snap-center snap-always"
            >
              <Image
                src={image}
                alt={
                  index === 0
                    ? product.title
                    : `${product.title} — görsel ${index + 1}`
                }
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized
                className={
                  lookbookCutout
                    ? "object-contain p-8 md:p-12"
                    : "object-cover"
                }
                draggable={false}
              />
            </div>
          );
        })}
      </div>

      {product.images.length > 1 ? (
        <div
          className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5"
          role="tablist"
          aria-label="Görsel seç"
        >
          {product.images.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={activeIndex === index}
              aria-label={`Görsel ${index + 1}`}
              onClick={() => scrollToIndex(index)}
              className={`h-1.5 transition-all ${
                activeIndex === index
                  ? "w-5 bg-white"
                  : "w-1.5 bg-white/55 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
