"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import type { Look, ResolvedLookItem } from "@/types/look";
import type { CanvasItemLayout } from "@/lib/canvasLayout";
import { resolveEditableLookItems } from "@/lib/resolveLookItems";
import { LookImagePanel } from "@/components/modal/LookImagePanel";
import { LookItemsPanel } from "@/components/modal/LookItemsPanel";
import { HeaderIconNav } from "@/components/HeaderIconNav";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

function isLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

interface LookModalProps {
  look: Look | null;
  onClose: () => void;
}

export function LookModal({ look, onClose }: LookModalProps) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(isLocalhost);
  const [showPreview, setShowPreview] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [editableItems, setEditableItems] = useState<ResolvedLookItem[]>([]);
  const [canvasLayouts, setCanvasLayouts] = useState<
    Record<string, CanvasItemLayout>
  >({});

  useEffect(() => {
    setActiveItemId(null);
    setShowPreview(false);
    setShowCheckout(false);
    if (look) {
      setEditableItems(resolveEditableLookItems(look));
    } else {
      setEditableItems([]);
    }
    setCanvasLayouts({});
  }, [look]);

  useEffect(() => {
    if (!look) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (showCheckout) {
        setShowCheckout(false);
        return;
      }

      if (showPreview) {
        setShowPreview(false);
        return;
      }

      onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [look, onClose, showPreview, showCheckout]);

  const handleSelectItem = (itemId: string) => {
    setActiveItemId(itemId);
  };

  const handleCanvasLayoutsChange = useCallback(
    (layouts: Record<string, CanvasItemLayout>) => {
      setCanvasLayouts(layouts);
    },
    [],
  );

  const handleUnlock = () => {
    setShowPreview(true);
    setShowCheckout(false);
    setActiveItemId(null);
  };

  const handleBackToLook = () => {
    setShowPreview(false);
    setShowCheckout(false);
  };

  return (
    <AnimatePresence>
      {look && (
        <>
          <motion.button
            type="button"
            aria-label="Close look detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            onClick={onClose}
            className="fixed inset-0 z-50 cursor-default bg-black/40 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="look-modal-title"
            initial={{ opacity: 0, scale: 0.92, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={spring}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          >
            <div className="pointer-events-auto relative flex h-[90vh] max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl lg:flex-row">
              {isLocalhost() && !showPreview && (
                <button
                  type="button"
                  onClick={() => setIsEditMode((current) => !current)}
                  className={`absolute top-4 left-4 z-20 border px-3 py-2 font-sans text-[9px] tracking-[0.3em] uppercase transition-colors ${
                    isEditMode
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-neutral-300 bg-white text-neutral-500 hover:border-neutral-900 hover:text-neutral-900"
                  }`}
                >
                  {isEditMode ? "Editor On" : "Editor Off"}
                </button>
              )}

      <HeaderIconNav variant="modal" className="absolute top-4 right-[5.25rem] z-20" />

              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 z-20 font-sans text-[10px] tracking-[0.35em] text-neutral-400 uppercase transition-colors hover:text-neutral-900"
              >
                Close
              </button>

              <LookImagePanel
                lookId={look.id}
                image={look.image}
                title={look.title}
                modelName={look.modelName}
                layout={look.layout}
                outfitId={look.outfitId}
                editorGuideImage={look.editorGuideImage}
                modelPortraitImage={look.modelPortraitImage}
                modelPortraitPosition={look.modelPortraitPosition}
                modelNamePosition={look.modelNamePosition}
                items={editableItems}
                activeItemId={activeItemId}
                isEditMode={isEditMode && !showPreview}
                showPreview={showPreview}
                onSelectItem={handleSelectItem}
                onCanvasLayoutsChange={handleCanvasLayoutsChange}
              />

              <LookItemsPanel
                look={look}
                items={editableItems}
                activeItemId={activeItemId}
                isEditMode={isEditMode && !showPreview}
                showPreview={showPreview}
                showCheckout={showCheckout}
                onSelectItem={handleSelectItem}
                onUnlock={handleUnlock}
                onPurchase={() => setShowCheckout(true)}
                onBackToLook={handleBackToLook}
                onCloseCheckout={() => setShowCheckout(false)}
                canvasLayouts={canvasLayouts}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
