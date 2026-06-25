"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { WardrobeOutfitLivePreviewCard } from "@/components/wardrobe/WardrobeOutfitLivePreviewCard";
import { CanvasBackgroundPalette } from "@/components/wardrobe/CanvasBackgroundPalette";
import { MoodImageInputMatrix } from "@/components/wardrobe/MoodImageInputMatrix";
import { compressMoodImageFile } from "@/lib/compressMoodImage";
import {
  CANVAS_BG_DEFAULT,
  type CanvasBgValue,
} from "@/lib/wardrobeCanvasBackground";
import { exportLookCardAsPng } from "@/lib/exportLookCardPng";
import { FREE_TIER_SAVED_OUTFIT_LIMIT } from "@/lib/launchGates";
import { persistSavedWardrobeOutfitToDb, formatSupabaseError } from "@/lib/savedWardrobeOutfitDb";
import type { CanvasItemLayout } from "@/types/canvas-layout";
import type { ResolvedLookItem } from "@/types/look";
import type {
  LayoutPositionOverride,
  SavedWardrobeOutfitBlueprint,
  WardrobeOutfitMatrix,
} from "@/types/wardrobe-builder";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

export interface WardrobeSaveOutfitPayload {
  name: string;
  moodword: string;
  moodImageUrl: string | null;
  canvasBg: CanvasBgValue;
}

type ModalPhase = "edit" | "success";

interface WardrobeSaveOutfitModalProps {
  isOpen: boolean;
  userId: string | null;
  slots: WardrobeOutfitMatrix;
  lookItems: ResolvedLookItem[];
  canvasKey: string;
  resolveLayouts: (
    items: ResolvedLookItem[],
    containerWidth: number,
  ) => Record<string, CanvasItemLayout>;
  layoutOverrides?: Record<string, LayoutPositionOverride>;
  initialName?: string;
  initialMoodword?: string;
  initialMoodImageUrl?: string | null;
  initialCanvasBg?: CanvasBgValue;
  savedOutfitCount?: number;
  editingOutfitId?: string | null;
  editingSavedAt?: string | null;
  onArchiveLimitReached?: () => void;
  onClose: () => void;
  onSaveSuccess: (
    blueprint: SavedWardrobeOutfitBlueprint,
    payload: WardrobeSaveOutfitPayload,
  ) => void;
}

function handleBackdropDismiss(
  event: React.MouseEvent<HTMLDivElement>,
  onClose: () => void,
) {
  if (event.target === event.currentTarget) {
    onClose();
  }
}

export function WardrobeSaveOutfitModal({
  isOpen,
  userId,
  slots,
  lookItems,
  canvasKey,
  resolveLayouts,
  layoutOverrides,
  initialName = "",
  initialMoodword = "",
  initialMoodImageUrl = null,
  initialCanvasBg = CANVAS_BG_DEFAULT,
  savedOutfitCount = 0,
  editingOutfitId = null,
  editingSavedAt = null,
  onArchiveLimitReached,
  onClose,
  onSaveSuccess,
}: WardrobeSaveOutfitModalProps) {
  const [phase, setPhase] = useState<ModalPhase>("edit");
  const [outfitName, setOutfitName] = useState(initialName);
  const [moodword, setMoodword] = useState(initialMoodword);
  const [moodImageUrl, setMoodImageUrl] = useState<string | null>(
    initialMoodImageUrl,
  );
  const [canvasBg, setCanvasBg] = useState<CanvasBgValue>(CANVAS_BG_DEFAULT);
  const [savedBlueprint, setSavedBlueprint] =
    useState<SavedWardrobeOutfitBlueprint | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isProcessingMoodImage, setIsProcessingMoodImage] = useState(false);
  const [moodImageError, setMoodImageError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const saveInFlightRef = useRef(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      saveInFlightRef.current = false;
      return;
    }

    if (wasOpenRef.current) return;

    wasOpenRef.current = true;
    setPhase("edit");
    setOutfitName(initialName);
    setMoodword(initialMoodword);
    setMoodImageUrl(initialMoodImageUrl);
    setCanvasBg(initialCanvasBg);
    setSavedBlueprint(null);
    setIsSaving(false);
    setIsSharing(false);
    setSaveError(null);
    setShareError(null);
    setSaveWarning(null);
    setMoodImageError(null);
    setIsProcessingMoodImage(false);
  }, [isOpen, initialName, initialMoodword, initialMoodImageUrl, initialCanvasBg]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousOverflowX = document.body.style.overflowX;
    const previousHtmlOverflowX = document.documentElement.style.overflowX;
    document.body.style.overflow = "hidden";
    document.body.style.overflowX = "hidden";
    document.documentElement.style.overflowX = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overflowX = previousOverflowX;
      document.documentElement.style.overflowX = previousHtmlOverflowX;
    };
  }, [isOpen]);

  const applyImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    setIsProcessingMoodImage(true);
    setMoodImageError(null);

    try {
      const dataUrl = await compressMoodImageFile(file);
      setMoodImageUrl(dataUrl);
    } catch (error) {
      setMoodImageError(
        error instanceof Error
          ? error.message
          : "Unable to process mood image.",
      );
    } finally {
      setIsProcessingMoodImage(false);
    }
  }, []);

  const handleSelectLibraryAsset = useCallback((url: string) => {
    setMoodImageError(null);
    setMoodImageUrl(url);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saveInFlightRef.current || isSaving || phase === "success") {
      return;
    }

    if (!userId) {
      setSaveError("Sign in to save outfits to your archive.");
      return;
    }

    const isNewArchiveSlot = !editingOutfitId;
    if (
      isNewArchiveSlot &&
      savedOutfitCount >= FREE_TIER_SAVED_OUTFIT_LIMIT
    ) {
      onArchiveLimitReached?.();
      return;
    }

    const payload: WardrobeSaveOutfitPayload = {
      name: (outfitName ?? "").trim().toUpperCase(),
      moodword: (moodword ?? "").trim().toUpperCase(),
      moodImageUrl,
      canvasBg,
    };

    saveInFlightRef.current = true;
    setIsSaving(true);
    setSaveError(null);
    setSaveWarning(null);

    try {
      const result = await persistSavedWardrobeOutfitToDb(
        userId,
        {
          name: payload.name,
          moodword: payload.moodword,
          moodImageUrl: payload.moodImageUrl,
          canvasBg: payload.canvasBg,
          slots,
          ...(layoutOverrides ? { layoutOverrides } : {}),
        },
        editingOutfitId
          ? {
              existingOutfitId: editingOutfitId,
              existingSavedAt: editingSavedAt ?? undefined,
            }
          : undefined,
      );

      setSavedBlueprint(result.blueprint);
      setPhase("success");
      setSaveWarning(result.warning ?? null);
      onSaveSuccess(result.blueprint, payload);
    } catch (error) {
      setSaveError(formatSupabaseError(error));
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  };

  const handleShareLookCard = async () => {
    if (!previewRef.current) return;

    setIsSharing(true);
    setShareError(null);

    try {
      await exportLookCardAsPng(
        previewRef.current,
        savedBlueprint?.name ?? outfitName,
        {
          backgroundColor: "#ffffff",
          preferNativeShare: true,
        },
      );
    } catch (error) {
      setShareError(
        error instanceof Error
          ? error.message
          : "Unable to export look card image.",
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleDone = () => {
    onClose();
  };

  if (!isMounted) return null;

  const previewOutfitName =
    phase === "success"
      ? (savedBlueprint?.name ?? outfitName ?? "")
      : (outfitName ?? "");
  const previewMoodword =
    phase === "success"
      ? (savedBlueprint?.moodword ?? moodword ?? "")
      : (moodword ?? "");
  const previewMoodImageUrl =
    phase === "success" ? (savedBlueprint?.moodImageUrl ?? moodImageUrl) : moodImageUrl;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] overflow-x-hidden">
          <motion.button
            type="button"
            aria-label="Close save outfit modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <div
            className="absolute inset-0 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain"
            onClick={(event) => handleBackdropDismiss(event, onClose)}
          >
            <div className="flex min-h-full w-full max-w-[100vw] justify-center px-3 py-4 sm:px-4 sm:py-6 md:items-center">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="save-outfit-title"
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={spring}
                onClick={(event) => event.stopPropagation()}
                className="box-border w-full max-w-[min(920px,calc(100vw-1.5rem))] min-w-0 overflow-x-hidden border border-blueprint-border surface-canvas-paper p-4 shadow-2xl sm:p-5 md:p-8"
              >
              {phase === "edit" ? (
                <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-8">
                  <div className="min-w-0">
                    <p className="text-meta mb-3 text-[9px] tracking-[0.4em] uppercase">
                      Moodboard Archive
                    </p>
                    <h2
                      id="save-outfit-title"
                      className="font-serif text-2xl leading-tight text-neutral-950"
                    >
                      Save Outfit
                    </h2>
                    <p className="text-meta mt-3 font-mono text-[10px] leading-relaxed tracking-[0.08em] uppercase sm:tracking-[0.12em]">
                      Name your look and attach an editorial mood reference.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 min-w-0 space-y-5 sm:mt-8 sm:space-y-6">
                      <label className="block">
                        <span className="text-meta mb-2 block font-mono text-[9px] tracking-[0.35em] uppercase">
                          Outfit Name
                        </span>
                        <input
                          type="text"
                          required
                          value={outfitName}
                          onChange={(event) => setOutfitName(event.target.value)}
                          placeholder="LOOK 01 — CYBER GRUNGE"
                          className="box-border w-full min-w-0 border border-blueprint-border bg-canvas-paper px-3 py-3 font-mono text-[11px] tracking-[0.08em] text-neutral-900 uppercase outline-none transition-colors focus:border-blueprint-accent sm:tracking-[0.14em]"
                        />
                      </label>

                      <CanvasBackgroundPalette
                        value={canvasBg}
                        onChange={setCanvasBg}
                      />

                      <label className="block">
                        <span className="text-meta mb-2 block font-mono text-[9px] tracking-[0.35em] uppercase">
                          Moodword{" "}
                          <span className="text-neutral-400">(Optional)</span>
                        </span>
                        <input
                          type="text"
                          value={moodword}
                          onChange={(event) => setMoodword(event.target.value)}
                          placeholder="e.g., CYBER, GRUNGE, AESTHETIC"
                          className="box-border w-full min-w-0 border border-blueprint-border bg-canvas-paper px-3 py-3 font-mono text-[11px] tracking-[0.08em] text-neutral-900 uppercase outline-none transition-colors focus:border-blueprint-accent sm:tracking-[0.14em]"
                        />
                      </label>

                      <MoodImageInputMatrix
                        moodImageUrl={moodImageUrl}
                        isProcessing={isProcessingMoodImage}
                        error={moodImageError}
                        onSelectLibraryAsset={handleSelectLibraryAsset}
                        onUploadFile={applyImageFile}
                        onClear={() => setMoodImageUrl(null)}
                      />

                      {saveError ? (
                        <p className="font-mono text-[10px] tracking-[0.12em] text-red-600 uppercase">
                          {saveError}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="btn-primary w-full border border-jet-black px-5 py-3 font-mono text-[10px] tracking-[0.3em] disabled:opacity-60"
                      >
                        {isSaving ? "Saving..." : "Save Outfit Card"}
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={onClose}
                      className="text-meta mt-4 w-full font-mono text-[10px] tracking-[0.3em] uppercase transition-colors hover:text-jet-black"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="surface-blueprint min-w-0 overflow-hidden border border-blueprint-border p-3 sm:p-4 md:p-5">
                    <p className="text-meta mb-4 font-mono text-[9px] tracking-[0.35em] uppercase">
                      Live Preview
                    </p>
                    <div className="flex w-full min-w-0 justify-center overflow-hidden">
                      <WardrobeOutfitLivePreviewCard
                        ref={previewRef}
                        outfitName={outfitName}
                        moodword={moodword}
                        moodImageUrl={moodImageUrl}
                        canvasBg={canvasBg}
                        showMoodPlaceholders
                        lookItems={lookItems}
                        resolveLayouts={resolveLayouts}
                        canvasKey={canvasKey}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-8">
                  <div className="min-w-0">
                    <p className="text-meta mb-3 text-[9px] tracking-[0.4em] uppercase">
                      Archive Confirmed
                    </p>
                    <h2
                      id="save-outfit-title"
                      className="font-serif text-2xl leading-tight text-neutral-950"
                    >
                      Look Card Ready
                    </h2>
                    <p className="text-meta mt-3 font-mono text-[10px] leading-relaxed tracking-[0.12em] uppercase">
                      Your outfit is saved to your archive. Download the look
                      card or return to the builder.
                    </p>

                    <div className="mt-8 space-y-4">
                      <button
                        type="button"
                        onClick={handleShareLookCard}
                        disabled={isSharing}
                        className="btn-primary w-full border border-jet-black px-5 py-3 font-mono text-[10px] tracking-[0.3em] disabled:opacity-60"
                      >
                        {isSharing
                          ? "Generating..."
                          : "Share / Download Look Card"}
                      </button>

                      <button
                        type="button"
                        onClick={handleDone}
                        className="w-full font-mono text-[10px] tracking-[0.3em] text-neutral-400 uppercase transition-colors hover:text-neutral-900"
                      >
                        Close / Done
                      </button>
                    </div>

                    {saveWarning ? (
                      <p className="mt-4 font-mono text-[10px] leading-relaxed tracking-[0.12em] text-amber-700 uppercase">
                        {saveWarning}
                      </p>
                    ) : null}

                    {shareError ? (
                      <p className="mt-4 font-mono text-[10px] tracking-[0.12em] text-red-600 uppercase">
                        {shareError}
                      </p>
                    ) : null}
                  </div>

                  <div className="surface-blueprint min-w-0 overflow-hidden border border-blueprint-border p-3 sm:p-4 md:p-5">
                    <p className="text-meta mb-4 font-mono text-[9px] tracking-[0.35em] uppercase">
                      Saved Poster
                    </p>
                    <div className="flex w-full min-w-0 justify-center overflow-hidden">
                      <WardrobeOutfitLivePreviewCard
                        ref={previewRef}
                        outfitName={previewOutfitName}
                        moodword={previewMoodword}
                        moodImageUrl={previewMoodImageUrl}
                        canvasBg={
                          savedBlueprint?.canvasBg ?? canvasBg
                        }
                        lookItems={lookItems}
                        resolveLayouts={resolveLayouts}
                        canvasKey={canvasKey}
                      />
                    </div>
                  </div>
                </div>
              )}
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
