"use client";

import { useCallback, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  CADDE_DISPLAY,
  CADDE_KICKER,
  caddeBracket,
  caddeIndexLabel,
} from "@/lib/tr/marketplace/caddeUi";
import {
  CADDE_PLUS_ARM_VMIN,
  CADDE_PLUS_BAR_VMIN,
  CADDE_PLUS_GROW_VMIN,
  CADDE_PLUS_REVEAL_ID,
  CADDE_PLUS_SHEET,
  caddePlusTearPath,
} from "@/lib/tr/marketplace/caddePlusReveal";

const TEAR_PATH = caddePlusTearPath();

function ComingSoonCopy() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center px-5 text-center md:px-10">
      <p className={`${CADDE_KICKER} text-[12px] md:text-[13px]`}>
        {caddeIndexLabel("02", "Stüdyo")}
      </p>
      <h2
        className={`${CADDE_DISPLAY} mt-5 text-ice-floor text-[clamp(2.4rem,8.5vw,5.8rem)]`}
      >
        {caddeBracket("Kendi kombinin oluştur")}
      </h2>
      <p className="mt-8 max-w-2xl font-cadde-nav text-[16px] leading-snug tracking-[0.06em] text-white/85 md:text-[22px] md:leading-snug">
        Cadde butiklerinden parçalarla kendi look’unu kuracağın stüdyo. Bu
        özellik henüz geliştiriliyor.
      </p>
      <p
        className={`${CADDE_KICKER} mt-8 text-[12px] md:text-[14px]`}
      >
        Yakında — üzerinde çalışıyoruz
      </p>
    </div>
  );
}

function ClosedHint() {
  return (
    <div className="flex flex-col items-center px-5 text-center">
      <p className={`${CADDE_KICKER} text-[12px] md:text-[13px]`}>
        {caddeIndexLabel("02", "Stüdyo")}
      </p>
      <p
        className={`${CADDE_DISPLAY} mt-3 text-[clamp(1.7rem,5.4vw,3rem)] text-jet-black`}
      >
        Kendi kombinin oluştur
      </p>
    </div>
  );
}

export function CaddePlusReveal() {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const arm = useTransform(
    scrollYProgress,
    [0, 0.42],
    [`${CADDE_PLUS_ARM_VMIN}vmin`, `${CADDE_PLUS_GROW_VMIN}vmin`],
  );
  const bar = useTransform(
    scrollYProgress,
    [0, 0.42],
    [`${CADDE_PLUS_BAR_VMIN}vmin`, `${CADDE_PLUS_GROW_VMIN}vmin`],
  );
  const hintOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);
  const copyOpacity = useTransform(scrollYProgress, [0.22, 0.42], [0, 1]);
  const copyY = useTransform(scrollYProgress, [0.22, 0.42], [22, 0]);

  const openFromPlus = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top =
      track.getBoundingClientRect().top +
      window.scrollY +
      track.offsetHeight -
      window.innerHeight;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }, []);

  if (reduceMotion) {
    return (
      <section
        id={CADDE_PLUS_REVEAL_ID}
        className="relative bg-jet-black"
        aria-label="Kendi kombinin oluştur"
      >
        <div className="flex min-h-[80dvh] flex-col items-center justify-center py-24">
          <ComingSoonCopy />
        </div>
        <div className="min-h-[50vh]" />
        <CaddePlusTear />
      </section>
    );
  }

  return (
    <section
      id={CADDE_PLUS_REVEAL_ID}
      aria-label="Kendi kombinin oluştur"
    >
      <div ref={trackRef} className="relative h-[280vh]">
        <div className="sticky top-0 h-dvh overflow-hidden bg-ice-floor">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative"
              style={{
                width: `${CADDE_PLUS_ARM_VMIN}vmin`,
                height: `${CADDE_PLUS_ARM_VMIN}vmin`,
              }}
            >
              <motion.span
                aria-hidden
                className="absolute top-1/2 left-1/2 block -translate-x-1/2 -translate-y-1/2 bg-jet-black"
                style={{ width: bar, height: arm }}
              />
              <motion.span
                aria-hidden
                className="absolute top-1/2 left-1/2 block -translate-x-1/2 -translate-y-1/2 bg-jet-black"
                style={{ width: arm, height: bar }}
              />

              <motion.div
                className="absolute inset-x-0 bottom-full mb-6 flex justify-center md:mb-8"
                style={{ opacity: hintOpacity }}
              >
                <ClosedHint />
              </motion.div>

              <button
                type="button"
                onClick={openFromPlus}
                className="absolute inset-0 z-10 outline-none focus-visible:ring-2 focus-visible:ring-jet-black focus-visible:ring-offset-4 focus-visible:ring-offset-ice-floor"
                aria-label="Kendi kombinin oluştur — yakında"
              />

              <motion.p
                className={`${CADDE_KICKER} absolute inset-x-0 top-full mt-6 text-center text-[12px] md:mt-8 md:text-[13px]`}
                style={{ opacity: hintOpacity }}
              >
                İpucu: açmak için kaydır
              </motion.p>
            </div>
          </div>

          <motion.div
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
            style={{ opacity: copyOpacity, y: copyY }}
          >
            <ComingSoonCopy />
          </motion.div>
        </div>
      </div>

      <div className="relative flex min-h-[85vh] items-center justify-center bg-jet-black py-24">
        <ComingSoonCopy />
        <CaddePlusTear />
      </div>
    </section>
  );
}

function CaddePlusTear() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 w-full md:h-12"
      aria-hidden
    >
      <svg
        viewBox="0 0 1000 48"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <path d={TEAR_PATH} fill={CADDE_PLUS_SHEET} />
      </svg>
    </div>
  );
}
