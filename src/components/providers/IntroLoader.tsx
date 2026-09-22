"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/BrandLogo";
import { CaddeIntroStack } from "@/components/tr/marketplace/CaddeIntroStack";
import { resolveBoutiqueIntroBrand } from "@/lib/tr/boutiqueBrand";
import { useBoutiqueSlug } from "@/lib/tr/boutiqueStorefrontContext";
import {
  emitCaddeHeroReady,
  hasCaddeIntroPlayed,
  markCaddeIntroPlayed,
  shouldShowCaddeIntroLoader,
} from "@/lib/introLoader";
import {
  CADDE_INTRO_HOLD_MS,
  CADDE_INTRO_REDUCED_MOTION_MS,
  CADDE_INTRO_SLIDE_MS,
  caddeIntroReverseMs,
} from "@/lib/platform/caddeIntro";

const MIN_DISPLAY_MS = 2000;
const MAX_LOAD_WAIT_MS = 5000;
const EXIT_DURATION_MS = 800;

const INTRO_LOCK_CLASSES = [
  "intro-loading",
  "intro-loading-boutique",
  "intro-loading-cadde",
] as const;

const entrance = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 1.2, ease: "easeOut" as const },
};

const exitPanel = {
  opacity: 0,
  y: -28,
  transition: { duration: EXIT_DURATION_MS / 1000, ease: [0.22, 1, 0.36, 1] as const },
};

type IntroPhase = "visible" | "reversing" | "exiting" | "done";

interface IntroLoaderProps {
  /** Keeps the mask visible until the parent unmounts (auth callback bridge). */
  forceActive?: boolean;
  statusLabel?: string;
}

export function IntroLoader({
  forceActive = false,
  statusLabel,
}: IntroLoaderProps) {
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const stackWrapRef = useRef<HTMLDivElement>(null);
  const caddeSlideDoneRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);
  const [phase, setPhase] = useState<IntroPhase>("visible");
  const [caddeLift, setCaddeLift] = useState(false);
  const resolvedSlug = useBoutiqueSlug();

  const introBrand = resolvedSlug
    ? resolveBoutiqueIntroBrand(resolvedSlug)
    : null;
  const isBoutique = Boolean(introBrand);
  const isCaddeIntro =
    !forceActive &&
    !isBoutique &&
    shouldShowCaddeIntroLoader(pathname, resolvedSlug);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || forceActive) return;
    if (isCaddeIntro && hasCaddeIntroPlayed()) return;

    document.documentElement.classList.add("intro-loading");
    if (isBoutique) {
      document.documentElement.classList.add("intro-loading-boutique");
    }
    if (isCaddeIntro) {
      document.documentElement.classList.add("intro-loading-cadde");
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (isCaddeIntro) {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const wait = reduceMotion
        ? CADDE_INTRO_REDUCED_MOTION_MS
        : CADDE_INTRO_HOLD_MS;
      const exitTimer = setTimeout(() => {
        setPhase("reversing");
      }, wait);

      return () => {
        clearTimeout(exitTimer);
        document.documentElement.classList.remove(...INTRO_LOCK_CLASSES);
        document.body.style.overflow = previousOverflow;
      };
    }

    let loadComplete = document.readyState === "complete";
    const startTime = Date.now();
    let exitTimer: ReturnType<typeof setTimeout> | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const minDisplay = MIN_DISPLAY_MS;

    const scheduleExit = () => {
      if (!loadComplete || exitTimer) return;

      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, minDisplay - elapsed);

      exitTimer = setTimeout(() => {
        setPhase("exiting");
      }, delay);
    };

    const onLoad = () => {
      loadComplete = true;
      scheduleExit();
    };

    if (loadComplete) {
      scheduleExit();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    fallbackTimer = setTimeout(() => {
      loadComplete = true;
      scheduleExit();
    }, MAX_LOAD_WAIT_MS);

    return () => {
      window.removeEventListener("load", onLoad);
      if (exitTimer) clearTimeout(exitTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      document.documentElement.classList.remove(...INTRO_LOCK_CLASSES);
      document.body.style.overflow = previousOverflow;
    };
  }, [forceActive, isBoutique, isCaddeIntro, isMounted]);

  useEffect(() => {
    if (forceActive || phase !== "reversing") return;

    const timer = setTimeout(() => {
      setPhase("exiting");
    }, caddeIntroReverseMs());

    return () => clearTimeout(timer);
  }, [forceActive, phase]);

  const finishCaddeSlide = () => {
    if (caddeSlideDoneRef.current) return;
    caddeSlideDoneRef.current = true;
    setPhase("done");
    markCaddeIntroPlayed();
    emitCaddeHeroReady();
    document.documentElement.classList.remove(...INTRO_LOCK_CLASSES);
    document.body.style.overflow = "";
  };

  useEffect(() => {
    if (forceActive || phase !== "exiting") return;
    if (isCaddeIntro) return;

    const timer = setTimeout(() => {
      setPhase("done");
      document.documentElement.classList.remove(...INTRO_LOCK_CLASSES);
      document.body.style.overflow = "";
    }, EXIT_DURATION_MS);

    return () => clearTimeout(timer);
  }, [forceActive, isCaddeIntro, phase]);

  useLayoutEffect(() => {
    if (forceActive || !isCaddeIntro || phase !== "exiting") return;

    if (stackWrapRef.current) {
      stackWrapRef.current.style.visibility = "hidden";
    }

    document.documentElement.classList.remove(
      "intro-loading",
      "intro-loading-cadde",
    );
    document.body.style.overflow = "hidden";
  }, [forceActive, isCaddeIntro, phase]);

  useEffect(() => {
    if (forceActive || !isCaddeIntro || phase !== "exiting") return;

    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => {
        setCaddeLift(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
    };
  }, [forceActive, isCaddeIntro, phase]);

  useEffect(() => {
    if (forceActive || !isCaddeIntro || !caddeLift) return;

    const fallback = window.setTimeout(
      finishCaddeSlide,
      CADDE_INTRO_SLIDE_MS + 120,
    );
    return () => window.clearTimeout(fallback);
  }, [caddeLift, forceActive, isCaddeIntro]);

  useEffect(() => {
    if (!forceActive || !isMounted) return;

    document.documentElement.classList.add("intro-loading");
    if (isBoutique) {
      document.documentElement.classList.add("intro-loading-boutique");
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.classList.remove(...INTRO_LOCK_CLASSES);
      document.body.style.overflow = previousOverflow;
    };
  }, [forceActive, isBoutique, isMounted]);

  if (!isMounted || (!forceActive && phase === "done")) {
    return null;
  }

  if (
    !forceActive &&
    isCaddeIntro &&
    hasCaddeIntroPlayed() &&
    phase === "visible"
  ) {
    return null;
  }

  const overlayBg = isBoutique
    ? "bg-white"
    : isCaddeIntro
      ? "bg-black"
      : "bg-[#0D0D0D]";

  const overlayLabel =
    statusLabel ??
    (introBrand ? `Loading ${introBrand.label}` : "Loading Cortisstyle");

  if (isCaddeIntro) {
    return createPortal(
      <div
        ref={overlayRef}
        role="status"
        aria-live="polite"
        aria-label={overlayLabel}
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.propertyName !== "transform") return;
          finishCaddeSlide();
        }}
        data-intro-overlay=""
        className={`fixed inset-0 z-[9999] h-dvh w-screen overflow-hidden bg-black ${
          phase === "exiting" || phase === "reversing"
            ? "pointer-events-none"
            : "pointer-events-auto"
        }`}
        style={{
          transform: caddeLift
            ? "translate3d(0, -110%, 0)"
            : "translate3d(0, 0, 0)",
          transition: caddeLift
            ? `transform ${CADDE_INTRO_SLIDE_MS}ms cubic-bezier(0.87, 0, 0.13, 1)`
            : "none",
          willChange: "transform",
          backfaceVisibility: "hidden",
        }}
      >
        <div ref={stackWrapRef} className="h-full w-full">
          <CaddeIntroStack
            exiting={phase === "reversing" || phase === "exiting"}
          />
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key="intro-loader"
        role="status"
        aria-live="polite"
        aria-label={overlayLabel}
        initial={{ opacity: 1, y: 0 }}
        animate={
          !forceActive && phase === "exiting"
            ? exitPanel
            : { opacity: 1, y: 0 }
        }
        className={`fixed inset-0 z-[9999] flex h-screen w-screen flex-col items-center justify-center overflow-hidden ${overlayBg} ${
          !forceActive && (phase === "exiting" || phase === "reversing")
            ? "pointer-events-none"
            : "pointer-events-auto"
        }`}
      >
        <motion.div
          {...entrance}
          className="flex flex-col items-center gap-6 px-6"
        >
          {introBrand ? (
            <Image
              src={introBrand.logoUrl}
              alt={introBrand.label}
              width={320}
              height={128}
              priority
              unoptimized
              className="h-[min(42vw,11rem)] w-auto object-contain md:h-[min(28vw,12rem)]"
            />
          ) : (
            <BrandLogo
              variant="onDark"
              priority
              className="h-[min(52vw,14rem)] w-auto md:h-[min(36vw,16rem)]"
            />
          )}
          {statusLabel ? (
            <p
              className={`font-mono text-[10px] tracking-[0.42em] uppercase sm:text-[11px] ${
                isBoutique ? "text-neutral-500" : "text-white/75"
              }`}
            >
              [ {statusLabel} ]
            </p>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
