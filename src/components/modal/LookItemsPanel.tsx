"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { Look, ResolvedLookItem } from "@/types/look";
import type { CanvasItemLayout } from "@/lib/canvasLayout";
import { CoordinateEditorExport } from "@/components/modal/CoordinateEditorExport";
import { LookItemCard } from "@/components/modal/LookItemCard";
import { ProductMetadataTable } from "@/components/modal/ProductMetadataTable";
import { PurchaseActionBar } from "@/components/modal/PurchaseActionBar";
import { ReviewHighlights } from "@/components/modal/ReviewHighlights";
import { ShopierCheckoutOverlay } from "@/components/modal/ShopierCheckoutOverlay";
import { StyleAnalysis } from "@/components/modal/StyleAnalysis";

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
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    if (!activeItemId || isEditMode || showPreview) return;

    const element = itemRefs.current.get(activeItemId);
    element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeItemId, isEditMode, showPreview]);

  return (
    <motion.aside
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ ...spring, delay: 0.12 }}
      className="relative flex h-full min-h-0 flex-1 w-full flex-col overflow-hidden border-t border-neutral-200 lg:w-[48%] lg:border-t-0 lg:border-l"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-14 pb-8 md:px-8 md:pt-16 md:pb-10">
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
                className="mb-6 text-[10px] tracking-[0.3em] text-neutral-400 uppercase transition-colors hover:text-neutral-900"
              >
                ← Back to Look
              </button>

              <p className="mb-2 text-[9px] tracking-[0.45em] text-neutral-400 uppercase">
                Digital Product
              </p>
              <h2 className="font-serif text-2xl leading-tight tracking-[-0.01em] text-neutral-950 md:text-3xl">
                {look.title}
              </h2>
              <p className="mt-2 text-[10px] tracking-[0.35em] text-neutral-500 uppercase">
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
              <p className="mb-2 text-[9px] tracking-[0.45em] text-neutral-400 uppercase">
                Styled by
              </p>
              <h2
                id="look-modal-title"
                className="font-serif text-2xl leading-tight tracking-[-0.01em] text-neutral-950 md:text-3xl"
              >
                {look.title}
              </h2>
              <p className="mt-2 text-[10px] tracking-[0.35em] text-neutral-500 uppercase">
                {look.modelName}
              </p>

              <StyleAnalysis
                vibe={look.vibe}
                investmentRetail={look.investmentRetail}
                investmentWithGuide={look.investmentWithGuide}
                versatility={look.versatility}
              />

              <div className="mt-8 space-y-3 border-t border-neutral-200 pt-8">
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
                  items={items}
                  canvasLayouts={canvasLayouts}
                  isCollage={look.layout === "collage"}
                  modelName={look.modelName}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!showPreview && (
        <div className="relative shrink-0 border-t border-neutral-200 bg-white px-6 py-5 md:px-8">
          <button
            type="button"
            onClick={onUnlock}
            className="block w-full border border-neutral-900 bg-neutral-900 px-6 py-4 text-center text-[10px] tracking-[0.3em] text-white uppercase transition-colors hover:bg-white hover:text-neutral-900"
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
