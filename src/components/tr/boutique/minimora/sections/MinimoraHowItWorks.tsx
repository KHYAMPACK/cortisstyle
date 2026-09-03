"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { useRef, useState } from "react";
import { minimoraHomeContent } from "@/components/tr/boutique/minimora/minimoraHomeContent";
import { minimoraDisplay } from "@/components/tr/boutique/minimora/minimoraTheme";

const EASE = [0.22, 1, 0.36, 1] as const;
const STEPS = minimoraHomeContent.howItWorks.steps;
const STEP_COUNT = STEPS.length;

function stepFromProgress(v: number) {
  const clamped = Math.min(0.999, Math.max(0, v));
  return Math.min(STEP_COUNT - 1, Math.floor(clamped * STEP_COUNT));
}

function PhotoFrame({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden border border-black/10 bg-[#FDFBF7] ${className ?? ""}`}
    >
      <Image
        src={src}
        alt={alt}
        width={1400}
        height={900}
        className="h-full w-full object-cover"
        sizes="(max-width: 1024px) 90vw, 420px"
      />
    </div>
  );
}

export function MinimoraHowItWorks() {
  const { howItWorks } = minimoraHomeContent;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const line = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    restDelta: 0.001,
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = stepFromProgress(v);
    setActive((prev) => (prev === next ? prev : next));
  });

  const current = STEPS[active] ?? STEPS[0];

  if (reduce) {
    return (
      <section
        id={howItWorks.id}
        className="scroll-mt-24 border-t border-black/5 bg-[#FDFBF7] text-[#3D3D3D]"
        aria-labelledby="nasil-calisir-title"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="mb-3 text-xs font-medium tracking-[0.2em] text-[#C45E2A] uppercase">
            {howItWorks.eyebrow}
          </p>
          <h2 id="nasil-calisir-title" className="sr-only">
            {howItWorks.title}
          </h2>
          <ul className="grid gap-10 lg:grid-cols-3">
            {STEPS.map((item) => (
              <li key={item.word}>
                <p
                  className={`${minimoraDisplay} text-3xl font-bold tracking-tight text-[#3D3D3D] uppercase`}
                >
                  {item.word}
                </p>
                <div className="mt-4">
                  <PhotoFrame
                    src={item.image}
                    alt={item.imageAlt}
                    className="aspect-[16/10]"
                  />
                </div>
                <p className="mt-4 text-base leading-relaxed text-[#6B7280]">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section
      id={howItWorks.id}
      className="scroll-mt-24 border-t border-black/5 bg-[#FDFBF7] text-[#3D3D3D]"
      aria-labelledby="nasil-calisir-title"
    >
      <div ref={ref} className="h-[600vh]">
        <div className="sticky top-14 h-[calc(100svh-3.5rem)] overflow-x-clip overflow-y-auto md:top-16 md:h-[calc(100svh-4rem)] lg:overflow-hidden">
          <div className="relative mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col px-5 pt-5 pb-6 md:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:grid-rows-1 lg:items-center lg:gap-10 lg:overflow-visible lg:py-0">
            <div className="order-1 flex shrink-0 flex-col lg:order-1 lg:min-w-0">
              <p className="mb-3 text-xs font-medium tracking-[0.2em] text-[#C45E2A] uppercase lg:mb-6">
                {howItWorks.eyebrow}
              </p>
              <h2 id="nasil-calisir-title" className="sr-only">
                {howItWorks.title}
              </h2>
              <ul className="flex flex-col">
                {STEPS.map((item, i) => {
                  const on = i === active;
                  return (
                    <li key={item.word} className="min-w-0">
                      <motion.span
                        className={`${minimoraDisplay} block origin-left py-[0.04em] leading-[0.92] font-bold tracking-tight whitespace-nowrap uppercase transition-[font-size] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          on
                            ? "text-[clamp(3.15rem,15vw,5.1rem)] lg:text-[clamp(4.1rem,5.6vw,5.6rem)]"
                            : "text-[clamp(1.45rem,6.2vw,2.05rem)] lg:text-[clamp(1.9rem,2.7vw,2.55rem)]"
                        }`}
                        animate={{
                          color: on ? "#3D3D3D" : "rgba(61, 61, 61, 0.18)",
                        }}
                        transition={{ duration: 0.4, ease: EASE }}
                      >
                        {item.word}
                      </motion.span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-sm text-[#6B7280] lg:mt-8">
                {howItWorks.footer}
              </p>

              <div className="mt-5 h-px w-full bg-black/10 lg:hidden" aria-hidden>
                <motion.div
                  style={{ scaleX: line }}
                  className="h-px origin-left bg-[#F3A575]"
                />
              </div>
            </div>

            <div className="relative order-2 mt-5 flex min-h-0 flex-1 flex-col justify-start lg:order-2 lg:mt-0 lg:h-full lg:justify-center lg:pl-10">
              <div
                className="absolute inset-y-0 left-[15px] hidden w-px bg-black/10 lg:block"
                aria-hidden
              />
              <motion.div
                style={{ scaleY: line }}
                className="absolute inset-y-0 left-[15px] hidden w-px origin-top bg-[#F3A575] lg:block"
                aria-hidden
              />

              <div className="relative min-h-0 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.word}
                    className="flex flex-col"
                    initial={{ y: "40%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    exit={{ y: "-28%", opacity: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                  >
                    <p className="order-1 max-w-lg text-base leading-relaxed text-[#6B7280] lg:order-2 lg:mt-5 lg:text-lg">
                      {current.body}
                    </p>
                    <div className="relative order-2 mt-4 aspect-[16/10] max-h-[32vh] overflow-hidden border border-black/10 bg-[#FDFBF7] lg:order-1 lg:mt-0 lg:max-h-none">
                      <Image
                        src={current.image}
                        alt={current.imageAlt}
                        width={1400}
                        height={900}
                        className="h-full w-full object-cover"
                        sizes="(max-width: 1024px) 90vw, 480px"
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
