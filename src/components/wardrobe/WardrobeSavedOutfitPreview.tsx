"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  buildWardrobeBuilderCategoryFilterMap,
  buildWardrobeBuilderSourceLookMap,
  resolveWardrobeBuilderCanvasLayouts,
  resolveWardrobeBuilderLookItems,
} from "@/lib/wardrobeBuilderLook";
import { mergeLayoutOverrides } from "@/lib/wardrobeDragLayout";
import type { SavedWardrobeOutfitBlueprint } from "@/types/wardrobe-builder";
import type { WardrobeClothingItem } from "@/types/user";
import { normalizeSavedOutfitBlueprint } from "@/lib/normalizeSavedOutfit";
import { WardrobeOutfitLivePreviewCard } from "@/components/wardrobe/WardrobeOutfitLivePreviewCard";

interface WardrobeSavedOutfitPreviewProps {
  outfit: SavedWardrobeOutfitBlueprint;
  inventory: WardrobeClothingItem[];
  onOpenInBuilder?: (outfit: SavedWardrobeOutfitBlueprint) => void;
}

export function WardrobeSavedOutfitPreview({
  outfit,
  inventory,
  onOpenInBuilder,
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
    ) => {
      const base = resolveWardrobeBuilderCanvasLayouts(
        items,
        width,
        sourceLookByItemId,
        categoryFilterByItemId,
      );

      return mergeLayoutOverrides(base, safeOutfit.layoutOverrides, true);
    },
    [sourceLookByItemId, categoryFilterByItemId, safeOutfit.layoutOverrides],
  );

  return (
    <article className="surface-canvas-paper border border-blueprint-border">
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
      <div className="border-t border-blueprint-border px-3 py-3 md:px-4 md:py-4">
        <h2 className="font-serif text-[11px] leading-snug tracking-[0.12em] text-neutral-900 uppercase md:text-xs">
          {safeOutfit.name}
        </h2>
        <p className="text-meta mt-1 text-[9px] tracking-[0.3em] uppercase">
          Saved Outfit
        </p>
        {onOpenInBuilder ? (
          <button
            type="button"
            onClick={() => onOpenInBuilder(safeOutfit)}
            className="mt-3 w-full border border-jet-black px-3 py-2 font-mono text-[9px] tracking-[0.22em] text-jet-black uppercase transition-colors duration-200 hover:bg-jet-black hover:text-white"
          >
            Open in Builder
          </button>
        ) : null}
      </div>
    </article>
  );
}
