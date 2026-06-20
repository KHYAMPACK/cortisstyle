"use client";

import { forwardRef, useCallback, useRef } from "react";
import { LookCanvas } from "@/components/modal/LookCanvas";
import {
  WardrobeCanvasFrame,
  WARDROBE_PREVIEW_CANVAS_FRAME_CLASS,
} from "@/components/wardrobe/WardrobeCanvasFrame";
import { WardrobeOutfitMoodboardCard } from "@/components/wardrobe/WardrobeOutfitMoodboardCard";
import type { CanvasItemLayout } from "@/types/canvas-layout";
import type { ResolvedLookItem } from "@/types/look";
import { WARDROBE_BUILDER_LOOK } from "@/types/wardrobe-builder";

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
      <WardrobeOutfitMoodboardCard
        name={name}
        containerClassName="w-[340px] shrink-0"
      >
        <WardrobeCanvasFrame
          containerRef={containerRef}
          moodImageUrl={moodImageUrl}
          showMoodPlaceholder
          frameClassName={WARDROBE_PREVIEW_CANVAS_FRAME_CLASS}
        >
          <LookCanvas
            key={canvasKey}
            bindContainerRef={false}
            transparentBackdrop
            className="absolute inset-0 z-30 h-full w-full"
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
        </WardrobeCanvasFrame>
      </WardrobeOutfitMoodboardCard>
    </div>
  );
});
