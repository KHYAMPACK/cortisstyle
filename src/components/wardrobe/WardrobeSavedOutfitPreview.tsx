"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pen, Trash2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
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
  onEdit?: (outfit: SavedWardrobeOutfitBlueprint) => void;
  onDelete?: (outfit: SavedWardrobeOutfitBlueprint) => void;
  isDeleting?: boolean;
}

const iconButtonClass =
  "flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200/80 bg-white/90 text-neutral-950 shadow-sm transition-all duration-200 hover:border-neutral-400 hover:bg-white hover:shadow-md";

const iconClass = "h-3.5 w-3.5 stroke-current text-neutral-950";

export function WardrobeSavedOutfitPreview({
  outfit,
  inventory,
  onEdit,
  onDelete,
  isDeleting = false,
}: WardrobeSavedOutfitPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

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

  const handleConfirmDelete = () => {
    if (isDeleting) return;
    onDelete?.(safeOutfit);
  };

  return (
    <article className="relative overflow-hidden border border-blueprint-border bg-transparent">
      <div
        className={`relative transition-opacity duration-300 ${
          isDeleting ? "opacity-70" : "opacity-100"
        }`}
      >
        {(onEdit || onDelete) && !showPurgeConfirm && !isDeleting ? (
          <div className="absolute top-3 right-3 z-[60] flex items-center gap-1.5">
            {onEdit ? (
              <button
                type="button"
                aria-label={`Edit ${safeOutfit.name || "saved outfit"}`}
                onClick={() => onEdit(safeOutfit)}
                className={iconButtonClass}
              >
                <Pen className={iconClass} strokeWidth={1.75} />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                aria-label={`Delete ${safeOutfit.name || "saved outfit"}`}
                onClick={() => setShowPurgeConfirm(true)}
                className={iconButtonClass}
              >
                <Trash2 className={iconClass} strokeWidth={1.75} />
              </button>
            ) : null}
          </div>
        ) : null}

        <AnimatePresence>
          {showPurgeConfirm || isDeleting ? (
            <motion.div
              key="purge-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-[#0D0D0D]/92 p-4 text-center"
            >
              {isDeleting ? (
                <>
                  <motion.div
                    aria-hidden
                    className="h-6 w-6 border border-neutral-500 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <p className="font-mono text-[9px] tracking-[0.22em] text-white uppercase">
                    Purging look
                    <span className="inline-flex w-[1.35rem] justify-start">
                      {[0, 1, 2].map((index) => (
                        <motion.span
                          key={index}
                          aria-hidden
                          animate={{ opacity: [0.15, 1, 0.15] }}
                          transition={{
                            duration: 0.9,
                            repeat: Infinity,
                            delay: index * 0.18,
                          }}
                        >
                          .
                        </motion.span>
                      ))}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="font-mono text-[9px] leading-relaxed tracking-[0.18em] text-white uppercase">
                    Are you sure you want to purge this look?
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className="border border-white px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-white uppercase transition-colors hover:bg-white hover:text-black"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPurgeConfirm(false)}
                      className="font-mono text-[9px] tracking-[0.2em] text-neutral-400 uppercase transition-colors hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <WardrobeOutfitLivePreviewCard
          ref={previewRef}
          outfitName={safeOutfit.name}
          moodword={safeOutfit.moodword}
          moodImageUrl={safeOutfit.moodImageUrl}
          canvasBg={safeOutfit.canvasBg}
          lookItems={lookItems}
          resolveLayouts={resolveLayouts}
          canvasKey={canvasKey}
          className="mx-auto"
        />
      </div>
    </article>
  );
}
