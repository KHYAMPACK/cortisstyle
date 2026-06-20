"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { LookCanvas } from "@/components/modal/LookCanvas";
import { LookCanvasViewport } from "@/components/modal/LookCanvasViewport";
import { WardrobeBuilderBlueprintCell } from "@/components/wardrobe/WardrobeBuilderBlueprintCell";
import { WardrobeBuilderSlotZone } from "@/components/wardrobe/WardrobeBuilderSlotZone";
import { WardrobeSelectionDrawer } from "@/components/wardrobe/WardrobeSelectionDrawer";
import {
  filterInventoryByCategory,
  resolveBuilderInventory,
  resolveItemSourceLookId,
} from "@/lib/wardrobeBuilderInventory";
import {
  buildWardrobeBuilderSourceLookMap,
  resolveWardrobeBuilderCanvasLayouts,
  resolveWardrobeBuilderLookItems,
} from "@/lib/wardrobeBuilderLook";
import {
  getSlotDefinition,
  WARDROBE_BUILDER_LOOK,
  WARDROBE_MATRIX_SLOTS,
  type MatrixCategoryFilter,
  type WardrobeEquippedItem,
  type WardrobeMatrixSlotIndex,
  type WardrobeOutfitMatrix,
} from "@/types/wardrobe-builder";
import type { WardrobeClothingItem } from "@/types/user";

interface WardrobeBuilderCanvasProps {
  ownedClothes?: WardrobeClothingItem[];
}

export function WardrobeBuilderCanvas({
  ownedClothes = [],
}: WardrobeBuilderCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentOutfit, setCurrentOutfit] = useState<WardrobeOutfitMatrix>(() =>
    Array(9).fill(null),
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] =
    useState<MatrixCategoryFilter | null>(null);
  const [activeSlotIndex, setActiveSlotIndex] =
    useState<WardrobeMatrixSlotIndex | null>(null);

  const inventory = useMemo(
    () => resolveBuilderInventory(ownedClothes),
    [ownedClothes],
  );

  const drawerItems = useMemo(
    () => filterInventoryByCategory(inventory, activeCategoryFilter),
    [inventory, activeCategoryFilter],
  );

  const lookItems = useMemo(
    () => resolveWardrobeBuilderLookItems(currentOutfit, inventory),
    [currentOutfit, inventory],
  );

  const sourceLookByItemId = useMemo(
    () => buildWardrobeBuilderSourceLookMap(currentOutfit, inventory),
    [currentOutfit, inventory],
  );

  const outfitCanvasKey = useMemo(
    () => currentOutfit.map((slot) => slot?.id ?? "_").join("|"),
    [currentOutfit],
  );

  const resolveLayouts = useCallback(
    (items: Parameters<typeof resolveWardrobeBuilderCanvasLayouts>[0], width: number) =>
      resolveWardrobeBuilderCanvasLayouts(items, width, sourceLookByItemId),
    [sourceLookByItemId],
  );

  const equippedCount = currentOutfit.filter((slot) => slot !== null).length;

  const openDrawerForSlot = (slotIndex: WardrobeMatrixSlotIndex) => {
    const slot = getSlotDefinition(slotIndex);
    setActiveSlotIndex(slotIndex);
    setActiveCategoryFilter(slot.categoryFilter);
    setIsDrawerOpen(true);
  };

  const handleSelectItem = (item: WardrobeClothingItem) => {
    if (activeSlotIndex === null || !activeCategoryFilter) return;
    if (!item.canvasImage) return;

    const equippedItem: WardrobeEquippedItem = {
      id: item.id,
      categoryFilter: activeCategoryFilter,
      slotIndex: activeSlotIndex,
      sourceLookId: item.sourceLookId ?? resolveItemSourceLookId(item.id),
    };

    setCurrentOutfit((current) => {
      const next = [...current];
      next[activeSlotIndex] = equippedItem;
      return next;
    });

    setIsDrawerOpen(false);
    setActiveCategoryFilter(null);
    setActiveSlotIndex(null);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setActiveCategoryFilter(null);
    setActiveSlotIndex(null);
  };

  return (
    <section
      aria-label="Wardrobe builder matrix"
      className="relative w-full overflow-visible"
    >
      <div className="mb-6 text-center">
        <p className="text-[9px] tracking-[0.42em] text-neutral-400 uppercase">
          Core Matrix // 3×3
        </p>
        <h2 className="mt-2 font-serif text-xl tracking-[-0.01em] text-neutral-950 md:text-2xl">
          Outfit Builder
        </h2>
      </div>

      <div className="relative w-full">
        <LookCanvasViewport>
          <div className="relative h-full w-full">
            <LookCanvas
              key={outfitCanvasKey}
              look={WARDROBE_BUILDER_LOOK}
              lookImage=""
              title="Wardrobe Builder"
              items={lookItems}
              activeItemId={null}
              isEditMode={false}
              containerRef={containerRef}
              onSelectItem={() => {}}
              resolveLayouts={resolveLayouts}
            />

            <div className="pointer-events-none absolute inset-0 z-30 grid h-full w-full grid-cols-3 grid-rows-3">
              {WARDROBE_MATRIX_SLOTS.map((slot) => (
                <WardrobeBuilderBlueprintCell
                  key={slot.index}
                  label={slot.label}
                  isEmpty={currentOutfit[slot.index] === null}
                />
              ))}
            </div>

            <div className="absolute inset-0 z-40 grid h-full w-full grid-cols-3 grid-rows-3">
              {WARDROBE_MATRIX_SLOTS.map((slot) => (
                <WardrobeBuilderSlotZone
                  key={slot.index}
                  label={slot.label}
                  isEmpty={currentOutfit[slot.index] === null}
                  onClick={() => openDrawerForSlot(slot.index)}
                />
              ))}
            </div>
          </div>
        </LookCanvasViewport>
      </div>

      <p className="mt-5 w-full text-center font-mono text-[9px] tracking-[0.18em] text-neutral-400 uppercase">
        {equippedCount > 0
          ? `${equippedCount} / 9 slots equipped`
          : "Tap an empty slot to assign archive assets"}
      </p>

      <WardrobeSelectionDrawer
        isOpen={isDrawerOpen}
        categoryFilter={activeCategoryFilter}
        items={drawerItems}
        onClose={closeDrawer}
        onSelectItem={handleSelectItem}
      />
    </section>
  );
}
