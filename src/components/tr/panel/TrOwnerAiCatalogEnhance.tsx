"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { TrOwnerAiModelPicker } from "@/components/tr/fashion/panel/TrOwnerAiModelPicker";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import {
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  describeModelPackageCredits,
  describeModelPackageShots,
  TR_AI_CATALOG_CREDITS,
} from "@/lib/tr/fashion/aiCatalog/uploadCostHints";
import {
  TrOwnerCreditsCostLine,
  TrOwnerCreditsMoreInfoLink,
} from "@/components/tr/panel/TrOwnerCreditsInfo";
import {
  getAiModelOptionById,
  getElbiseTryOnPlates,
  isLilaHouseModelId,
  LILA_DEFAULT_PHOTOGRAPHY_STYLE,
  listAiModelOptions,
  type TrLilaPhotographyStyle,
} from "@/lib/tr/aiModel/registry";
import {
  buildElbiseTryOnShots,
  chipsFromProductFeatures,
  elbiseLifestyleShotLabel,
} from "@/lib/tr/aiModel/elbiseTryOn";
import {
  constructionCatalogFamily,
  isConstructionCatalogUpload,
} from "@/lib/tr/fashion/garmentUploadTypes";
import { replaceLifestyleShot } from "@/lib/tr/catalog/productImages";
import {
  lifestyleModelIdAt,
  withLifestyleModelsAll,
  withLifestyleModelShot,
} from "@/lib/tr/catalog/productFeatures";
import type { TrProductFeatures } from "@/types/tr-marketplace";
import { useScheduleAiJob } from "@/components/tr/panel/TrOwnerAiJobQueue";
import { useRegisterLeaveBusy } from "@/components/tr/panel/TrOwnerLeaveGuard";
import {
  requestOwnerAiModelGenerate,
  requestOwnerPackshot,
  updateOwnerProduct,
  type OwnerListingDraft,
} from "@/lib/tr/ownerClient";
import type { PipelineJobItem } from "@/lib/tr/aiCatalog/pipelineProgress";

const quietLinkBtn =
  "w-full text-left text-[13px] font-medium text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline disabled:opacity-50";

const ease = trPanelEase;

export interface TrOwnerAiCatalogEnhanceProps {
  boutiqueId: string;
  boutiqueSlug?: string | null;
  productId?: string | null;
  title?: string;
  category?: string | null;
  images: string[];
  marketplaceImages: string[];
  lifestyleImages: string[];
  selectedModelId: string | null;
  onSelectedModelIdChange: (id: string | null) => void;
  photographyStyle?: TrLilaPhotographyStyle;
  onPhotographyStyleChange?: (style: TrLilaPhotographyStyle) => void;
  onMarketplaceImagesChange: (urls: string[]) => void;
  onLifestyleImagesChange: (urls: string[]) => void;
  onFeaturesChange?: (features: TrProductFeatures) => void;
  onListingDraft?: (draft: OwnerListingDraft) => void;
  onModelJobsChange?: (jobs: PipelineJobItem[]) => void;
  /** Skip model shot and continue (optional step). */
  onSkip?: () => void;
  disabled?: boolean;
  /**
   * Elbise copies manken into marketplace on purpose — do not treat
   * matching URLs as “needs a packshot”.
   */
  skipPackshot?: boolean;
  features?: TrProductFeatures;
  uploadType?: string | null;
}

type EnhancePhase =
  | "idle"
  | "packshot"
  | "tryon"
  | "done"
  | "error";

function lifestylePreviewUrls(urls: string[]): string[] {
  return urls.map((url) => url.trim()).filter(Boolean);
}

function ModelBusySpinner({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "accent";
}) {
  const border =
    tone === "light"
      ? "border-white border-t-transparent"
      : "border-[color:var(--panel-accent)] border-t-transparent";
  return (
    <motion.span
      aria-hidden
      className={`inline-block shrink-0 rounded-full border-2 ${border} ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function TrOwnerAiCatalogEnhance({
  boutiqueId,
  boutiqueSlug,
  productId,
  title,
  category,
  images,
  marketplaceImages,
  lifestyleImages,
  selectedModelId,
  onSelectedModelIdChange,
  photographyStyle = LILA_DEFAULT_PHOTOGRAPHY_STYLE,
  onPhotographyStyleChange,
  onMarketplaceImagesChange,
  onLifestyleImagesChange,
  onFeaturesChange,
  onListingDraft,
  onModelJobsChange,
  onSkip,
  disabled = false,
  skipPackshot = false,
  features,
  uploadType = null,
}: TrOwnerAiCatalogEnhanceProps) {
  const scheduleAiJob = useScheduleAiJob();
  const [phase, setPhase] = useState<EnhancePhase>("idle");
  const [progressLabel, setProgressLabel] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [progressTarget, setProgressTarget] = useState(0);
  const [runMode, setRunMode] = useState<"create" | "replace" | null>(null);
  const [busyShotIndex, setBusyShotIndex] = useState<number | "all" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenDraftModelId, setRegenDraftModelId] = useState<string | null>(
    null,
  );
  const [regenDraftStyle, setRegenDraftStyle] =
    useState<TrLilaPhotographyStyle>(photographyStyle);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const regenTitleId = useId();
  const regenBodyId = useId();

  const options = useMemo(
    () => listAiModelOptions(boutiqueSlug),
    [boutiqueSlug],
  );
  const selectedReady = options.find((o) => o.id === selectedModelId)?.ready;
  const previewUrls = lifestylePreviewUrls(lifestyleImages);
  const hasModelPhoto = previewUrls.length > 0;
  const family = constructionCatalogFamily(uploadType, category);
  const elbise = skipPackshot || isConstructionCatalogUpload(uploadType);
  const dressChips = chipsFromProductFeatures(features, family);
  const packshotUrl =
    marketplaceImages[3]?.trim() || images[3]?.trim() || "";
  const backMankenUrl = images[1]?.trim() || marketplaceImages[1]?.trim() || "";
  const detailMankenUrl =
    images[2]?.trim() || marketplaceImages[2]?.trim() || "";
  const costContext = elbise
    ? {
        uploadType: family ?? "elbise",
        features: dressChips,
        detailImageUrl: detailMankenUrl,
      }
    : undefined;
  const shotCount = describeModelPackageShots(selectedModelId, costContext);
  const modelCredits = describeModelPackageCredits(
    selectedModelId,
    costContext,
  );
  const lilaSelected = isLilaHouseModelId(selectedModelId);
  const storedPrimary =
    lifestyleModelIdAt(features, 0) ||
    lifestyleModelIdAt(features, 1) ||
    lifestyleModelIdAt(features, 2);
  const chipModelId = hasModelPhoto ? storedPrimary : selectedModelId;
  const hasBackPlate = Boolean(
    (chipModelId || selectedModelId) &&
      getElbiseTryOnPlates(chipModelId || selectedModelId)?.back,
  );
  const currentModel = chipModelId
    ? getAiModelOptionById(chipModelId, boutiqueSlug)
    : null;
  const regenDraftReady = options.find(
    (o) => o.id === regenDraftModelId,
  )?.ready;
  const regenDraftCredits = describeModelPackageCredits(
    regenDraftModelId,
    costContext,
  );

  const slotSources = useMemo(() => {
    const slots: Array<{ index: number; source: string }> = [];
    for (let i = 0; i < Math.min(2, images.length); i++) {
      const source =
        marketplaceImages[i]?.trim() || images[i]?.trim() || "";
      if (source) slots.push({ index: i, source });
    }
    return slots;
  }, [images, marketplaceImages]);

  const busy = phase === "packshot" || phase === "tryon";
  useRegisterLeaveBusy("ai-catalog-enhance", busy);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!regenOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRegenOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [regenOpen]);

  useEffect(() => {
    if (!busy || progressPct >= progressTarget) return;
    const timer = window.setInterval(() => {
      setProgressPct((current) => {
        if (current >= progressTarget) return current;
        const step = phase === "tryon" ? 0.55 : 0.9;
        return Math.min(progressTarget, current + step);
      });
    }, 120);
    return () => window.clearInterval(timer);
  }, [busy, phase, progressPct, progressTarget]);

  const pushProgress = (
    pct: number,
    detail: string,
    label = "Model / katalog",
  ) => {
    setProgressLabel(detail);
    setProgressTarget(pct);
    setProgressPct((current) => Math.max(current, Math.max(0, pct - 10)));
    onModelJobsChange?.([
      {
        id: "model-pack",
        kind: "model",
        label,
        status: "running",
        progressPct: pct,
        detail,
      },
    ]);
  };

  const garmentsReady = elbise
    ? Boolean(packshotUrl && backMankenUrl)
    : slotSources.length >= 2;

  const canGenerate =
    !disabled &&
    !busy &&
    garmentsReady &&
    Boolean(selectedModelId) &&
    Boolean(selectedReady);

  function openRegenSheet() {
    setConfirmDelete(false);
    setRegenDraftModelId(selectedModelId || storedPrimary || null);
    setRegenDraftStyle(photographyStyle);
    setRegenOpen(true);
  }

  async function runEnhance(
    mode: "create" | "replace",
    override?: {
      modelId: string;
      photographyStyle?: TrLilaPhotographyStyle;
      shotIndex?: number;
    },
  ) {
    const modelId = override?.modelId ?? selectedModelId;
    const style = override?.photographyStyle ?? photographyStyle;
    const shotIndex = override?.shotIndex;
    const singleShot = typeof shotIndex === "number";
    const modelReady = options.find((o) => o.id === modelId)?.ready;
    const ready = elbise
      ? Boolean(packshotUrl && backMankenUrl)
      : slotSources.length >= 2;
    if (disabled || busy || !ready || !modelId || !modelReady) {
      return;
    }
    if (mode === "create" && hasModelPhoto) return;
    if (mode === "replace" && !hasModelPhoto) return;

    if (!singleShot) {
      if (modelId) onSelectedModelIdChange(modelId);
      if (style !== photographyStyle) onPhotographyStyleChange?.(style);
    }

    setRegenOpen(false);
    setConfirmDelete(false);
    setError(null);
    setRunMode(mode);
    setBusyShotIndex(singleShot ? shotIndex : "all");
    if (elbise) {
      setPhase("tryon");
      setProgressPct(8);
      setProgressTarget(16);
      pushProgress(
        16,
        mode === "replace" ? "Model kareleri yenileniyor…" : "Model kareleri hazırlanıyor…",
        "Model çekimi",
      );
    } else {
      setPhase("packshot");
      setProgressPct(4);
      setProgressTarget(12);
      pushProgress(
        12,
        mode === "replace" ? "Yenileme hazırlanıyor…" : "Katalog kontrolü…",
      );
    }

    try {
      const nextMarketplace = [...marketplaceImages];
      while (nextMarketplace.length < images.length) {
        nextMarketplace.push("");
      }

      if (!skipPackshot && !singleShot) {
        for (let i = 0; i < slotSources.length; i++) {
          const slot = slotSources[i]!;
          const existing = nextMarketplace[slot.index]?.trim();
          if (existing && existing !== images[slot.index]?.trim()) {
            continue;
          }
          const detail = `Katalog görseli ${i + 1}/${slotSources.length}…`;
          pushProgress(18 + i * 14, "Sırada…");
          const pack = await scheduleAiJob(
            () =>
              requestOwnerPackshot({
                boutiqueId,
                sourceImageUrl: slot.source,
                productId: productId ?? undefined,
                title,
                category,
                view: slot.index === 1 ? "back" : "front",
                numImages: 1,
              }),
            {
              onStart: () => pushProgress(22 + i * 14, detail),
            },
          );
          if (pack.status !== "succeeded" || !pack.imageUrls[0]) {
            throw new Error(pack.error ?? "Katalog görseli üretilemedi.");
          }
          nextMarketplace[slot.index] = pack.imageUrls[0];
          if (
            slot.index === 0 &&
            pack.listingDraft?.title?.trim() &&
            onListingDraft
          ) {
            onListingDraft({
              title: pack.listingDraft.title.trim(),
              description: pack.listingDraft.description?.trim() ?? "",
              features: pack.listingDraft.features ?? {},
            });
          }
        }
      }
      onMarketplaceImagesChange(nextMarketplace);

      setPhase("tryon");
      let generateInput: Parameters<typeof requestOwnerAiModelGenerate>[0];
      if (elbise) {
        const packshot =
          nextMarketplace[3]?.trim() || packshotUrl;
        const planned = buildElbiseTryOnShots({
          modelId,
          packshotUrl: packshot,
          backMankenUrl,
          detailMankenUrl,
          chips: dressChips,
        });
        if (planned.error || planned.shots.length === 0) {
          throw new Error(
            planned.error ?? "Model kareleri hazırlanamadı.",
          );
        }
        const shots = singleShot
          ? planned.shots.slice(shotIndex, shotIndex + 1)
          : planned.shots;
        if (shots.length === 0) {
          throw new Error("Bu kare yenilenemedi.");
        }
        generateInput = {
          boutiqueId,
          cutoutImageUrl: shots[0]!.cutoutImageUrl,
          productId: productId ?? undefined,
          title,
          category,
          modelId,
          shots,
          replaceLifestyleIndex: singleShot ? shotIndex : undefined,
        };
      } else {
        const frontGarment = nextMarketplace[0]?.trim() || "";
        if (!frontGarment) {
          throw new Error(
            "Model için ön katalog (packshot) görseli gerekli.",
          );
        }
        generateInput = {
          boutiqueId,
          cutoutImageUrl: frontGarment,
          productId: productId ?? undefined,
          title,
          category,
          modelId,
          photographyStyle: isLilaHouseModelId(modelId) ? style : undefined,
          pose: "standing-front",
          replaceLifestyleIndex: singleShot ? shotIndex : undefined,
        };
      }

      const tryOnDetail = singleShot
        ? `${elbiseLifestyleShotLabel(shotIndex, shotCount, hasBackPlate)} yenileniyor…`
        : mode === "replace"
          ? shotCount > 1
            ? "Model fotoğrafları yenileniyor…"
            : "Model fotoğrafı yenileniyor…"
          : shotCount > 1
            ? "Model fotoğrafları oluşturuluyor…"
            : "Model fotoğrafı oluşturuluyor…";
      pushProgress(68, "Sırada…", "Model çekimi");
      const result = await scheduleAiJob(
        () => requestOwnerAiModelGenerate(generateInput),
        {
          onStart: () =>
            pushProgress(72, tryOnDetail, "Model çekimi"),
        },
      );
      const produced = lifestylePreviewUrls(
        result.imageUrls?.length ? result.imageUrls : result.imageUrl ? [result.imageUrl] : [],
      );
      if (result.status !== "succeeded" || produced.length === 0) {
        throw new Error(result.error ?? "Model görseli üretilemedi.");
      }

      const nextLifestyle = singleShot
        ? replaceLifestyleShot(previewUrls, shotIndex, produced[0]!)
        : produced;
      const usedCredits = singleShot
        ? TR_AI_CATALOG_CREDITS.modelPackage
        : modelCredits;

      setProgressPct(100);
      setProgressTarget(100);
      onLifestyleImagesChange(nextLifestyle);
      onFeaturesChange?.(
        singleShot
          ? withLifestyleModelShot(
              features,
              shotIndex,
              modelId,
              nextLifestyle.length,
            )
          : withLifestyleModelsAll(features, modelId, nextLifestyle.length),
      );
      setPhase("done");
      setBusyShotIndex(null);
      setProgressLabel(
        productId
          ? mode === "replace"
            ? `Model fotoğrafı yenilendi ve kaydedildi (${usedCredits} kredi).`
            : `Model fotoğrafı kaydedildi (${usedCredits} kredi).`
          : mode === "replace"
            ? `Model fotoğrafı yenilendi (${usedCredits} kredi).`
            : `Model fotoğrafı hazır (${usedCredits} kredi).`,
      );
      setRunMode(null);
      onModelJobsChange?.([]);
    } catch (err) {
      setPhase("error");
      setRunMode(null);
      setBusyShotIndex(null);
      setProgressPct(0);
      setProgressTarget(0);
      setError(err instanceof Error ? err.message : "İşlem başarısız.");
      setProgressLabel("");
      onModelJobsChange?.([
        {
          id: "model-pack",
          kind: "model",
          label: "Model / katalog",
          status: "error",
          progressPct: 0,
          detail: err instanceof Error ? err.message : "İşlem başarısız.",
        },
      ]);
    }
  }

  async function deleteModelPhoto() {
    setConfirmDelete(false);
    setRegenOpen(false);
    onLifestyleImagesChange([]);
    setPhase("idle");
    setProgressLabel("");
    setProgressPct(0);
    setProgressTarget(0);
    setRunMode(null);
    setBusyShotIndex(null);
    setError(null);
    if (!productId) return;
    try {
      await updateOwnerProduct(productId, { lifestyleImages: [] });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Model fotoğrafı silinemedi.",
      );
    }
  }

  if (images.length === 0) return null;

  const roundedPct = Math.round(progressPct);

  return (
    <div className="space-y-4 rounded-2xl border-2 border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-softer)]/40 p-4">
      <div>
        <p className="text-[17px] font-semibold text-neutral-800">
          Model fotoğrafı
        </p>
        <p className="mt-1 text-[14px] text-neutral-600">
          {elbise
            ? shotCount > 2
              ? "2 stüdyo karesi (üç-çeyrek + sırt) ve 1 detay karesi."
              : "2 stüdyo karesi: üç-çeyrek ve sırt. Detay fotoğrafı varsa üçüncü kare eklenir."
            : lilaSelected
              ? "Seçilen ışık stilinden 1 model karesi."
              : "Ürün başına 1 model karesi (ön)."}
          {onSkip ? " İsterseniz bu adımı atlayabilirsiniz." : ""}
        </p>
      </div>

      {!hasModelPhoto ? (
        <TrOwnerAiModelPicker
          boutiqueSlug={boutiqueSlug}
          value={selectedModelId}
          onChange={onSelectedModelIdChange}
          photographyStyle={photographyStyle}
          onPhotographyStyleChange={onPhotographyStyleChange}
          hidePhotographyStyle={elbise}
          disabled={disabled || busy}
        />
      ) : !busy && currentModel ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--panel-accent-border)] bg-white px-3 py-3">
          {currentModel.referenceImageUrls[0] ? (
            <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentModel.referenceImageUrls[0]}
                alt=""
                className="h-full w-full object-cover object-top"
              />
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-neutral-900">
              {currentModel.label}
            </p>
            <p className="text-[13px] text-neutral-600">Kullanılan model</p>
          </div>
        </div>
      ) : null}

      {previewUrls.length > 0 ? (
        <div className={previewUrls.length > 1 ? "grid grid-cols-2 gap-3" : "sm:max-w-xs"}>
          {previewUrls.map((url, index) => {
            const shotBusy =
              busy &&
              (busyShotIndex === "all" || busyShotIndex === index);
            const shotModelId = lifestyleModelIdAt(features, index);
            const shotModel = shotModelId
              ? getAiModelOptionById(shotModelId, boutiqueSlug)
              : null;
            const canRegenShot =
              !disabled &&
              !busy &&
              garmentsReady &&
              Boolean(shotModelId) &&
              Boolean(shotModel?.ready);
            const shotLabel = elbise
              ? elbiseLifestyleShotLabel(
                  index,
                  previewUrls.length,
                  Boolean(
                    shotModelId && getElbiseTryOnPlates(shotModelId)?.back,
                  ),
                )
              : "Model karesi";
            return (
              <div key={`${index}-${url}`} className="space-y-2">
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className={`h-full w-full object-cover transition-[filter,opacity,transform] duration-500 ease-out ${
                      shotBusy
                        ? "scale-[1.03] opacity-45 blur-[2px]"
                        : "scale-100 opacity-100 blur-0"
                    }`}
                  />
                  <AnimatePresence>
                    {shotBusy ? (
                      <motion.div
                        key={`model-busy-${index}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease }}
                        className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-black/70 via-black/35 to-black/10 p-4"
                        aria-live="polite"
                        aria-busy="true"
                      >
                        <div className="mb-auto mt-10 flex flex-col items-center gap-3 text-center">
                          <ModelBusySpinner className="h-8 w-8" />
                          <p className="text-[13px] font-semibold tracking-[0.04em] text-white uppercase">
                            Yenileniyor
                          </p>
                        </div>
                        <div className="w-full space-y-2">
                          <div className="flex items-end justify-between gap-2">
                            <p className="min-w-0 text-[12px] leading-snug text-white/90">
                              {progressLabel || "İşleniyor…"}
                            </p>
                            <span className="shrink-0 text-[12px] font-semibold tabular-nums text-white">
                              {roundedPct}%
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                            <motion.div
                              className="h-full rounded-full bg-white"
                              animate={{ width: `${progressPct}%` }}
                              transition={{ duration: 0.35, ease }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
                <p className="text-[13px] font-semibold text-neutral-800">
                  {shotLabel}
                  {shotModel ? ` · ${shotModel.label}` : ""}
                </p>
                <button
                  type="button"
                  className={`${panelSecondaryBtnClass} min-h-11 w-full`}
                  disabled={!canRegenShot}
                  onClick={() => {
                    if (!shotModelId) return;
                    void runEnhance("replace", {
                      modelId: shotModelId,
                      shotIndex: index,
                    });
                  }}
                >
                  Bu kareyi yenile
                </button>
                <p className="text-center text-[12px] text-neutral-500">
                  {shotModelId
                    ? `${TR_AI_CATALOG_CREDITS.modelPackage} kredi`
                    : "Model kaydı yok — tüm kareleri bir model ile üretin"}
                </p>
              </div>
            );
          })}
          {!busy ? (
            <p
              className={`text-[13px] font-medium text-emerald-800 ${
                previewUrls.length > 1 ? "col-span-full" : ""
              }`}
            >
              {previewUrls.length > 1
                ? `${previewUrls.length} model karesi hazır.`
                : "Model fotoğrafı hazır — ürün başına 1 adet."}
            </p>
          ) : null}
        </div>
      ) : null}

      {!hasModelPhoto && busy ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className={shotCount > 1 ? "grid grid-cols-2 gap-3" : "sm:max-w-xs"}
          aria-live="polite"
          aria-busy="true"
        >
          {Array.from({ length: shotCount }, (_, index) => (
            <div
              key={`pending-${index}`}
              className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[color:var(--panel-accent-soft)]"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                <ModelBusySpinner className="h-8 w-8" tone="accent" />
                <p className="text-[13px] font-semibold text-neutral-800">
                  {shotCount > 1
                    ? `Kare ${index + 1}/${shotCount}`
                    : "Model oluşturuluyor"}
                </p>
                <p className="text-[12px] text-neutral-600">
                  {progressLabel || "Hazırlanıyor…"}
                </p>
              </div>
              <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-4">
                <div className="flex justify-between text-[11px] font-semibold tabular-nums text-neutral-700">
                  <span>İlerleme</span>
                  <span>{roundedPct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/70">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--panel-accent)" }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.35, ease }}
                  />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      ) : null}

      {!hasModelPhoto && !busy ? (
        <button
          type="button"
          className={panelPrimaryBtnClass}
          disabled={!canGenerate}
          onClick={() => void runEnhance("create")}
        >
          Model fotoğrafı oluştur
        </button>
      ) : null}

      {hasModelPhoto && !busy && !confirmDelete ? (
        <div className="space-y-2 border-t border-black/5 pt-3">
          <button
            type="button"
            className={`${panelSecondaryBtnClass} w-full`}
            disabled={disabled}
            onClick={openRegenSheet}
          >
            Modeli değiştir (tüm kareler)
          </button>
          <button
            type="button"
            className={quietLinkBtn}
            disabled={disabled}
            onClick={() => setConfirmDelete(true)}
          >
            Model fotoğrafını sil…
          </button>
        </div>
      ) : null}

      {confirmDelete && !busy ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50/80 p-4"
          role="alertdialog"
          aria-labelledby="delete-model-title"
          aria-describedby="delete-model-body"
        >
          <p
            id="delete-model-title"
            className="text-[15px] font-semibold text-neutral-900"
          >
            Model fotoğrafı silinsin mi?
          </p>
          <p
            id="delete-model-body"
            className="mt-1.5 text-[13px] leading-relaxed text-neutral-700"
          >
            Üründen kaldırılır. Kaydettiğinizde mağazada da görünmez.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-700 px-4 text-[14px] font-semibold text-white disabled:opacity-50"
              disabled={disabled || busy}
              onClick={deleteModelPhoto}
            >
              Evet, sil
            </button>
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 text-[14px] font-semibold text-neutral-700 disabled:opacity-50"
              disabled={disabled || busy}
              onClick={() => setConfirmDelete(false)}
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : null}

      {onSkip && !hasModelPhoto && !busy && phase !== "done" ? (
        <button
          type="button"
          className="w-full text-center text-[14px] font-semibold text-neutral-600 underline-offset-2 hover:underline disabled:opacity-50"
          disabled={disabled || busy}
          onClick={onSkip}
        >
          Model istemiyorum — atla
        </button>
      ) : null}

      {!hasModelPhoto && !busy ? (
        <>
          <TrOwnerCreditsCostLine
            credits={modelCredits}
            prefix="Bu işlem"
            boutiqueId={boutiqueId}
          />
          <TrOwnerCreditsMoreInfoLink boutiqueId={boutiqueId} />
        </>
      ) : null}

      {!hasModelPhoto && !busy && elbise && !packshotUrl ? (
        <p className="text-[13px] text-amber-800">
          Ön packshot hazır olunca model çekimi açılır.
        </p>
      ) : null}

      {!hasModelPhoto && !busy && !selectedModelId ? (
        <p className="text-[13px] text-neutral-600">Önce bir model seçin.</p>
      ) : !hasModelPhoto && !busy && !selectedReady ? (
        <p className="text-[13px] text-amber-800">
          Bu modelin referans fotoğrafları henüz eklenmedi.
        </p>
      ) : null}

      {!busy && progressLabel && phase === "done" ? (
        <p className="text-[14px] font-medium text-emerald-800">
          {progressLabel}
        </p>
      ) : null}
      {error ? (
        <p className="text-[14px] font-medium text-red-700">{error}</p>
      ) : null}

      {portalReady
        ? createPortal(
            <AnimatePresence>
              {regenOpen && !busy ? (
                <motion.div
                  className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setRegenOpen(false)}
                >
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={regenTitleId}
                    aria-describedby={regenBodyId}
                    className="grid w-full max-w-xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-t-3xl border border-[color:var(--panel-accent-border)] bg-white shadow-xl max-h-[calc(100dvh-0.75rem)] sm:rounded-2xl"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.28, ease }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="space-y-3 border-b border-neutral-100 px-5 py-4">
                      <div>
                        <p
                          id={regenTitleId}
                          className="text-[18px] font-semibold text-neutral-900"
                        >
                          Model fotoğrafını yenile
                        </p>
                        <p
                          id={regenBodyId}
                          className="mt-1 text-[14px] leading-relaxed text-neutral-600"
                        >
                          Yeni bir model seçin. Mevcut kare değişir.
                        </p>
                      </div>
                      {previewUrls[0] ? (
                        <div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2">
                          <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewUrls[0]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </span>
                          <p className="text-[13px] text-neutral-600">
                            Şu anki kare değişecek.
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="overflow-y-auto px-5 py-4">
                      <TrOwnerAiModelPicker
                        boutiqueSlug={boutiqueSlug}
                        value={regenDraftModelId}
                        onChange={setRegenDraftModelId}
                        photographyStyle={regenDraftStyle}
                        onPhotographyStyleChange={setRegenDraftStyle}
                        hidePhotographyStyle={elbise}
                        variant="sheet"
                        allowDeselect={false}
                        autoSelectDefault={false}
                      />
                      {!regenDraftModelId ? (
                        <p className="mt-3 text-[13px] text-neutral-600">
                          Önce bir model seçin.
                        </p>
                      ) : !regenDraftReady ? (
                        <p className="mt-3 text-[13px] text-amber-800">
                          Bu modelin referans fotoğrafları henüz eklenmedi.
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2 border-t border-neutral-100 bg-white px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                      <button
                        type="button"
                        className={`${panelPrimaryBtnClass} w-full`}
                        disabled={
                          disabled ||
                          !regenDraftModelId ||
                          !regenDraftReady ||
                          !garmentsReady
                        }
                        onClick={() => {
                          if (!regenDraftModelId) return;
                          void runEnhance("replace", {
                            modelId: regenDraftModelId,
                            photographyStyle: regenDraftStyle,
                          });
                        }}
                      >
                        Model fotoğrafı oluştur
                      </button>
                      <p className="text-center text-[13px] text-neutral-500">
                        {regenDraftCredits} kredi
                      </p>
                      <button
                        type="button"
                        className={`${panelSecondaryBtnClass} w-full`}
                        disabled={disabled}
                        onClick={() => setRegenOpen(false)}
                      >
                        Vazgeç
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
