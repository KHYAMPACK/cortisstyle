"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/BrandLogo";

const MIN_DISPLAY_MS = 2000;
const MAX_LOAD_WAIT_MS = 5000;
const EXIT_DURATION_MS = 800;

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

export function IntroLoader() {
  const [isMounted, setIsMounted] = useState(false);
  const [phase, setPhase] = useState<"visible" | "exiting" | "done">("visible");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    document.documentElement.classList.add("intro-loading");
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
      document.documentElement.classList.remove("intro-loading");
      document.body.style.overflow = previousOverflow;
    };
  }, [isMounted]);

  useEffect(() => {
    if (phase !== "exiting") return;

    const timer = setTimeout(() => {
      setPhase("done");
      document.documentElement.classList.remove("intro-loading");
      document.body.style.overflow = "";
    }, EXIT_DURATION_MS);

    return () => clearTimeout(timer);
  }, [phase]);

  if (!isMounted || phase === "done") {
    return null;
  }

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key="intro-loader"
        role="status"
        aria-live="polite"
        aria-label="Loading Cortisstyle"
        initial={{ opacity: 1, y: 0 }}
        animate={phase === "exiting" ? exitPanel : { opacity: 1, y: 0 }}
        className={`fixed inset-0 z-[9999] flex h-screen w-screen flex-col items-center justify-center bg-[#0D0D0D] ${
          phase === "exiting" ? "pointer-events-none" : "pointer-events-auto"
        }`}
      >
        <motion.div {...entrance} className="px-6">
          <BrandLogo
            variant="onDark"
            priority
            className="h-[min(52vw,14rem)] w-auto md:h-[min(36vw,16rem)]"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
