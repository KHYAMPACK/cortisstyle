"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import {
  CADDE_INTRO_FRAMES,
  CADDE_INTRO_LETTER_OUT_DURATION_S,
  CADDE_INTRO_LETTER_OUT_STAGGER_S,
  CADDE_INTRO_LETTER_STAGGER_S,
  CADDE_INTRO_LETTER_START_S,
  CADDE_INTRO_PHOTO_IN_DELAY_S,
  CADDE_INTRO_PHOTO_IN_DURATION_S,
  CADDE_INTRO_PHOTO_IN_STAGGER_S,
  CADDE_INTRO_PHOTO_OUT_DURATION_S,
  CADDE_INTRO_PHOTO_OUT_STAGGER_S,
  CADDE_INTRO_WORD,
} from "@/lib/platform/caddeIntro";

const IN_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const OUT_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type IntroFrame = (typeof CADDE_INTRO_FRAMES)[number];

function photoFrom(frame: IntroFrame): string {
  return `translate3d(0px, 64px, 0) rotate(${frame.rotate - 10}deg) scale(0.72)`;
}

function photoIn(frame: IntroFrame): string {
  return `translate3d(${frame.x}px, ${frame.y}px, 0) rotate(${frame.rotate}deg) scale(1)`;
}

function photoOut(frame: IntroFrame): string {
  return photoFrom(frame);
}

function freezeThenAnimate(
  el: HTMLElement,
  fromFallback: Keyframe,
  to: Keyframe,
  delayMs: number,
  durationMs: number,
  easing: string,
) {
  const computed = getComputedStyle(el);
  for (const animation of el.getAnimations()) {
    try {
      animation.commitStyles();
    } catch {
      /* Safari may throw if the animation already finished */
    }
    animation.cancel();
  }

  const opacity = Number(getComputedStyle(el).opacity);
  const from: Keyframe =
    opacity > 0.05
      ? { transform: getComputedStyle(el).transform, opacity }
      : fromFallback;

  el.animate([from, to], {
    duration: durationMs,
    delay: delayMs,
    fill: "forwards",
    easing,
  });
}

function playEntrance(root: HTMLElement) {
  const photos = root.querySelectorAll<HTMLElement>("[data-cadde-photo]");
  photos.forEach((el, index) => {
    const frame = CADDE_INTRO_FRAMES[index];
    if (!frame) return;
    el.animate(
      [
        { transform: photoFrom(frame), opacity: 0 },
        { transform: photoIn(frame), opacity: 1 },
      ],
      {
        duration: CADDE_INTRO_PHOTO_IN_DURATION_S * 1000,
        delay:
          (CADDE_INTRO_PHOTO_IN_DELAY_S +
            index * CADDE_INTRO_PHOTO_IN_STAGGER_S) *
          1000,
        fill: "forwards",
        easing: IN_EASE,
      },
    );
  });

  const letters = root.querySelectorAll<HTMLElement>("[data-cadde-letter]");
  letters.forEach((el, index) => {
    el.animate(
      [
        { transform: "translate3d(0, 0.55em, 0)", opacity: 0 },
        { transform: "translate3d(0, 0, 0)", opacity: 1 },
      ],
      {
        duration: 380,
        delay:
          (CADDE_INTRO_LETTER_START_S +
            index * CADDE_INTRO_LETTER_STAGGER_S) *
          1000,
        fill: "forwards",
        easing: IN_EASE,
      },
    );
  });
}

function playReverse(root: HTMLElement) {
  const photos = root.querySelectorAll<HTMLElement>("[data-cadde-photo]");
  const photoCount = photos.length;
  photos.forEach((el, index) => {
    const frame = CADDE_INTRO_FRAMES[index];
    if (!frame) return;
    freezeThenAnimate(
      el,
      { transform: photoIn(frame), opacity: 1 },
      { transform: photoOut(frame), opacity: 0 },
      (photoCount - 1 - index) * CADDE_INTRO_PHOTO_OUT_STAGGER_S * 1000,
      CADDE_INTRO_PHOTO_OUT_DURATION_S * 1000,
      OUT_EASE,
    );
  });

  const letters = root.querySelectorAll<HTMLElement>("[data-cadde-letter]");
  const letterCount = letters.length;
  letters.forEach((el, index) => {
    freezeThenAnimate(
      el,
      { transform: "translate3d(0, 0, 0)", opacity: 1 },
      { transform: "translate3d(0, 0.55em, 0)", opacity: 0 },
      (letterCount - 1 - index) * CADDE_INTRO_LETTER_OUT_STAGGER_S * 1000,
      CADDE_INTRO_LETTER_OUT_DURATION_S * 1000,
      OUT_EASE,
    );
  });
}

export function CaddeIntroStack({ exiting = false }: { exiting?: boolean }) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const didEnter = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || didEnter.current) return;
    didEnter.current = true;

    if (reduceMotion) {
      root.querySelectorAll<HTMLElement>("[data-cadde-photo]").forEach((el, i) => {
        const frame = CADDE_INTRO_FRAMES[i];
        if (!frame) return;
        el.style.transform = photoIn(frame);
        el.style.opacity = "1";
      });
      root.querySelectorAll<HTMLElement>("[data-cadde-letter]").forEach((el) => {
        el.style.transform = "translate3d(0, 0, 0)";
        el.style.opacity = "1";
      });
      return;
    }

    playEntrance(root);
  }, [reduceMotion]);

  useEffect(() => {
    if (!exiting) return;
    const root = rootRef.current;
    if (!root) return;

    if (reduceMotion) {
      root.querySelectorAll<HTMLElement>("[data-cadde-photo]").forEach((el, i) => {
        const frame = CADDE_INTRO_FRAMES[i];
        if (!frame) return;
        el.style.transform = photoOut(frame);
        el.style.opacity = "0";
      });
      root.querySelectorAll<HTMLElement>("[data-cadde-letter]").forEach((el) => {
        el.style.transform = "translate3d(0, 0.55em, 0)";
        el.style.opacity = "0";
      });
      return;
    }

    playReverse(root);
  }, [exiting, reduceMotion]);

  return (
    <div
      ref={rootRef}
      className="relative isolate flex h-full w-full items-center justify-center overflow-hidden bg-black px-3"
    >
      <div className="relative flex max-w-[100vw] items-center justify-center">
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
          aria-hidden
        >
          <div className="relative h-[min(68vw,460px)] w-[min(50vw,340px)] sm:h-[500px] sm:w-[360px]">
            {CADDE_INTRO_FRAMES.map((frame, index) => (
              <div
                key={frame.src}
                data-cadde-photo=""
                className="absolute inset-0 overflow-hidden bg-black shadow-[0_22px_50px_rgba(0,0,0,0.55)] ring-1 ring-white/20"
                style={{
                  zIndex: index + 1,
                  opacity: 0,
                  transform: photoFrom(frame),
                  willChange: "transform, opacity",
                  backfaceVisibility: "hidden",
                }}
              >
                <Image
                  src={frame.src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 360px"
                  priority={index < 4}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <p
          aria-label="Cortisstyle"
          className="font-cadde-display pointer-events-none relative z-20 flex flex-col items-center text-center text-[clamp(3.15rem,16vw,9.75rem)] leading-[0.72] font-bold tracking-[-0.055em] text-[#F3EDE4] uppercase mix-blend-difference"
        >
          <span className="block">
            {Array.from(CADDE_INTRO_WORD.top).map((letter, index) => (
              <span
                key={`top-${index}`}
                data-cadde-letter=""
                className="inline-block"
                style={{
                  opacity: 0,
                  transform: "translate3d(0, 0.55em, 0)",
                  willChange: "transform, opacity",
                }}
              >
                {letter}
              </span>
            ))}
          </span>
          <span className="block">
            {Array.from(CADDE_INTRO_WORD.bottom).map((letter, index) => (
              <span
                key={`bottom-${index}`}
                data-cadde-letter=""
                className="inline-block"
                style={{
                  opacity: 0,
                  transform: "translate3d(0, 0.55em, 0)",
                  willChange: "transform, opacity",
                }}
              >
                {letter}
              </span>
            ))}
          </span>
        </p>
      </div>
    </div>
  );
}
