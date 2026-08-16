"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import {
  CADDE_INTRO_FRAMES,
  CADDE_INTRO_HOLD_MS,
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

const COUNT_MAX = 100;

function pad3(value: number): string {
  return String(Math.max(0, Math.min(COUNT_MAX, Math.round(value)))).padStart(
    3,
    "0",
  );
}

function startProgressCount(
  el: HTMLElement,
  durationMs: number,
  onComplete?: () => void,
): () => void {
  let raf = 0;
  const start = performance.now();

  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / durationMs);
    const eased = 1 - (1 - t) * (1 - t);
    el.textContent = pad3(1 + (COUNT_MAX - 1) * eased);
    if (t < 1) {
      raf = requestAnimationFrame(tick);
      return;
    }
    onComplete?.();
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

function playCountClose(el: HTMLElement) {
  const raw =
    (el.textContent ?? pad3(COUNT_MAX)).replace(/\s/g, "") || pad3(COUNT_MAX);
  el.replaceChildren();
  el.style.overflow = "hidden";

  Array.from(raw).forEach((digit, index) => {
    const span = document.createElement("span");
    span.textContent = digit;
    span.className = "inline-block";
    span.style.willChange = "transform, opacity";
    el.appendChild(span);
    span.animate(
      [
        { transform: "translate3d(0, 0, 0)", opacity: 1 },
        { transform: "translate3d(0, -110%, 0)", opacity: 0 },
      ],
      {
        duration: 220,
        delay: index * 36,
        fill: "forwards",
        easing: OUT_EASE,
      },
    );
  });
}

function freezeThenAnimate(
  el: HTMLElement,
  fromFallback: Keyframe,
  to: Keyframe,
  delayMs: number,
  durationMs: number,
  easing: string,
) {
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
        duration: 280,
        delay:
          (CADDE_INTRO_LETTER_START_S + index * CADDE_INTRO_LETTER_STAGGER_S) *
          1000,
        fill: "forwards",
        easing: IN_EASE,
      },
    );
  });

  const count = root.querySelector<HTMLElement>("[data-cadde-count]");
  count?.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 320,
    delay: CADDE_INTRO_PHOTO_IN_DELAY_S * 1000,
    fill: "forwards",
    easing: IN_EASE,
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
  const countRef = useRef<HTMLParagraphElement>(null);
  const stopCountRef = useRef<(() => void) | null>(null);
  const countClosedRef = useRef(false);

  const setCount = (value: number) => {
    if (countClosedRef.current) return;
    if (countRef.current) countRef.current.textContent = pad3(value);
  };

  const stopCount = () => {
    stopCountRef.current?.();
    stopCountRef.current = null;
  };

  const closeCount = () => {
    if (countClosedRef.current) return;
    countClosedRef.current = true;
    const el = countRef.current;
    if (!el) return;
    if (reduceMotion) {
      el.style.opacity = "0";
      return;
    }
    playCountClose(el);
  };

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    countClosedRef.current = false;

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
      const count = root.querySelector<HTMLElement>("[data-cadde-count]");
      if (count) count.style.opacity = "1";
      setCount(COUNT_MAX);
      return;
    }

    playEntrance(root);
    if (countRef.current) {
      stopCountRef.current = startProgressCount(
        countRef.current,
        CADDE_INTRO_HOLD_MS,
        closeCount,
      );
    }

    return () => {
      stopCount();
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (!exiting) return;
    const root = rootRef.current;
    if (!root) return;

    stopCount();
    if (!countClosedRef.current) {
      setCount(COUNT_MAX);
      closeCount();
    }

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
          <div className="relative h-[min(42vw,220px)] w-[min(31vw,160px)]">
            {CADDE_INTRO_FRAMES.map((frame, index) => (
              <div
                key={frame.src}
                data-cadde-photo=""
                className="absolute inset-0 overflow-hidden bg-black opacity-0 shadow-[0_22px_50px_rgba(0,0,0,0.55)] ring-1 ring-white/20"
                style={{
                  zIndex: index + 1,
                  willChange: "transform, opacity",
                  backfaceVisibility: "hidden",
                }}
              >
                <img
                  src={frame.src}
                  alt=""
                  width={800}
                  height={1067}
                  decoding="async"
                  fetchPriority={index < 3 ? "high" : "low"}
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <p
          aria-label="Cortisstyle"
          className="font-cadde-display pointer-events-none relative z-20 flex flex-col items-center gap-[0.14em] text-center text-[clamp(3.15rem,16vw,9.75rem)] leading-none font-normal tracking-[0.02em] text-[#F3EDE4] uppercase mix-blend-difference md:gap-0 md:leading-[0.9]"
        >
          <span className="block">
            {Array.from(CADDE_INTRO_WORD.top).map((letter, index) => (
              <span
                key={`top-${index}`}
                data-cadde-letter=""
                className="inline-block opacity-0"
                style={{ willChange: "transform, opacity" }}
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
                className="inline-block opacity-0"
                style={{ willChange: "transform, opacity" }}
              >
                {letter}
              </span>
            ))}
          </span>
        </p>

        <p
          ref={countRef}
          data-cadde-count=""
          aria-hidden
          className="font-cadde-display pointer-events-none absolute right-0 bottom-0 z-30 translate-y-[1.2em] overflow-hidden text-[clamp(1.05rem,3.1vw,1.7rem)] leading-none font-normal tracking-[0.06em] text-[#E8E4DC] tabular-nums opacity-0"
        >
          001
        </p>
      </div>
    </div>
  );
}
