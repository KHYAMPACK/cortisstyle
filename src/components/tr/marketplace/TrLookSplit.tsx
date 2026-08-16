"use client";

import Image from "next/image";
import { useRef } from "react";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { TrLookBoutiqueCredits } from "@/components/tr/TrLookBoutiqueCredits";
import { TrProductCard } from "@/components/tr/TrProductCard";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import {
  useCaddeLookRailAutoplay,
  useCaddeLookRailWheel,
} from "@/lib/tr/marketplace/useCaddeLookRailWheel";
import {
  CADDE_DISPLAY,
  CADDE_KICKER,
  CADDE_CTA,
  caddeBracket,
} from "@/lib/tr/marketplace/caddeUi";
import { trLookPath } from "@/lib/tr/paths";
import type { TrLookWithProducts } from "@/types/tr-look";

interface TrLookSplitProps {
  look: TrLookWithProducts;
  index: number;
}

export function TrLookSplit({ look, index }: TrLookSplitProps) {
  const lookOnRight = index % 2 === 1;
  const demoCover = isTrDemoIconSrc(look.coverImage);
  const boutiques = look.products.map((product) => product.boutique);
  const href = trLookPath(look.slug);
  const sectionRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const railEnabled = look.products.length > 2;
  useCaddeLookRailWheel(sectionRef, railRef, railEnabled);
  useCaddeLookRailAutoplay(sectionRef, railRef, railEnabled);

  const scrollRail = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * Math.round(rail.clientWidth * 0.72),
      behavior: "smooth",
    });
  };

  return (
    <div
      ref={sectionRef}
      className={`hidden min-h-dvh items-center gap-10 px-10 py-16 lg:grid lg:grid-cols-2 xl:gap-14 xl:px-16 xl:py-20 ${
        lookOnRight ? "lg:[&>.look-pane]:order-2" : ""
      }`}
    >
      <div className="look-pane mx-auto w-full max-w-[26rem] xl:max-w-[30rem]">
        <TrSoftNavLink
          href={href}
          className="group relative block aspect-[3/4] overflow-hidden bg-ice-floor outline-none focus-visible:ring-2 focus-visible:ring-jet-black focus-visible:ring-offset-2"
          aria-label={`${look.title} look’unu aç`}
        >
          {demoCover ? (
            <TrDemoGarmentVisual
              src={look.coverImage}
              showLabel
              iconClassName="h-24 w-24"
            />
          ) : look.coverImage ? (
            <Image
              src={look.coverImage}
              alt=""
              fill
              sizes="30rem"
              unoptimized
              priority={index === 0}
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-10">
              <span className={`${CADDE_DISPLAY} text-5xl`}>{look.title}</span>
            </div>
          )}
        </TrSoftNavLink>
        <p className={`${CADDE_KICKER} mt-6`}>
          {String(index + 1).padStart(2, "0")}. Kombin
        </p>
        <h3 className={`${CADDE_DISPLAY} mt-2 text-[clamp(1.8rem,3vw,2.8rem)]`}>
          {look.title}
        </h3>
        {look.subtitle ? (
          <p className="mt-2 max-w-md font-cadde-nav text-[13px] leading-relaxed tracking-[0.04em] text-neutral-500">
            {look.subtitle}
          </p>
        ) : null}
        <TrSoftNavLink
          href={href}
          className={`${CADDE_CTA} mt-4 text-jet-black transition-colors hover:text-cadde-red`}
        >
          {caddeBracket("Kombine bak")}
        </TrSoftNavLink>
      </div>

      <div className="min-w-0">
        <p className={CADDE_KICKER}>Parçalar</p>

        {look.products.length > 0 ? (
          <div
            ref={railRef}
            className="mt-6 flex gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label={`${look.title} parçaları`}
          >
            {look.products.map((product, productIndex) => (
              <div
                key={product.id}
                className="w-[13.5rem] shrink-0 bg-white xl:w-[15rem]"
              >
                <TrProductCard
                  product={product}
                  showBoutique
                  variant="marketplace"
                  showQuickAdd
                  priority={index === 0 && productIndex < 2}
                />
              </div>
            ))}
          </div>
        ) : null}

        {look.products.length > 2 ? (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => scrollRail(-1)}
              className="flex size-10 items-center justify-center border border-black/15 text-jet-black transition-colors hover:border-jet-black"
              aria-label="Önceki parçalar"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollRail(1)}
              className="flex size-10 items-center justify-center border border-black/15 text-jet-black transition-colors hover:border-jet-black"
              aria-label="Sonraki parçalar"
            >
              →
            </button>
          </div>
        ) : null}

        <div className="mt-6">
          <TrLookBoutiqueCredits boutiques={boutiques} />
        </div>
      </div>
    </div>
  );
}
