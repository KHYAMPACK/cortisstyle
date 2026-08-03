"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useState,
  type CSSProperties,
} from "react";
import type { EditorialHeroPromotion } from "@/lib/tr/boutiqueHome";
import { trBoutiqueProductsPath } from "@/lib/tr/paths";

const AUTO_MS = 5500;
const ease = [0.22, 1, 0.36, 1] as const;

const PLACEHOLDER_TONES = [
  "bg-[#2a2a2a]",
  "bg-[#1f1a1c]",
  "bg-[#242018]",
] as const;

function promotionHref(boutiqueSlug: string, promo: EditorialHeroPromotion) {
  const target = promo.target?.trim() || "sale";
  if (target === "sale") {
    return trBoutiqueProductsPath(boutiqueSlug, { indirim: true });
  }
  if (target === "all") {
    return trBoutiqueProductsPath(boutiqueSlug);
  }
  return trBoutiqueProductsPath(boutiqueSlug, { kategori: target });
}

interface TrBoutiqueEditorialHeroCarouselProps {
  boutiqueSlug: string;
  brandTitle: string;
  logoUrl: string | null;
  promotions: EditorialHeroPromotion[];
}

export function TrBoutiqueEditorialHeroCarousel({
  boutiqueSlug,
  brandTitle,
  logoUrl,
  promotions,
}: TrBoutiqueEditorialHeroCarouselProps) {
  const slides =
    promotions.length > 0
      ? promotions
      : [
          {
            id: "fallback",
            promoLine: "Kampanya",
            discountLine: "Alışverişe başla",
            cta: "Keşfet",
            target: "all" as const,
          },
        ];

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = slides[index % slides.length]!;
  const multi = slides.length > 1;

  const goTo = useCallback(
    (next: number) => {
      const len = slides.length;
      setIndex(((next % len) + len) % len);
    },
    [slides.length],
  );

  const advance = useEffectEvent(() => {
    if (paused || !multi) return;
    setIndex((current) => (current + 1) % slides.length);
  });

  useEffect(() => {
    if (!multi || paused) return;
    const timer = window.setInterval(() => advance(), AUTO_MS);
    return () => window.clearInterval(timer);
  }, [multi, paused, slides.length]);

  return (
    <section
      aria-label="Kampanyalar"
      aria-roledescription="carousel"
      className="relative min-h-[72vh] overflow-hidden md:min-h-[85vh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`bg-${active.id}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease }}
        >
          {active.image ? (
            <Image
              src={active.image}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div
              className={`absolute inset-0 ${PLACEHOLDER_TONES[index % PLACEHOLDER_TONES.length]}`}
              aria-hidden
            >
              <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.06)_40%,rgba(255,255,255,0.06)_60%,transparent_60%)] opacity-40" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/45" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex min-h-[72vh] flex-col items-center justify-between px-5 py-10 text-center text-white md:min-h-[85vh] md:py-14">
        <div className="flex flex-col items-center pt-2 md:pt-6">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt=""
              width={160}
              height={160}
              className="h-14 w-auto object-contain brightness-0 invert md:h-20"
              unoptimized
              priority
            />
          ) : null}
          <p className="mt-3 font-serif text-[1.75rem] tracking-[0.04em] md:text-4xl lg:text-5xl">
            {brandTitle}
          </p>
        </div>

        <div className="flex max-w-xl flex-col items-center pb-6 md:pb-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease }}
              className="flex flex-col items-center"
            >
              <p className="text-[13px] tracking-[0.08em] text-white/80 uppercase md:text-[15px]">
                {active.promoLine}
              </p>
              <p
                className="editorial-sale-text mt-3 text-[28px] leading-tight font-semibold tracking-[-0.02em] uppercase md:text-5xl lg:text-6xl"
                style={
                  {
                    color: "#FF4D8D",
                    "--boutique-sale": "#FF4D8D",
                    "--brand-primary": "#C2185B",
                  } as CSSProperties
                }
              >
                {active.discountLine}
              </p>
              <Link
                href={promotionHref(boutiqueSlug, active)}
                className="editorial-promo-cta mt-6 inline-flex min-h-11 items-center bg-brand-primary px-6 py-3 text-[12px] tracking-[0.2em] text-white uppercase transition-opacity hover:opacity-90 md:text-[13px]"
              >
                {active.cta}
              </Link>
            </motion.div>
          </AnimatePresence>

          {multi ? (
            <div
              className="mt-8 flex items-center gap-2"
              role="tablist"
              aria-label="Kampanya slaytları"
            >
              {slides.map((slide, slideIndex) => {
                const selected = slideIndex === index % slides.length;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-label={`Kampanya ${slideIndex + 1}`}
                    onClick={() => goTo(slideIndex)}
                    className={`h-1.5 transition-all duration-300 ${
                      selected
                        ? "w-8 bg-white"
                        : "w-1.5 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
