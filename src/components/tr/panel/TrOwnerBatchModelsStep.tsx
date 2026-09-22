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
import { featuresWithLifestyleModels } from "@/lib/tr/fashion/aiCatalog/elbiseRestyle";
import {
  describeModelPackageCredits,
} from "@/lib/tr/fashion/aiCatalog/uploadCostHints";
import {
  buildElbiseTryOnShots,
  chipsFromProductFeatures,
} from "@/lib/tr/aiModel/elbiseTryOn";
import { listAiModelOptions } from "@/lib/tr/aiModel/registry";
import { ELBISE_PACKSHOT_SLOT } from "@/lib/tr/fashion/garmentUploadTypes";
import { requestOwnerAiModelGenerate } from "@/lib/tr/ownerClient";
import type { ProductBatchCreateRow } from "@/lib/tr/productBatchCreateDraft";
import {
  batchRowCover,
  batchRowFamily,
} from "@/lib/tr/productBatchCreateFlow";

type ModelRowStatus = "idle" | "waiting-catalog" | "queued" | "running" | "done" | "error";

function packshotUrlOf(row: ProductBatchCreateRow): string {
  return (
    row.marketplaceImages[ELBISE_PACKSHOT_SLOT]?.trim() ||
    row.images[ELBISE_PACKSHOT_SLOT]?.trim() ||
    ""
  );
}

export function TrOwnerBatchModelsStep({
  boutiqueId,
  boutiqueSlug,
  rows,
  modelId,
  modelStatusById,
  onModelIdChange,
  getRow,
  onPatchRow,
  onModelStatusChange,
}: {
  boutiqueId: string;
  boutiqueSlug: string;
  rows: ProductBatchCreateRow[];
  modelId: string | null;
  modelStatusById: Record<string, { status: ModelRowStatus; error?: string }>;
  getRow: (clientId: string) => ProductBatchCreateRow | undefined;
  onModelIdChange: (id: string | null) => void;
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
  const credits = rows.reduce((sum, row) => {
    const family = batchRowFamily(row);
    return (
      sum +
      describeModelPackageCredits(modelId, {
        uploadType: family ?? "elbise",
        features:
          row.gateChips ?? chipsFromProductFeatures(row.features, family),
        detailImageUrl: row.images[2]?.trim() || null,
      })
    );
  }, 0);

  async function waitForPackshot(clientId: string): Promise<string> {
    const deadline = Date.now() + 180_000;
    while (Date.now() < deadline) {
      const latest = getRow(clientId);
      const url = latest ? packshotUrlOf(latest) : "";
      if (url) return url;
      if (latest?.packshotError) {
        throw new Error(latest.packshotError);
      }
      await new Promise((resolve) => window.setTimeout(resolve, 800));
    }
    throw new Error("Packshot hazır olmadı.");
  }

  async function generateOne(
    row: ProductBatchCreateRow,
    selectedModelId: string,
  ) {
    const family = batchRowFamily(row);
    if (!family) {
      throw new Error("Önce tür ve özellikleri onaylayın.");
    }
    onModelStatusChange(row.clientId, { status: "waiting-catalog" });
    const packshotUrl =
      packshotUrlOf(row) || (await waitForPackshot(row.clientId));
    const latest = getRow(row.clientId) ?? row;
    const chips =
      latest.gateChips ?? chipsFromProductFeatures(latest.features, family);
    const planned = buildElbiseTryOnShots({
      modelId: selectedModelId,
      packshotUrl,
      backMankenUrl: latest.images[1]?.trim() || "",
      detailMankenUrl: latest.images[2]?.trim() || "",
      chips,
      family,
    });
    if (planned.error || planned.shots.length === 0) {
      throw new Error(planned.error ?? "Model kareleri hazırlanamadı.");
    }
    onModelStatusChange(row.clientId, { status: "queued" });
    const result = await scheduleAiJob(
      () =>
        requestOwnerAiModelGenerate({
          boutiqueId,
          cutoutImageUrl: planned.shots[0]!.cutoutImageUrl,
          title: latest.title,
          category:
            family === "elbise" ? "elbise" : latest.category,
          modelId: selectedModelId,
          shots: planned.shots,
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
      lifestyleImages: produced,
      selectedModelId,
      features: featuresWithLifestyleModels(
        latest.features,
        selectedModelId,
        produced.length,
      ),
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
    if (status === "waiting-catalog") return "Packshot bekleniyor";
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
        İsterseniz atlayabilirsiniz. Construction katalog: 2 kare (detay
        fotoğrafı varsa 3). Packshot bitince başlar.
      </p>
      <TrOwnerAiModelPicker
        boutiqueSlug={boutiqueSlug}
        value={modelId}
        onChange={onModelIdChange}
        hidePhotographyStyle
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
