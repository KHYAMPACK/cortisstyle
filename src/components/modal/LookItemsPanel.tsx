"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import type { Look, ResolvedLookItem } from "@/types/look";
import type { CanvasItemLayout } from "@/lib/canvasLayout";
import { computeOutfitRarityFromItems } from "@/lib/rarity";
import { CoordinateEditorExport } from "@/components/modal/CoordinateEditorExport";
import { DownloadStyleGuideButton } from "@/components/modal/DownloadStyleGuideButton";
import { LookItemCard } from "@/components/modal/LookItemCard";
import { ProductMetadataTable } from "@/components/modal/ProductMetadataTable";
import { PurchaseActionBar } from "@/components/modal/PurchaseActionBar";
import { ReviewHighlights } from "@/components/modal/ReviewHighlights";
import { ShopierCheckoutOverlay } from "@/components/modal/ShopierCheckoutOverlay";
import { StyleAnalysis } from "@/components/modal/StyleAnalysis";
import { RarityBadge } from "@/components/RarityBadge";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface LookItemsPanelProps {
  look: Look;
  items: ResolvedLookItem[];
  activeItemId: string | null;
  isEditMode: boolean;
  showPreview: boolean;
  showCheckout: boolean;
  onSelectItem: (itemId: string) => void;
  onUnlock: () => void;
  onPurchase: () => void;
  onBackToLook: () => void;
  onCloseCheckout: () => void;
  canvasLayouts?: Record<string, CanvasItemLayout>;
}

export function LookItemsPanel({
  look,
  items,
  activeItemId,
  isEditMode,
  showPreview,
  showCheckout,
  onSelectItem,
  onUnlock,
  onPurchase,
  onBackToLook,
  onCloseCheckout,
  canvasLayouts,
}: LookItemsPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const outfitRarity = useMemo(
    () => computeOutfitRarityFromItems(items),
    [items],
  );

  useEffect(() => {
    if (!activeItemId || isEditMode || showPreview) return;

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
  }, [activeItemId, isEditMode, showPreview]);

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
        <AnimatePresence mode="wait">
          {showPreview ? (
            <motion.div
              key="purchase"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={spring}
            >
              <button
                type="button"
                onClick={onBackToLook}
                className="text-meta mb-6 text-[10px] tracking-[0.3em] uppercase transition-colors hover:text-jet-black"
              >
                ← Back to Look
              </button>

              <p className="text-meta mb-2 text-[9px] tracking-[0.45em] uppercase">
                Digital Product
              </p>
              <h2 className="font-serif text-2xl leading-tight tracking-[-0.01em] text-neutral-950 md:text-3xl">
                {look.title}
              </h2>
              <p className="text-meta mt-2 text-[10px] tracking-[0.35em] uppercase">
                Style Guide &amp; Source Directory
              </p>

              <div className="mt-8">
                <ProductMetadataTable />
              </div>

              <p className="mt-6 text-xs leading-relaxed text-neutral-500">
                Preview the watermarked document on the left. Complete your
                purchase to receive the full printable PDF with certificate and
                unlocked shop links delivered instantly.
              </p>

              <DownloadStyleGuideButton lookId={look.id} className="mt-6" />

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.1 }}
                className="mt-8"
              >
                <PurchaseActionBar
                  lookId={look.id}
                  guidePrice={look.guidePrice}
                  onPurchase={onPurchase}
                />
              </motion.div>

              <ReviewHighlights />
            </motion.div>
          ) : (
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
          )}
        </AnimatePresence>
        </div>
      </div>

      {!showPreview && (
        <div className="shrink-0 border-t border-blueprint-border bg-blueprint-surface px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8 md:py-5">
          <button
            type="button"
            onClick={onUnlock}
            className="btn-primary block w-full border border-jet-black px-6 py-4 text-center font-mono text-[10px] tracking-[0.3em]"
          >
            Unlock Full Style Guide &amp; Shop Links
          </button>
        </div>
      )}

      <ShopierCheckoutOverlay
        isOpen={showCheckout}
        shopierUrl={look.shopierUrl}
        lookTitle={look.title}
        onClose={onCloseCheckout}
      />
    </motion.aside>
  );
}
