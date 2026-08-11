"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { TrLookBoutiqueCredits } from "@/components/tr/TrLookBoutiqueCredits";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import { trLookPath } from "@/lib/tr/paths";
import type { TrLookWithProducts } from "@/types/tr-look";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";

interface TrLookCardProps {
  look: TrLookWithProducts;
  index: number;
  /** When false, omit look navigation (parent provides it). Default true. */
  linked?: boolean;
}

export function TrLookCard({ look, index, linked = true }: TrLookCardProps) {
  const boutiques = look.products.map((product) => product.boutique);
  const demoCover = isTrDemoIconSrc(look.coverImage);

  const cover = (
    <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
      {demoCover ? (
        <TrDemoGarmentVisual
          src={look.coverImage}
          showLabel
          iconClassName="h-16 w-16 md:h-20 md:w-20"
        />
      ) : look.coverImage ? (
        <Image
          src={look.coverImage}
          alt=""
          fill
          sizes="(max-width: 768px) 92vw, 460px"
          unoptimized
          className="object-cover transition-all duration-700 ease-out group-hover:scale-[1.02] group-hover:brightness-[0.72]"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-blueprint-surface px-6">
          <span className="font-serif text-2xl text-neutral-600">
            {look.title}
          </span>
        </div>
      )}

      <div
        className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/20"
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <span className="font-serif text-[11px] tracking-[0.45em] text-white uppercase drop-shadow">
          Look’a bak
        </span>
      </div>
    </div>
  );

  const titleBlock = (
    <div className="space-y-2">
      <h3 className="font-serif text-xl tracking-[-0.02em] text-neutral-950 md:text-2xl">
        {look.title}
      </h3>
      {look.subtitle ? (
        <p className="text-[12px] leading-relaxed text-neutral-600">
          {look.subtitle}
        </p>
      ) : null}
    </div>
  );

  const motionProps = {
    initial: { opacity: 0, y: 14 } as const,
    whileInView: { opacity: 1, y: 0 } as const,
    viewport: { once: true, margin: "-40px" } as const,
    transition: {
      duration: 0.45,
      ease: trPanelEase,
      delay: Math.min(index * 0.06, 0.24),
    },
  };

  return (
    <motion.article
      className="group surface-canvas-paper block w-full overflow-hidden border border-blueprint-border text-left"
      {...motionProps}
    >
      {linked ? (
        <TrSoftNavLink
          href={trLookPath(look.slug)}
          className="block outline-none focus-visible:ring-2 focus-visible:ring-blueprint-accent focus-visible:ring-offset-2"
          aria-label={`${look.title} look’una bak`}
        >
          {cover}
          <div className="px-4 pt-4 md:px-5 md:pt-5">{titleBlock}</div>
        </TrSoftNavLink>
      ) : (
        <>
          {cover}
          <div className="px-4 pt-4 md:px-5 md:pt-5">{titleBlock}</div>
        </>
      )}

      {/* Outside the look <a> so boutique links are not nested */}
      <div className="px-4 pt-2 pb-4 md:px-5 md:pb-5">
        <TrLookBoutiqueCredits boutiques={boutiques} />
      </div>
    </motion.article>
  );
}
