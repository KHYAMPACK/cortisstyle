"use client";

import { forwardRef, useCallback, useRef } from "react";
import { LookCanvas } from "@/components/modal/LookCanvas";
import { WardrobeMoodImageFrame } from "@/components/wardrobe/WardrobeMoodImageFrame";
import { WardrobeMoodword } from "@/components/wardrobe/WardrobeMoodword";
import { WardrobeOutfitMoodboardCard } from "@/components/wardrobe/WardrobeOutfitMoodboardCard";
import type { CanvasItemLayout } from "@/types/canvas-layout";
import type { ResolvedLookItem } from "@/types/look";
import { WARDROBE_BUILDER_LOOK } from "@/types/wardrobe-builder";

/** Matches the verified main wardrobe canvas width — layout math stays identical. */
const MAIN_CANVAS_WIDTH_PX = 420;

/** Sidebar mask + scale: 420 × 0.76 ≈ 320px wide, 560 × 0.76 ≈ 426px tall. */
const PREVIEW_SCALE = 0.76;

interface WardrobeOutfitLivePreviewCardProps {
  name: string;
  moodImageUrl: string | null;
  lookItems: ResolvedLookItem[];
  resolveLayouts: (
    items: ResolvedLookItem[],
    containerWidth: number,
  ) => Record<string, CanvasItemLayout>;
  canvasKey: string;
  className?: string;
  /** @deprecated Ignored — preview always renders at the main canvas width. */
  canvasWidthClassName?: string;
}

export const WardrobeOutfitLivePreviewCard = forwardRef<
  HTMLDivElement,
  WardrobeOutfitLivePreviewCardProps
>(function WardrobeOutfitLivePreviewCard(
  {
    name,
    moodImageUrl,
    lookItems,
    resolveLayouts,
    canvasKey,
    className = "",
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);

  const resolvePreviewLayouts = useCallback(
    (items: ResolvedLookItem[], width: number) => resolveLayouts(items, width),
    [resolveLayouts],
  );

  return (
    <div ref={ref} className={`shrink-0 ${className}`.trim()}>
      <div className="relative mx-auto flex h-[426px] w-[320px] items-center justify-center overflow-hidden">
        <div
          className="w-[420px] shrink-0 will-change-transform"
          style={{
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: "center",
          }}
        >
          <WardrobeOutfitMoodboardCard name={name}>
            <div
              className="relative mx-auto aspect-[3/4] w-[420px] shrink-0 overflow-hidden border border-neutral-200 bg-white"
              style={{ width: MAIN_CANVAS_WIDTH_PX }}
            >
              <div aria-hidden className="absolute inset-0 z-0 bg-white" />

              <WardrobeMoodImageFrame
                moodImageUrl={moodImageUrl}
                showPlaceholder
              />

              <WardrobeMoodword outfitName={name} />

              {/*
                Preview-only blend: white LookCanvas backdrop reveals the mood
                layer beneath while garment pixels composite on top.
              */}
              <div className="pointer-events-none absolute inset-0 z-20 mix-blend-multiply">
                <LookCanvas
                  key={canvasKey}
                  className="absolute inset-0 h-full w-full"
                  look={WARDROBE_BUILDER_LOOK}
                  lookImage=""
                  title="Outfit Preview"
                  items={lookItems}
                  activeItemId={null}
                  isEditMode={false}
                  containerRef={containerRef}
                  onSelectItem={() => {}}
                  resolveLayouts={resolvePreviewLayouts}
                />
              </div>
            </div>
          </WardrobeOutfitMoodboardCard>
        </div>
      </div>
    </div>
  );
});
