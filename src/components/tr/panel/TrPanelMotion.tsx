"use client";

import { motion, type Transition } from "framer-motion";

/** Shared easing for TR owner panel — keep loading / page changes soft. */
export const trPanelEase = [0.22, 1, 0.36, 1] as const;

export const trPanelFadeTransition: Transition = {
  duration: 0.35,
  ease: trPanelEase,
};

export const trPanelStaggerTransition: Transition = {
  duration: 0.4,
  ease: trPanelEase,
};

/** Soft enter/exit page body — pair with parent `AnimatePresence mode="wait"`. */
export function TrPanelPageTransition({
  children,
}: {
  /** Kept for call-site clarity; parent should key by pathname. */
  pathname?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={trPanelFadeTransition}
    >
      {children}
    </motion.div>
  );
}

/** Fade content in after data loads (swap with loading state). */
export function TrPanelFadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...trPanelFadeTransition, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Rectangular spinner — matches panel chrome, not a soft pill. */
export function TrPanelLoading({
  label = "Yükleniyor…",
}: {
  label?: string;
}) {
  return (
    <motion.div
      className="flex flex-col items-start gap-4 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      role="status"
      aria-live="polite"
    >
      <motion.div
        aria-hidden
        className="h-7 w-7 border border-neutral-300 border-t-neutral-900"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.05, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-[11px] tracking-[0.2em] text-neutral-500 uppercase">
        {label}
      </p>
    </motion.div>
  );
}

/** Stagger children (e.g. KPI cards, quick tiles). */
export function TrPanelStagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: 0.06, delayChildren: 0.04 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export const trPanelStaggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: trPanelStaggerTransition,
  },
};
