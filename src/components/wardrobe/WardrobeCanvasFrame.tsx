"use client";

import type { ReactNode, RefObject } from "react";
import { WardrobeMoodImageFrame } from "@/components/wardrobe/WardrobeMoodImageFrame";

export const WARDROBE_CANVAS_FRAME_CLASS =
  "relative mx-auto aspect-[3/4] shrink-0 overflow-hidden border border-neutral-200";

export const WARDROBE_PREVIEW_CANVAS_FRAME_CLASS = `${WARDROBE_CANVAS_FRAME_CLASS} w-[340px] bg-white`;

export const WARDROBE_MAIN_CANVAS_FRAME_CLASS = `${WARDROBE_CANVAS_FRAME_CLASS} w-full max-w-[420px] bg-white`;

interface WardrobeCanvasFrameProps {
  containerRef: RefObject<HTMLDivElement | null>;
  moodImageUrl: string | null;
  showMoodPlaceholder?: boolean;
  frameClassName: string;
  children: ReactNode;
}

export function WardrobeCanvasFrame({
  containerRef,
  moodImageUrl,
  showMoodPlaceholder = false,
  frameClassName,
  children,
}: WardrobeCanvasFrameProps) {
  return (
    <div ref={containerRef} className={frameClassName}>
      <div aria-hidden className="absolute inset-0 z-0 bg-white" />

      <WardrobeMoodImageFrame
        moodImageUrl={moodImageUrl}
        showPlaceholder={showMoodPlaceholder}
      />

      {children}
    </div>
  );
}
