"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { LookCanvas } from "@/components/modal/LookCanvas";
import { MatrixBlueprintGrid } from "@/components/modal/MatrixBlueprintGrid";
import { WardrobeBuilderBlueprintCell } from "@/components/wardrobe/WardrobeBuilderBlueprintCell";
import { MatrixBlueprintInteractionGrid } from "@/components/wardrobe/MatrixBlueprintInteractionGrid";
import { WardrobeBuilderSlotZone } from "@/components/wardrobe/WardrobeBuilderSlotZone";
import { WardrobeMoodImageFrame } from "@/components/wardrobe/WardrobeMoodImageFrame";
import { WardrobeOutfitMoodboardCard } from "@/components/wardrobe/WardrobeOutfitMoodboardCard";
import { WardrobeSaveOutfitModal } from "@/components/wardrobe/WardrobeSaveOutfitModal";
import { WardrobeSelectionDrawer } from "@/components/wardrobe/WardrobeSelectionDrawer";
import { useAuth } from "@/context/AuthContext";
import {
  filterInventoryByCategory,
  resolveBuilderInventory,
  resolveItemSourceLookId,
} from "@/lib/wardrobeBuilderInventory";
import {
  buildWardrobeBuilderCategoryFilterMap,
  buildWardrobeBuilderSourceLookMap,
  resolveWardrobeBuilderCanvasLayouts,
  resolveWardrobeBuilderLookItems,
} from "@/lib/wardrobeBuilderLook";
import {
  DEFAULT_OUTFIT_CARD_META,
  getSlotDefinition,
  WARDROBE_BUILDER_LOOK,
  type MatrixCategoryFilter,
  type SavedWardrobeOutfitBlueprint,
  type WardrobeEquippedItem,
  type WardrobeMatrixSlotIndex,
  type WardrobeOutfitCardMeta,
  type WardrobeOutfitMatrix,
} from "@/types/wardrobe-builder";
import type { WardrobeClothingItem } from "@/types/user";

interface WardrobeBuilderCanvasProps {
  ownedClothes?: WardrobeClothingItem[];
}

export function WardrobeBuilderCanvas({
  ownedClothes = [],
}: WardrobeBuilderCanvasProps) {
  const { user, refreshSavedOutfits } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentOutfit, setCurrentOutfit] = useState<WardrobeOutfitMatrix>(() =>
    Array(9).fill(null),
  );
  const [cardMeta, setCardMeta] = useState<WardrobeOutfitCardMeta>(
    DEFAULT_OUTFIT_CARD_META,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
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

  const categoryFilterByItemId = useMemo(
    () => buildWardrobeBuilderCategoryFilterMap(currentOutfit),
    [currentOutfit],
  );

  const outfitCanvasKey = useMemo(
    () => currentOutfit.map((slot) => slot?.id ?? "_").join("|"),
    [currentOutfit],
  );

  const resolveLayouts = useCallback(
    (items: Parameters<typeof resolveWardrobeBuilderCanvasLayouts>[0], width: number) =>
      resolveWardrobeBuilderCanvasLayouts(
        items,
        width,
        sourceLookByItemId,
        categoryFilterByItemId,
      ),
    [sourceLookByItemId, categoryFilterByItemId],
  );

  const equippedCount = currentOutfit.filter((slot) => slot !== null).length;
  const hasSavedCardMeta =
    cardMeta.name.trim().length > 0 || cardMeta.moodImageUrl !== null;

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

  const handleSaveSuccess = (
    _blueprint: SavedWardrobeOutfitBlueprint,
    payload: { name: string; moodImageUrl: string | null },
  ) => {
    setCardMeta({
      name: payload.name,
      moodImageUrl: payload.moodImageUrl,
    });
  };

  const handleSavedToOutfits = () => {
    void refreshSavedOutfits();
  };

  return (
    <section
      aria-label="Wardrobe builder matrix"
      className="relative flex w-full flex-col items-center overflow-visible"
    >
      <div className="mb-6 w-full text-center">
        <p className="text-[9px] tracking-[0.42em] text-neutral-400 uppercase">
          Core Matrix // 3×3
        </p>
        <h2 className="mt-2 font-serif text-xl tracking-[-0.01em] text-neutral-950 md:text-2xl">
          Outfit Builder
        </h2>
      </div>

      <div className="grid w-full place-items-center">
        <WardrobeOutfitMoodboardCard
          name={cardMeta.name}
          showFooter={hasSavedCardMeta}
        >
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[420px] shrink-0 overflow-hidden border border-neutral-200 bg-white">
            <WardrobeMoodImageFrame moodImageUrl={cardMeta.moodImageUrl} />

            <LookCanvas
              key={outfitCanvasKey}
              className="absolute inset-0 z-20 h-full w-full"
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

            <MatrixBlueprintGrid
              className="z-30"
              renderCell={({ slotIndex }) => {
                const index = slotIndex as WardrobeMatrixSlotIndex;
                const slot = getSlotDefinition(index);
                return (
                  <WardrobeBuilderBlueprintCell
                    label={slot.label}
                    isEmpty={currentOutfit[index] === null}
                  />
                );
              }}
            />

            <MatrixBlueprintInteractionGrid
              className="z-40"
              renderCell={({ slotIndex }) => {
                const index = slotIndex as WardrobeMatrixSlotIndex;
                const slot = getSlotDefinition(index);
                return (
                  <WardrobeBuilderSlotZone
                    label={slot.label}
                    isEmpty={currentOutfit[index] === null}
                    onClick={() => openDrawerForSlot(index)}
                  />
                );
              }}
            />

          </div>
        </WardrobeOutfitMoodboardCard>
      </div>

      <p className="mx-auto mt-5 w-full max-w-[420px] text-center font-mono text-[9px] tracking-[0.18em] text-neutral-400 uppercase">
        {equippedCount > 0
          ? `${equippedCount} / 9 slots equipped`
          : "Tap an empty slot to assign archive assets"}
      </p>

      <button
        type="button"
        onClick={() => setIsSaveModalOpen(true)}
        disabled={equippedCount === 0}
        className="fixed right-6 bottom-6 z-[60] border border-neutral-900 bg-neutral-900 px-5 py-3 font-mono text-[10px] tracking-[0.3em] text-white uppercase shadow-lg transition-colors hover:bg-white hover:text-neutral-900 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-200 disabled:text-neutral-400"
      >
        Save Outfit
      </button>

      <WardrobeSelectionDrawer
        isOpen={isDrawerOpen}
        categoryFilter={activeCategoryFilter}
        items={drawerItems}
        onClose={closeDrawer}
        onSelectItem={handleSelectItem}
      />

      <WardrobeSaveOutfitModal
        isOpen={isSaveModalOpen}
        userId={user?.id ?? null}
        slots={currentOutfit}
        lookItems={lookItems}
        canvasKey={outfitCanvasKey}
        resolveLayouts={resolveLayouts}
        initialName={cardMeta.name}
        initialMoodImageUrl={cardMeta.moodImageUrl}
        onClose={() => setIsSaveModalOpen(false)}
        onSaveSuccess={handleSaveSuccess}
        onSavedToOutfits={handleSavedToOutfits}
      />
    </section>
  );
}
