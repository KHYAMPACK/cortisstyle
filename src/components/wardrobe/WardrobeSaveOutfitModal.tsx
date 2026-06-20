"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { WardrobeOutfitLivePreviewCard } from "@/components/wardrobe/WardrobeOutfitLivePreviewCard";
import { compressMoodImageFile } from "@/lib/compressMoodImage";
import { exportLookCardAsPng } from "@/lib/exportLookCardPng";
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
  onClose,
  onSaveSuccess,
}: WardrobeSaveOutfitModalProps) {
  const [phase, setPhase] = useState<ModalPhase>("edit");
  const [outfitName, setOutfitName] = useState(initialName);
  const [moodword, setMoodword] = useState(initialMoodword);
  const [moodImageUrl, setMoodImageUrl] = useState<string | null>(
    initialMoodImageUrl,
  );
  const [savedBlueprint, setSavedBlueprint] =
    useState<SavedWardrobeOutfitBlueprint | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingMoodImage, setIsProcessingMoodImage] = useState(false);
  const [moodImageError, setMoodImageError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    setSavedBlueprint(null);
    setIsSaving(false);
    setIsSharing(false);
    setSaveError(null);
    setShareError(null);
    setSaveWarning(null);
    setMoodImageError(null);
    setIsProcessingMoodImage(false);
  }, [isOpen, initialName, initialMoodword, initialMoodImageUrl]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
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

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await applyImageFile(file);
    event.target.value = "";
  };

  const handleDrop = async (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await applyImageFile(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saveInFlightRef.current || isSaving || phase === "success") {
      return;
    }

    if (!userId) {
      setSaveError("Sign in to save outfits to your archive.");
      return;
    }

    const payload: WardrobeSaveOutfitPayload = {
      name: (outfitName ?? "").trim().toUpperCase(),
      moodword: (moodword ?? "").trim().toUpperCase(),
      moodImageUrl,
    };

    saveInFlightRef.current = true;
    setIsSaving(true);
    setSaveError(null);
    setSaveWarning(null);

    try {
      const result = await persistSavedWardrobeOutfitToDb(userId, {
        name: payload.name,
        moodword: payload.moodword,
        moodImageUrl: payload.moodImageUrl,
        slots,
        ...(layoutOverrides ? { layoutOverrides } : {}),
      });

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
        <div className="fixed inset-0 z-[90]">
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
            <div className="flex min-h-full justify-center px-4 py-6 md:items-center">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="save-outfit-title"
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={spring}
                onClick={(event) => event.stopPropagation()}
                className="w-full max-w-[920px] border border-neutral-200 bg-white p-5 shadow-2xl md:p-8"
              >
              {phase === "edit" ? (
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start">
                  <div>
                    <p className="mb-3 text-[9px] tracking-[0.4em] text-neutral-400 uppercase">
                      Moodboard Archive
                    </p>
                    <h2
                      id="save-outfit-title"
                      className="font-serif text-2xl leading-tight text-neutral-950"
                    >
                      Save Outfit
                    </h2>
                    <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-[0.12em] text-neutral-500 uppercase">
                      Name your look and attach an editorial mood reference.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                      <label className="block">
                        <span className="mb-2 block font-mono text-[9px] tracking-[0.35em] text-neutral-400 uppercase">
                          Outfit Name
                        </span>
                        <input
                          type="text"
                          required
                          value={outfitName}
                          onChange={(event) => setOutfitName(event.target.value)}
                          placeholder="LOOK 01 — CYBER GRUNGE"
                          className="w-full border border-neutral-200 bg-white px-3 py-3 font-mono text-[11px] tracking-[0.14em] text-neutral-900 uppercase outline-none transition-colors focus:border-neutral-900"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block font-mono text-[9px] tracking-[0.35em] text-neutral-400 uppercase">
                          Moodword
                        </span>
                        <input
                          type="text"
                          value={moodword}
                          onChange={(event) => setMoodword(event.target.value)}
                          placeholder="e.g., CYBER, GRUNGE, AESTHETIC"
                          className="w-full border border-neutral-200 bg-white px-3 py-3 font-mono text-[11px] tracking-[0.14em] text-neutral-900 uppercase outline-none transition-colors focus:border-neutral-900"
                        />
                      </label>

                      <div>
                        <span className="mb-2 block font-mono text-[9px] tracking-[0.35em] text-neutral-400 uppercase">
                          Mood Image Overlay
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDrop}
                          className={`relative flex w-full flex-col items-center justify-center gap-3 border border-dashed px-4 py-8 transition-colors ${
                            isDragging
                              ? "border-neutral-900 bg-neutral-50"
                              : "border-neutral-200 bg-white hover:border-neutral-400"
                          }`}
                        >
                          {moodImageUrl ? (
                            <div className="relative aspect-[3/4] w-[100px] overflow-hidden border border-neutral-100">
                              <Image
                                src={moodImageUrl}
                                alt="Mood preview"
                                fill
                                unoptimized
                                sizes="100px"
                                className="object-cover"
                              />
                            </div>
                          ) : null}
                          <span className="font-mono text-[9px] tracking-[0.2em] text-neutral-400 uppercase">
                            {isProcessingMoodImage
                              ? "Processing..."
                              : moodImageUrl
                                ? "Replace Mood Image"
                                : "Drag & Drop or Click to Upload"}
                          </span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                          disabled={isProcessingMoodImage}
                        />
                        {moodImageError ? (
                          <p className="mt-2 font-mono text-[10px] tracking-[0.12em] text-red-600 uppercase">
                            {moodImageError}
                          </p>
                        ) : null}
                        {moodImageUrl ? (
                          <button
                            type="button"
                            onClick={() => setMoodImageUrl(null)}
                            className="mt-2 font-mono text-[9px] tracking-[0.2em] text-neutral-400 uppercase transition-colors hover:text-neutral-900"
                          >
                            Remove Mood Image
                          </button>
                        ) : null}
                      </div>

                      {saveError ? (
                        <p className="font-mono text-[10px] tracking-[0.12em] text-red-600 uppercase">
                          {saveError}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full border border-neutral-900 bg-neutral-900 px-5 py-3 font-mono text-[10px] tracking-[0.3em] text-white uppercase transition-colors hover:bg-white hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "Saving..." : "Save Outfit Card"}
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-4 w-full font-mono text-[10px] tracking-[0.3em] text-neutral-400 uppercase transition-colors hover:text-neutral-900"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="border border-neutral-100 bg-neutral-50/60 p-4 md:p-5">
                    <p className="mb-4 font-mono text-[9px] tracking-[0.35em] text-neutral-400 uppercase">
                      Live Preview
                    </p>
                    <div className="mx-auto max-w-[280px]">
                      <WardrobeOutfitLivePreviewCard
                        ref={previewRef}
                        outfitName={outfitName}
                        moodword={moodword}
                        moodImageUrl={moodImageUrl}
                        lookItems={lookItems}
                        resolveLayouts={resolveLayouts}
                        canvasKey={canvasKey}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center">
                  <div>
                    <p className="mb-3 text-[9px] tracking-[0.4em] text-neutral-400 uppercase">
                      Archive Confirmed
                    </p>
                    <h2
                      id="save-outfit-title"
                      className="font-serif text-2xl leading-tight text-neutral-950"
                    >
                      Look Card Ready
                    </h2>
                    <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-[0.12em] text-neutral-500 uppercase">
                      Your outfit is saved to your archive. Download the look
                      card or return to the builder.
                    </p>

                    <div className="mt-8 space-y-4">
                      <button
                        type="button"
                        onClick={handleShareLookCard}
                        disabled={isSharing}
                        className="w-full border border-neutral-900 bg-neutral-900 px-5 py-3 font-mono text-[10px] tracking-[0.3em] text-white uppercase transition-colors hover:bg-white hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
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

                  <div className="border border-neutral-100 bg-neutral-50/60 p-4 md:p-5">
                    <p className="mb-4 font-mono text-[9px] tracking-[0.35em] text-neutral-400 uppercase">
                      Saved Poster
                    </p>
                    <div className="mx-auto max-w-[280px]">
                      <WardrobeOutfitLivePreviewCard
                        ref={previewRef}
                        outfitName={previewOutfitName}
                        moodword={previewMoodword}
                        moodImageUrl={previewMoodImageUrl}
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
