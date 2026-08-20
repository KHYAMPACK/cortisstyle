"use client";

import { useState } from "react";
import { TrOwnerAiModelPicker } from "@/components/tr/panel/TrOwnerAiModelPicker";
import { useScheduleAiJob } from "@/components/tr/panel/TrOwnerAiJobQueue";
import { TrOwnerCreditsCostLine } from "@/components/tr/panel/TrOwnerCreditsInfo";
import {
  panelErrorClass,
  panelHintClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { TR_AI_CATALOG_CREDITS } from "@/lib/tr/aiCatalog/uploadCostHints";
import {
  isLilaHouseModelId,
  listAiModelOptions,
  type TrLilaPhotographyStyle,
} from "@/lib/tr/aiModel/registry";
import { requestOwnerAiModelGenerate } from "@/lib/tr/ownerClient";
import type { ProductBatchCreateRow } from "@/lib/tr/productBatchCreateDraft";
import { batchRowCover } from "@/lib/tr/productBatchCreateFlow";

type ModelRowStatus = "idle" | "waiting-catalog" | "queued" | "running" | "done" | "error";

export function TrOwnerBatchModelsStep({
  boutiqueId,
  boutiqueSlug,
  rows,
  modelId,
  photographyStyle,
  modelStatusById,
  onModelIdChange,
  onPhotographyStyleChange,
  getRow,
  onPatchRow,
  onModelStatusChange,
}: {
  boutiqueId: string;
  boutiqueSlug: string;
  rows: ProductBatchCreateRow[];
  modelId: string | null;
  photographyStyle: TrLilaPhotographyStyle;
  modelStatusById: Record<string, { status: ModelRowStatus; error?: string }>;
  getRow: (clientId: string) => ProductBatchCreateRow | undefined;
  onModelIdChange: (id: string | null) => void;
  onPhotographyStyleChange: (style: TrLilaPhotographyStyle) => void;
  onPatchRow: (clientId: string, patch: Partial<ProductBatchCreateRow>) => void;
  onModelStatusChange: (
    clientId: string,
    status: { status: ModelRowStatus; error?: string },
  ) => void;
}) {
  const scheduleAiJob = useScheduleAiJob();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = listAiModelOptions(boutiqueSlug);
  const selectedReady = options.find((option) => option.id === modelId)?.ready;
  const credits = rows.length * TR_AI_CATALOG_CREDITS.modelPackage;

  async function waitForCutout(clientId: string): Promise<string> {
    const deadline = Date.now() + 180_000;
    while (Date.now() < deadline) {
      const latest = getRow(clientId);
      const cutout = latest?.marketplaceImages[0]?.trim() || "";
      if (cutout) return cutout;
      await new Promise((resolve) => window.setTimeout(resolve, 800));
    }
    throw new Error("Katalog görseli hazır olmadı.");
  }

  async function generateOne(
    row: ProductBatchCreateRow,
    selectedModelId: string,
  ) {
    onModelStatusChange(row.clientId, { status: "waiting-catalog" });
    const cutout =
      row.marketplaceImages[0]?.trim() || (await waitForCutout(row.clientId));
    onModelStatusChange(row.clientId, { status: "queued" });
    const result = await scheduleAiJob(
      () =>
        requestOwnerAiModelGenerate({
          boutiqueId,
          cutoutImageUrl: cutout,
          title: row.title,
          category: row.category,
          modelId: selectedModelId,
          photographyStyle: isLilaHouseModelId(selectedModelId)
            ? photographyStyle
            : undefined,
          pose: "standing-front",
        }),
      {
        onStart: () =>
          onModelStatusChange(row.clientId, { status: "running" }),
      },
    );
    const produced = (
      result.imageUrls?.length
        ? result.imageUrls
        : result.imageUrl
          ? [result.imageUrl]
          : []
    )
      .map((url) => url.trim())
      .filter(Boolean);
    if (result.status !== "succeeded" || produced.length === 0) {
      throw new Error(result.error ?? "Model görseli üretilemedi.");
    }
    onPatchRow(row.clientId, {
      lifestyleImages: produced.slice(0, 1),
      selectedModelId,
      photographyStyle,
    });
    onModelStatusChange(row.clientId, { status: "done" });
  }

  async function generateAll() {
    if (!modelId || !selectedReady) {
      setError("Önce hazır bir model seçin.");
      return;
    }
    setBusy(true);
    setError(null);
    for (const row of rows) {
      try {
        await generateOne(row, modelId);
      } catch (generateError) {
        onModelStatusChange(row.clientId, {
          status: "error",
          error:
            generateError instanceof Error
              ? generateError.message
              : "Model oluşturulamadı.",
        });
      }
    }
    setBusy(false);
  }

  function statusLabel(
    row: ProductBatchCreateRow,
  ): string {
    if (row.lifestyleImages.some((url) => Boolean(url?.trim()))) {
      return "Hazır";
    }
    const status = modelStatusById[row.clientId]?.status ?? "idle";
    if (status === "waiting-catalog") return "Katalog bekleniyor";
    if (status === "queued") return "Sırada…";
    if (status === "running") return "Model oluşturuluyor…";
    if (status === "error") {
      return modelStatusById[row.clientId]?.error ?? "Hata";
    }
    return "Bekliyor";
  }

  return (
    <div className="space-y-5">
      <p className={panelHintClass}>
        İsterseniz atlayabilirsiniz. Model fotoğrafı arka planda üretilir.
      </p>
      <TrOwnerAiModelPicker
        boutiqueSlug={boutiqueSlug}
        value={modelId}
        onChange={onModelIdChange}
        photographyStyle={photographyStyle}
        onPhotographyStyleChange={onPhotographyStyleChange}
        disabled={busy}
      />
      <TrOwnerCreditsCostLine
        boutiqueId={boutiqueId}
        credits={credits}
        prefix="Tüm ürünler için model"
      />
      {error ? <p className={panelErrorClass}>{error}</p> : null}
      <button
        type="button"
        className={`${panelPrimaryBtnClass} w-full`}
        disabled={busy || !modelId}
        onClick={() => void generateAll()}
      >
        {busy ? "Oluşturuluyor…" : "Her ürün için model fotoğrafı oluştur"}
      </button>
      <ul className="space-y-2">
        {rows.map((row, index) => {
          const cover =
            row.lifestyleImages.find((url) => Boolean(url?.trim())) ||
            batchRowCover(row);
          const failed = modelStatusById[row.clientId]?.status === "error";
          return (
            <li
              key={row.clientId}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-3"
            >
              <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-[color:var(--panel-accent-soft)]">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-neutral-900">
                  {row.title.trim() || `Ürün ${index + 1}`}
                </p>
                <p className="text-[13px] text-neutral-500">
                  {statusLabel(row)}
                </p>
              </div>
              {failed && modelId ? (
                <button
                  type="button"
                  className={panelSecondaryBtnClass}
                  disabled={busy}
                  onClick={() => void generateOne(row, modelId).catch((err) => {
                    onModelStatusChange(row.clientId, {
                      status: "error",
                      error:
                        err instanceof Error ? err.message : "Model oluşturulamadı.",
                    });
                  })}
                >
                  Tekrar dene
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export type { ModelRowStatus };
