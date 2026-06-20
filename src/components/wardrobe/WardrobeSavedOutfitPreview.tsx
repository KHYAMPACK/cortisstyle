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

  const lookItems = useMemo(
    () => resolveWardrobeBuilderLookItems(outfit.slots, inventory),
    [outfit.slots, inventory],
  );

  const sourceLookByItemId = useMemo(
    () => buildWardrobeBuilderSourceLookMap(outfit.slots, inventory),
    [outfit.slots, inventory],
  );

  const categoryFilterByItemId = useMemo(
    () => buildWardrobeBuilderCategoryFilterMap(outfit.slots),
    [outfit.slots],
  );

  const canvasKey = useMemo(
    () => outfit.slots.map((slot) => slot?.id ?? "_").join("|"),
    [outfit.slots],
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
          outfitName={outfit.name}
          moodword={outfit.moodword}
          moodImageUrl={outfit.moodImageUrl}
          lookItems={lookItems}
          resolveLayouts={resolveLayouts}
          canvasKey={canvasKey}
          canvasWidthClassName="w-full"
        />
      </div>
      <div className="border-t border-neutral-200 px-3 py-3 md:px-4 md:py-4">
        <h2 className="font-serif text-[11px] leading-snug tracking-[0.12em] text-neutral-900 uppercase md:text-xs">
          {outfit.name}
        </h2>
        <p className="mt-1 font-mono text-[9px] tracking-[0.3em] text-neutral-400 uppercase">
          Saved Outfit
        </p>
      </div>
    </article>
  );
}
