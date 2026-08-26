"use client";

import Image from "next/image";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTrBoutiqueNavPendingOptional } from "@/components/tr/boutique/editorial/TrBoutiqueNavPending";
import type {
  EditorialTwinStory,
  EditorialTwinStorySide,
} from "@/lib/tr/boutiqueHome";

const ATELIER_EASE = [0.22, 1, 0.36, 1] as const;
const PICK_EXPAND_MS = 420;
/** No href yet: hold the fullscreen pick so the expand is visible, then release. */
const PICK_HOLD_MS = 1100;
const IMMERSIVE_ATTR = "data-atelier-twin-immersive";
const PIN_ON = 0.04;
const PIN_OFF = 0.02;

function setTwinStoryImmersive(on: boolean) {
  document.documentElement.toggleAttribute(IMMERSIVE_ATTR, on);
}

function TwinPanelTone({ side }: { side: EditorialTwinStorySide }) {
  return (
    <div
      className="absolute inset-0"
      style={{ background: side.tone }}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.07)_0%,transparent_42%,rgba(0,0,0,0.18)_100%)]" />
    </div>
  );
}

function TwinPanelMedia({
  side,
  priority,
}: {
  side: EditorialTwinStorySide;
  priority?: boolean;
}) {
  if (side.image) {
    const shift = side.imageShiftY;
    const image = (
      <Image
        src={side.image}
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
        style={{ objectPosition: side.objectPosition ?? "center 20%" }}
      />
    );

    if (!shift) {
      return <div className="absolute inset-0">{image}</div>;
    }

    return (
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute left-0 right-0 top-0 h-[120%]"
          style={{ transform: `translateY(calc(-1 * ${shift}))` }}
        >
          {image}
        </div>
      </div>
    );
  }
  return <TwinPanelTone side={side} />;
}

function TwinPanelCopy({ side }: { side: EditorialTwinStorySide }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/55 via-black/15 to-transparent px-4 pb-5 pt-16 md:px-6 md:pb-7">
      <p className="text-[11px] font-medium tracking-[0.22em] text-white uppercase md:text-[12px]">
        {side.label}
      </p>
      <p className="mt-1.5 font-serif text-[15px] font-light tracking-[0.01em] text-white/90 md:text-[17px]">
        {side.line}
      </p>
    </div>
  );
}

function TwinStoryHeadline({
  story,
  variant,
  className = "",
  style,
  animate,
}: {
  story: EditorialTwinStory;
  variant: "overlay" | "inline";
  className?: string;
  style?: React.ComponentProps<typeof motion.div>["style"];
  animate?: React.ComponentProps<typeof motion.div>["animate"];
}) {
  const overlay = variant === "overlay";
  return (
    <motion.div
      className={className}
      style={style}
      animate={animate}
      transition={{ duration: 0.25, ease: ATELIER_EASE }}
    >
      <p
        className={`font-serif font-light tracking-[-0.02em] ${
          overlay
            ? "text-[1.65rem] text-white drop-shadow-[0_1px_12px_rgba(0,0,0,0.45)] md:text-[2.35rem]"
            : "text-[1.35rem] text-neutral-950"
        }`}
      >
        {story.title}
      </p>
      <p
        className={`mt-1.5 text-[11px] tracking-[0.18em] uppercase md:mt-2 md:text-[12px] ${
          overlay ? "text-white/85" : "text-neutral-500"
        }`}
      >
        {story.question}
      </p>
    </motion.div>
  );
}

interface TrBoutiqueAtelierTwinStoryProps {
  story: EditorialTwinStory;
}

export function TrBoutiqueAtelierTwinStory({
  story,
}: TrBoutiqueAtelierTwinStoryProps) {
  const reduceMotion = useReducedMotion();
  const pending = useTrBoutiqueNavPendingOptional();
  const trackRef = useRef<HTMLDivElement>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const pickLock = useRef(false);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const expand = useTransform(
    scrollYProgress,
    [0, 0.22, 0.4, 0.72, 1],
    [0, 1, 1, 0, 0],
  );
  const padY = useTransform(expand, (value) => `${(1 - value) * 10}vh`);
  const padX = useTransform(expand, (value) => `${(1 - value) * 7}vw`);
  const gap = useTransform(expand, (value) => `${(1 - value) * 1.15}rem`);
  const overlayOpacity = useTransform(expand, [0.55, 1], [0, 1]);

  const pickedSide = story.sides.find((side) => side.id === pickedId) ?? null;
  const skipScrub = Boolean(reduceMotion);
  const pickedRef = useRef(pickedId);
  pickedRef.current = pickedId;
  const immersiveOn = useRef(false);

  const syncImmersive = useCallback((progress: number) => {
    const inPin = progress > (immersiveOn.current ? PIN_OFF : PIN_ON) && progress < 1 - PIN_OFF;
    const next = Boolean(pickedRef.current) || inPin;
    if (next === immersiveOn.current) return;
    immersiveOn.current = next;
    setTwinStoryImmersive(next);
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (skipScrub) return;
    syncImmersive(value);
  });

  useEffect(() => {
    syncImmersive(pickedId ? 1 : scrollYProgress.get());
  }, [pickedId, scrollYProgress, syncImmersive]);

  useEffect(() => {
    if (!skipScrub) {
      return () => setTwinStoryImmersive(false);
    }
    const el = trackRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setTwinStoryImmersive(
          Boolean(entry?.isIntersecting) && (entry?.intersectionRatio ?? 0) > 0.4,
        );
      },
      { threshold: [0.4, 0.55] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      setTwinStoryImmersive(false);
    };
  }, [skipScrub]);

  const onPick = useCallback(
    (side: EditorialTwinStorySide) => {
      if (pickLock.current || pickedId) return;
      pickLock.current = true;
      setPickedId(side.id);

      const href = side.href?.trim();
      window.setTimeout(() => {
        if (href) {
          pending?.beginNavigation(href, { kind: "product" });
          return;
        }
        pickLock.current = false;
        setPickedId(null);
      }, href ? PICK_EXPAND_MS : PICK_HOLD_MS);
    },
    [pending, pickedId],
  );

  const renderPanel = (side: EditorialTwinStorySide, index: number) => (
    <button
      key={side.id}
      type="button"
      aria-label={`${side.label}. ${side.line}`}
      disabled={pickedId !== null}
      onClick={() => onPick(side)}
      className="relative min-h-0 min-w-0 flex-1 overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      style={{ background: side.tone }}
    >
      <TwinPanelMedia side={side} priority={index === 0} />
      <TwinPanelCopy side={side} />
    </button>
  );

  const mobileHeadline = (
    <TwinStoryHeadline
      story={story}
      variant="inline"
      className="pointer-events-none shrink-0 bg-[#FAFAF8] px-4 py-4 text-center md:hidden"
      animate={pickedId ? { opacity: 0 } : undefined}
    />
  );

  const panels = (
    <>
      {renderPanel(story.sides[0]!, 0)}
      {mobileHeadline}
      {story.sides.slice(1).map((side, index) => renderPanel(side, index + 1))}
    </>
  );

  const headline = skipScrub ? null : (
    <TwinStoryHeadline
      story={story}
      variant="overlay"
      className="pointer-events-none absolute inset-x-0 top-[20%] z-10 hidden flex-col items-center px-6 text-center md:flex"
      style={{ opacity: overlayOpacity }}
      animate={pickedId ? { opacity: 0 } : undefined}
    />
  );

  const pickOverlay = pickedSide ? (
    <div
      data-twin-pick-overlay=""
      className={`absolute inset-0 z-20 overflow-hidden ${
        pickedSide.id === story.sides[0].id
          ? "atelier-twin-wipe-first"
          : "atelier-twin-wipe-second"
      }`}
      style={{ background: pickedSide.tone }}
    >
      <TwinPanelTone side={pickedSide} />
      <TwinPanelCopy side={pickedSide} />
    </div>
  ) : null;

  const stageInner = (
    <motion.div
      className={`relative flex h-full min-h-0 flex-col overflow-hidden md:flex-row ${
        skipScrub ? "gap-3 px-4 py-10 md:gap-4 md:px-8 md:py-14" : ""
      }`}
      style={
        skipScrub || pickedId
          ? undefined
          : {
              paddingTop: padY,
              paddingBottom: padY,
              paddingLeft: padX,
              paddingRight: padX,
              gap,
            }
      }
    >
      {panels}
      {headline}
      {pickOverlay}
    </motion.div>
  );

  if (skipScrub) {
    return (
      <section
        ref={trackRef}
        aria-label={story.title}
        className="relative bg-[#FAFAF8]"
      >
        <div className="hidden px-4 pt-10 pb-4 text-center md:block md:px-8 md:pt-14">
          <h2 className="font-serif text-[1.65rem] font-light tracking-[-0.02em] text-neutral-950 md:text-[2.15rem]">
            {story.title}
          </h2>
          <p className="mt-2 text-[11px] tracking-[0.18em] text-neutral-500 uppercase">
            {story.question}
          </p>
        </div>
        <div className="relative min-h-[64vh] md:min-h-[72vh]">{stageInner}</div>
      </section>
    );
  }

  return (
    <section
      ref={trackRef}
      aria-label={story.title}
      className="relative h-[165vh] bg-[#FAFAF8] md:h-[185vh]"
    >
      <div className="sticky top-0 h-dvh overflow-hidden">{stageInner}</div>
    </section>
  );
}
