"use client";

import Image from "next/image";
import type { KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { TrLookBoutiqueCredits } from "@/components/tr/TrLookBoutiqueCredits";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import type { TrLookWithProducts } from "@/types/tr-look";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";

interface TrLookCardProps {
  look: TrLookWithProducts;
  index: number;
  onSelect: (look: TrLookWithProducts) => void;
}

export function TrLookCard({ look, index, onSelect }: TrLookCardProps) {
  const boutiques = look.products.map((product) => product.boutique);
  const demoCover = isTrDemoIconSrc(look.coverImage);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(look);
    }
  };

  return (
    <motion.article
      role="button"
      tabIndex={0}
      onClick={() => onSelect(look)}
      onKeyDown={handleKeyDown}
      className="group surface-canvas-paper block w-full cursor-pointer overflow-hidden border border-blueprint-border text-left outline-none focus-visible:ring-2 focus-visible:ring-blueprint-accent focus-visible:ring-offset-2"
      aria-label={`${look.title} look’una bak`}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.45,
        ease: trPanelEase,
        delay: Math.min(index * 0.06, 0.24),
      }}
    >
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

      <div className="border-t border-blueprint-border px-3 py-3 md:px-4 md:py-4">
        <h3 className="font-serif text-[11px] leading-snug tracking-[0.12em] text-neutral-900 uppercase md:text-xs">
          {look.title}
        </h3>
        <p className="text-meta mt-1.5 text-[9px] tracking-[0.22em] uppercase">
          {look.products.length} parça
          {look.boutiqueCount > 1 ? ` · ${look.boutiqueCount} butik` : ""}
        </p>
        <TrLookBoutiqueCredits boutiques={boutiques} />
      </div>
    </motion.article>
  );
}
