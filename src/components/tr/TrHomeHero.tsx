"use client";

import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";
import { TR_LOOKS_SECTION_ID } from "@/lib/tr/looks";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";

export function TrHomeHero() {
  const scrollToLooks = () => {
    document.getElementById(TR_LOOKS_SECTION_ID)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section
      aria-label="Türkiye editorial hero"
      className="hero-editorial-gradient relative flex min-h-[calc(100dvh-5rem)] w-full flex-col justify-between overflow-hidden"
    >
      <div className="relative z-10 flex flex-1 flex-col justify-end px-5 pb-28 pt-16 md:px-10 md:pb-32 md:pt-20">
        <motion.div
          className="max-w-4xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: trPanelEase }}
        >
          <p className="font-mono text-[10px] tracking-[0.45em] text-white/70 uppercase md:text-[11px]">
            [ TÜRKİYE · BUTİK CADDESİ ]
          </p>

          <div className="mt-6 md:mt-8">
            <BrandLogo
              variant="onDark"
              className="h-10 w-auto opacity-95 md:h-14"
            />
          </div>

          <h1 className="mt-6 max-w-2xl font-serif text-[clamp(1.85rem,5.5vw,3.25rem)] leading-[1.05] font-light tracking-[-0.02em] text-white md:mt-8">
            Butik caddesinden seçilmiş kombinler
          </h1>

          <p className="mt-4 max-w-md font-mono text-[11px] leading-relaxed tracking-[0.08em] text-white/65 md:text-[12px]">
            Farklı butiklerden parçalar, tek sepet. Önce look — sonra ürün.
          </p>

          <button
            type="button"
            onClick={scrollToLooks}
            className="mt-8 inline-flex items-center border border-white/35 bg-white/5 px-5 py-3 font-mono text-[10px] tracking-[0.28em] text-white uppercase backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/10 md:mt-10"
          >
            Kombinlere bak
          </button>
        </motion.div>
      </div>

      <div className="absolute right-0 bottom-0 left-0 z-10 flex justify-center pb-6 md:pb-8">
        <button
          type="button"
          onClick={scrollToLooks}
          aria-label="Kombinler bölümüne kaydır"
          className="animate-bounce cursor-pointer rounded-full p-2 text-white/55 transition-colors hover:text-white"
        >
          <ChevronDown strokeWidth={1.25} className="h-7 w-7" aria-hidden />
        </button>
      </div>
    </section>
  );
}
