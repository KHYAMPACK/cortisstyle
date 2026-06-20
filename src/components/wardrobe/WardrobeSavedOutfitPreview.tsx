"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  buildWardrobeBuilderCategoryFilterMap,
  buildWardrobeBuilderSourceLookMap,
  resolveWardrobeBuilderCanvasLayouts,
  resolveWardrobeBuilderLookItems,
} from "@/lib/wardrobeBuilderLook";
import type { SavedWardrobeOutfitBlueprint } from "@/types/wardrobe-builder";
import type { WardrobeClothingItem } from "@/types/user";
import { normalizeSavedOutfitBlueprint } from "@/lib/normalizeSavedOutfit";
import { WardrobeOutfitLivePreviewCard } from "@/components/wardrobe/WardrobeOutfitLivePreviewCard";

interface WardrobeSavedOutfitPreviewProps {
  outfit: SavedWardrobeOutfitBlueprint;
  inventory: WardrobeClothingItem[];
}

export function WardrobeSavedOutfitPreview({
  outfit,
  inventory,
}: WardrobeSavedOutfitPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const safeOutfit = useMemo(
    () => normalizeSavedOutfitBlueprint(outfit),
    [outfit],
  );

  const lookItems = useMemo(
    () => resolveWardrobeBuilderLookItems(safeOutfit.slots, inventory),
    [safeOutfit.slots, inventory],
  );

  const sourceLookByItemId = useMemo(
    () => buildWardrobeBuilderSourceLookMap(safeOutfit.slots, inventory),
    [safeOutfit.slots, inventory],
  );

  const categoryFilterByItemId = useMemo(
    () => buildWardrobeBuilderCategoryFilterMap(safeOutfit.slots),
    [safeOutfit.slots],
  );

  const canvasKey = useMemo(
    () => safeOutfit.slots.map((slot) => slot?.id ?? "_").join("|"),
    [safeOutfit.slots],
  );

  const resolveLayouts = useCallback(
    (
      items: Parameters<typeof resolveWardrobeBuilderCanvasLayouts>[0],
      width: number,
    ) => resolveWardrobeBuilderCanvasLayouts(
      items,
      width,
      sourceLookByItemId,
      categoryFilterByItemId,
    ),
    [sourceLookByItemId, categoryFilterByItemId],
  );

  return (
    <article className="border border-neutral-200 bg-white">
      <div className="p-3 md:p-4">
        <WardrobeOutfitLivePreviewCard
          ref={previewRef}
          outfitName={safeOutfit.name}
          moodword={safeOutfit.moodword}
          moodImageUrl={safeOutfit.moodImageUrl}
          lookItems={lookItems}
          resolveLayouts={resolveLayouts}
          canvasKey={canvasKey}
        />
      </div>
      <div className="border-t border-neutral-200 px-3 py-3 md:px-4 md:py-4">
        <h2 className="font-serif text-[11px] leading-snug tracking-[0.12em] text-neutral-900 uppercase md:text-xs">
          {safeOutfit.name}
        </h2>
        <p className="mt-1 font-mono text-[9px] tracking-[0.3em] text-neutral-400 uppercase">
          Saved Outfit
        </p>
      </div>
    </article>
  );
}
