"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import type { HeroSlotPiece } from "@/data/tr/heroSlotPieces";
import {
  OUTFIT_FRAME_HEIGHT,
  OUTFIT_FRAME_WIDTH,
  OUTFIT_LANDMARKS,
  OUTFIT_ROLE_PLACEMENTS,
} from "@/lib/tr/outfitFrame/types";

interface TrHeroOutfitSlotsProps {
  tops: readonly HeroSlotPiece[];
  bottoms: readonly HeroSlotPiece[];
}

const DWELL_MS = 1800;
const STAGGER_MS = 420;
const REEL_DURATION = 0.52;
const BREATHE_DURATION = 0;

function LayerReel({
  piece,
  reelKey,
  reduceMotion,
  priority,
  zIndex,
  /** Fraction of frame height — nudges top up / bottom down for a tiny seam gap. */
  seamOffsetY = 0,
  /** Horizontal spin direction: top from right, bottom from left. */
  enterFrom,
}: {
  piece: HeroSlotPiece;
  reelKey: string;
  reduceMotion: boolean | null;
  priority?: boolean;
  zIndex: number;
  seamOffsetY?: number;
  enterFrom: "left" | "right";
}) {
  const gapPercent = `${seamOffsetY * 100}%`;
  const enterX = enterFrom === "right" ? "28%" : "-28%";
  const exitX = enterFrom === "right" ? "-22%" : "22%";

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ zIndex, transform: `translateY(${gapPercent})` }}
      aria-hidden
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={reelKey}
          className="absolute inset-0 will-change-transform"
          initial={
            reduceMotion
              ? false
              : { x: enterX, opacity: 0, filter: "blur(4px)" }
          }
          animate={{ x: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={
            reduceMotion
              ? undefined
              : { x: exitX, opacity: 0, filter: "blur(4px)" }
          }
          transition={{ duration: REEL_DURATION, ease: trPanelEase }}
        >
          <Image
            src={piece.src}
            alt=""
            fill
            sizes="(max-width: 768px) 80vw, 520px"
            unoptimized
            priority={priority}
            draggable={false}
            className="object-contain object-center select-none"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function TrHeroOutfitSlots({ tops, bottoms }: TrHeroOutfitSlotsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.35 });
  const reduceMotion = useReducedMotion();
  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(0);
  /** Bumps when the user advances a reel so the auto-spin timer restarts. */
  const [spinEpoch, setSpinEpoch] = useState(0);

  const hasSlots = tops.length > 0 && bottoms.length > 0;
  const seamSplit = `${OUTFIT_LANDMARKS.waistY * 100}%`;

  useEffect(() => {
    if (
      reduceMotion ||
      !inView ||
      !hasSlots ||
      tops.length < 2 ||
      bottoms.length < 2
    ) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let staggerId: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      if (cancelled) return;
      setTopIndex((current) => (current + 1) % tops.length);
      staggerId = setTimeout(() => {
        if (cancelled) return;
        setBottomIndex((current) => (current + 1) % bottoms.length);
      }, STAGGER_MS);
      timeoutId = setTimeout(tick, DWELL_MS);
    };

    timeoutId = setTimeout(tick, DWELL_MS);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (staggerId) clearTimeout(staggerId);
    };
  }, [bottoms.length, hasSlots, inView, reduceMotion, spinEpoch, tops.length]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasSlots) return;
    const nextTop = tops[(topIndex + 1) % tops.length];
    const nextBottom = bottoms[(bottomIndex + 1) % bottoms.length];
    for (const piece of [nextTop, nextBottom]) {
      if (!piece?.src) continue;
      const img = new window.Image();
      img.src = piece.src;
    }
  }, [bottomIndex, bottoms, hasSlots, topIndex, tops]);

  const advanceTop = () => {
    if (tops.length < 2) return;
    setTopIndex((current) => (current + 1) % tops.length);
    setSpinEpoch((n) => n + 1);
  };

  const advanceBottom = () => {
    if (bottoms.length < 2) return;
    setBottomIndex((current) => (current + 1) % bottoms.length);
    setSpinEpoch((n) => n + 1);
  };

  if (!hasSlots) return null;

  const topPiece = tops[topIndex % tops.length] ?? tops[0];
  const bottomPiece = bottoms[bottomIndex % bottoms.length] ?? bottoms[0];

  if (!topPiece || !bottomPiece) return null;

  return (
    <motion.div
      ref={rootRef}
      className="relative mx-auto w-full overflow-hidden max-h-[min(68dvh,640px)] lg:max-h-[min(80dvh,860px)]"
      style={{
        aspectRatio: `${OUTFIT_FRAME_WIDTH} / ${OUTFIT_FRAME_HEIGHT}`,
      }}
      animate={
        reduceMotion || !inView
          ? { y: 0 }
          : { y: [0, -6, 0] }
      }
      transition={
        reduceMotion || !inView
          ? { duration: 0 }
          : {
              duration: BREATHE_DURATION,
              ease: "easeInOut",
              repeat: Infinity,
            }
      }
    >
      {/* Full-frame layers — tiny seamGapY so hem / waistband don’t kiss */}
      <LayerReel
        piece={bottomPiece}
        reelKey={`bottom-${bottomIndex}-${bottomPiece.src}`}
        reduceMotion={reduceMotion}
        priority={bottomIndex === 0}
        zIndex={OUTFIT_ROLE_PLACEMENTS.bottom.zIndex}
        seamOffsetY={OUTFIT_LANDMARKS.seamGapY}
        enterFrom="left"
      />
      <LayerReel
        piece={topPiece}
        reelKey={`top-${topIndex}-${topPiece.src}`}
        reduceMotion={reduceMotion}
        priority={topIndex === 0}
        zIndex={OUTFIT_ROLE_PLACEMENTS.top.zIndex}
        seamOffsetY={-OUTFIT_LANDMARKS.seamGapY}
        enterFrom="right"
      />

      {/*
        Hit zones split at waist — not the overlapping full-frame layers —
        so top vs bottom clicks are distinct. touch-action: pan-y keeps page scroll.
      */}
      <button
        type="button"
        aria-label="Sonraki üst parça"
        onClick={advanceTop}
        className="absolute top-0 right-0 left-0 z-30 cursor-pointer touch-pan-y border-0 bg-transparent p-0"
        style={{ height: seamSplit }}
      />
      <button
        type="button"
        aria-label="Sonraki alt parça"
        onClick={advanceBottom}
        className="absolute right-0 bottom-0 left-0 z-30 cursor-pointer touch-pan-y border-0 bg-transparent p-0"
        style={{ top: seamSplit }}
      />
    </motion.div>
  );
}
