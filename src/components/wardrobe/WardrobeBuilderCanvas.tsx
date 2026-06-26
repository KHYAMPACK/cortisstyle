"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LookCanvas } from "@/components/modal/LookCanvas";
import { MatrixBlueprintGrid } from "@/components/modal/MatrixBlueprintGrid";
import { WardrobeBuilderBlueprintCell } from "@/components/wardrobe/WardrobeBuilderBlueprintCell";
import { MatrixBlueprintInteractionGrid } from "@/components/wardrobe/MatrixBlueprintInteractionGrid";
import { WardrobeBuilderSlotZone } from "@/components/wardrobe/WardrobeBuilderSlotZone";
import { WardrobeMoodImageFrame } from "@/components/wardrobe/WardrobeMoodImageFrame";
import { WardrobeOutfitMoodboardCard } from "@/components/wardrobe/WardrobeOutfitMoodboardCard";
import { WardrobeSaveOutfitModal, type WardrobeSaveOutfitPayload } from "@/components/wardrobe/WardrobeSaveOutfitModal";
import { SavedOutfitArchiveLimitModal } from "@/components/wardrobe/SavedOutfitArchiveLimitModal";
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
import { LookCanvasViewport } from "@/components/modal/LookCanvasViewport";
import {
  LOOK_CANVAS_REFERENCE_HEIGHT,
  LOOK_CANVAS_REFERENCE_WIDTH,
  WARDROBE_MOBILE_DISPLAY_MAX_WIDTH,
} from "@/lib/lookCanvasReference";
import { normalizeSavedOutfitBlueprint } from "@/lib/normalizeSavedOutfit";
import { isPersistedSavedOutfitBlueprint } from "@/lib/lookToWardrobeBlueprint";
import {
  CANVAS_BG_DEFAULT,
  type CanvasBgValue,
} from "@/lib/wardrobeCanvasBackground";
import { FREE_TIER_SAVED_OUTFIT_LIMIT } from "@/lib/launchGates";
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

/** Mobile-first canvas frame — desktop caps unchanged at md+. */
const CANVAS_WIDTH_CLASS =
  "mx-auto w-full min-w-0 max-w-[360px] xs:max-w-[400px] sm:max-w-[420px] md:max-w-[420px]";

const CANVAS_FRAME_CLASS = `relative ${CANVAS_WIDTH_CLASS}`;

const CANVAS_BOUNDARY_CLASS =
  "surface-canvas-paper relative isolate box-content shrink-0 overflow-hidden border border-blueprint-border";

/** Isolated 2:3 coordinate sandbox — percentage math resolves only inside this box. */
const CANVAS_COORDINATE_SANDBOX_CLASS =
  "absolute inset-0 h-full w-full overflow-hidden";

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
  const { user, refreshSavedOutfits, savedOutfits } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentOutfit, setCurrentOutfit] = useState<WardrobeOutfitMatrix>(() =>
    Array(9).fill(null),
  );
  const [cardMeta, setCardMeta] = useState<WardrobeOutfitCardMeta>(
    DEFAULT_OUTFIT_CARD_META,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isArchiveLimitModalOpen, setIsArchiveLimitModalOpen] = useState(false);
  const [editingOutfitId, setEditingOutfitId] = useState<string | null>(null);
  const [editingSavedAt, setEditingSavedAt] = useState<string | null>(null);
  const [editingCanvasBg, setEditingCanvasBg] =
    useState<CanvasBgValue>(CANVAS_BG_DEFAULT);
  const [activeCategoryFilter, setActiveCategoryFilter] =
    useState<MatrixCategoryFilter | null>(null);
  const [activeSlotIndex, setActiveSlotIndex] =
    useState<WardrobeMatrixSlotIndex | null>(null);
  const [isDragModeActive, setIsDragModeActive] = useState(false);
  const [showDragHint, setShowDragHint] = useState(true);
  const [customDragPositions, setCustomDragPositions] = useState<
    Record<string, FreeDragPosition>
  >({});
  const workbenchRef = useRef<HTMLElement>(null);
  const dragHintAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadBlueprint) return;

    const blueprint = normalizeSavedOutfitBlueprint(loadBlueprint);

    setCurrentOutfit(blueprint.slots);
    setCardMeta({
      name: blueprint.name,
      moodword: blueprint.moodword,
      moodImageUrl: blueprint.moodImageUrl,
    });

    const isPersisted = isPersistedSavedOutfitBlueprint(blueprint);
    setEditingOutfitId(isPersisted ? blueprint.id : null);
    setEditingSavedAt(isPersisted ? blueprint.savedAt : null);
    setEditingCanvasBg(blueprint.canvasBg ?? CANVAS_BG_DEFAULT);

    if (isPersisted && blueprint.layoutOverrides) {
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

  useEffect(() => {
    const workbench = workbenchRef.current;
    if (!workbench || !showDragHint) return;

    const handlePointerDown = (event: PointerEvent) => {
      const anchor = dragHintAnchorRef.current;
      if (anchor?.contains(event.target as Node)) return;

      setShowDragHint(false);
    };

    workbench.addEventListener("pointerdown", handlePointerDown);
    return () => workbench.removeEventListener("pointerdown", handlePointerDown);
  }, [showDragHint]);

  const inventory = useMemo(
    () => resolveBuilderInventory(ownedClothes),
    [ownedClothes],
  );

  const drawerItems = useMemo(
    () => filterInventoryByCategory(inventory, activeCategoryFilter),
    [inventory, activeCategoryFilter],
  );

  const equippedItemInActiveSlot = useMemo(() => {
    if (activeSlotIndex === null) return null;

    const equipped = currentOutfit[activeSlotIndex];
    if (!equipped) return null;

    return inventory.find((item) => item.id === equipped.id) ?? null;
  }, [activeSlotIndex, currentOutfit, inventory]);

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

  useEffect(() => {
    const equippedIds = new Set(
      currentOutfit.map((slot) => slot?.id).filter(Boolean) as string[],
    );

    setCustomDragPositions((current) => {
      const next: Record<string, FreeDragPosition> = {};
      for (const [itemId, position] of Object.entries(current)) {
        if (equippedIds.has(itemId)) {
          next[itemId] = position;
        }
      }

      return Object.keys(next).length === Object.keys(current).length
        ? current
        : next;
    });
  }, [currentOutfit]);

  const resolveLayouts = useCallback(
    (items: Parameters<typeof resolveWardrobeBuilderCanvasLayouts>[0], width: number) => {
      const base = resolveWardrobeBuilderCanvasLayouts(
        items,
        width,
        sourceLookByItemId,
        categoryFilterByItemId,
      );

      return mergeFreeDragPositions(base, customDragPositions);
    },
    [sourceLookByItemId, categoryFilterByItemId, customDragPositions],
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
    if (Object.keys(customDragPositions).length === 0) {
      return undefined;
    }

    return dragPositionsToLayoutOverrides(customDragPositions);
  }, [customDragPositions]);

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

    const previousItemId = currentOutfit[activeSlotIndex]?.id ?? null;

    setCustomDragPositions((current) => {
      if (!previousItemId && !current[item.id]) return current;

      const next = { ...current };
      if (previousItemId) delete next[previousItemId];
      delete next[item.id];
      return next;
    });

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

  const handleRemoveItem = () => {
    if (activeSlotIndex === null) return;

    const equipped = currentOutfit[activeSlotIndex];
    if (!equipped) return;

    setCustomDragPositions((current) => {
      if (!current[equipped.id]) return current;

      const next = { ...current };
      delete next[equipped.id];
      return next;
    });

    setCurrentOutfit((current) => {
      const next = [...current];
      next[activeSlotIndex] = null;
      return next;
    });

    closeDrawer();
  };

  const handleSaveSuccess = (
    _blueprint: SavedWardrobeOutfitBlueprint,
    payload: WardrobeSaveOutfitPayload,
  ) => {
    setCardMeta({
      name: payload.name ?? "",
      moodword: payload.moodword ?? "",
      moodImageUrl: payload.moodImageUrl,
    });
    setEditingOutfitId(null);
    setEditingSavedAt(null);
    setEditingCanvasBg(CANVAS_BG_DEFAULT);
    void refreshSavedOutfits();
  };

  const handleOpenSaveModal = () => {
    if (
      !editingOutfitId &&
      savedOutfits.length >= FREE_TIER_SAVED_OUTFIT_LIMIT
    ) {
      setIsArchiveLimitModalOpen(true);
      return;
    }

    setIsSaveModalOpen(true);
  };

  return (
    <section
      ref={workbenchRef}
      aria-label="Wardrobe builder matrix"
      className="relative flex w-full min-w-0 flex-col items-center overflow-visible"
    >
      <div className="mb-6 w-full text-center">
        <p className="text-meta text-[9px] tracking-[0.42em] uppercase">
          Core Matrix // 3×3
        </p>
        <h2 className="mt-2 font-serif text-xl tracking-[-0.01em] text-neutral-950 md:text-2xl">
          Outfit Builder
        </h2>
      </div>

      <div className="grid w-full min-w-0 place-items-center">
        <div className={CANVAS_FRAME_CLASS}>
          <div className="mb-3 flex items-center justify-end">
            <div
              ref={dragHintAnchorRef}
              className="relative flex items-center gap-2"
            >
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

              <button
                type="button"
                aria-label={
                  showDragHint ? "Hide drag mode hint" : "Show drag mode hint"
                }
                aria-expanded={showDragHint}
                onClick={(event) => {
                  event.stopPropagation();
                  setShowDragHint((current) => !current);
                }}
                className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-400 font-mono text-[9px] text-neutral-500 transition-colors hover:border-black hover:text-black"
              >
                ?
              </button>

              <AnimatePresence>
                {showDragHint ? (
                  <motion.div
                    role="tooltip"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full right-0 z-50 mt-2 w-48 rounded-none border border-neutral-800 bg-[#0D0D0D] p-3 text-left font-mono text-[10px] tracking-wider text-white uppercase shadow-xl"
                  >
                    Toggle drag mode to freely unpin and arrange clothing items
                    anywhere
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <WardrobeOutfitMoodboardCard
            name={cardMeta.name}
            showFooter={hasSavedCardMeta}
            containerClassName={`${CANVAS_FRAME_CLASS} shrink-0`}
          >
            <LookCanvasViewport
              layout="standalone"
              mobileDisplayMaxWidth={WARDROBE_MOBILE_DISPLAY_MAX_WIDTH}
              className={CANVAS_WIDTH_CLASS}
            >
              <div
                className={CANVAS_BOUNDARY_CLASS}
                style={{
                  width: LOOK_CANVAS_REFERENCE_WIDTH,
                  height: LOOK_CANVAS_REFERENCE_HEIGHT,
                }}
              >
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-white" />

            <WardrobeMoodImageFrame moodImageUrl={cardMeta.moodImageUrl} />

            <LookCanvas
              key={outfitCanvasKey}
              className={`${CANVAS_COORDINATE_SANDBOX_CLASS} ${
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
              disableCanvasHitTesting
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
            </LookCanvasViewport>
          </WardrobeOutfitMoodboardCard>
        </div>
      </div>

      <p
        className={`mt-5 px-1 text-center text-meta text-[9px] tracking-[0.18em] uppercase ${CANVAS_WIDTH_CLASS}`}
      >
        {equippedCount > 0
          ? `${equippedCount} / 9 slots equipped`
          : "Tap an empty slot to assign archive assets"}
      </p>

      <button
        type="button"
        onClick={handleOpenSaveModal}
        disabled={equippedCount === 0}
        className="btn-primary fixed right-6 bottom-6 z-[60] border border-jet-black px-5 py-3 font-mono text-[10px] tracking-[0.3em] shadow-lg disabled:border-neutral-200 disabled:bg-neutral-200 disabled:text-neutral-400"
      >
        Save Outfit
      </button>

      <WardrobeSelectionDrawer
        isOpen={isDrawerOpen}
        categoryFilter={activeCategoryFilter}
        items={drawerItems}
        equippedItem={equippedItemInActiveSlot}
        onClose={closeDrawer}
        onSelectItem={handleSelectItem}
        onRemoveItem={handleRemoveItem}
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
        initialCanvasBg={editingOutfitId ? editingCanvasBg : CANVAS_BG_DEFAULT}
        savedOutfitCount={savedOutfits.length}
        editingOutfitId={editingOutfitId}
        editingSavedAt={editingSavedAt}
        onArchiveLimitReached={() => {
          setIsSaveModalOpen(false);
          setIsArchiveLimitModalOpen(true);
        }}
        onClose={() => setIsSaveModalOpen(false)}
        onSaveSuccess={handleSaveSuccess}
      />

      <SavedOutfitArchiveLimitModal
        isOpen={isArchiveLimitModalOpen}
        onClose={() => setIsArchiveLimitModalOpen(false)}
      />
    </section>
  );
}
