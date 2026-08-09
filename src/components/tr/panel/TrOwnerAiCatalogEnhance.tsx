"use client";

import { useMemo, useState } from "react";
import { TrOwnerAiModelPicker } from "@/components/tr/panel/TrOwnerAiModelPicker";
import {
  describeModelPackageCredits,
  TR_AI_CATALOG_CREDITS,
} from "@/lib/tr/aiCatalog/uploadCostHints";
import {
  TrOwnerCreditsCostLine,
  TrOwnerCreditsMoreInfoLink,
} from "@/components/tr/panel/TrOwnerCreditsInfo";
import { listAiModelOptions } from "@/lib/tr/aiModel/registry";
import {
  requestOwnerAiModelGenerate,
  requestOwnerPackshot,
} from "@/lib/tr/ownerClient";
import type { PipelineJobItem } from "@/lib/tr/aiCatalog/pipelineProgress";

const primaryBtn =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 py-3 text-[16px] font-semibold text-white disabled:opacity-50";

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
  onMarketplaceImagesChange: (urls: string[]) => void;
  onLifestyleImagesChange: (urls: string[]) => void;
  onListingDraft?: (draft: {
    title: string;
    description: string;
  }) => void;
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
  onMarketplaceImagesChange,
  onLifestyleImagesChange,
  onListingDraft,
  onModelJobsChange,
  onSkip,
  disabled = false,
}: TrOwnerAiCatalogEnhanceProps) {
  const [phase, setPhase] = useState<EnhancePhase>("idle");
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(
    () => listAiModelOptions(boutiqueSlug),
    [boutiqueSlug],
  );
  const selectedReady = options.find((o) => o.id === selectedModelId)?.ready;

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

  const canRun =
    !disabled &&
    !busy &&
    slotSources.length >= 2 &&
    Boolean(selectedModelId) &&
    Boolean(selectedReady);

  async function runEnhance() {
    if (!canRun || !selectedModelId) return;
    setError(null);
    setPhase("packshot");
    onModelJobsChange?.([
      {
        id: "model-pack",
        kind: "model",
        label: "Model / katalog",
        status: "running",
        progressPct: 12,
        detail: "Katalog kontrolü…",
      },
    ]);

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
        setProgressLabel(
          `Katalog görseli ${i + 1}/${slotSources.length}…`,
        );
        onModelJobsChange?.([
          {
            id: "model-pack",
            kind: "model",
            label: "Model / katalog",
            status: "running",
            progressPct: 20 + i * 10,
            detail: `Katalog görseli ${i + 1}/${slotSources.length}…`,
          },
        ]);
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

      setProgressLabel("Model fotoğrafı…");
      onModelJobsChange?.([
        {
          id: "model-pack",
          kind: "model",
          label: "Model çekimi",
          status: "running",
          progressPct: 70,
          detail: "Ön model…",
        },
      ]);
      const result = await requestOwnerAiModelGenerate({
        boutiqueId,
        cutoutImageUrl: frontGarment,
        productId: productId ?? undefined,
        title,
        category,
        modelId: selectedModelId,
        pose: "standing-front",
      });
      if (result.status !== "succeeded" || !result.imageUrl?.trim()) {
        throw new Error(result.error ?? "Model görseli üretilemedi.");
      }

      const merged = [
        ...lifestyleImages.filter(Boolean),
        result.imageUrl.trim(),
      ];
      onLifestyleImagesChange(Array.from(new Set(merged)));
      setPhase("done");
      setProgressLabel(
        `Model fotoğrafı hazır (${TR_AI_CATALOG_CREDITS.modelPackage} kredi).`,
      );
      onModelJobsChange?.([]);
    } catch (err) {
      setPhase("error");
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

  if (images.length === 0) return null;

  return (
    <div className="space-y-4 rounded-2xl border-2 border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-softer)]/40 p-4">
      <div>
        <p className="text-[17px] font-semibold text-neutral-800">
          Model fotoğrafı
        </p>
        <p className="mt-1 text-[14px] text-neutral-600">
          İsteğe bağlı — ön katalog ile 1 model karesi. Atlayabilirsiniz.
        </p>
      </div>

      <TrOwnerAiModelPicker
        boutiqueSlug={boutiqueSlug}
        value={selectedModelId}
        onChange={onSelectedModelIdChange}
        disabled={disabled || busy}
      />

      {lifestyleImages.some((u) => u?.trim()) ? (
        <div className="grid grid-cols-2 gap-2 sm:max-w-xs">
          {lifestyleImages
            .filter((u) => u?.trim())
            .slice(0, 2)
            .map((url) => (
              <div
                key={url}
                className="relative aspect-[2/3] overflow-hidden rounded-xl bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
        </div>
      ) : null}

      <button
        type="button"
        className={primaryBtn}
        style={{ background: "var(--panel-accent)" }}
        disabled={!canRun}
        onClick={() => void runEnhance()}
      >
        {busy
          ? "Hazırlanıyor…"
          : phase === "done"
            ? "Tekrar oluştur"
            : "Model fotoğrafı oluştur"}
      </button>

      {onSkip && phase !== "done" ? (
        <button
          type="button"
          className="w-full text-center text-[14px] font-semibold text-neutral-600 underline-offset-2 hover:underline disabled:opacity-50"
          disabled={disabled || busy}
          onClick={onSkip}
        >
          Model istemiyorum — atla
        </button>
      ) : null}

      <TrOwnerCreditsCostLine
        credits={describeModelPackageCredits()}
        prefix="Bu işlem"
      />
      <TrOwnerCreditsMoreInfoLink />

      {!selectedModelId ? (
        <p className="text-[13px] text-neutral-600">Önce bir model seçin.</p>
      ) : !selectedReady ? (
        <p className="text-[13px] text-amber-800">
          Bu modelin referans fotoğrafları henüz eklenmedi.
        </p>
      ) : null}

      {progressLabel ? (
        <p className="text-[14px] font-medium text-neutral-700">
          {progressLabel}
        </p>
      ) : null}
      {error ? (
        <p className="text-[14px] font-medium text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
