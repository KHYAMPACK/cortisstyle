"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { GuidePageOneView } from "@/components/guide/GuidePageOneView";
import { GuidePageTwoView } from "@/components/guide/GuidePageTwoView";
import { resolveStyleGuide } from "@/lib/resolveStyleGuide";
import type { Look } from "@/types/look";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface GuidePreviewCanvasProps {
  look: Look;
  isUnlockedViewState: boolean;
}

export function GuidePreviewCanvas({
  look,
  isUnlockedViewState,
}: GuidePreviewCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const guide = useMemo(
    () =>
      resolveStyleGuide(look, {
        buyerName: "Archive Curator",
      }),
    [look],
  );

  useEffect(() => {
    if (!isUnlockedViewState) return;
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [isUnlockedViewState, look.id]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={spring}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-neutral-950 p-3 md:p-4"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div
        ref={scrollRef}
        className="flex h-full max-h-full w-full max-w-sm flex-col gap-2.5 overflow-y-auto"
      >
        <PreviewPage label="Page 1 — Style Guide & Source Directory">
          <GuidePageOneView guide={guide} compact />
        </PreviewPage>

        <PreviewPage label="Page 2 — Certificate & Digital Ledger">
          <GuidePageTwoView guide={guide} compact />
        </PreviewPage>
      </div>
    </motion.div>
  );
}

function PreviewPage({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative shrink-0 overflow-hidden border border-neutral-800 bg-[#0A0A0A] shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
      <div className="border-b border-neutral-800 bg-[#111111] px-2.5 py-1">
        <p className="text-[6px] tracking-[0.3em] text-neutral-500 uppercase">
          {label}
        </p>
      </div>
      <div className="aspect-[1/1.414] overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
