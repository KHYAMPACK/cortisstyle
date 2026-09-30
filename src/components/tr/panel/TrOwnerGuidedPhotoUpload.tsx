"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type ReactNode,
} from "react";
import {
  describePhotoSlotCost,
  TR_AI_CATALOG_CREDITS,
} from "@/lib/tr/fashion/aiCatalog/uploadCostHints";
import { type PipelineJobItem } from "@/lib/tr/aiCatalog/pipelineProgress";
import {
  pipelineJobKindForSlot,
  pipelineLabelForSlot,
} from "@/lib/tr/fashion/aiCatalog/pipelineSlotLabels";
import { constructionChipsEqual, constructionChipsForFamily } from "@/lib/tr/fashion/aiCatalog/elbiseConstructionLock";
import { applyConstructionListingTitle } from "@/lib/tr/fashion/aiCatalog/listingDraft";
import { buildElbisePackshotPrompt } from "@/lib/tr/fashion/aiCatalog/packshotPrompt";
import { chipsFromProductFeatures } from "@/lib/tr/aiModel/elbiseTryOn";
import {
  TrOwnerCreditsCostLine,
  TrOwnerCreditsMoreInfoLink,
} from "@/components/tr/panel/TrOwnerCreditsInfo";
import {
  getProductPhotoRole,
  productPhotoRoleLabel,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import {
  ELBISE_DETAIL_SLOT,
  ELBISE_PACKSHOT_SLOT,
  constructionCatalogFamily,
  guidedPhotoSlotCountForUploadType,
  isConstructionCatalogUpload,
  parseConstructionShopCategory,
  requiredPhotoSlotsForUploadType,
  type ConstructionCatalogFamily,
} from "@/lib/tr/fashion/garmentUploadTypes";
import { resolveDressFeatureValue } from "@/lib/tr/fashion/dressFeatures";
import {
  constructionGateErrorCopy,
  constructionGateRequiredCopy,
  emptyElbiseGateChips,
  elbiseGateReady,
} from "@/components/tr/fashion/panel/TrOwnerElbiseConstructionGate";
import {
  constructionTriageReady,
  TrOwnerConstructionTriageFields,
} from "@/components/tr/fashion/panel/TrOwnerConstructionTriageFields";
import {
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { useScheduleAiJob } from "@/components/tr/panel/TrOwnerAiJobQueue";
import { uploadOwnerProductImage, requestOwnerPackshot, requestOwnerPackshotPrepare, type OwnerListingDraft } from "@/lib/tr/ownerClient";
import type { TrProductFeatures } from "@/types/tr-marketplace";

type UploadStage = "idle" | "cutout" | "analyze" | "queued" | "packshot";

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

interface ElbiseGateState {
  frontUrl: string;
  backUrl: string;
  detailUrl: string;
  sourceToken: string;
  promptFront: string | null;
  preparedPrompt: string;
  draft: OwnerListingDraft | null;
  proposed: {
    neckline: string;
    sleeves: string;
    length: string;
    decollete: string;
  };
}

function uploadStageLabel(stage: UploadStage): string {
  if (stage === "analyze") return "Ürün tanınıyor…";
  if (stage === "queued") return "Sırada…";
  if (stage === "packshot") return "Katalog görseli hazırlanıyor…";
  if (stage === "cutout") return "Fotoğraf işleniyor…";
  return "";
}

function uploadStageTarget(stage: UploadStage): number {
  if (stage === "analyze") return 42;
  if (stage === "queued") return 16;
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
  reservedSlots: ReadonlySet<number> = new Set(),
  skipSlots: ReadonlySet<number> = new Set(),
): number | null {
  for (let i = 0; i < TR_OWNER_PRODUCT_LIMITS.maxImages; i++) {
    if (reservedSlots.has(i) || skipSlots.has(i)) continue;
    const filled = Boolean(images[i]?.trim());
    if (!filled && !activeSlots.has(i)) return i;
  }
  return null;
}

function isAcceptedProductPhoto(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/png" || type === "image/jpeg" || type === "image/webp") {
    return true;
  }
  return /\.(png|jpe?g|webp)$/i.test(file.name);
}

function imageFilesFromList(files: FileList | File[]): File[] {
  return Array.from(files).filter(isAcceptedProductPhoto);
}

function leftDropTarget(
  event: ReactDragEvent<HTMLElement>,
): boolean {
  const next = event.relatedTarget;
  if (!(next instanceof Node)) return true;
  return !event.currentTarget.contains(next);
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

const COMPACT_THUMB_COL = "w-[4.75rem] sm:w-[5.5rem]";

function CompactPhotoColumn({
  label,
  children,
  action,
  busy,
}: {
  label: string;
  children: ReactNode;
  action?: ReactNode;
  busy?: boolean;
}) {
  return (
    <div className={`min-w-0 ${COMPACT_THUMB_COL}`} aria-busy={busy || undefined}>
      {children}
      <p className="mt-1 truncate text-center text-[11px] font-semibold leading-tight text-neutral-800">
        {label}
      </p>
      {action}
    </div>
  );
}

function CompactThumbFrame({
  children,
  className,
  style,
}: {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-lg ${className ?? "bg-[#F3F1EC]"}`}
      style={style}
    >
      {children}
    </div>
  );
}

function CompactExpandHint() {
  return (
    <span
      className="pointer-events-none absolute right-1 bottom-1 z-[2] rounded bg-black/55 px-1 py-0.5 text-[9px] font-semibold tracking-wide text-white uppercase"
      aria-hidden
    >
      Büyüt
    </span>
  );
}

function CompactDeleteButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="mt-1 min-h-9 w-full rounded-md bg-white text-[12px] font-semibold text-red-700 ring-1 ring-black/10 disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
    >
      Sil
    </button>
  );
}

function CompactRecreateButton({
  disabled,
  onClick,
  creditHint,
}: {
  disabled: boolean;
  onClick: () => void;
  creditHint: string;
}) {
  return (
    <div className="mt-1 space-y-0.5">
      <button
        type="button"
        className="min-h-9 w-full rounded-md bg-white text-[12px] font-semibold text-[color:var(--panel-accent-deep)] ring-1 ring-black/10 disabled:opacity-50"
        disabled={disabled}
        onClick={onClick}
        aria-label="Packshot'u yeniden üret"
      >
        Yenile
      </button>
      <p className="text-center text-[10px] leading-tight text-neutral-500">
        {creditHint}
      </p>
    </div>
  );
}

function CompactJobProgress({
  stageLabel,
  progressPct,
}: {
  stageLabel: string;
  progressPct: number;
}) {
  return (
    <>
      {stageLabel ? (
        <p className="mt-0.5 truncate text-center text-[10px] leading-tight text-neutral-600">
          {stageLabel}
        </p>
      ) : null}
      <div className="mt-1 h-1 overflow-hidden rounded-sm bg-neutral-200">
        <motion.div
          className="h-full rounded-sm"
          style={{ background: "var(--panel-accent)" }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className="mt-0.5 text-center text-[10px] tabular-nums text-neutral-500">
        {Math.round(progressPct)}%
      </p>
    </>
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
  uploadType?: string | null;
  uploading: boolean;
  onUploadingChange: (value: boolean) => void;
  onImagesChange: (images: string[]) => void;
  onMarketplaceImagesChange: (urls: string[]) => void;
  onError: (message: string | null) => void;
  onLightbox?: (payload: { src: string; label: string }) => void;
  onListingDraft?: (draft: OwnerListingDraft) => void;
  /** Fired when front packshot+analysis finishes (draft may be null if Gemini failed). */
  onFrontAnalysisComplete?: (result: {
    draft: OwnerListingDraft | null;
  }) => void;
  onFrontSlotReset?: () => void;
  /** Emit photo pipeline jobs for the wizard status rail */
  onPhotoJobsChange?: (jobs: PipelineJobItem[]) => void;
  disabled?: boolean;
  features?: TrProductFeatures | null;
  listingDraft?: OwnerListingDraft | null;
  /**
   * Construction capture without a Tür step: 3 slots, no Photoroom on people,
   * identify after ön+arka, do not open the chip gate or start FASHN.
   */
  deferConstructionPackshot?: boolean;
  /**
   * Photo-first construction: 3 slots + Gemini infers family/leaf even when
   * `uploadType` is still empty. Opens the triage gate (unlike defer).
   */
  inferConstructionFamily?: boolean;
  onUploadTypeChange?: (uploadType: ConstructionCatalogFamily) => void;
  onCategoryChange?: (category: string | null) => void;
  /** Override picker tiles (takım items: 2 — no detay). */
  photoSlotCount?: number;
  onConstructionPrepared?: (result: {
    draft: OwnerListingDraft | null;
    proposed: {
      neckline: string;
      sleeves: string;
      fit: string;
      length: string;
      decollete: string;
      rise: string;
      hem: string;
    };
    preparedPrompt: string;
  }) => void;
  /** Linked-color upload: skip optional detay so every color is ön+arka only. */
  skipDetailSlot?: boolean;
}

export function TrOwnerGuidedPhotoUpload({
  boutiqueId,
  images,
  marketplaceImages,
  catalogBackgroundCss,
  title,
  category,
  productId,
  uploadType = null,
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
  features = null,
  listingDraft = null,
  deferConstructionPackshot = false,
  inferConstructionFamily = false,
  onUploadTypeChange,
  onCategoryChange,
  photoSlotCount,
  onConstructionPrepared,
  skipDetailSlot = false,
}: TrOwnerGuidedPhotoUploadProps) {
  const scheduleAiJob = useScheduleAiJob();
  const scheduleAiJobRef = useRef(scheduleAiJob);
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingPreview | null>(null);
  const [elbiseGate, setElbiseGate] = useState<ElbiseGateState | null>(null);
  const [elbiseGateOpen, setElbiseGateOpen] = useState(false);
  const [elbiseGateBusy, setElbiseGateBusy] = useState(false);
  const [gateChips, setGateChips] = useState(emptyElbiseGateChips());
  const [gateFamily, setGateFamily] = useState<ConstructionCatalogFamily | null>(
    null,
  );
  const [gateCategory, setGateCategory] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Record<number, ActiveSlotJob>>({});
  const [skippedDetail, setSkippedDetail] = useState(false);
  const [softUndo, setSoftUndo] = useState<{
    index: number;
    image: string;
    marketplace: string;
    packshotImage?: string;
    packshotMarketplace?: string;
    secondsLeft: number;
  } | null>(null);
  const softUndoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const softUndoSnapshotRef = useRef<{
    index: number;
    image: string;
    marketplace: string;
    packshotImage?: string;
    packshotMarketplace?: string;
  } | null>(null);
  const onFrontSlotResetRef = useRef(onFrontSlotReset);
  const onPhotoJobsChangeRef = useRef(onPhotoJobsChange);
  const jobsRef = useRef(jobs);
  const imagesRef = useRef(images);
  const marketplaceRef = useRef(marketplaceImages);
  const elbiseGateRef = useRef(elbiseGate);
  const pickerSlotRef = useRef<number | null>(null);
  const dropQueueRef = useRef<Array<{ file: File; slotIndex: number }>>([]);
  const [dragOver, setDragOver] = useState<"picker" | number | null>(null);

  useEffect(() => {
    scheduleAiJobRef.current = scheduleAiJob;
  }, [scheduleAiJob]);

  useEffect(() => {
    onFrontSlotResetRef.current = onFrontSlotReset;
  }, [onFrontSlotReset]);

  useEffect(() => {
    onPhotoJobsChangeRef.current = onPhotoJobsChange;
  }, [onPhotoJobsChange]);

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
    elbiseGateRef.current = elbiseGate;
  }, [elbiseGate]);

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
  const elbise =
    isConstructionCatalogUpload(uploadType) ||
    deferConstructionPackshot ||
    inferConstructionFamily;
  const knownFamily = constructionCatalogFamily(uploadType, category);
  const triageFamily = gateFamily ?? knownFamily;
  const family = triageFamily ?? "elbise";
  const shopCategory = gateCategory ?? category;
  const requiredSlots = requiredPhotoSlotsForUploadType(
    elbise ? uploadType ?? "elbise" : uploadType,
  );
  const guidedSlots = photoSlotCount ?? (elbise
    ? skipDetailSlot && !images[ELBISE_DETAIL_SLOT]?.trim()
      ? 2
      : 3
    : guidedPhotoSlotCountForUploadType(uploadType));
  const packshotSlot = elbise ? ELBISE_PACKSHOT_SLOT : null;
  const reservedSlots = useMemo(
    () => new Set(packshotSlot != null ? [packshotSlot] : []),
    [packshotSlot],
  );
  const skipSlots = useMemo(() => {
    if (
      elbise &&
      (skipDetailSlot || skippedDetail) &&
      !images[ELBISE_DETAIL_SLOT]?.trim()
    ) {
      return new Set([ELBISE_DETAIL_SLOT]);
    }
    return new Set<number>();
  }, [elbise, skipDetailSlot, skippedDetail, images]);
  const nextSlot = nextOpenSlotIndex(
    images,
    activeSlotSet,
    reservedSlots,
    skipSlots,
  );
  const frontClaimed =
    Boolean(images[0]?.trim()) || activeSlotSet.has(0);
  const backClaimed =
    Boolean(images[1]?.trim()) || activeSlotSet.has(1);
  const detailClaimed =
    Boolean(images[ELBISE_DETAIL_SLOT]?.trim()) ||
    activeSlotSet.has(ELBISE_DETAIL_SLOT);

  const phase: "front" | "back" | "detail" | "extras" =
    nextSlot === 0
      ? "front"
      : nextSlot === 1
        ? "back"
        : elbise && nextSlot === 2
          ? "detail"
          : "extras";

  const anyJobRunning = Object.keys(jobs).length > 0;

  useEffect(() => {
    onUploadingChange(anyJobRunning);
  }, [anyJobRunning, onUploadingChange]);

  useEffect(() => {
    const notify = onPhotoJobsChangeRef.current;
    if (!notify) return;
    const items: PipelineJobItem[] = Object.values(jobs).map((job) => ({
      id: `photo-${job.slotIndex}`,
      kind: pipelineJobKindForSlot(job.slotIndex, guidedSlots),
      label:
        packshotSlot != null && job.slotIndex === packshotSlot
          ? "Ön packshot"
          : pipelineLabelForSlot(job.slotIndex, guidedSlots),
      status: "running",
      progressPct: job.progressPct,
      detail: uploadStageLabel(job.stage),
    }));
    notify(items);
  }, [jobs, packshotSlot, guidedSlots]);

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
        const step = job.stage === "packshot" ? 0.45 : job.stage === "analyze" ? 0.9 : job.stage === "queued" ? 0.2 : 1.3;
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
        step: elbise ? "1 / 3" : "1 / 2",
        headline: elbise ? "Ön manken" : "Ön yüz — kapak",
        body: elbise
          ? "Önden tam boy manken fotoğrafı. Olduğu gibi kaydedilir."
          : "Ön fotoğrafı onayladıktan sonra arka yüklemeye geçebilirsiniz — ikisi birlikte işlenebilir.",
        cta: elbise ? "Ön manken fotoğrafı seç" : "Ön yüz fotoğrafı seç",
        outline: "front" as const,
      };
    }
    if (phase === "back") {
      return {
        step: elbise ? "2 / 3" : "2 / 2",
        headline: elbise ? "Arka manken" : "Arka yüz",
        body: elbise
          ? "Arkadan tam boy manken fotoğrafı. Askı, sırt detay ve etek / hem arkası görünsün."
          : frontClaimed && !images[0]?.trim()
            ? "Ön hâlâ hazırlanırken arka fotoğrafı seçip yüklemeyi başlatabilirsiniz."
            : "Aynı ürünün arkasını çekin. Katalog görseli oluşturulacak.",
        cta: elbise ? "Arka manken fotoğrafı seç" : "Arka yüz fotoğrafı seç",
        outline: "back" as const,
      };
    }
    if (phase === "detail") {
      return {
        step: "3 / 3",
        headline: "Dekolte / detay (isteğe bağlı)",
        body: "Yaka, dekolte veya dantel gibi yakın çekim. Atlayabilirsiniz — ön ve arka yetince packshot üretilir.",
        cta: "Detay fotoğrafı seç",
        outline: "front" as const,
      };
    }
    return {
      step: "Ek",
      headline: "Ek fotoğraflar (isteğe bağlı)",
      body: elbise
        ? "Ön ve arka tamam. Detay isterseniz boş kareye dokunun."
        : "Ön + arka tamam veya işleniyor. İsterseniz detay ekleyin.",
      cta: "Ek fotoğraf seç",
      outline: "front" as const,
    };
  }, [phase, frontClaimed, images, elbise]);

  function clearPending() {
    dropQueueRef.current = [];
    setPending((current) => {
      if (current?.objectUrl) URL.revokeObjectURL(current.objectUrl);
      return null;
    });
  }

  function showPendingFile(file: File, slotIndex: number) {
    const objectUrl = URL.createObjectURL(file);
    setPending({ file, objectUrl, slotIndex });
    onError(null);
  }

  function flushDropQueue() {
    const next = dropQueueRef.current.shift();
    if (!next) return;
    showPendingFile(next.file, next.slotIndex);
  }

  function collectDropSlots(preferred: number | null): number[] {
    const skip = new Set(skipSlots);
    if (preferred === ELBISE_DETAIL_SLOT) skip.delete(ELBISE_DETAIL_SLOT);
    const taken = new Set<number>([
      ...reservedSlots,
      ...skip,
      ...Object.keys(jobs).map(Number),
      ...dropQueueRef.current.map((item) => item.slotIndex),
    ]);
    if (pending) taken.add(pending.slotIndex);
    const out: number[] = [];
    const consider = (index: number) => {
      if (index < 0 || index >= TR_OWNER_PRODUCT_LIMITS.maxImages) return;
      if (packshotSlot != null && index === packshotSlot) return;
      if (taken.has(index)) return;
      if (images[index]?.trim()) return;
      taken.add(index);
      out.push(index);
    };
    if (preferred != null) consider(preferred);
    for (let index = 0; index < TR_OWNER_PRODUCT_LIMITS.maxImages; index++) {
      consider(index);
    }
    return out;
  }

  function offerDroppedFiles(files: File[], preferredSlot: number | null) {
    if (disabled) return;
    const photos = imageFilesFromList(files);
    if (photos.length === 0) {
      onError("PNG, JPEG veya WebP yükleyin.");
      return;
    }
    const slots = collectDropSlots(preferredSlot);
    if (slots.length === 0) {
      onError("Boş fotoğraf yeri yok.");
      return;
    }
    let photoIndex = 0;
    if (!pending) {
      showPendingFile(photos[0]!, slots[0]!);
      slots.shift();
      photoIndex = 1;
    }
    for (; photoIndex < photos.length && slots.length > 0; photoIndex++) {
      dropQueueRef.current.push({
        file: photos[photoIndex]!,
        slotIndex: slots.shift()!,
      });
    }
  }

  function openPicker() {
    if (disabled || pending || nextSlot == null) return;
    pickerSlotRef.current = nextSlot;
    fileInputRef.current?.click();
  }

  function openPickerForSlot(slotIndex: number) {
    if (disabled || pending) return;
    pickerSlotRef.current = slotIndex;
    if (slotIndex === ELBISE_DETAIL_SLOT) setSkippedDetail(false);
    fileInputRef.current?.click();
  }

  function onFilePicked(fileList: FileList | null) {
    if (!fileList?.[0]) return;
    const slotIndex = pickerSlotRef.current ?? nextSlot;
    pickerSlotRef.current = null;
    if (slotIndex == null) return;
    offerDroppedFiles(imageFilesFromList(fileList), slotIndex);
  }

  function onDragOverTarget(
    event: ReactDragEvent<HTMLElement>,
    target: "picker" | number,
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    event.dataTransfer.dropEffect = "copy";
    setDragOver(target);
  }

  function onDragLeaveTarget(
    event: ReactDragEvent<HTMLElement>,
    target: "picker" | number,
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (!leftDropTarget(event)) return;
    setDragOver((current) => (current === target ? null : current));
  }

  function onDropOnTarget(
    event: ReactDragEvent<HTMLElement>,
    preferredSlot: number | null,
  ) {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(null);
    if (disabled) return;
    if (preferredSlot === ELBISE_DETAIL_SLOT) setSkippedDetail(false);
    offerDroppedFiles(Array.from(event.dataTransfer.files), preferredSlot);
  }

  async function confirmPending() {
    if (!pending) return;
    const { file, objectUrl, slotIndex } = pending;
    const role = getProductPhotoRole(slotIndex, guidedSlots);
    const roleLabel = productPhotoRoleLabel(role);

    setPending(null);
    flushDropQueue();
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

      if (elbise && slotIndex < guidedSlots) {
        if (slotIndex === ELBISE_DETAIL_SLOT) setSkippedDetail(false);
        const originalUrl = uploaded.url.trim();
        onMarketplaceImagesChange(
          setSlotInList(marketplaceRef.current, slotIndex, originalUrl),
        );

        const nextImages = setSlotInList(
          imagesRef.current,
          slotIndex,
          originalUrl,
        );
        const allRequired = Array.from(
          { length: requiredSlots },
          (_, i) => Boolean(nextImages[i]?.trim()),
        ).every(Boolean);
        const packshotAlready =
          packshotSlot != null &&
          (Boolean(nextImages[packshotSlot]?.trim()) ||
            Boolean(jobsRef.current[packshotSlot]) ||
            Boolean(elbiseGateRef.current));
        const shouldStartPackshot =
          slotIndex < requiredSlots &&
          allRequired &&
          packshotSlot != null &&
          !packshotAlready;

        if (shouldStartPackshot) {
          const frontUrl = nextImages[0]!.trim();
          const backUrl = nextImages[1]!.trim();
          const detailUrl = nextImages[ELBISE_DETAIL_SLOT]?.trim() || "";
          const sourceToken = `${frontUrl}|${backUrl}|${detailUrl}`;

          setJobs((current) => {
            const finished = current[slotIndex];
            if (finished?.previewUrl) URL.revokeObjectURL(finished.previewUrl);
            const { [slotIndex]: _removed, ...rest } = current;
            return {
              ...rest,
              [packshotSlot]: {
                slotIndex: packshotSlot,
                previewUrl: "",
                roleLabel: "Ön packshot",
                stage: "analyze",
                progressPct: 24,
              },
            };
          });

          let preparedPrompt: string | undefined;
          let preparedDraft: OwnerListingDraft | null = null;
          try {
            const prepared = await requestOwnerPackshotPrepare({
              boutiqueId,
              sourceImageUrl: frontUrl,
              backImageUrl: backUrl,
              detailImageUrl: detailUrl || undefined,
              title,
              category: knownFamily === "elbise" ? "elbise" : category,
              view: "front",
              uploadType: knownFamily ?? undefined,
              inferConstructionFamily:
                !knownFamily &&
                (inferConstructionFamily || deferConstructionPackshot),
            });
            preparedPrompt = prepared.prompt;
            preparedDraft = prepared.listingDraft;
          } catch (analyzeError) {
            console.warn(
              "[guided-upload] elbise prepare-packshot failed:",
              analyzeError instanceof Error
                ? analyzeError.message
                : analyzeError,
            );
          }

          const proposed = emptyElbiseGateChips(
            constructionChipsForFamily(
              {
                neckline: resolveDressFeatureValue(
                  "neckline",
                  preparedDraft?.features?.neckline,
                ),
                sleeves: resolveDressFeatureValue(
                  "sleeves",
                  preparedDraft?.features?.sleeves,
                ),
                fit: resolveDressFeatureValue(
                  "fit",
                  preparedDraft?.features?.fit,
                ),
                length: resolveDressFeatureValue(
                  "length",
                  preparedDraft?.features?.length,
                ),
                decollete: resolveDressFeatureValue(
                  "decollete",
                  preparedDraft?.features?.decollete,
                ),
                rise: resolveDressFeatureValue(
                  "rise",
                  preparedDraft?.features?.rise,
                ),
                hem: resolveDressFeatureValue(
                  "hem",
                  preparedDraft?.features?.neckHem,
                ),
              },
              constructionCatalogFamily(
                knownFamily,
                preparedDraft?.category,
              ),
              detailUrl || "",
            ),
            { hasDetailPhoto: Boolean(detailUrl) },
          );

          if (deferConstructionPackshot) {
            if (preparedDraft?.title?.trim()) {
              onListingDraft?.(preparedDraft);
              onFrontAnalysisComplete?.({ draft: preparedDraft });
            } else {
              onFrontAnalysisComplete?.({ draft: null });
            }
            onConstructionPrepared?.({
              draft: preparedDraft,
              proposed,
              preparedPrompt: preparedPrompt ?? "",
            });
            setJobs((current) => {
              if (packshotSlot == null) return current;
              const { [packshotSlot]: _removed, ...rest } = current;
              return rest;
            });
            return;
          }

          const inferredFamily = constructionCatalogFamily(
            knownFamily,
            preparedDraft?.category,
          );
          setGateFamily(inferredFamily);
          setGateCategory(
            inferredFamily === "elbise"
              ? "elbise"
              : inferredFamily
                ? parseConstructionShopCategory(
                    preparedDraft?.category,
                    inferredFamily,
                  )
                : null,
          );
          setGateChips(proposed);
          setElbiseGate({
            frontUrl,
            backUrl,
            detailUrl,
            sourceToken,
            promptFront: preparedDraft?.promptFront ?? null,
            preparedPrompt: preparedPrompt ?? "",
            draft: preparedDraft,
            proposed,
          });
          setElbiseGateOpen(true);
        }
        return;
      }

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
              stage: "queued",
              progressPct: Math.max(job.progressPct, 48),
            },
          };
        });

        const pack = await scheduleAiJobRef.current(
          () =>
            requestOwnerPackshot({
              boutiqueId,
              sourceImageUrl,
              productId: productId ?? undefined,
              title,
              category,
              view,
              numImages: 1,
              prompt: preparedPrompt,
              listingDraft: preparedDraft,
            }),
          {
            onStart: () => {
              setJobs((current) => {
                const job = current[slotIndex];
                if (!job) return current;
                return {
                  ...current,
                  [slotIndex]: {
                    ...job,
                    stage: "packshot",
                    progressPct: Math.max(job.progressPct, 52),
                  },
                };
              });
            },
          },
        );
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
      if (slotIndex === 0 && !elbise) {
        onFrontAnalysisComplete?.({ draft: null });
      }
    } finally {
      setJobs((current) => {
        const keys = [slotIndex];
        if (
          elbise &&
          slotIndex === requiredSlots - 1 &&
          packshotSlot != null
        ) {
          keys.push(packshotSlot);
        }
        let next = current;
        for (const key of keys) {
          const job = next[key];
          if (job?.previewUrl) URL.revokeObjectURL(job.previewUrl);
          const { [key]: _removed, ...rest } = next;
          next = rest;
        }
        return next;
      });
    }
  }

  function dismissElbiseGate() {
    setElbiseGateOpen(false);
  }

  async function confirmElbiseGate() {
    if (!elbiseGate || packshotSlot == null || elbiseGateBusy) return;
    const confirmedFamily = gateFamily;
    const confirmedCategory =
      confirmedFamily === "elbise"
        ? "elbise"
        : gateCategory;
    const neckline = gateChips.neckline.trim();
    const sleeves = gateChips.sleeves.trim();
    const fit = gateChips.fit.trim();
    const length = gateChips.length.trim();
    const decollete = gateChips.decollete.trim();
    const rise = gateChips.rise.trim();
    const hem = gateChips.hem.trim();
    if (
      !confirmedFamily ||
      !constructionTriageReady(
        confirmedFamily,
        confirmedCategory,
        gateChips,
      )
    ) {
      onError(
        confirmedFamily
          ? constructionGateErrorCopy(confirmedFamily, confirmedCategory)
          : "Tür seçin.",
      );
      return;
    }
    onError(null);

    const detailUrl =
      imagesRef.current[ELBISE_DETAIL_SLOT]?.trim() ||
      elbiseGate.detailUrl ||
      "";
    const chips = constructionChipsForFamily(
      { neckline, sleeves, fit, length, decollete, rise, hem },
      confirmedFamily,
      detailUrl,
    );
    const changed = !constructionChipsEqual(chips, elbiseGate.proposed);
    const needsRewrite = changed || !elbiseGate.promptFront?.trim();

    const chipFeatures =
      confirmedFamily === "alt-giyim"
        ? {
            fit: chips.fit ?? fit,
            length: chips.length ?? length,
            ...(chips.rise ? { rise: chips.rise } : {}),
            ...(chips.hem ? { neckHem: chips.hem } : {}),
          }
        : {
            neckline: chips.neckline ?? neckline,
            sleeves: chips.sleeves ?? sleeves,
            fit: chips.fit ?? fit,
            length: chips.length ?? length,
            decollete: chips.decollete ?? decollete,
          };

    setElbiseGateBusy(true);
    try {
      let promptFront = elbiseGate.promptFront;
      let draft: OwnerListingDraft | null = elbiseGate.draft
        ? {
            ...elbiseGate.draft,
            features: {
              ...elbiseGate.draft.features,
              ...chipFeatures,
            },
          }
        : {
            title: "",
            description: "",
            features: chipFeatures,
          };
      if (confirmedFamily === "alt-giyim" && draft.features) {
        const nextFeatures = { ...draft.features };
        delete nextFeatures.neckline;
        delete nextFeatures.sleeves;
        delete nextFeatures.decollete;
        if (!rise) delete nextFeatures.rise;
        if (!hem) delete nextFeatures.neckHem;
        draft = { ...draft, features: nextFeatures };
      } else if (!decollete && draft.features) {
        const nextFeatures = { ...draft.features };
        delete nextFeatures.decollete;
        draft = { ...draft, features: nextFeatures };
      }
      draft = {
        ...applyConstructionListingTitle(draft, confirmedFamily),
        category: confirmedCategory,
      };

      let prompt = "";
      if (needsRewrite) {
        try {
          const prepared = await requestOwnerPackshotPrepare({
            boutiqueId,
            sourceImageUrl: elbiseGate.frontUrl,
            backImageUrl: elbiseGate.backUrl,
            detailImageUrl:
              imagesRef.current[ELBISE_DETAIL_SLOT]?.trim() ||
              elbiseGate.detailUrl ||
              undefined,
            title: draft.title || title,
            category: confirmedCategory,
            view: "front",
            uploadType: confirmedFamily,
            existingTitle: draft.title || title,
            existingDescription: draft.description,
            lockedConstruction: chips,
          });
          promptFront = prepared.listingDraft?.promptFront ?? promptFront;
          if (prepared.listingDraft?.title?.trim()) {
            const ornament =
              prepared.listingDraft.features?.ornament?.trim() ||
              draft.features?.ornament?.trim();
            draft = {
              ...applyConstructionListingTitle(
                {
                  ...prepared.listingDraft,
                  features: {
                    ...prepared.listingDraft.features,
                    ...chipFeatures,
                    ...(ornament ? { ornament } : {}),
                  },
                },
                confirmedFamily,
              ),
              category: confirmedCategory,
            };
          }
        } catch (rewriteError) {
          console.warn(
            "[guided-upload] elbise prompt rewrite failed:",
            rewriteError instanceof Error
              ? rewriteError.message
              : rewriteError,
          );
        }
      }

      prompt = buildElbisePackshotPrompt(
        promptFront,
        chips,
        confirmedFamily,
        detailUrl,
      );

      onUploadTypeChange?.(confirmedFamily);
      onCategoryChange?.(confirmedCategory);
      if (onListingDraft && draft.title.trim()) {
        onListingDraft({ ...draft, promptFront });
      } else if (onListingDraft) {
        onListingDraft({
          ...draft,
          title: draft.title,
          promptFront,
        });
      }
      onFrontAnalysisComplete?.({
        draft: draft.title.trim() ? { ...draft, promptFront } : draft,
      });
      setElbiseGateOpen(false);
      setElbiseGate(null);

      setJobs((current) => ({
        ...current,
        [packshotSlot]: {
          slotIndex: packshotSlot,
          previewUrl: "",
          roleLabel: "Ön packshot",
          stage: "queued",
          progressPct: 48,
        },
      }));

      const pack = await scheduleAiJobRef.current(
        () =>
          requestOwnerPackshot({
            boutiqueId,
            sourceImageUrl: elbiseGate.frontUrl,
            productId: productId ?? undefined,
            title: draft.title || title,
            category: confirmedCategory,
            view: "front",
            numImages: 1,
            prompt,
            listingDraft: draft.title.trim() ? draft : null,
            uploadType: confirmedFamily,
          }),
        {
          onStart: () => {
            setJobs((current) => {
              const job = current[packshotSlot];
              if (!job) return current;
              return {
                ...current,
                [packshotSlot]: {
                  ...job,
                  stage: "packshot",
                  progressPct: Math.max(job.progressPct, 52),
                },
              };
            });
          },
        },
      );

      const stillSameSource =
        `${imagesRef.current[0]?.trim() ?? ""}|${imagesRef.current[1]?.trim() ?? ""}|${imagesRef.current[2]?.trim() ?? ""}` ===
        elbiseGate.sourceToken;
      if (
        stillSameSource &&
        pack.status === "succeeded" &&
        pack.imageUrls[0]?.trim()
      ) {
        const packUrl = pack.imageUrls[0].trim();
        onImagesChange(setSlotInList(imagesRef.current, packshotSlot, packUrl));
        onMarketplaceImagesChange(
          setSlotInList(marketplaceRef.current, packshotSlot, packUrl),
        );
      } else if (stillSameSource) {
        onError(pack.error?.trim() || "Ön packshot oluşturulamadı.");
      }
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Packshot oluşturulamadı.",
      );
    } finally {
      setElbiseGateBusy(false);
      setJobs((current) => {
        const job = current[packshotSlot];
        if (job?.previewUrl) URL.revokeObjectURL(job.previewUrl);
        const { [packshotSlot]: _removed, ...rest } = current;
        return rest;
      });
    }
  }

  async function recreatePackshot() {
    if (
      packshotSlot == null ||
      jobs[packshotSlot] ||
      disabled ||
      elbiseGateBusy
    ) {
      return;
    }
    const frontUrl = imagesRef.current[0]?.trim();
    const backUrl = imagesRef.current[1]?.trim();
    if (!frontUrl || !backUrl) {
      onError("Packshot yenilemek için ön ve arka manken gerekli.");
      return;
    }
    const detailUrl = imagesRef.current[ELBISE_DETAIL_SLOT]?.trim() || "";
    const chips = emptyElbiseGateChips(
      chipsFromProductFeatures(features ?? listingDraft?.features, family),
      { hasDetailPhoto: Boolean(detailUrl) },
    );
    if (!elbiseGateReady(chips, family, shopCategory)) {
      onError(constructionGateErrorCopy(family, shopCategory));
      return;
    }
    onError(null);
    const prompt = buildElbisePackshotPrompt(
      listingDraft?.promptFront,
      chips,
      family,
      detailUrl,
    );
    const sourceToken = `${frontUrl}|${backUrl}|${imagesRef.current[2]?.trim() ?? ""}`;
    setJobs((current) => ({
      ...current,
      [packshotSlot]: {
        slotIndex: packshotSlot,
        previewUrl: "",
        roleLabel: "Ön packshot",
        stage: "queued",
        progressPct: 48,
      },
    }));
    try {
      const pack = await scheduleAiJobRef.current(
        () =>
          requestOwnerPackshot({
            boutiqueId,
            sourceImageUrl: frontUrl,
            productId: productId ?? undefined,
            title: listingDraft?.title || title,
            category:
              family === "elbise"
                ? "elbise"
                : listingDraft?.category || category,
            view: "front",
            numImages: 1,
            prompt,
            listingDraft: listingDraft?.title?.trim() ? listingDraft : null,
            uploadType: family,
          }),
        {
          onStart: () => {
            setJobs((current) => {
              const job = current[packshotSlot];
              if (!job) return current;
              return {
                ...current,
                [packshotSlot]: {
                  ...job,
                  stage: "packshot",
                  progressPct: Math.max(job.progressPct, 52),
                },
              };
            });
          },
        },
      );
      const stillSameSource =
        `${imagesRef.current[0]?.trim() ?? ""}|${imagesRef.current[1]?.trim() ?? ""}|${imagesRef.current[2]?.trim() ?? ""}` ===
        sourceToken;
      if (
        stillSameSource &&
        pack.status === "succeeded" &&
        pack.imageUrls[0]?.trim()
      ) {
        const packUrl = pack.imageUrls[0].trim();
        onImagesChange(setSlotInList(imagesRef.current, packshotSlot, packUrl));
        onMarketplaceImagesChange(
          setSlotInList(marketplaceRef.current, packshotSlot, packUrl),
        );
      } else if (stillSameSource) {
        onError(pack.error?.trim() || "Packshot yenilenemedi.");
      }
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Packshot yenilenemedi.",
      );
    } finally {
      setJobs((current) => {
        const job = current[packshotSlot];
        if (job?.previewUrl) URL.revokeObjectURL(job.previewUrl);
        const { [packshotSlot]: _removed, ...rest } = current;
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
    if (index < requiredSlots) {
      onFrontSlotResetRef.current?.();
      if (elbise) {
        setElbiseGate(null);
        setElbiseGateOpen(false);
        setGateFamily(null);
        setGateCategory(null);
        setGateChips(emptyElbiseGateChips());
      }
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

    const pinned =
      index < guidedSlots || (packshotSlot != null && index === packshotSlot);
    if (elbise && index < requiredSlots) {
      setElbiseGate(null);
      setElbiseGateOpen(false);
      setGateFamily(null);
      setGateCategory(null);
      setGateChips(emptyElbiseGateChips());
    }
    const packshotImage =
      elbise && index < requiredSlots && packshotSlot != null
        ? images[packshotSlot]?.trim() || ""
        : "";
    const packshotMarketplace =
      elbise && index < requiredSlots && packshotSlot != null
        ? marketplaceImages[packshotSlot]?.trim() || ""
        : "";

    softUndoSnapshotRef.current = {
      index,
      image,
      marketplace,
      packshotImage,
      packshotMarketplace,
    };
    if (pinned) {
      let nextImages = setSlotInList(images, index, "");
      let nextMarket = setSlotInList(marketplaceImages, index, "");
      if (packshotImage || packshotMarketplace) {
        nextImages = setSlotInList(nextImages, packshotSlot!, "");
        nextMarket = setSlotInList(nextMarket, packshotSlot!, "");
      }
      onImagesChange(nextImages);
      onMarketplaceImagesChange(nextMarket);
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
          if (current.index < requiredSlots) {
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
    const pinned =
      snap.index < requiredSlots ||
      (packshotSlot != null && snap.index === packshotSlot);
    if (pinned) {
      let nextImages = setSlotInList(imagesRef.current, snap.index, snap.image);
      let nextMarket = setSlotInList(
        marketplaceRef.current,
        snap.index,
        snap.marketplace,
      );
      if (packshotSlot != null && (snap.packshotImage || snap.packshotMarketplace)) {
        nextImages = setSlotInList(
          nextImages,
          packshotSlot,
          snap.packshotImage ?? "",
        );
        nextMarket = setSlotInList(
          nextMarket,
          packshotSlot,
          snap.packshotMarketplace ?? "",
        );
      }
      onImagesChange(nextImages);
      onMarketplaceImagesChange(nextMarket);
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
    ? describePhotoSlotCost(pending.slotIndex, uploadType, {
        deferPackshot: deferConstructionPackshot,
      })
    : null;

  const showPicker =
    !disabled &&
    nextSlot != null &&
    nextSlot < TR_OWNER_PRODUCT_LIMITS.maxImages;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {Array.from({ length: guidedSlots }, (_, i) => i).map((i) => {
          const done = Boolean(images[i]?.trim());
          const running = Boolean(jobs[i]);
          const active = nextSlot === i;
          const slotLabel =
            i === 0 ? "1 · Ön" : i === 1 ? "2 · Arka" : "3 · Detay";
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
                {slotLabel}
                {done ? " ✓" : running ? " …" : ""}
              </div>
              {i < guidedSlots - 1 ? (
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
            disabled={disabled}
            onDragOver={(event) => onDragOverTarget(event, "picker")}
            onDragLeave={(event) => onDragLeaveTarget(event, "picker")}
            onDrop={(event) => onDropOnTarget(event, nextSlot)}
            className={`group relative flex min-h-[5.75rem] w-full items-center gap-3 overflow-hidden rounded-xl border-2 border-dashed px-3 py-3 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-4 sm:px-4 ${
              dragOver === "picker"
                ? "border-[color:var(--panel-accent)] bg-[color:var(--panel-accent-softer)]"
                : "border-[color:var(--panel-accent-border)] bg-[#F7F5F1]"
            }`}
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
              className="relative z-[1] h-14 w-11 shrink-0 text-neutral-700 transition-transform duration-300 group-hover:scale-[1.02] sm:h-16 sm:w-12"
            />
            <span className="relative z-[1] min-w-0">
              <span
                className="block text-[16px] font-semibold"
                style={{ color: "var(--panel-accent-deep)" }}
              >
                {phaseCopy.cta}
              </span>
              <span className="mt-0.5 block text-[13px] leading-snug text-neutral-600">
                {phase === "detail"
                  ? "Sürükleyip bırakın veya seçin — atlayabilirsiniz"
                  : phase === "extras"
                    ? "Sürükleyip bırakın veya seçin — isteğe bağlı"
                    : "Sürükleyip bırakın veya fotoğraf seçin"}
              </span>
            </span>
          </button>
        ) : null}

        {elbise && phase === "detail" && !detailClaimed ? (
          <button
            type="button"
            className={`${panelSecondaryBtnClass} w-full`}
            disabled={disabled || Boolean(pending)}
            onClick={() => setSkippedDetail(true)}
          >
            Atla — detayı sonra eklerim
          </button>
        ) : null}

        <input
          id={inputId}
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            onFilePicked(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {/* Slot grid: required + packshot job */}
      <div className="flex flex-wrap gap-2.5">
        {Array.from({ length: guidedSlots }, (_, i) => i).map((index) => {
          const job = jobs[index];
          const url = images[index]?.trim();
          const catalogUrl = marketplaceImages[index]?.trim();
          const roleLabel = productPhotoRoleLabel(
            getProductPhotoRole(index, guidedSlots),
          );
          const useCatalogBg = Boolean(catalogUrl && catalogBackgroundCss && !elbise);

          if (job) {
            return (
              <CompactPhotoColumn
                key={`job-${index}`}
                label={roleLabel}
                busy
                action={
                  <CompactJobProgress
                    stageLabel={uploadStageLabel(job.stage)}
                    progressPct={job.progressPct}
                  />
                }
              >
                <CompactThumbFrame
                  className="border-2 border-[color:var(--panel-accent-border)] bg-[#EDE9E2]"
                >
                  {job.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.previewUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-75"
                    />
                  ) : null}
                </CompactThumbFrame>
              </CompactPhotoColumn>
            );
          }

          if (!url) {
            const optionalDetail =
              elbise && index === ELBISE_DETAIL_SLOT;
            const over = dragOver === index;
            return (
              <button
                key={`empty-${index}`}
                type="button"
                disabled={disabled}
                onClick={() => openPickerForSlot(index)}
                onDragOver={(event) => onDragOverTarget(event, index)}
                onDragLeave={(event) => onDragLeaveTarget(event, index)}
                onDrop={(event) => onDropOnTarget(event, index)}
                className={`${COMPACT_THUMB_COL} min-w-0 text-left disabled:opacity-60`}
              >
                <CompactThumbFrame
                  className={`flex items-center justify-center border-2 border-dashed transition-colors duration-200 ${
                    over
                      ? "border-[color:var(--panel-accent)] bg-[color:var(--panel-accent-softer)]"
                      : "border-neutral-200 bg-neutral-50"
                  }`}
                >
                  <span className="px-1 text-center text-[10px] leading-tight text-neutral-400">
                    {over ? "Bırak" : optionalDetail ? "Ekle" : ""}
                  </span>
                </CompactThumbFrame>
                <p className="mt-1 truncate text-center text-[11px] font-semibold leading-tight text-neutral-800">
                  {roleLabel}
                </p>
                {optionalDetail ? (
                  <p className="mt-0.5 text-center text-[10px] leading-tight text-neutral-400">
                    İsteğe bağlı
                  </p>
                ) : null}
              </button>
            );
          }

          const previewSrc = elbise ? url : catalogUrl || url;
          return (
            <CompactPhotoColumn
              key={`${url}-${index}`}
              label={roleLabel}
              action={
                <CompactDeleteButton
                  disabled={disabled || Boolean(jobs[index])}
                  onClick={() => removeAt(index)}
                />
              }
            >
              <CompactThumbFrame
                style={
                  useCatalogBg
                    ? { background: catalogBackgroundCss }
                    : undefined
                }
                className={useCatalogBg ? "bg-transparent" : undefined}
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
                  className={useCatalogBg ? "object-contain p-1" : "object-cover"}
                  sizes="88px"
                />
                <CompactExpandHint />
              </CompactThumbFrame>
            </CompactPhotoColumn>
          );
        })}
        {elbise && packshotSlot != null
          ? (() => {
              const index = packshotSlot;
              const job = jobs[index];
              const url = images[index]?.trim();
              const roleLabel = "Ön packshot";
              if (job) {
                return (
                  <CompactPhotoColumn
                    key="job-packshot"
                    label={roleLabel}
                    busy
                    action={
                      <CompactJobProgress
                        stageLabel={uploadStageLabel(job.stage)}
                        progressPct={job.progressPct}
                      />
                    }
                  >
                    <CompactThumbFrame
                      className="flex items-center justify-center border-2 border-[color:var(--panel-accent-border)] bg-white"
                    >
                      <p className="px-1 text-center text-[10px] leading-tight text-neutral-500">
                        {uploadStageLabel(job.stage)}
                      </p>
                    </CompactThumbFrame>
                  </CompactPhotoColumn>
                );
              }
              if (!url) return null;
              return (
                <CompactPhotoColumn
                  key={`packshot-${url}`}
                  label={roleLabel}
                  action={
                    <CompactRecreateButton
                      disabled={disabled || Boolean(jobs[index])}
                      onClick={() => void recreatePackshot()}
                      creditHint={`${TR_AI_CATALOG_CREDITS.productPackage} kredi`}
                    />
                  }
                >
                  <CompactThumbFrame className="bg-white">
                    <button
                      type="button"
                      className="absolute inset-0 z-[1]"
                      aria-label={`${roleLabel} — büyüt`}
                      onClick={() =>
                        onLightbox?.({ src: url, label: roleLabel })
                      }
                    />
                    <Image
                      src={url}
                      alt={roleLabel}
                      fill
                      className="object-contain p-1"
                      sizes="88px"
                    />
                    <CompactExpandHint />
                  </CompactThumbFrame>
                </CompactPhotoColumn>
              );
            })()
          : null}
      </div>

      {/* Extra completed images beyond required + packshot */}
      {images.length > (elbise ? ELBISE_PACKSHOT_SLOT + 1 : 2) ? (
        <div className="flex flex-wrap gap-2.5">
          {images
            .map((url, index) => ({ url, index }))
            .filter(
              ({ url, index }) =>
                index >= (elbise ? ELBISE_PACKSHOT_SLOT + 1 : 2) &&
                Boolean(url?.trim()),
            )
            .map(({ url, index }) => {
            const catalogUrl = marketplaceImages[index]?.trim();
            const previewSrc = catalogUrl || url;
            const roleLabel = productPhotoRoleLabel(
              getProductPhotoRole(index, guidedSlots),
            );
            return (
              <CompactPhotoColumn
                key={`${url}-${index}`}
                label={roleLabel}
                action={
                  <CompactDeleteButton
                    disabled={disabled}
                    onClick={() => removeAt(index)}
                  />
                }
              >
                <CompactThumbFrame>
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
                    className="object-cover"
                    sizes="88px"
                  />
                  <CompactExpandHint />
                </CompactThumbFrame>
              </CompactPhotoColumn>
            );
          })}
        </div>
      ) : null}

      {!frontClaimed || !backClaimed ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-950">
          {elbise
            ? deferConstructionPackshot
              ? guidedSlots < 3
                ? "Ön ve arka zorunlu. Özellikler sonraki adımda onaylanır — packshot o zaman üretilir."
                : "Ön ve arka zorunlu. Detay isteğe bağlı. Özellikler sonraki adımda onaylanır — packshot o zaman üretilir."
              : triageFamily
                ? `Ön ve arka zorunlu. Detay isteğe bağlı. ${constructionGateRequiredCopy(triageFamily, shopCategory)} onaylayınca packshot üretilir.`
                : "Ön ve arka zorunlu. Detay isteğe bağlı. Gemini önerisini onaylayınca packshot üretilir."
            : "Ön ve arka zorunlu. Ön yüklenirken arka seçebilirsiniz — işlemler paralel ilerler."}
        </p>
      ) : null}

      {elbise &&
      !deferConstructionPackshot &&
      elbiseGate &&
      !elbiseGateOpen &&
      packshotSlot != null &&
      !images[packshotSlot]?.trim() ? (
        <button
          type="button"
          className={`${panelPrimaryBtnClass} w-full`}
          onClick={() => setElbiseGateOpen(true)}
          disabled={disabled || elbiseGateBusy}
        >
          {triageFamily
            ? `${constructionGateRequiredCopy(triageFamily, shopCategory)} onayla — packshot üret`
            : "Tür ve özellikleri onayla — packshot üret"}
        </button>
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
                boutiqueId={boutiqueId}
                freeLabel={
                  elbise
                    ? "Ekstra kredi yok."
                    : pending.slotIndex === 1
                      ? "Ürün paketine dahil — ekstra kredi yok."
                      : "Ekstra kredi yok."
                }
              />

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  className={panelSecondaryBtnClass}
                  onClick={clearPending}
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  className={panelPrimaryBtnClass}
                  onClick={() => void confirmPending()}
                >
                  {elbise || pending.slotIndex >= 2
                    ? "Onayla — bu fotoğrafı kullan"
                    : "Onayla — katalog görseli oluştur"}
                </button>
              </div>
              <TrOwnerCreditsMoreInfoLink
                className="mt-3"
                boutiqueId={boutiqueId}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {elbiseGateOpen && elbiseGate && !deferConstructionPackshot ? (
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
              aria-labelledby={`${inputId}-elbise-gate-title`}
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-xl"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <p
                id={`${inputId}-elbise-gate-title`}
                className="text-[18px] font-semibold text-neutral-900"
              >
                {elbiseGate.draft?.title?.trim()
                  ? "Gemini önerisi"
                  : "Ürünü tanımlayın"}
              </p>
              <p className="mt-1 text-[14px] leading-relaxed text-neutral-600">
                {elbiseGate.draft?.title?.trim()
                  ? `${
                      triageFamily
                        ? `${constructionGateRequiredCopy(triageFamily, shopCategory)} doğru mu? Yanlışsa düzeltin`
                        : "Tür, kategori ve özellikler doğru mu? Yanlışsa düzeltin"
                    } — packshot bu bilgilere kilitlenir.`
                  : "AI tanıyamadı — tür, kategori ve özellikleri seçin. Packshot bu bilgilere kilitlenir."}
                {elbiseGate.detailUrl.trim()
                  ? " Detay isteğe bağlı."
                  : ""}
              </p>

              <div className="mt-5">
                <TrOwnerConstructionTriageFields
                  family={gateFamily}
                  shopCategory={gateCategory}
                  chips={gateChips}
                  disabled={elbiseGateBusy}
                  hasDetailPhoto={Boolean(elbiseGate.detailUrl.trim())}
                  onChange={({ family: nextFamily, category: nextCategory, chips }) => {
                    setGateFamily(nextFamily);
                    setGateCategory(nextCategory);
                    setGateChips(chips);
                  }}
                />
              </div>

              <TrOwnerCreditsCostLine
                className="mt-5"
                credits={TR_AI_CATALOG_CREDITS.productPackage}
                prefix="Ön packshot"
                boutiqueId={boutiqueId}
              />

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  className={panelSecondaryBtnClass}
                  onClick={dismissElbiseGate}
                  disabled={elbiseGateBusy}
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  className={`${panelPrimaryBtnClass} flex-1`}
                  disabled={
                    elbiseGateBusy ||
                    !constructionTriageReady(
                      gateFamily,
                      gateCategory,
                      gateChips,
                    )
                  }
                  onClick={() => void confirmElbiseGate()}
                >
                  {elbiseGateBusy
                    ? "Hazırlanıyor…"
                    : "Onayla ve packshot üret"}
                </button>
              </div>
              <TrOwnerCreditsMoreInfoLink
                className="mt-3"
                boutiqueId={boutiqueId}
              />
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
                {productPhotoRoleLabel(
                  getProductPhotoRole(softUndo.index, guidedSlots),
                )}{" "}
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

/** Required photo slots finished (URLs present). */
export { hasRequiredProductPhotos } from "@/lib/tr/productPhotoChecks";

/** Required slots started (finished or still generating). */
export function hasRequiredProductPhotosStarted(
  images: string[],
  photoJobs: PipelineJobItem[],
  requiredSlots = 2,
): boolean {
  for (let i = 0; i < requiredSlots; i += 1) {
    const kind = pipelineJobKindForSlot(i, requiredSlots);
    const ok =
      Boolean(images[i]?.trim()) ||
      photoJobs.some((j) => j.kind === kind && j.status === "running");
    if (!ok) return false;
  }
  return true;
}
