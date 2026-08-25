"use client";

import { Children } from "react";
import { motion, type Transition } from "framer-motion";

/** Shared easing for TR owner panel — keep loading / page changes soft. */
export const trPanelEase = [0.22, 1, 0.36, 1] as const;

export const trPanelFadeTransition: Transition = {
  duration: 0.2,
  ease: trPanelEase,
};

export const trPanelStaggerTransition: Transition = {
  duration: 0.28,
  ease: trPanelEase,
};

const STAGGER_CAP = 12;

/** Soft enter/exit page body — pair with parent `AnimatePresence`.
 *  Opacity only: a translate transform on this wrapper would break
 *  `position: sticky` descendants (product/stock filters). */
export function TrPanelPageTransition({
  children,
}: {
  /** Kept for call-site clarity; parent should key by pathname. */
  pathname?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
  shift = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Set false when this wrapper contains `position: sticky` children. */
  shift?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={shift ? { opacity: 0, y: 8 } : { opacity: 0 }}
      animate={shift ? { opacity: 1, y: 0 } : { opacity: 1 }}
      transition={{ ...trPanelFadeTransition, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Inline busy mark for buttons — set busy before await so click feels instant. */
export function TrPanelBusySpinner({ className = "" }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      className={`inline-block h-4 w-4 shrink-0 border-2 border-current border-t-transparent ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    />
  );
}

/** Soft spinner — uses panel accent CSS vars (per-boutique), not hardcoded pink. */
export function TrPanelLoading({
  label = "Yükleniyor…",
}: {
  label?: string;
}) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[color:var(--panel-accent-border)] bg-white px-6 py-14 shadow-sm lg:min-h-[280px] lg:rounded-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="status"
      aria-live="polite"
    >
      <motion.div
        aria-hidden
        className="h-10 w-10 rounded-full border-4 border-[color:var(--panel-accent-border)] border-t-[color:var(--panel-accent)]"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.05, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-[17px] font-medium text-neutral-700 lg:text-[14px]">
        {label}
      </p>
    </motion.div>
  );
}

function Pulse({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[color:var(--panel-accent-soft)] ${className}`}
    />
  );
}

/** KPI / metric cards while summary loads. */
export function TrPanelMetricSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      role="status"
      aria-label="Özet yükleniyor"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="rounded-xl border border-neutral-200/80 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
        >
          <Pulse className="h-10 w-28" />
          <Pulse className="mt-4 h-4 w-36" />
          <Pulse className="mt-2 h-3 w-48" />
        </div>
      ))}
    </div>
  );
}

/** List/table rows while products, orders, or customers load. */
export function TrPanelListSkeleton({
  rows = 5,
  label = "Liste yükleniyor",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div className="space-y-3" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5"
        >
          <Pulse className="h-16 w-14 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Pulse className="h-4 w-2/3" />
            <Pulse className="h-3 w-1/3" />
          </div>
          <Pulse className="hidden h-4 w-16 sm:block" />
        </div>
      ))}
    </div>
  );
}

/** Desktop sidebar chrome while boutiques load. */
export function TrPanelSidebarSkeleton() {
  return (
    <aside
      className="flex h-dvh w-[232px] shrink-0 flex-col bg-[#1C1C1E]"
      aria-hidden
    >
      <div className="px-4 py-4">
        <Pulse className="h-3 w-16 bg-white/15" />
        <div className="mt-3 flex items-center gap-3">
          <Pulse className="h-9 w-9 rounded-full bg-white/15" />
          <Pulse className="h-4 flex-1 bg-white/15" />
        </div>
      </div>
      <div className="flex-1 space-y-2 px-3 py-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Pulse key={index} className="h-9 w-full bg-white/10" />
        ))}
      </div>
    </aside>
  );
}

/** Stagger children (e.g. KPI cards, quick tiles). Large lists skip stagger. */
export function TrPanelStagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const count = Children.count(children);
  const staggerChildren = count > STAGGER_CAP ? 0 : 0.05;
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren, delayChildren: staggerChildren ? 0.03 : 0 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export const trPanelStaggerItem = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: trPanelStaggerTransition,
  },
};
