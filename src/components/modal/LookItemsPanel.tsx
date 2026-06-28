"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type { Look, ResolvedLookItem } from "@/types/look";
import type { CanvasItemLayout } from "@/lib/canvasLayout";
import { computeOutfitRarityFromItems } from "@/lib/rarity";
import { CoordinateEditorExport } from "@/components/modal/CoordinateEditorExport";
import { LookItemCard } from "@/components/modal/LookItemCard";
import { StyleAnalysis } from "@/components/modal/StyleAnalysis";
import { RarityBadge } from "@/components/RarityBadge";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface LookItemsPanelProps {
  look: Look;
  items: ResolvedLookItem[];
  activeItemId: string | null;
  isEditMode: boolean;
  onSelectItem: (itemId: string) => void;
  onAddToWardrobe: () => void;
  isAddingToWardrobe?: boolean;
  isInWardrobe?: boolean;
  wardrobeAddError?: string | null;
  isMetadataRevealed?: boolean;
  canvasLayouts?: Record<string, CanvasItemLayout>;
}

export function LookItemsPanel({
  look,
  items,
  activeItemId,
  isEditMode,
  onSelectItem,
  onAddToWardrobe,
  isAddingToWardrobe = false,
  isInWardrobe = false,
  wardrobeAddError = null,
  isMetadataRevealed = false,
  canvasLayouts,
}: LookItemsPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const outfitRarity = useMemo(
    () => computeOutfitRarityFromItems(items),
    [items],
  );

  useEffect(() => {
    if (!activeItemId || isEditMode) return;

    const element = itemRefs.current.get(activeItemId);
    const container = scrollContainerRef.current;
    if (!element || !container) return;

    const containerTop = container.getBoundingClientRect().top;
    const elementTop = element.getBoundingClientRect().top;
    const nextScrollTop = container.scrollTop + (elementTop - containerTop) - 12;

    container.scrollTo({
      top: Math.max(0, nextScrollTop),
      behavior: "smooth",
    });
  }, [activeItemId, isEditMode]);

  return (
    <motion.aside
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ ...spring, delay: 0.12 }}
      className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden border-t border-blueprint-border surface-blueprint md:h-full md:w-[48%] md:border-t-0 md:border-l"
    >
      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-4 py-4 md:px-8 md:py-6 md:pt-16 md:pb-6">
          <motion.div
            key="look"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={spring}
          >
            <h2 id="look-modal-title" className="sr-only">
              {look.title} — styled by {look.modelName}
            </h2>

            <RarityBadge rarity={outfitRarity} className="mb-4 md:mb-6" />

            <div className="hidden md:block" aria-hidden="true">
              <p className="text-meta mb-2 text-[9px] tracking-[0.45em] uppercase">
                Styled by
              </p>
              <p className="font-serif text-2xl leading-tight tracking-[-0.01em] text-neutral-950 md:text-3xl">
                {look.title}
              </p>
              <p className="text-meta mt-2 text-[10px] tracking-[0.35em] uppercase">
                {look.modelName}
              </p>

              <StyleAnalysis
                vibe={look.vibe}
                investmentRetail={look.investmentRetail}
                investmentWithGuide={look.investmentWithGuide}
                versatility={look.versatility}
              />
            </div>

            <div className="mt-4 space-y-3 border-t border-blueprint-border pt-4 md:mt-8 md:pt-8">
              {items.map((item) => (
                <LookItemCard
                  key={item.id}
                  ref={(node) => {
                    if (node) {
                      itemRefs.current.set(item.id, node);
                    } else {
                      itemRefs.current.delete(item.id);
                    }
                  }}
                  item={item}
                  isActive={activeItemId === item.id}
                  isMetadataRevealed={isMetadataRevealed}
                  onSelect={onSelectItem}
                />
              ))}
            </div>

            {isEditMode && (
              <CoordinateEditorExport
                lookId={look.id}
                items={items}
                canvasLayouts={canvasLayouts}
                isCollage={look.layout === "collage"}
              />
            )}
          </motion.div>
        </div>
      </div>

      {isMetadataRevealed && (
        <div className="shrink-0 border-t border-blueprint-border bg-blueprint-surface px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8 md:py-5">
          <button
            type="button"
            onClick={onAddToWardrobe}
            disabled={isAddingToWardrobe || isInWardrobe}
            aria-disabled={isAddingToWardrobe || isInWardrobe}
            className={`flex w-full items-center justify-center gap-2 border px-6 py-4 text-center font-mono text-[10px] tracking-[0.3em] transition-colors ${
              isInWardrobe
                ? "cursor-default border-neutral-300 bg-neutral-100 text-neutral-500"
                : "btn-primary border-jet-black disabled:opacity-60"
            }`}
          >
            {isInWardrobe ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Already Added
              </>
            ) : isAddingToWardrobe ? (
              "Adding to Wardrobe..."
            ) : (
              "Add to Wardrobe"
            )}
          </button>
          {wardrobeAddError ? (
            <p className="mt-3 text-center font-mono text-[9px] tracking-[0.12em] text-red-600 uppercase">
              {wardrobeAddError}
            </p>
          ) : null}
        </div>
      )}
    </motion.aside>
  );
}
