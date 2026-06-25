"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Look, ResolvedLookItem } from "@/types/look";
import type { CanvasItemLayout } from "@/lib/canvasLayout";
import { resolveEditableLookItems } from "@/lib/resolveLookItems";
import { isUnlockedArchiveLook } from "@/lib/launchGates";
import { WARDROBE_APP_PATH } from "@/lib/wardrobeGate";
import { addLookToUserWardrobe } from "@/lib/wardrobe";
import { useAuth } from "@/context/AuthContext";
import { AuthPopup } from "@/components/AuthPopup";
import { LookImagePanel } from "@/components/modal/LookImagePanel";
import { LookItemsPanel } from "@/components/modal/LookItemsPanel";
import { isLocalhostClient } from "@/lib/dev";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface LookModalProps {
  look: Look | null;
  onClose: () => void;
}

export function LookModal({ look, onClose }: LookModalProps) {
  const router = useRouter();
  const { user, isAuthenticated, refreshWardrobe, purchasedLooks } = useAuth();
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(isLocalhostClient);
  const [showPreview, setShowPreview] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isAddingToWardrobe, setIsAddingToWardrobe] = useState(false);
  const [wardrobeAddError, setWardrobeAddError] = useState<string | null>(null);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [pendingWardrobeAdd, setPendingWardrobeAdd] = useState(false);
  const [editableItems, setEditableItems] = useState<ResolvedLookItem[]>([]);
  const [canvasLayouts, setCanvasLayouts] = useState<
    Record<string, CanvasItemLayout>
  >({});

  useEffect(() => {
    setActiveItemId(null);
    setShowPreview(false);
    setShowCheckout(false);
    setWardrobeAddError(null);
    setIsAddingToWardrobe(false);
    setShowAuthPopup(false);
    setPendingWardrobeAdd(false);
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

  const persistLookToWardrobe = useCallback(async () => {
    if (!look || !user?.id) return;

    if (purchasedLooks.some((entry) => entry.id === look.id)) {
      return;
    }

    setIsAddingToWardrobe(true);
    setWardrobeAddError(null);

    try {
      await addLookToUserWardrobe(user.id, look.id);
      await refreshWardrobe();
      onClose();
      router.push(`${WARDROBE_APP_PATH}?tab=looks`);
    } catch (error) {
      setWardrobeAddError(
        error instanceof Error
          ? error.message
          : "Unable to add this look to your wardrobe.",
      );
    } finally {
      setIsAddingToWardrobe(false);
    }
  }, [look, onClose, purchasedLooks, refreshWardrobe, router, user?.id]);

  const handleAddToWardrobe = useCallback(async () => {
    if (!look) return;

    if (!isAuthenticated || !user?.id) {
      setPendingWardrobeAdd(true);
      setShowAuthPopup(true);
      return;
    }

    await persistLookToWardrobe();
  }, [isAuthenticated, look, persistLookToWardrobe, user?.id]);

  useEffect(() => {
    if (!pendingWardrobeAdd || !isAuthenticated || !user?.id || !look) return;

    setPendingWardrobeAdd(false);
    void persistLookToWardrobe();
  }, [isAuthenticated, look, pendingWardrobeAdd, persistLookToWardrobe, user?.id]);

  const isMetadataRevealed = look ? isUnlockedArchiveLook(look.id) : false;
  const isInWardrobe = look
    ? purchasedLooks.some((entry) => entry.id === look.id)
    : false;

  const handleBackToLook = () => {
    setShowPreview(false);
    setShowCheckout(false);
  };

  return (
    <>
      <AnimatePresence>
        {look ? (
          <>
            <motion.button
              key="look-modal-backdrop"
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
              key="look-modal-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="look-modal-title"
              initial={{ opacity: 0, scale: 0.92, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={spring}
              className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-8"
            >
              <div className="pointer-events-auto relative flex h-[100dvh] max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-ice-floor shadow-2xl md:h-[90vh] md:max-h-[90vh] md:flex-row">
                {isLocalhostClient() && !showPreview && (
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

                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 z-20 font-sans text-[10px] tracking-[0.35em] text-neutral-400 uppercase transition-colors hover:text-neutral-900"
                >
                  Close
                </button>

                <LookImagePanel
                  look={look}
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
                  onAddToWardrobe={handleAddToWardrobe}
                  isAddingToWardrobe={isAddingToWardrobe}
                  isInWardrobe={isInWardrobe}
                  wardrobeAddError={wardrobeAddError}
                  isMetadataRevealed={isMetadataRevealed}
                  onPurchase={() => setShowCheckout(true)}
                  onGateNavigate={onClose}
                  onBackToLook={handleBackToLook}
                  onCloseCheckout={() => setShowCheckout(false)}
                  canvasLayouts={canvasLayouts}
                />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => {
          setShowAuthPopup(false);
          setPendingWardrobeAdd(false);
        }}
        description="Create an account or sign in to save this look to your wardrobe."
        allowSignUp
      />
    </>
  );
}
