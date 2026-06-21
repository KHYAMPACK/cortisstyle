"use client";

import { forwardRef, useCallback, useRef } from "react";
import { LookCanvas } from "@/components/modal/LookCanvas";
import { WardrobeCanvasBrandWatermark } from "@/components/wardrobe/WardrobeCanvasBrandWatermark";
import { WardrobeMoodImageFrame } from "@/components/wardrobe/WardrobeMoodImageFrame";
import { WardrobeMoodword } from "@/components/wardrobe/WardrobeMoodword";
import { WardrobeOutfitMoodboardCard } from "@/components/wardrobe/WardrobeOutfitMoodboardCard";
import type { CanvasItemLayout } from "@/types/canvas-layout";
import type { ResolvedLookItem } from "@/types/look";
import { WARDROBE_BUILDER_LOOK } from "@/types/wardrobe-builder";

/** Matches the verified main wardrobe canvas width — layout math stays identical. */
const MAIN_CANVAS_WIDTH_PX = 420;

const PREVIEW_SCALE = 0.76;

const PREVIEW_CANVAS_HEIGHT_PX = Math.round(MAIN_CANVAS_WIDTH_PX * (4 / 3));
const PREVIEW_FOOTER_HEIGHT_PX = 40;
const PREVIEW_MASK_HEIGHT_PX = Math.round(
  (PREVIEW_CANVAS_HEIGHT_PX + PREVIEW_FOOTER_HEIGHT_PX) * PREVIEW_SCALE,
);

interface WardrobeOutfitLivePreviewCardProps {
  outfitName: string;
  moodword: string;
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
    outfitName,
    moodword,
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
      <div
        className="relative mx-auto flex w-[320px] items-center justify-center overflow-hidden"
        style={{ height: PREVIEW_MASK_HEIGHT_PX }}
      >
        <div
          className="w-[420px] shrink-0 will-change-transform"
          style={{
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: "center",
          }}
        >
          <WardrobeOutfitMoodboardCard
            name={outfitName}
            containerClassName="w-[420px] shrink-0"
          >
            <div
              className="relative mx-auto aspect-[3/4] w-[420px] shrink-0 overflow-hidden border border-blueprint-border surface-canvas-paper"
              style={{ width: MAIN_CANVAS_WIDTH_PX }}
            >
              <div aria-hidden className="absolute inset-0 z-0 bg-white" />

              <WardrobeCanvasBrandWatermark />

              <WardrobeMoodImageFrame
                moodImageUrl={moodImageUrl}
                showPlaceholder
              />

              <WardrobeMoodword moodword={moodword} />

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
                  disableCanvasHitTesting
                />
              </div>
            </div>
          </WardrobeOutfitMoodboardCard>
        </div>
      </div>
    </div>
  );
});
