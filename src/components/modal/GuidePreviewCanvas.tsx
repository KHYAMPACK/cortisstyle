"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import type { ResolvedLookItem } from "@/types/look";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface GuidePreviewCanvasProps {
  lookTitle: string;
  modelName: string;
  items: ResolvedLookItem[];
  isUnlockedViewState: boolean;
}

export function GuidePreviewCanvas({
  lookTitle,
  modelName,
  items,
  isUnlockedViewState,
}: GuidePreviewCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isUnlockedViewState) return;

    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [isUnlockedViewState, lookTitle]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={spring}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-neutral-100 p-4 md:p-6"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div
        ref={scrollRef}
        className="flex h-full max-h-full w-full max-w-sm flex-col gap-3 overflow-y-auto"
      >
        <PreviewPage label="Page 1 — Unlocked Guide">
          <div className="space-y-2 p-4">
            <p className="font-serif text-[9px] tracking-[0.12em] text-neutral-900 uppercase">
              Unlocked Style Guide &amp; Source Directory
            </p>
            <p className="text-[7px] tracking-[0.2em] text-neutral-400 uppercase blur-[1px]">
              {lookTitle}
            </p>

            {items.slice(0, 5).map((item) => (
              <div key={item.id} className="border-t border-neutral-200 pt-2">
                <p className="text-[8px] tracking-[0.08em] text-neutral-800 uppercase blur-[1.5px]">
                  {item.name}
                </p>
                <p className="text-[7px] text-neutral-500 blur-[3px]">
                  {item.brand} — {item.category}
                </p>
                <p className="mt-1 text-[7px] leading-relaxed text-neutral-400 blur-[4px] select-none">
                  {item.unlockedDescription}
                </p>
                <div className="mt-2 h-4 w-full rounded-sm bg-neutral-200 blur-[3px]" />
              </div>
            ))}

            {items.length > 5 && (
              <p className="text-[7px] tracking-[0.2em] text-neutral-400 uppercase">
                +{items.length - 5} more items
              </p>
            )}
          </div>
        </PreviewPage>

        <PreviewPage label="Page 2 — Certificate">
          <div className="space-y-3 p-4">
            <p className="text-[7px] tracking-[0.35em] text-neutral-400 uppercase">
              Cortis Style — Official Document
            </p>
            <h3 className="font-serif text-sm leading-tight text-neutral-900">
              Certificate of Styling Authenticity
            </h3>
            <p className="text-[8px] leading-relaxed text-neutral-500 blur-[2px]">
              This document confirms that [Curator Name] is an official curator of{" "}
              {lookTitle}, authenticated under the Cortis Style archive.
            </p>
            <div className="space-y-1 border-t border-neutral-200 pt-3">
              <PreviewRow label="Look" value={lookTitle} />
              <PreviewRow label="Model" value={modelName} />
              <PreviewRow label="Serial" value="CORTIS-XXXX-XXXX" />
            </div>
          </div>
        </PreviewPage>
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, transparent, transparent 18px, rgba(0,0,0,0.03) 18px, rgba(0,0,0,0.03) 19px)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-white/30 backdrop-blur-[1px]" />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <p
          className="rotate-[-24deg] text-center font-serif text-lg tracking-[0.25em] text-black/20 uppercase md:text-2xl"
          style={{ textShadow: "0 0 40px rgba(255,255,255,0.8)" }}
        >
          Preview Only — Legal use requires purchase
        </p>
      </div>
    </motion.div>
  );
}

function PreviewPage({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="relative shrink-0 overflow-hidden border border-neutral-300 bg-white shadow-sm">
      <div className="border-b border-neutral-200 bg-neutral-50 px-3 py-1.5">
        <p className="text-[7px] tracking-[0.3em] text-neutral-400 uppercase">
          {label}
        </p>
      </div>
      <div className="aspect-[1/1.414] overflow-hidden">{children}</div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-[7px] tracking-[0.2em] text-neutral-400 uppercase">
        {label}
      </span>
      <span className="text-[8px] text-neutral-700 blur-[1px]">{value}</span>
    </div>
  );
}
