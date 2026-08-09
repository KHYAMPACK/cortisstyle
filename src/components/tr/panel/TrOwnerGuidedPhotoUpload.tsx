"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  describePhotoSlotCost,
} from "@/lib/tr/aiCatalog/uploadCostHints";
import {
  pipelineJobKindForSlot,
  pipelineLabelForSlot,
  type PipelineJobItem,
} from "@/lib/tr/aiCatalog/pipelineProgress";
import {
  TrOwnerCreditsCostLine,
  TrOwnerCreditsMoreInfoLink,
} from "@/components/tr/panel/TrOwnerCreditsInfo";
import {
  getProductPhotoRole,
  productPhotoRoleLabel,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import { uploadOwnerProductImage, requestOwnerPackshot, requestOwnerPackshotPrepare } from "@/lib/tr/ownerClient";

const primaryBtn =
  "inline-flex min-h-12 flex-1 items-center justify-center rounded-xl px-5 py-3 text-[16px] font-semibold text-white disabled:opacity-50";

const secondaryBtn =
  "inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border-2 border-[color:var(--panel-accent-border)] bg-white px-5 py-3 text-[16px] font-semibold text-neutral-800 disabled:opacity-50";

type UploadStage = "idle" | "cutout" | "analyze" | "packshot";

interface PendingPreview {
  file: File;
  objectUrl: string;
  slotIndex: number;
}

interface ActiveSlotJob {
  slotIndex: number;
  previewUrl: string;
  roleLabel: string;
  stage: UploadStage;
  progressPct: number;
}

function uploadStageLabel(stage: UploadStage): string {
  if (stage === "analyze") return "Ürün tanınıyor…";
  if (stage === "packshot") return "Katalog görseli hazırlanıyor…";
  if (stage === "cutout") return "Fotoğraf işleniyor…";
  return "";
}

function uploadStageTarget(stage: UploadStage): number {
  if (stage === "analyze") return 42;
  if (stage === "packshot") return 88;
  if (stage === "cutout") return 22;
  return 0;
}

function setSlotInList(list: string[], slotIndex: number, value: string): string[] {
  const next = [...list];
  while (next.length <= slotIndex) next.push("");
  next[slotIndex] = value;
  return next;
}

function nextOpenSlotIndex(
  images: string[],
  activeSlots: Set<number>,
): number | null {
  for (let i = 0; i < TR_OWNER_PRODUCT_LIMITS.maxImages; i++) {
    const filled = Boolean(images[i]?.trim());
    if (!filled && !activeSlots.has(i)) return i;
  }
  return null;
}

/** Chalk-outline garment silhouette (crime-scene style dashed contour). */
function GarmentChalkOutline({
  variant,
  className,
}: {
  variant: "front" | "back";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 160 220"
      className={className}
      aria-hidden
      fill="none"
    >
      <path
        d="M80 28c10 0 18 7 20 16l6 4 28 10c4 1 7 5 7 9v18c0 3-2 6-5 7l-18 6v86c0 8-6 14-14 14H56c-8 0-14-6-14-14v-86l-18-6c-3-1-5-4-5-7V67c0-4 3-8 7-9l28-10 6-4c2-9 10-16 20-16z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeDasharray="5 5"
        strokeLinecap="square"
        opacity="0.85"
      />
      {variant === "front" ? (
        <path
          d="M68 78h24M72 100h16M70 122h20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 4"
          opacity="0.55"
        />
      ) : (
        <path
          d="M80 72v70M64 100h32"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 4"
          opacity="0.55"
        />
      )}
      <circle cx="80" cy="44" r="3" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export interface TrOwnerGuidedPhotoUploadProps {
  boutiqueId: string;
  images: string[];
  marketplaceImages: string[];
  catalogBackgroundCss?: string;
  title?: string;
  category?: string | null;
  productId?: string | null;
  uploading: boolean;
  onUploadingChange: (value: boolean) => void;
  onImagesChange: (images: string[]) => void;
  onMarketplaceImagesChange: (urls: string[]) => void;
  onError: (message: string | null) => void;
  onLightbox?: (payload: { src: string; label: string }) => void;
  onListingDraft?: (draft: {
    title: string;
    description: string;
  }) => void;
  /** Fired when front packshot+analysis finishes (draft may be null if Gemini failed). */
  onFrontAnalysisComplete?: (result: {
    draft: { title: string; description: string } | null;
  }) => void;
  onFrontSlotReset?: () => void;
  /** Emit photo pipeline jobs for the wizard status rail */
  onPhotoJobsChange?: (jobs: PipelineJobItem[]) => void;
  disabled?: boolean;
}

export function TrOwnerGuidedPhotoUpload({
  boutiqueId,
  images,
  marketplaceImages,
  catalogBackgroundCss,
  title,
  category,
  productId,
  uploading: _uploading,
  onUploadingChange,
  onImagesChange,
  onMarketplaceImagesChange,
  onError,
  onLightbox,
  onListingDraft,
  onFrontAnalysisComplete,
  onFrontSlotReset,
  onPhotoJobsChange,
  disabled = false,
}: TrOwnerGuidedPhotoUploadProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingPreview | null>(null);
  const [jobs, setJobs] = useState<Record<number, ActiveSlotJob>>({});
  const [softUndo, setSoftUndo] = useState<{
    index: number;
    image: string;
    marketplace: string;
    secondsLeft: number;
  } | null>(null);
  const softUndoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const softUndoSnapshotRef = useRef<{
    index: number;
    image: string;
    marketplace: string;
  } | null>(null);
  const onFrontSlotResetRef = useRef(onFrontSlotReset);
  const jobsRef = useRef(jobs);
  const imagesRef = useRef(images);
  const marketplaceRef = useRef(marketplaceImages);

  useEffect(() => {
    onFrontSlotResetRef.current = onFrontSlotReset;
  }, [onFrontSlotReset]);

  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => {
    marketplaceRef.current = marketplaceImages;
  }, [marketplaceImages]);

  useEffect(() => {
    return () => {
      if (softUndoTimerRef.current) {
        clearInterval(softUndoTimerRef.current);
        softUndoTimerRef.current = null;
      }
    };
  }, []);

  const activeSlotSet = useMemo(
    () => new Set(Object.keys(jobs).map((k) => Number(k))),
    [jobs],
  );
  const nextSlot = nextOpenSlotIndex(images, activeSlotSet);
  const frontClaimed =
    Boolean(images[0]?.trim()) || activeSlotSet.has(0);
  const backClaimed =
    Boolean(images[1]?.trim()) || activeSlotSet.has(1);

  const phase: "front" | "back" | "extras" =
    nextSlot === 0
      ? "front"
      : nextSlot === 1
        ? "back"
        : nextSlot != null
          ? "extras"
          : "extras";

  const anyJobRunning = Object.keys(jobs).length > 0;

  useEffect(() => {
    onUploadingChange(anyJobRunning);
  }, [anyJobRunning, onUploadingChange]);

  useEffect(() => {
    if (!onPhotoJobsChange) return;
    const items: PipelineJobItem[] = Object.values(jobs).map((job) => ({
      id: `photo-${job.slotIndex}`,
      kind: pipelineJobKindForSlot(job.slotIndex),
      label: pipelineLabelForSlot(job.slotIndex),
      status: "running",
      progressPct: job.progressPct,
      detail: uploadStageLabel(job.stage),
    }));
    onPhotoJobsChange(items);
  }, [jobs, onPhotoJobsChange]);

  useEffect(() => {
    return () => {
      for (const job of Object.values(jobsRef.current)) {
        if (job.previewUrl) URL.revokeObjectURL(job.previewUrl);
      }
    };
  }, []);

  // Animate progress toward stage targets for each job
  useEffect(() => {
    const running = Object.values(jobs);
    if (running.length === 0) return;
    const timer = window.setInterval(() => {
      setJobs((current) => {
        let changed = false;
        const next = { ...current };
        for (const key of Object.keys(next)) {
          const job = next[Number(key)]!;
          const target = uploadStageTarget(job.stage);
          if (job.progressPct >= target) continue;
        const step = job.stage === "packshot" ? 0.45 : job.stage === "analyze" ? 0.9 : 1.3;
          next[Number(key)] = {
            ...job,
            progressPct: Math.min(target, job.progressPct + step),
          };
          changed = true;
        }
        return changed ? next : current;
      });
    }, 120);
    return () => window.clearInterval(timer);
  }, [Object.keys(jobs).join(",")]);

  const phaseCopy = useMemo(() => {
    if (phase === "front") {
      return {
        step: "1 / 2",
        headline: "Ön yüz — kapak",
        body: "Ön fotoğrafı onayladıktan sonra arka yüklemeye geçebilirsiniz — ikisi birlikte işlenebilir.",
        cta: "Ön yüz fotoğrafı seç",
        outline: "front" as const,
      };
    }
    if (phase === "back") {
      return {
        step: "2 / 2",
        headline: "Arka yüz",
        body: frontClaimed && !images[0]?.trim()
          ? "Ön hâlâ hazırlanırken arka fotoğrafı seçip yüklemeyi başlatabilirsiniz."
          : "Aynı ürünün arkasını çekin. Katalog görseli oluşturulacak.",
        cta: "Arka yüz fotoğrafı seç",
        outline: "back" as const,
      };
    }
    return {
      step: "Ek",
      headline: "Ek fotoğraflar (isteğe bağlı)",
      body: "Ön + arka tamam veya işleniyor. İsterseniz detay ekleyin.",
      cta: "Ek fotoğraf seç",
      outline: "front" as const,
    };
  }, [phase, frontClaimed, images]);

  function clearPending() {
    setPending((current) => {
      if (current?.objectUrl) URL.revokeObjectURL(current.objectUrl);
      return null;
    });
  }

  function openPicker() {
    if (disabled || pending || nextSlot == null) return;
    fileInputRef.current?.click();
  }

  function onFilePicked(fileList: FileList | null) {
    if (!fileList?.[0] || nextSlot == null) return;
    const file = fileList[0];
    const objectUrl = URL.createObjectURL(file);
    setPending({
      file,
      objectUrl,
      slotIndex: nextSlot,
    });
    onError(null);
  }

  async function confirmPending() {
    if (!pending) return;
    const { file, objectUrl, slotIndex } = pending;
    const role = getProductPhotoRole(slotIndex);
    const roleLabel = productPhotoRoleLabel(role);

    setPending(null);
    setJobs((current) => ({
      ...current,
      [slotIndex]: {
        slotIndex,
        previewUrl: objectUrl,
        roleLabel,
        stage: "cutout",
        progressPct: 6,
      },
    }));
    onError(null);

    try {
      // Front/back: Photoroom once after packshot. Extras: keep original (no cutout).
      const uploaded = await uploadOwnerProductImage(boutiqueId, file, {
        removeBackground: false,
      });

      // Commit original early so wizard can leave photo step after Gemini
      onImagesChange(
        setSlotInList(imagesRef.current, slotIndex, uploaded.url),
      );
      let marketplaceUrl = uploaded.marketplaceUrl ?? "";
      if (marketplaceUrl) {
        onMarketplaceImagesChange(
          setSlotInList(marketplaceRef.current, slotIndex, marketplaceUrl),
        );
      }

      if (slotIndex < 2) {
        const sourceImageUrl =
          uploaded.marketplaceUrl?.trim() || uploaded.url.trim();
        const view = getProductPhotoRole(slotIndex);
        let preparedPrompt: string | undefined;
        let preparedDraft: {
          title: string;
          description: string;
        } | null = null;

        // Front: Gemini identify first → unlock name step, then FASHN
        if (slotIndex === 0) {
          setJobs((current) => {
            const job = current[slotIndex];
            if (!job) return current;
            return {
              ...current,
              [slotIndex]: {
                ...job,
                stage: "analyze",
                progressPct: Math.max(job.progressPct, 24),
              },
            };
          });
          try {
            const prepared = await requestOwnerPackshotPrepare({
              boutiqueId,
              sourceImageUrl,
              title,
              category,
              view: "front",
            });
            preparedPrompt = prepared.prompt;
            preparedDraft = prepared.listingDraft;
            if (preparedDraft && onListingDraft) {
              onListingDraft(preparedDraft);
            }
            onFrontAnalysisComplete?.({ draft: preparedDraft });
          } catch (analyzeError) {
            console.warn(
              "[guided-upload] prepare-packshot failed:",
              analyzeError instanceof Error
                ? analyzeError.message
                : analyzeError,
            );
            onFrontAnalysisComplete?.({ draft: null });
          }
        }

        setJobs((current) => {
          const job = current[slotIndex];
          if (!job) return current;
          return {
            ...current,
            [slotIndex]: {
              ...job,
              stage: "packshot",
              progressPct: Math.max(job.progressPct, 48),
            },
          };
        });

        const pack = await requestOwnerPackshot({
          boutiqueId,
          sourceImageUrl,
          productId: productId ?? undefined,
          title,
          category,
          view,
          numImages: 1,
          prompt: preparedPrompt,
          listingDraft: preparedDraft,
        });
        if (pack.status === "succeeded" && pack.imageUrls[0]?.trim()) {
          marketplaceUrl = pack.imageUrls[0].trim();
        } else {
          onError(
            pack.error?.trim() ||
              `${roleLabel}: katalog görseli oluşturulamadı.`,
          );
        }
      }

      onMarketplaceImagesChange(
        setSlotInList(marketplaceRef.current, slotIndex, marketplaceUrl),
      );
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : `${roleLabel} yüklenemedi.`,
      );
      if (slotIndex === 0) {
        onFrontAnalysisComplete?.({ draft: null });
      }
    } finally {
      setJobs((current) => {
        const job = current[slotIndex];
        if (job?.previewUrl) URL.revokeObjectURL(job.previewUrl);
        const { [slotIndex]: _removed, ...rest } = current;
        return rest;
      });
    }
  }

  function clearSoftUndoTimer() {
    if (softUndoTimerRef.current) {
      clearInterval(softUndoTimerRef.current);
      softUndoTimerRef.current = null;
    }
  }

  function commitSoftDelete(index: number) {
    softUndoSnapshotRef.current = null;
    setSoftUndo(null);
    clearSoftUndoTimer();
    if (index === 0) {
      onFrontSlotResetRef.current?.();
    }
  }

  function removeAt(index: number) {
    if (jobs[index]) return;
    const image = images[index]?.trim() || "";
    const marketplace = marketplaceImages[index]?.trim() || "";
    if (!image && !marketplace) return;

    // Commit any previous soft-delete before starting a new one
    if (softUndoSnapshotRef.current) {
      commitSoftDelete(softUndoSnapshotRef.current.index);
    }

    softUndoSnapshotRef.current = { index, image, marketplace };
    if (index < 2) {
      onImagesChange(setSlotInList(images, index, ""));
      onMarketplaceImagesChange(setSlotInList(marketplaceImages, index, ""));
    } else {
      onImagesChange(images.filter((_, i) => i !== index));
      onMarketplaceImagesChange(
        marketplaceImages.filter((_, i) => i !== index),
      );
    }

    setSoftUndo({ index, image, marketplace, secondsLeft: 10 });
    clearSoftUndoTimer();
    softUndoTimerRef.current = setInterval(() => {
      setSoftUndo((current) => {
        if (!current) return null;
        if (current.secondsLeft <= 1) {
          clearSoftUndoTimer();
          softUndoSnapshotRef.current = null;
          if (current.index === 0) {
            onFrontSlotResetRef.current?.();
          }
          return null;
        }
        return { ...current, secondsLeft: current.secondsLeft - 1 };
      });
    }, 1000);
  }

  function undoSoftDelete() {
    const snap = softUndoSnapshotRef.current;
    if (!snap) {
      setSoftUndo(null);
      clearSoftUndoTimer();
      return;
    }
    clearSoftUndoTimer();
    softUndoSnapshotRef.current = null;
    setSoftUndo(null);
    if (snap.index < 2) {
      onImagesChange(setSlotInList(imagesRef.current, snap.index, snap.image));
      onMarketplaceImagesChange(
        setSlotInList(marketplaceRef.current, snap.index, snap.marketplace),
      );
    } else {
      const nextImages = [...imagesRef.current];
      const nextMarket = [...marketplaceRef.current];
      nextImages.splice(snap.index, 0, snap.image);
      nextMarket.splice(snap.index, 0, snap.marketplace);
      onImagesChange(nextImages);
      onMarketplaceImagesChange(nextMarket);
    }
  }

  const pendingCost = pending
    ? describePhotoSlotCost(pending.slotIndex)
    : null;

  const showPicker =
    !disabled &&
    nextSlot != null &&
    nextSlot < TR_OWNER_PRODUCT_LIMITS.maxImages;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {([0, 1] as const).map((i) => {
          const done = Boolean(images[i]?.trim());
          const running = Boolean(jobs[i]);
          const active = nextSlot === i;
          return (
            <div key={i} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-9 flex-1 items-center justify-center rounded-xl border-2 text-[13px] font-semibold transition-colors ${
                  done
                    ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                    : running
                      ? "border-[color:var(--panel-accent)] bg-[color:var(--panel-accent-softer)] text-neutral-900"
                      : active
                        ? "border-[color:var(--panel-accent)] bg-[color:var(--panel-accent-softer)] text-neutral-900"
                        : "border-dashed border-neutral-300 bg-neutral-50 text-neutral-400"
                }`}
              >
                {i === 0 ? "1 · Ön" : "2 · Arka"}
                {done ? " ✓" : running ? " …" : ""}
              </div>
              {i === 0 ? (
                <span className="text-neutral-300" aria-hidden>
                  →
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[13px] font-semibold tracking-wide text-neutral-500 uppercase">
            Adım {phaseCopy.step}
          </p>
          <h3 className="mt-1 text-[20px] font-semibold text-neutral-900">
            {phaseCopy.headline}
          </h3>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
            {phaseCopy.body}
          </p>
        </div>

        {showPicker ? (
          <button
            type="button"
            onClick={openPicker}
            disabled={disabled || Boolean(pending)}
            className="group relative flex min-h-[220px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[color:var(--panel-accent-border)] bg-[#F7F5F1] px-4 py-8 text-center disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, #222 1px, transparent 0)",
                backgroundSize: "18px 18px",
              }}
            />
            <GarmentChalkOutline
              variant={phaseCopy.outline}
              className="relative z-[1] h-36 w-28 text-neutral-700 transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <span
              className="relative z-[1] mt-4 text-[18px] font-semibold"
              style={{ color: "var(--panel-accent-deep)" }}
            >
              {phaseCopy.cta}
            </span>
            <span className="relative z-[1] mt-2 max-w-xs text-[14px] text-neutral-600">
              {phase === "extras"
                ? "İsteğe bağlı"
                : "Onaydan sonra diğer fotoğrafa geçebilirsiniz"}
            </span>
          </button>
        ) : null}

        <input
          id={inputId}
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          disabled={disabled || Boolean(pending)}
          onChange={(event) => {
            onFilePicked(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {/* Slot grid: done + in-progress */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((index) => {
          const job = jobs[index];
          const url = images[index]?.trim();
          const catalogUrl = marketplaceImages[index]?.trim();
          const roleLabel = productPhotoRoleLabel(getProductPhotoRole(index));

          if (job) {
            return (
              <div
                key={`job-${index}`}
                className="relative overflow-hidden rounded-xl border-2 border-[color:var(--panel-accent-border)] bg-[#F7F5F1] p-3"
                aria-busy
              >
                <div className="relative mx-auto aspect-[3/4] w-full max-w-[140px] overflow-hidden rounded-lg bg-[#EDE9E2]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={job.previewUrl}
                    alt=""
                    className="h-full w-full object-cover opacity-75"
                  />
                </div>
                <p className="mt-2 text-center text-[13px] font-semibold text-neutral-800">
                  {roleLabel}
                </p>
                <p className="mt-0.5 text-center text-[12px] text-neutral-600">
                  {uploadStageLabel(job.stage)}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-white/80">
                  <motion.div
                    className="h-full rounded-sm"
                    style={{ background: "var(--panel-accent)" }}
                    animate={{ width: `${job.progressPct}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="mt-1 text-center text-[11px] tabular-nums text-neutral-500">
                  {Math.round(job.progressPct)}%
                </p>
              </div>
            );
          }

          if (!url) {
            return (
              <div
                key={`empty-${index}`}
                className="flex aspect-[3/4] items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 text-[13px] text-neutral-400"
              >
                {roleLabel}
              </div>
            );
          }

          const previewSrc = catalogUrl || url;
          return (
            <div
              key={`${url}-${index}`}
              className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#F3F1EC]"
              style={
                catalogUrl && catalogBackgroundCss
                  ? { background: catalogBackgroundCss }
                  : undefined
              }
            >
              <button
                type="button"
                className="absolute inset-0 z-[1]"
                aria-label={`${roleLabel} — büyüt`}
                onClick={() =>
                  onLightbox?.({ src: previewSrc, label: roleLabel })
                }
              />
              <Image
                src={previewSrc}
                alt={roleLabel}
                fill
                unoptimized
                className={catalogUrl ? "object-contain p-2" : "object-cover"}
                sizes="160px"
              />
              <span className="pointer-events-none absolute top-2 left-2 z-[2] rounded-lg bg-white px-2 py-1 text-[13px] font-semibold">
                {roleLabel}
              </span>
              <button
                type="button"
                className="absolute right-2 bottom-2 z-[2] rounded-lg bg-white px-3 py-2 text-[14px] font-semibold text-red-700"
                disabled={disabled || Boolean(jobs[index])}
                onClick={() => removeAt(index)}
              >
                Sil
              </button>
            </div>
          );
        })}
      </div>

      {/* Extra completed images beyond front/back */}
      {images.length > 2 ? (
        <div className="grid grid-cols-2 gap-3">
          {images.slice(2).map((url, offset) => {
            const index = offset + 2;
            if (!url?.trim()) return null;
            const catalogUrl = marketplaceImages[index]?.trim();
            const previewSrc = catalogUrl || url;
            const roleLabel = productPhotoRoleLabel(getProductPhotoRole(index));
            return (
              <div
                key={`${url}-${index}`}
                className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#F3F1EC]"
              >
                <Image
                  src={previewSrc}
                  alt={roleLabel}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="160px"
                />
                <button
                  type="button"
                  className="absolute right-2 bottom-2 z-[2] rounded-lg bg-white px-3 py-2 text-[14px] font-semibold text-red-700"
                  disabled={disabled}
                  onClick={() => removeAt(index)}
                >
                  Sil
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {!frontClaimed || !backClaimed ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-950">
          Ön ve arka zorunlu. Ön yüklenirken arka seçebilirsiniz — işlemler
          paralel ilerler.
        </p>
      ) : null}

      <AnimatePresence>
        {pending && pendingCost ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${inputId}-preview-title`}
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-xl"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <p
                id={`${inputId}-preview-title`}
                className="text-[18px] font-semibold text-neutral-900"
              >
                {pendingCost.title}
              </p>
              <p className="mt-1 text-[14px] text-neutral-600">
                {pendingCost.subtitle}
              </p>

              <div className="relative mx-auto mt-4 aspect-[3/4] w-full max-w-[240px] overflow-hidden rounded-xl bg-[#F3F1EC]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pending.objectUrl}
                  alt="Önizleme"
                  className="h-full w-full object-cover"
                />
              </div>

              <ul className="mt-4 space-y-2 text-[14px] text-neutral-700">
                {pendingCost.bullets.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span
                      aria-hidden
                      className="text-[color:var(--panel-accent)]"
                    >
                      ▸
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <TrOwnerCreditsCostLine
                className="mt-4"
                credits={pendingCost.credits}
                prefix={pendingCost.costPrefix || "Bu işlem"}
              />

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  className={secondaryBtn}
                  onClick={clearPending}
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  className={primaryBtn}
                  style={{ background: "var(--panel-accent)" }}
                  onClick={() => void confirmPending()}
                >
                  Onayla — katalog görseli oluştur
                </button>
              </div>
              <TrOwnerCreditsMoreInfoLink className="mt-3" />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {softUndo ? (
          <motion.div
            className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22 }}
          >
            <div
              role="status"
              className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-white shadow-xl"
            >
              <p className="min-w-0 flex-1 text-[14px] font-medium">
                {productPhotoRoleLabel(getProductPhotoRole(softUndo.index))}{" "}
                silindi · {softUndo.secondsLeft}sn
              </p>
              <button
                type="button"
                className="shrink-0 rounded-lg bg-white px-3 py-2 text-[14px] font-semibold text-neutral-900"
                onClick={undoSoftDelete}
              >
                Geri al
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Both front + back finished (URLs present). */
export function hasRequiredProductPhotos(images: string[]): boolean {
  return Boolean(images[0]?.trim() && images[1]?.trim());
}

/** Front + back started (finished or still generating). */
export function hasRequiredProductPhotosStarted(
  images: string[],
  photoJobs: PipelineJobItem[],
): boolean {
  const frontOk =
    Boolean(images[0]?.trim()) ||
    photoJobs.some((j) => j.kind === "photo-front" && j.status === "running");
  const backOk =
    Boolean(images[1]?.trim()) ||
    photoJobs.some((j) => j.kind === "photo-back" && j.status === "running");
  return frontOk && backOk;
}
