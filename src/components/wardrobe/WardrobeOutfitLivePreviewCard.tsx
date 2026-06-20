"use client";

import { forwardRef, useCallback, useMemo, useRef } from "react";
import { LookCanvas } from "@/components/modal/LookCanvas";
import { WardrobeMoodImageFrame } from "@/components/wardrobe/WardrobeMoodImageFrame";
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
    canvasWidthClassName = "w-full",
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);

  const resolvePreviewLayouts = useCallback(
    (items: ResolvedLookItem[], width: number) => resolveLayouts(items, width),
    [resolveLayouts],
  );

  const displayName = useMemo(() => name.trim() || "UNTITLED LOOK", [name]);

  return (
    <div ref={ref} className={`bg-white ${className}`.trim()}>
      <WardrobeOutfitMoodboardCard name={displayName}>
        <div
          className={`relative mx-auto aspect-[3/4] shrink-0 overflow-hidden border border-neutral-200 bg-white ${canvasWidthClassName}`}
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
          />

          <WardrobeMoodImageFrame
            moodImageUrl={moodImageUrl}
            showPlaceholder
          />
        </div>
      </WardrobeOutfitMoodboardCard>
    </div>
  );
});
