"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { TrLookWithProducts } from "@/types/tr-look";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";

interface TrLookCardProps {
  look: TrLookWithProducts;
  index: number;
  onSelect: (look: TrLookWithProducts) => void;
}

export function TrLookCard({ look, index, onSelect }: TrLookCardProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(look)}
      className="group block w-full cursor-pointer overflow-hidden border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: trPanelEase, delay: Math.min(index * 0.06, 0.24) }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
        {look.coverImage ? (
          <Image
            src={look.coverImage}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-blueprint-surface px-6">
            <span className="font-serif text-2xl text-neutral-600">{look.title}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 p-5 md:p-6">
          <p className="font-mono text-[9px] tracking-[0.28em] text-white/70 uppercase">
            {look.products.length} parça
            {look.boutiqueCount > 1
              ? ` · ${look.boutiqueCount} butik`
              : ""}
          </p>
          <h3 className="mt-2 font-serif text-2xl leading-none tracking-[-0.02em] text-white md:text-3xl">
            {look.title}
          </h3>
          {look.subtitle ? (
            <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-white/75">
              {look.subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </motion.button>
  );
}
