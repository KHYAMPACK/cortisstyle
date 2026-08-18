"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { TrOwnerAiModelPicker } from "@/components/tr/panel/TrOwnerAiModelPicker";
import {
  panelPrimaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  describeModelPackageCredits,
  describeModelPackageShots,
} from "@/lib/tr/aiCatalog/uploadCostHints";
import {
  TrOwnerCreditsCostLine,
  TrOwnerCreditsMoreInfoLink,
} from "@/components/tr/panel/TrOwnerCreditsInfo";
import {
  isLilaHouseModelId,
  LILA_DEFAULT_PHOTOGRAPHY_STYLE,
  listAiModelOptions,
  type TrLilaPhotographyStyle,
} from "@/lib/tr/aiModel/registry";
import {
  requestOwnerAiModelGenerate,
  requestOwnerPackshot,
  type OwnerListingDraft,
} from "@/lib/tr/ownerClient";
import type { PipelineJobItem } from "@/lib/tr/aiCatalog/pipelineProgress";

const quietLinkBtn =
  "w-full text-left text-[13px] font-medium text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline disabled:opacity-50";

const ease = [0.22, 1, 0.36, 1] as const;

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
  onListingDraft?: (draft: OwnerListingDraft) => void;
  onModelJobsChange?: (jobs: PipelineJobItem[]) => void;
  /** Skip model shot and continue (optional step). */
  onSkip?: () => void;
  disabled?: boolean;
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
  onListingDraft,
  onModelJobsChange,
  onSkip,
  disabled = false,
}: TrOwnerAiCatalogEnhanceProps) {
  const [phase, setPhase] = useState<EnhancePhase>("idle");
  const [progressLabel, setProgressLabel] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [progressTarget, setProgressTarget] = useState(0);
  const [runMode, setRunMode] = useState<"create" | "replace" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const options = useMemo(
    () => listAiModelOptions(boutiqueSlug),
    [boutiqueSlug],
  );
  const selectedReady = options.find((o) => o.id === selectedModelId)?.ready;
  const previewUrls = lifestylePreviewUrls(lifestyleImages);
  const hasModelPhoto = previewUrls.length > 0;
  const shotCount = describeModelPackageShots(selectedModelId);
  const modelCredits = describeModelPackageCredits(selectedModelId);
  const lilaSelected = isLilaHouseModelId(selectedModelId);

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

  const canGenerate =
    !disabled &&
    !busy &&
    slotSources.length >= 2 &&
    Boolean(selectedModelId) &&
    Boolean(selectedReady);

  async function runEnhance(mode: "create" | "replace") {
    if (!canGenerate || !selectedModelId) return;
    if (mode === "create" && hasModelPhoto) return;
    if (mode === "replace" && !hasModelPhoto) return;

    setConfirmRegen(false);
    setConfirmDelete(false);
    setError(null);
    setRunMode(mode);
    setPhase("packshot");
    setProgressPct(4);
    setProgressTarget(12);
    pushProgress(
      12,
      mode === "replace" ? "Yenileme hazırlanıyor…" : "Katalog kontrolü…",
    );

    try {
      const nextMarketplace = [...marketplaceImages];
      while (nextMarketplace.length < images.length) {
        nextMarketplace.push("");
      }

      for (let i = 0; i < slotSources.length; i++) {
        const slot = slotSources[i]!;
        const existing = nextMarketplace[slot.index]?.trim();
        if (existing && existing !== images[slot.index]?.trim()) {
          continue;
        }
        const detail = `Katalog görseli ${i + 1}/${slotSources.length}…`;
        pushProgress(22 + i * 14, detail);
        const pack = await requestOwnerPackshot({
          boutiqueId,
          sourceImageUrl: slot.source,
          productId: productId ?? undefined,
          title,
          category,
          view: slot.index === 1 ? "back" : "front",
          numImages: 1,
        });
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
      onMarketplaceImagesChange(nextMarketplace);

      setPhase("tryon");
      const frontGarment = nextMarketplace[0]?.trim() || "";
      if (!frontGarment) {
        throw new Error(
          "Model için ön katalog (packshot) görseli gerekli.",
        );
      }

      pushProgress(
        72,
        mode === "replace"
          ? shotCount > 1
            ? "Model fotoğrafları yenileniyor…"
            : "Model fotoğrafı yenileniyor…"
          : shotCount > 1
            ? "Model fotoğrafları oluşturuluyor…"
            : "Model fotoğrafı oluşturuluyor…",
        "Model çekimi",
      );
      const result = await requestOwnerAiModelGenerate({
        boutiqueId,
        cutoutImageUrl: frontGarment,
        productId: productId ?? undefined,
        title,
        category,
        modelId: selectedModelId,
        photographyStyle: lilaSelected ? photographyStyle : undefined,
        pose: "standing-front",
      });
      const produced = lifestylePreviewUrls(
        result.imageUrls?.length ? result.imageUrls : result.imageUrl ? [result.imageUrl] : [],
      );
      if (result.status !== "succeeded" || produced.length === 0) {
        throw new Error(result.error ?? "Model görseli üretilemedi.");
      }

      setProgressPct(100);
      setProgressTarget(100);
      onLifestyleImagesChange(produced);
      setPhase("done");
      setProgressLabel(
        mode === "replace"
          ? `Model fotoğrafı yenilendi (${modelCredits} kredi).`
          : `Model fotoğrafı hazır (${modelCredits} kredi).`,
      );
      setRunMode(null);
      onModelJobsChange?.([]);
    } catch (err) {
      setPhase("error");
      setRunMode(null);
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

  function deleteModelPhoto() {
    setConfirmDelete(false);
    setConfirmRegen(false);
    onLifestyleImagesChange([]);
    setPhase("idle");
    setProgressLabel("");
    setProgressPct(0);
    setProgressTarget(0);
    setRunMode(null);
    setError(null);
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
          {lilaSelected
            ? "Seçilen ışık stilinden 2 farklı kare."
            : "Ürün başına 1 model karesi (ön)."}
          {onSkip ? " İsterseniz bu adımı atlayabilirsiniz." : ""}
        </p>
      </div>

      <TrOwnerAiModelPicker
        boutiqueSlug={boutiqueSlug}
        value={selectedModelId}
        onChange={onSelectedModelIdChange}
        photographyStyle={photographyStyle}
        onPhotographyStyleChange={onPhotographyStyleChange}
        disabled={disabled || busy || (hasModelPhoto && !confirmRegen)}
      />

      {previewUrls.length > 0 ? (
        <div className={shotCount > 1 ? "grid grid-cols-2 gap-3" : "sm:max-w-xs"}>
          {previewUrls.map((url) => (
            <div key={url} className="relative aspect-[2/3] overflow-hidden rounded-xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className={`h-full w-full object-cover transition-[filter,opacity,transform] duration-500 ease-out ${
                  busy
                    ? "scale-[1.03] opacity-45 blur-[2px]"
                    : "scale-100 opacity-100 blur-0"
                }`}
              />
              <AnimatePresence>
                {busy ? (
                  <motion.div
                    key={`model-busy-${url}`}
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
                        {runMode === "replace" ? "Yenileniyor" : "Hazırlanıyor"}
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
          ))}
          {!busy ? (
            <p className={`text-[13px] font-medium text-emerald-800 ${shotCount > 1 ? "col-span-2" : ""}`}>
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

      {hasModelPhoto && !busy && !confirmRegen && !confirmDelete ? (
        <div className="space-y-2 border-t border-black/5 pt-3">
          <button
            type="button"
            className={quietLinkBtn}
            disabled={disabled}
            onClick={() => {
              setConfirmDelete(false);
              setConfirmRegen(true);
            }}
          >
            Yeniden oluştur…
          </button>
          <button
            type="button"
            className={quietLinkBtn}
            disabled={disabled}
            onClick={() => {
              setConfirmRegen(false);
              setConfirmDelete(true);
            }}
          >
            Model fotoğrafını sil…
          </button>
        </div>
      ) : null}

      {confirmRegen && !busy ? (
        <div
          className="rounded-xl border border-neutral-200 bg-white p-4"
          role="alertdialog"
          aria-labelledby="regen-model-title"
          aria-describedby="regen-model-body"
        >
          <p
            id="regen-model-title"
            className="text-[15px] font-semibold text-neutral-900"
          >
            Model fotoğrafı yenilensin mi?
          </p>
          <p
            id="regen-model-body"
            className="mt-1.5 text-[13px] leading-relaxed text-neutral-600"
          >
            Mevcut görseller değişir; aynı kareler tekrar eklenmez. Bu işlem{" "}
            {modelCredits} kredi kullanır.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={`${panelPrimaryBtnClass} min-h-10 px-4 py-2 text-[14px]`}
              disabled={!canGenerate}
              onClick={() => void runEnhance("replace")}
            >
              Evet, yenile
            </button>
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 text-[14px] font-semibold text-neutral-700 disabled:opacity-50"
              disabled={disabled || busy}
              onClick={() => setConfirmRegen(false)}
            >
              Vazgeç
            </button>
          </div>
          {!selectedModelId ? (
            <p className="mt-2 text-[12px] text-neutral-600">
              Önce bir model seçin.
            </p>
          ) : !selectedReady ? (
            <p className="mt-2 text-[12px] text-amber-800">
              Bu modelin referans fotoğrafları henüz eklenmedi.
            </p>
          ) : null}
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

      {(!hasModelPhoto && !busy) || (confirmRegen && !busy) ? (
        <>
          <TrOwnerCreditsCostLine
            credits={modelCredits}
            prefix="Bu işlem"
            boutiqueId={boutiqueId}
          />
          <TrOwnerCreditsMoreInfoLink boutiqueId={boutiqueId} />
        </>
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
    </div>
  );
}
