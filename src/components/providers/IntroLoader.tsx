"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/BrandLogo";
import { CaddeIntroStack } from "@/components/tr/marketplace/CaddeIntroStack";
import { resolveBoutiqueIntroBrand } from "@/lib/tr/boutiqueBrand";
import { resolveBoutiqueSlugFromHost } from "@/lib/tr/customDomain";
import {
  hasCaddeIntroPlayed,
  markCaddeIntroPlayed,
  shouldShowCaddeIntroLoader,
} from "@/lib/introLoader";
import { caddeIntroReverseMs } from "@/lib/platform/caddeIntro";

const MIN_DISPLAY_MS = 2000;
const CADDE_MIN_DISPLAY_MS = 4000;
const CADDE_REDUCED_MOTION_MS = 1400;
const CADDE_SLIDE_MS = 850;
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

const caddeExitPanel = {
  y: "-100%",
  transition: {
    duration: CADDE_SLIDE_MS / 1000,
    ease: [0.87, 0, 0.13, 1] as const,
  },
};

type IntroPhase = "visible" | "reversing" | "exiting" | "done";

interface IntroLoaderProps {
  /** Keeps the mask visible until the parent unmounts (auth callback bridge). */
  forceActive?: boolean;
  statusLabel?: string;
  /** White-label boutique slug (custom domain) — shows boutique logo instead of Cortis. */
  boutiqueSlug?: string | null;
}

export function IntroLoader({
  forceActive = false,
  statusLabel,
  boutiqueSlug = null,
}: IntroLoaderProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [phase, setPhase] = useState<IntroPhase>("visible");
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(() => {
    if (boutiqueSlug?.trim()) return boutiqueSlug.trim();
    if (typeof window !== "undefined") {
      return resolveBoutiqueSlugFromHost(window.location.host);
    }
    return null;
  });

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
    if (boutiqueSlug?.trim()) {
      setResolvedSlug(boutiqueSlug.trim());
      return;
    }
    const fromHost = resolveBoutiqueSlugFromHost(window.location.host);
    if (fromHost) setResolvedSlug(fromHost);
  }, [boutiqueSlug]);

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
      const wait = reduceMotion ? CADDE_REDUCED_MOTION_MS : CADDE_MIN_DISPLAY_MS;
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

  useEffect(() => {
    if (forceActive || phase !== "exiting") return;

    if (isCaddeIntro) {
      document.documentElement.classList.remove(
        "intro-loading",
        "intro-loading-cadde",
      );
    }

    const timer = setTimeout(() => {
      setPhase("done");
      if (isCaddeIntro) markCaddeIntroPlayed();
      document.documentElement.classList.remove(...INTRO_LOCK_CLASSES);
      document.body.style.overflow = "";
    }, isCaddeIntro ? CADDE_SLIDE_MS : EXIT_DURATION_MS);

    return () => clearTimeout(timer);
  }, [forceActive, isCaddeIntro, phase]);

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

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key="intro-loader"
        role="status"
        aria-live="polite"
        aria-label={
          statusLabel ??
          (introBrand ? `Loading ${introBrand.label}` : "Loading Cortisstyle")
        }
        initial={{ opacity: 1, y: 0 }}
        animate={
          !forceActive && phase === "exiting"
            ? isCaddeIntro
              ? caddeExitPanel
              : exitPanel
            : { opacity: 1, y: 0 }
        }
        className={`fixed inset-0 z-[9999] flex h-screen w-screen flex-col items-center justify-center overflow-hidden ${overlayBg} ${
          !forceActive && (phase === "exiting" || phase === "reversing")
            ? "pointer-events-none"
            : "pointer-events-auto"
        }`}
      >
        {isCaddeIntro ? (
          <CaddeIntroStack exiting={phase === "reversing" || phase === "exiting"} />
        ) : (
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
        )}
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
