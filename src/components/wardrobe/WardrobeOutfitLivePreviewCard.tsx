"use client";

import { forwardRef, useCallback, useRef } from "react";
import { LookCanvas } from "@/components/modal/LookCanvas";
import { LookCanvasLayoutProvider } from "@/context/LookCanvasLayoutContext";
import { WardrobeCanvasBrandWatermark } from "@/components/wardrobe/WardrobeCanvasBrandWatermark";
import { WardrobeMoodImageFrame } from "@/components/wardrobe/WardrobeMoodImageFrame";
import { WardrobeMoodword } from "@/components/wardrobe/WardrobeMoodword";
import { WardrobeOutfitMoodboardCard } from "@/components/wardrobe/WardrobeOutfitMoodboardCard";
import type { CanvasItemLayout } from "@/types/canvas-layout";
import type { ResolvedLookItem } from "@/types/look";
import { WARDROBE_BUILDER_LOOK } from "@/types/wardrobe-builder";
import { COLLAGE_BACKDROP } from "@/lib/collageLayout";
import {
  LOOK_CANVAS_REFERENCE_HEIGHT,
  LOOK_CANVAS_REFERENCE_WIDTH,
} from "@/lib/lookCanvasReference";
import { isDarkCanvasBackground } from "@/lib/wardrobeCanvasBackground";

/** Matches the verified main wardrobe canvas width — layout math stays identical. */
const MAIN_CANVAS_WIDTH_PX = 420;

const PREVIEW_SCALE = 0.76;

const PREVIEW_CANVAS_HEIGHT_PX = Math.round(MAIN_CANVAS_WIDTH_PX * (3 / 2));
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
  canvasBg?: string;
  /** When false, mood image placeholder and empty moodword are hidden. */
  showMoodPlaceholders?: boolean;
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
    canvasBg = "#FFFFFF",
    showMoodPlaceholders = false,
    className = "",
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDarkCanvas = isDarkCanvasBackground(canvasBg);
  const moodwordFallback = showMoodPlaceholders ? "EDITORIAL" : undefined;

  const resolvePreviewLayouts = useCallback(
    (items: ResolvedLookItem[], width: number) => resolveLayouts(items, width),
    [resolveLayouts],
  );

  return (
    <div ref={ref} className={`mx-auto w-full max-w-[320px] ${className}`.trim()}>
      <div
        className="relative mx-auto w-full max-w-[320px] overflow-hidden"
        style={{ height: PREVIEW_MASK_HEIGHT_PX }}
      >
        <div
          className="absolute top-1/2 left-1/2 w-[420px] shrink-0"
          style={{
            transform: `translate(-50%, -50%) scale(${PREVIEW_SCALE})`,
          }}
        >
          <WardrobeOutfitMoodboardCard
            name={outfitName}
            containerClassName="w-[420px] shrink-0"
          >
            <div
              className={`relative mx-auto box-content shrink-0 overflow-hidden border ${
                isDarkCanvas
                  ? "border-neutral-700"
                  : "border-blueprint-border surface-canvas-paper"
              }`}
              style={{
                width: LOOK_CANVAS_REFERENCE_WIDTH,
                height: LOOK_CANVAS_REFERENCE_HEIGHT,
              }}
            >
              <div
                aria-hidden
                className="absolute inset-0 z-0"
                style={{ backgroundColor: canvasBg }}
              />

              {isDarkCanvas ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,transparent_42%,rgba(255,255,255,0.06)_100%)]"
                />
              ) : null}

              <WardrobeCanvasBrandWatermark onDarkCanvas={isDarkCanvas} />

              <WardrobeMoodImageFrame
                moodImageUrl={moodImageUrl}
                showPlaceholder={showMoodPlaceholders}
              />

              <WardrobeMoodword
                moodword={moodword}
                emptyFallback={moodwordFallback}
                onDarkCanvas={isDarkCanvas}
              />

              <LookCanvasLayoutProvider
                referenceWidth={LOOK_CANVAS_REFERENCE_WIDTH}
                referenceHeight={LOOK_CANVAS_REFERENCE_HEIGHT}
              >
              <div
                className={`pointer-events-none absolute inset-0 z-20 ${
                  isDarkCanvas
                    ? "[&_img]:drop-shadow-[0_0_1px_rgba(255,255,255,0.95)] [&_img]:drop-shadow-[0_0_5px_rgba(255,255,255,0.28)]"
                    : "mix-blend-multiply"
                }`}
              >
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
                  collageBackdrop={
                    isDarkCanvas ? "transparent" : COLLAGE_BACKDROP
                  }
                />
              </div>
              </LookCanvasLayoutProvider>
            </div>
          </WardrobeOutfitMoodboardCard>
        </div>
      </div>
    </div>
  );
});
