"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import type { CaddeHeroPose } from "@/lib/tr/marketplace/caddeHero";
import {
  CADDE_HERO_RIP_HOLD_MS,
  CADDE_HERO_RIP_MS,
  CADDE_HERO_SLOGAN_RED,
} from "@/lib/tr/marketplace/caddeHero";
import {
  CADDE_HERO_PAPER_GRAIN,
  CADDE_HERO_RIP_TEXTURE,
  CADDE_HERO_TEARS,
  CADDE_HERO_TEARS_MOBILE,
  type CaddeHeroTearId,
} from "@/lib/tr/marketplace/caddeHeroTear";
import {
  CADDE_HERO_READY_EVENT,
  hasCaddeHeroRipPlayed,
  hasCaddeIntroPlayed,
  markCaddeHeroRipPlayed,
  markCaddeHeroRipSettled,
} from "@/lib/introLoader";

const DWELL_MS = 4800;
const FADE_MS = 700;

function FigureFrame({
  pose,
  priority,
  grayscale = false,
}: {
  pose: CaddeHeroPose;
  priority?: boolean;
  grayscale?: boolean;
}) {
  return (
    <div
      className="cadde-hero-figure absolute bottom-0 left-1/2 h-dvh w-[min(90vw,400px)] md:h-[min(88dvh,860px)] md:w-[min(38vw,460px)]"
      style={{
        ["--hero-shift" as string]: pose.shiftX ?? "0px",
        ["--hero-shift-mobile" as string]:
          pose.mobileShiftX ??
          (pose.shiftX ? `calc(${pose.shiftX} * 0.4)` : "0px"),
        ["--hero-scale" as string]: String(pose.scale ?? 1),
        ["--hero-scale-mobile" as string]: String(pose.mobileScale ?? 1.32),
        ["--hero-width-mobile" as string]: pose.mobileWidth ?? "90vw",
        ["--hero-width-cap" as string]: pose.mobileWidthCap ?? "400px",
      }}
    >
      <Image
        src={pose.src}
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 768px) 140vw, 38vw"
        className={`object-contain object-bottom ${grayscale ? "grayscale contrast-[1.08]" : ""}`}
      />
    </div>
  );
}

function useCaddeHeroTear(id: CaddeHeroTearId) {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrow(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return narrow ? CADDE_HERO_TEARS_MOBILE[id] : CADDE_HERO_TEARS[id];
}

function clipStyle(path: string): { clipPath: string; WebkitClipPath: string } {
  return { clipPath: path, WebkitClipPath: path };
}

const TEAR_TYPE_SLOT =
  "absolute inset-x-0 bottom-[max(1.1rem,calc(env(safe-area-inset-bottom)+0.35rem))] flex flex-col items-center gap-3 px-2 md:bottom-[6%] md:gap-5";

const TEAR_TYPE_HEADLINE =
  "font-cadde-display text-center text-[clamp(3.35rem,16.5vw,5.6rem)] leading-[0.8] font-normal tracking-[0.012em] uppercase md:text-[clamp(3.1rem,5.8vw,4.85rem)]";

const TEAR_TYPE_CTA =
  "font-cadde-nav flex min-h-11 items-center text-[0.78rem] font-semibold tracking-[0.32em] uppercase md:text-[0.95rem]";

function MobileTearTypeBlock({
  lines,
  exploreLabel,
}: {
  lines: readonly [string, string];
  exploreLabel: string;
}) {
  return (
    <div className={TEAR_TYPE_SLOT}>
      <p className={TEAR_TYPE_HEADLINE}>
        <span className="block">{lines[0]}</span>
        <span className="block">{lines[1]}</span>
      </p>
      <span className={TEAR_TYPE_CTA}>[ {exploreLabel} ]</span>
    </div>
  );
}

function MobileTearType({
  lines,
  tear,
  show,
  reduceMotion,
  onExplore,
  exploreLabel,
  interactive,
}: {
  lines: readonly [string, string];
  tear: { left: string; right: string };
  show: boolean;
  reduceMotion: boolean | null;
  onExplore: () => void;
  exploreLabel: string;
  interactive: boolean;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-30"
      initial={false}
      animate={
        show
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: reduceMotion ? 0 : 14 }
      }
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="sr-only">{`${lines[0]} ${lines[1]}`}</p>
      <div
        className="absolute inset-0"
        style={{ ...clipStyle(tear.left), color: CADDE_HERO_SLOGAN_RED }}
        aria-hidden
      >
        <MobileTearTypeBlock lines={lines} exploreLabel={exploreLabel} />
      </div>
      <div
        className="absolute inset-0 text-white"
        style={clipStyle(tear.right)}
        aria-hidden
      >
        <MobileTearTypeBlock lines={lines} exploreLabel={exploreLabel} />
      </div>
      <div className={`${TEAR_TYPE_SLOT} text-transparent`}>
        <p className={TEAR_TYPE_HEADLINE} aria-hidden>
          <span className="block">{lines[0]}</span>
          <span className="block">{lines[1]}</span>
        </p>
        <button
          type="button"
          onClick={onExplore}
          tabIndex={interactive ? 0 : -1}
          disabled={!interactive}
          className={`${TEAR_TYPE_CTA} ${
            interactive ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          [ {exploreLabel} ]
        </button>
      </div>
    </motion.div>
  );
}

function SplitPose({
  pose,
  priority,
  foldProgress,
  showType,
  interactive,
  onExplore,
  exploreLabel,
  reduceMotion,
}: {
  pose: CaddeHeroPose;
  priority?: boolean;
  foldProgress: number;
  showType: boolean;
  interactive: boolean;
  onExplore: () => void;
  exploreLabel: string;
  reduceMotion: boolean | null;
}) {
  const tear = useCaddeHeroTear(pose.tear ?? "lila");
  const folded = foldProgress >= 0.999;
  const foldY = Math.min(1, Math.max(0, foldProgress));
  const band = 0.1;
  const flapTop = Math.max(0, foldY - band);
  const flapBottom = Math.max(0, 1 - foldY);
  const showFlap = foldY > 0.012 && foldY < 0.985;
  const headline = pose.mobileHeadline ?? (["KENDI", "KOMBININ"] as const);

  return (
    <div className="absolute inset-0 [perspective:1600px]">
      <div className="absolute inset-0 bg-white">
        <FigureFrame pose={pose} priority={priority} />
      </div>
      <div
        className="absolute inset-0"
        style={{ filter: "drop-shadow(-2px 0 3px rgba(0,0,0,0.16))" }}
      >
        <div
          className="absolute inset-0 bg-[#D4D0C6]"
          style={{
            ...clipStyle(tear.right),
            backgroundImage: CADDE_HERO_PAPER_GRAIN,
            backgroundRepeat: "repeat",
            backgroundSize: "340px 340px, 200px 200px",
          }}
        >
          <FigureFrame pose={pose} priority={priority} grayscale />
        </div>
      </div>
      <div
        className="absolute inset-0"
        style={{
          ...clipStyle(tear.fiber),
          backgroundColor: "#F7F5EF",
          backgroundImage: CADDE_HERO_RIP_TEXTURE,
          backgroundBlendMode: "multiply, multiply, normal",
          backgroundRepeat: "repeat, repeat, no-repeat",
          backgroundSize: "16px 16px, 8px 48px, 100% 100%",
        }}
      />

      {folded ? null : (
        <>
          <div
            className="absolute inset-0 z-10 bg-white"
            style={{ clipPath: `inset(${foldY * 100}% 0 0 0)` }}
          >
            <FigureFrame pose={pose} priority={priority} />
          </div>

          {showFlap ? (
            <div
              className="absolute inset-0 z-20 origin-center bg-white [transform-style:preserve-3d]"
              style={{
                clipPath: `inset(${flapTop * 100}% 0 ${flapBottom * 100}% 0)`,
                transformOrigin: `50% ${foldY * 100}%`,
                transform: `rotateX(${-92 - foldY * 28}deg)`,
                backfaceVisibility: "hidden",
                boxShadow: "0 22px 32px rgba(0,0,0,0.28)",
              }}
            >
              <FigureFrame pose={pose} priority={priority} />
            </div>
          ) : null}

          {showFlap ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 z-[11] h-12"
              style={{
                top: `${foldY * 100}%`,
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.32), rgba(0,0,0,0))",
              }}
            />
          ) : null}
        </>
      )}

      <MobileTearType
        lines={headline}
        tear={tear}
        show={showType}
        reduceMotion={reduceMotion}
        onExplore={onExplore}
        exploreLabel={exploreLabel}
        interactive={interactive}
      />
    </div>
  );
}

interface CaddeSplitHeroProps {
  poses: CaddeHeroPose[];
  onExplore: () => void;
  exploreLabel: string;
}

export function CaddeSplitHero({
  poses,
  onExplore,
  exploreLabel,
}: CaddeSplitHeroProps) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [ripProgress, setRipProgress] = useState(0);
  const frames = poses.length > 0 ? poses : [];
  const ripped = ripProgress >= 0.999;
  const showType = ripped;

  useEffect(() => {
    if (frames.length === 0) return;

    if (reduceMotion == null) return;

    if (reduceMotion) {
      setRipProgress(1);
      markCaddeHeroRipPlayed();
      markCaddeHeroRipSettled();
      return;
    }

    if (hasCaddeHeroRipPlayed()) {
      setRipProgress(1);
      markCaddeHeroRipSettled();
      return;
    }

    let cancelled = false;
    let started = false;
    let holdTimer = 0;
    let stopAnimate: (() => void) | undefined;

    const playRip = () => {
      if (cancelled || started) return;
      started = true;
      holdTimer = window.setTimeout(() => {
        if (cancelled) return;
        markCaddeHeroRipPlayed();
        const control = animate(0, 1, {
          duration: CADDE_HERO_RIP_MS / 1000,
          ease: [0.42, 0.0, 0.18, 1],
          onUpdate: (value) => {
            if (!cancelled) setRipProgress(value);
          },
          onComplete: () => {
            if (cancelled) return;
            setRipProgress(1);
            markCaddeHeroRipSettled();
          },
        });
        stopAnimate = () => control.stop();
      }, CADDE_HERO_RIP_HOLD_MS);
    };

    if (hasCaddeIntroPlayed()) {
      playRip();
    } else {
      window.addEventListener(CADDE_HERO_READY_EVENT, playRip, { once: true });
    }

    const fallback = window.setTimeout(playRip, 12_000);

    return () => {
      cancelled = true;
      window.clearTimeout(holdTimer);
      window.clearTimeout(fallback);
      window.removeEventListener(CADDE_HERO_READY_EVENT, playRip);
      stopAnimate?.();
    };
  }, [frames.length, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !ripped || frames.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % frames.length);
    }, DWELL_MS);
    return () => window.clearInterval(timer);
  }, [frames.length, reduceMotion, ripped]);

  if (frames.length === 0) return null;

  return (
    <section
      aria-label="Cadde kampanya"
      className="relative h-dvh w-full overflow-hidden bg-white"
    >
      {frames.map((pose, index) => (
        <div
          key={pose.src}
          className="absolute inset-0"
          style={{
            opacity: index === active ? 1 : 0,
            pointerEvents: index === active ? "auto" : "none",
            transition: reduceMotion
              ? "none"
              : `opacity ${FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
          aria-hidden={index !== active}
        >
          <SplitPose
            pose={pose}
            priority={index === 0}
            foldProgress={index === active ? ripProgress : ripped ? 1 : 0}
            showType={showType}
            interactive={index === active && showType}
            onExplore={onExplore}
            exploreLabel={exploreLabel}
            reduceMotion={reduceMotion}
          />
        </div>
      ))}

      <motion.div
        className="pointer-events-none relative z-30 hidden h-dvh flex-col justify-center px-4 pt-20 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 md:flex md:px-12"
        initial={false}
        animate={
          showType
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: reduceMotion ? 0 : 18 }
        }
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="font-cadde-display max-w-[38%] -translate-y-[8vh] text-left text-[clamp(2.35rem,8.4vw,6.4rem)] leading-[0.84] font-normal tracking-[0.02em] text-black uppercase">
          <span className="block">CORTIS</span>
          <span className="block">STYLE</span>
        </p>
        <p className="font-cadde-nav absolute top-1/2 right-4 max-w-[42%] -translate-y-1/2 text-right text-[clamp(1.25rem,4.4vw,3.5rem)] leading-[0.94] font-semibold tracking-[0.06em] text-black uppercase sm:right-8 md:right-12">
          <span className="block">Kendi</span>
          <span className="block">kombinin</span>
        </p>
      </motion.div>
    </section>
  );
}
