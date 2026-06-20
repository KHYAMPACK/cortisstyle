"use client";

import { useMemo, useState } from "react";
import { WardrobeBuilderSlot } from "@/components/wardrobe/WardrobeBuilderSlot";
import { WardrobeSelectionDrawer } from "@/components/wardrobe/WardrobeSelectionDrawer";
import {
  filterInventoryByCategory,
  resolveBuilderInventory,
} from "@/lib/wardrobeBuilderInventory";
import { resolveWardrobeItemComposition } from "@/lib/wardrobeBuilderComposition";
import {
  getSlotDefinition,
  WARDROBE_MATRIX_ROW_HEIGHTS,
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
  const [currentOutfit, setCurrentOutfit] = useState<WardrobeOutfitMatrix>(() =>
    Array(9).fill(null),
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] =
    useState<MatrixCategoryFilter | null>(null);
  const [activeSlotIndex, setActiveSlotIndex] =
    useState<WardrobeMatrixSlotIndex | null>(null);
  const [menuSlotIndex, setMenuSlotIndex] =
    useState<WardrobeMatrixSlotIndex | null>(null);

  const inventory = useMemo(
    () => resolveBuilderInventory(ownedClothes),
    [ownedClothes],
  );

  const drawerItems = useMemo(
    () => filterInventoryByCategory(inventory, activeCategoryFilter),
    [inventory, activeCategoryFilter],
  );

  const equippedCount = currentOutfit.filter((slot) => slot !== null).length;

  const openDrawerForSlot = (slotIndex: WardrobeMatrixSlotIndex) => {
    const slot = getSlotDefinition(slotIndex);
    setActiveSlotIndex(slotIndex);
    setActiveCategoryFilter(slot.categoryFilter);
    setMenuSlotIndex(null);
    setIsDrawerOpen(true);
  };

  const handleSelectItem = (item: WardrobeClothingItem) => {
    if (activeSlotIndex === null || !activeCategoryFilter) return;
    if (!item.canvasImage) return;

    const composition = resolveWardrobeItemComposition(item.id, item.sourceLookId);

    const equippedItem: WardrobeEquippedItem = {
      id: item.id,
      name: item.name,
      image: item.canvasImage,
      rarityScore: item.rarityScore,
      categoryFilter: activeCategoryFilter,
      widthPx: composition.widthPx,
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

  const handleRemove = (slotIndex: WardrobeMatrixSlotIndex) => {
    setCurrentOutfit((current) => {
      const next = [...current];
      next[slotIndex] = null;
      return next;
    });
    setMenuSlotIndex(null);
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

      <div
        className="relative mx-auto grid w-full max-w-[500px] grid-cols-3 overflow-visible border border-neutral-200/60 bg-white"
        style={{
          gridTemplateRows: WARDROBE_MATRIX_ROW_HEIGHTS,
        }}
      >
        {WARDROBE_MATRIX_SLOTS.map((slot) => (
          <WardrobeBuilderSlot
            key={slot.index}
            stackOrder={slot.stackOrder}
            alignClass={slot.alignClass}
            assetWrapperClass={slot.assetWrapperClass}
            label={slot.label}
            item={currentOutfit[slot.index]}
            isMenuOpen={menuSlotIndex === slot.index}
            onEmptyClick={() => openDrawerForSlot(slot.index)}
            onActiveClick={() =>
              setMenuSlotIndex((current) =>
                current === slot.index ? null : slot.index,
              )
            }
            onSwap={() => openDrawerForSlot(slot.index)}
            onRemove={() => handleRemove(slot.index)}
          />
        ))}
      </div>

      <p className="mx-auto mt-5 max-w-[500px] text-center font-mono text-[9px] tracking-[0.18em] text-neutral-400 uppercase">
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
