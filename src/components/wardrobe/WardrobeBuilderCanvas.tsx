"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LookCanvas } from "@/components/modal/LookCanvas";
import { MatrixBlueprintGrid } from "@/components/modal/MatrixBlueprintGrid";
import { WardrobeBuilderBlueprintCell } from "@/components/wardrobe/WardrobeBuilderBlueprintCell";
import { MatrixBlueprintInteractionGrid } from "@/components/wardrobe/MatrixBlueprintInteractionGrid";
import { WardrobeBuilderSlotZone } from "@/components/wardrobe/WardrobeBuilderSlotZone";
import { WardrobeCanvasBrandWatermark } from "@/components/wardrobe/WardrobeCanvasBrandWatermark";
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
  dragPositionsToLayoutOverrides,
  layoutOverridesToDragPositions,
  mergeFreeDragPositions,
  type FreeDragPosition,
} from "@/lib/wardrobeDragLayout";
import { normalizeSavedOutfitBlueprint } from "@/lib/normalizeSavedOutfit";
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
  loadBlueprint?: SavedWardrobeOutfitBlueprint | null;
  onBlueprintLoaded?: () => void;
}

export function WardrobeBuilderCanvas({
  ownedClothes = [],
  loadBlueprint = null,
  onBlueprintLoaded,
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
  const [isDragModeActive, setIsDragModeActive] = useState(false);
  const [customDragPositions, setCustomDragPositions] = useState<
    Record<string, FreeDragPosition>
  >({});

  useEffect(() => {
    if (!loadBlueprint) return;

    const blueprint = normalizeSavedOutfitBlueprint(loadBlueprint);

    setCurrentOutfit(blueprint.slots);
    setCardMeta({
      name: blueprint.name,
      moodword: blueprint.moodword,
      moodImageUrl: blueprint.moodImageUrl,
    });

    if (blueprint.layoutOverrides) {
      setCustomDragPositions(
        layoutOverridesToDragPositions(blueprint.layoutOverrides),
      );
      setIsDragModeActive(true);
    } else {
      setCustomDragPositions({});
      setIsDragModeActive(false);
    }

    onBlueprintLoaded?.();
  }, [loadBlueprint, onBlueprintLoaded]);

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
    (items: Parameters<typeof resolveWardrobeBuilderCanvasLayouts>[0], width: number) => {
      const base = resolveWardrobeBuilderCanvasLayouts(
        items,
        width,
        sourceLookByItemId,
        categoryFilterByItemId,
      );

      if (!isDragModeActive) return base;

      return mergeFreeDragPositions(base, customDragPositions);
    },
    [sourceLookByItemId, categoryFilterByItemId, isDragModeActive, customDragPositions],
  );

  const handleFreeDragPositionCommit = useCallback(
    (itemId: string, position: FreeDragPosition) => {
      setCustomDragPositions((current) => ({
        ...current,
        [itemId]: position,
      }));
    },
    [],
  );

  const layoutOverridesForSave = useMemo(() => {
    if (!isDragModeActive || Object.keys(customDragPositions).length === 0) {
      return undefined;
    }

    return dragPositionsToLayoutOverrides(customDragPositions);
  }, [isDragModeActive, customDragPositions]);

  const equippedCount = currentOutfit.filter((slot) => slot !== null).length;
  const hasSavedCardMeta =
    (cardMeta.name ?? "").trim().length > 0 ||
    (cardMeta.moodword ?? "").trim().length > 0 ||
    cardMeta.moodImageUrl !== null;

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
    payload: { name: string; moodword: string; moodImageUrl: string | null },
  ) => {
    setCardMeta({
      name: payload.name ?? "",
      moodword: payload.moodword ?? "",
      moodImageUrl: payload.moodImageUrl,
    });
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
        <div className="relative w-full max-w-[420px]">
          <div className="mb-3 flex items-center justify-end">
            <button
              type="button"
              role="switch"
              aria-checked={isDragModeActive}
              aria-label={
                isDragModeActive
                  ? "Free design mode active"
                  : "Enable drag mode"
              }
              onClick={() => setIsDragModeActive((current) => !current)}
              className="group flex items-center gap-3"
            >
              <span
                className={`font-mono text-[9px] tracking-[0.28em] uppercase transition-colors ${
                  isDragModeActive
                    ? "text-neutral-950"
                    : "text-neutral-400 group-hover:text-neutral-600"
                }`}
              >
                {isDragModeActive ? "Free Design" : "Drag Mode"}
              </span>
              <span
                aria-hidden
                className={`relative inline-flex h-5 w-9 shrink-0 border border-neutral-900 transition-colors ${
                  isDragModeActive ? "bg-neutral-900" : "bg-white"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-3.5 w-3.5 bg-neutral-900 transition-transform duration-200 ${
                    isDragModeActive
                      ? "translate-x-[18px] bg-white"
                      : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
          </div>

          <WardrobeOutfitMoodboardCard
          name={cardMeta.name}
          showFooter={hasSavedCardMeta}
        >
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[420px] shrink-0 overflow-hidden border border-neutral-200 bg-white">
            <div aria-hidden className="absolute inset-0 z-0 bg-white" />

            <WardrobeCanvasBrandWatermark />

            <WardrobeMoodImageFrame moodImageUrl={cardMeta.moodImageUrl} />

            <LookCanvas
              key={outfitCanvasKey}
              className={`absolute inset-0 h-full w-full ${
                isDragModeActive ? "z-[45]" : "z-20"
              }`}
              look={WARDROBE_BUILDER_LOOK}
              lookImage=""
              title="Wardrobe Builder"
              items={lookItems}
              activeItemId={null}
              isEditMode={false}
              containerRef={containerRef}
              onSelectItem={() => {}}
              resolveLayouts={resolveLayouts}
              isFreeDragMode={isDragModeActive}
              onFreeDragPositionCommit={handleFreeDragPositionCommit}
            />

            <MatrixBlueprintGrid
              className={`z-30 transition-opacity duration-300 ${
                isDragModeActive ? "pointer-events-none opacity-0" : ""
              }`}
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
              className={`z-40 ${
                isDragModeActive ? "pointer-events-none" : ""
              }`}
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
        layoutOverrides={layoutOverridesForSave}
        initialName={cardMeta.name}
        initialMoodword={cardMeta.moodword}
        initialMoodImageUrl={cardMeta.moodImageUrl}
        onClose={() => setIsSaveModalOpen(false)}
        onSaveSuccess={handleSaveSuccess}
      />
    </section>
  );
}
