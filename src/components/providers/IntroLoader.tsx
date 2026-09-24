"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/BrandLogo";
import { resolveBoutiqueIntroBrand } from "@/lib/tr/boutiqueBrand";
import { useBoutiqueSlug } from "@/lib/tr/boutiqueStorefrontContext";

const MIN_DISPLAY_MS = 2000;
const MAX_LOAD_WAIT_MS = 5000;
const EXIT_DURATION_MS = 800;

const INTRO_LOCK_CLASSES = ["intro-loading", "intro-loading-boutique"] as const;

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

type IntroPhase = "visible" | "exiting" | "done";

interface IntroLoaderProps {
  /** Keeps the mask visible until the parent unmounts (auth callback bridge). */
  forceActive?: boolean;
  statusLabel?: string;
}

/** Branded loading mask — boutique logo on white, or the Cortisstyle mark on dark. */
export function IntroLoader({
  forceActive = false,
  statusLabel,
}: IntroLoaderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [phase, setPhase] = useState<IntroPhase>("visible");
  const resolvedSlug = useBoutiqueSlug();

  const introBrand = resolvedSlug
    ? resolveBoutiqueIntroBrand(resolvedSlug)
    : null;
  const isBoutique = Boolean(introBrand);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || forceActive) return;

    document.documentElement.classList.add("intro-loading");
    if (isBoutique) {
      document.documentElement.classList.add("intro-loading-boutique");
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let loadComplete = document.readyState === "complete";
    const startTime = Date.now();
    let exitTimer: ReturnType<typeof setTimeout> | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleExit = () => {
      if (!loadComplete || exitTimer) return;
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, MIN_DISPLAY_MS - elapsed);
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
  }, [forceActive, isBoutique, isMounted]);

  useEffect(() => {
    if (forceActive || phase !== "exiting") return;

    const timer = setTimeout(() => {
      setPhase("done");
      document.documentElement.classList.remove(...INTRO_LOCK_CLASSES);
      document.body.style.overflow = "";
    }, EXIT_DURATION_MS);

    return () => clearTimeout(timer);
  }, [forceActive, phase]);

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

  const overlayBg = isBoutique ? "bg-white" : "bg-[#0D0D0D]";
  const overlayLabel =
    statusLabel ??
    (introBrand ? `Loading ${introBrand.label}` : "Loading Cortisstyle");

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
          !forceActive && phase === "exiting"
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
