"use client";

import { useEffect, type RefObject } from "react";

/**
 * While a desktop look showcase sits in the viewport, vertical wheel
 * first drives the product rail sideways. When the rail is spent,
 * the page keeps scrolling.
 */
export function useCaddeLookRailWheel(
  sectionRef: RefObject<HTMLElement | null>,
  railRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      if (window.matchMedia("(max-width: 1023px)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const section = sectionRef.current;
      const rail = railRef.current;
      if (!section || !rail) return;

      const rect = section.getBoundingClientRect();
      const inLatch =
        rect.top <= 12 && rect.bottom >= window.innerHeight * 0.62;
      if (!inLatch) return;

      const overflow = rail.scrollWidth - rail.clientWidth;
      if (overflow < 12) return;

      const dominantX = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      const delta = dominantX ? event.deltaX : event.deltaY;
      if (delta === 0) return;

      const left = rail.scrollLeft;
      const goingForward = delta > 0;
      const atStart = left <= 1;
      const atEnd = left >= overflow - 1;

      if (goingForward && atEnd) return;
      if (!goingForward && atStart) return;

      event.preventDefault();
      rail.scrollLeft = Math.min(overflow, Math.max(0, left + delta));
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [enabled, railRef, sectionRef]);
}

/** Slow horizontal crawl while the showcase is on screen. Pauses on hover or wheel. */
export function useCaddeLookRailAutoplay(
  sectionRef: RefObject<HTMLElement | null>,
  railRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;

    const section = sectionRef.current;
    const rail = railRef.current;
    if (!section || !rail) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let paused = false;
    let resumeTimer = 0;

    const pause = () => {
      paused = true;
    };
    const pauseBriefly = () => {
      paused = true;
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        paused = false;
      }, 1600);
    };
    const resume = () => {
      paused = false;
    };

    rail.addEventListener("pointerenter", pause);
    rail.addEventListener("pointerleave", resume);
    window.addEventListener("wheel", pauseBriefly, { passive: true });

    const tick = window.setInterval(() => {
      if (paused) return;
      if (window.matchMedia("(max-width: 1023px)").matches) return;
      const rect = section.getBoundingClientRect();
      const onScreen =
        rect.top < window.innerHeight * 0.72 &&
        rect.bottom > window.innerHeight * 0.28;
      if (!onScreen) return;

      const overflow = rail.scrollWidth - rail.clientWidth;
      if (overflow < 12) return;
      if (rail.scrollLeft >= overflow - 1) {
        rail.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }
      rail.scrollLeft += 0.7;
    }, 24);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(resumeTimer);
      rail.removeEventListener("pointerenter", pause);
      rail.removeEventListener("pointerleave", resume);
      window.removeEventListener("wheel", pauseBriefly);
    };
  }, [enabled, railRef, sectionRef]);
}
