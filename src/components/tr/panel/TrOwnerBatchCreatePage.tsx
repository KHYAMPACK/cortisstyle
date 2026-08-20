"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TrOwnerAiJobQueueProvider } from "@/components/tr/panel/TrOwnerAiJobQueue";
import { TrOwnerBatchListingsStep } from "@/components/tr/panel/TrOwnerBatchListingsStep";
import {
  TrOwnerBatchModelsStep,
  type ModelRowStatus,
} from "@/components/tr/panel/TrOwnerBatchModelsStep";
import { TrOwnerBatchPhotoStep } from "@/components/tr/panel/TrOwnerBatchPhotoStep";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  emptyStockInputsForChart,
  TrOwnerSizeChartStock,
} from "@/components/tr/panel/TrOwnerSizeChartStock";
import { TrOwnerStorePreview } from "@/components/tr/panel/TrOwnerStorePreview";
import { TrPanelFadeIn } from "@/components/tr/panel/TrPanelMotion";
import {
  panelBackLinkClass,
  panelErrorClass,
  panelHintClass,
  panelPageTitleClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import type { PipelineJobItem } from "@/lib/tr/aiCatalog/pipelineProgress";
import {
  LILA_DEFAULT_PHOTOGRAPHY_STYLE,
  parseLilaPhotographyStyle,
  type TrLilaPhotographyStyle,
} from "@/lib/tr/aiModel/registry";
import { runOwnerPatches } from "@/lib/tr/ownerBulk";
import { createOwnerProduct, type TrOwnerProductPayload } from "@/lib/tr/ownerClient";
import {
  isValidStock,
  isValidTryPrice,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import {
  BATCH_CREATE_STEPS,
  batchDraftHasProgress,
  createEmptyBatchRow,
  clearProductBatchCreateDraft,
  readProductBatchCreateDraft,
  writeProductBatchCreateDraft,
  type ProductBatchCreateDraftV2,
  type ProductBatchCreateRow,
} from "@/lib/tr/productBatchCreateDraft";
import {
  batchIdentifyCounts,
  batchRowHasBothPhotos,
  capturedBatchRows,
} from "@/lib/tr/productBatchCreateFlow";
import { getPanelProductCover } from "@/lib/tr/productImages";
import { sizesForChart, type TrSizeChartId } from "@/lib/tr/productOptions";
import { parseSizeStockInputs, sumSizeStocks } from "@/lib/tr/sizeStocks";
import {
  trBoutiqueProductPath,
  trPanelEditProductPath,
  trPanelProductsPath,
} from "@/lib/tr/paths";
import { formatTryFromKurus, type TrProduct } from "@/types/tr-marketplace";

const STEP_LABELS: Record<(typeof BATCH_CREATE_STEPS)[number], string> = {
  photos: "Fotoğraf",
  listings: "İsim ve fiyat",
  models: "Model",
  stock: "Stok",
  preview: "Önizleme",
};

function listingRowValid(row: ProductBatchCreateRow): boolean {
  if (!row.title.trim()) return false;
  if (!isValidTryPrice(row.priceTry)) return false;
  if (!row.discountEnabled) return true;
  if (!isValidTryPrice(row.salePriceTry)) return false;
  const price = Number(row.priceTry.replace(",", "."));
  const sale = Number(row.salePriceTry.replace(",", "."));
  return sale < price;
}

function stockRowValid(row: ProductBatchCreateRow): boolean {
  if (row.sizeChart === "none") return isValidStock(row.stock);
  const sizes = sizesForChart(row.sizeChart);
  if (!sizes.every((size) => isValidStock(row.sizeStockInputs[size] ?? ""))) {
    return false;
  }
  const parsed = parseSizeStockInputs(sizes, row.sizeStockInputs);
  return parsed !== null && sumSizeStocks(parsed) > 0;
}

function jobsRunning(
  photoJobsById: Record<string, PipelineJobItem[]>,
  modelStatusById: Record<string, { status: ModelRowStatus }>,
): boolean {
  const photos = Object.values(photoJobsById).some((jobs) =>
    jobs.some((job) => job.status === "running"),
  );
  const models = Object.values(modelStatusById).some(
    (item) =>
      item.status === "running" ||
      item.status === "queued" ||
      item.status === "waiting-catalog",
  );
  return photos || models;
}

export function TrOwnerBatchCreatePage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerAiJobQueueProvider>
          <BatchCreateFlow
            boutiqueId={activeBoutique.id}
            boutiqueSlug={activeBoutique.slug}
          />
        </TrOwnerAiJobQueueProvider>
      )}
    </TrOwnerPanelGate>
  );
}

function BatchCreateFlow({
  boutiqueId,
  boutiqueSlug,
}: {
  boutiqueId: string;
  boutiqueSlug: string;
}) {
  const [rows, setRows] = useState<ProductBatchCreateRow[] | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saved, setSaved] = useState<TrProduct[]>([]);
  const [draftBanner, setDraftBanner] =
    useState<ProductBatchCreateDraftV2 | null>(null);
  const [photoJobsById, setPhotoJobsById] = useState<
    Record<string, PipelineJobItem[]>
  >({});
  const [modelStatusById, setModelStatusById] = useState<
    Record<string, { status: ModelRowStatus; error?: string }>
  >({});
  const [batchModelId, setBatchModelId] = useState<string | null>(null);
  const [photographyStyle, setPhotographyStyle] =
    useState<TrLilaPhotographyStyle>(LILA_DEFAULT_PHOTOGRAPHY_STYLE);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const hydratedRef = useRef(false);
  const skipNextPersistRef = useRef(false);
  const rowsRef = useRef<ProductBatchCreateRow[]>([]);

  useEffect(() => {
    const existing = readProductBatchCreateDraft(boutiqueId);
    if (existing && batchDraftHasProgress(existing)) {
      setDraftBanner(existing);
      const empty = createEmptyBatchRow();
      setRows([empty]);
      setActiveId(empty.clientId);
      setStepIndex(0);
    } else {
      const first = createEmptyBatchRow();
      setRows([first]);
      setActiveId(first.clientId);
    }
    hydratedRef.current = true;
  }, [boutiqueId]);

  useEffect(() => {
    rowsRef.current = rows ?? [];
  }, [rows]);

  useEffect(() => {
    if (!hydratedRef.current || !rows) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    if (draftBanner) return;
    const handle = window.setTimeout(() => {
      writeProductBatchCreateDraft(boutiqueId, { stepIndex, rows });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [boutiqueId, draftBanner, rows, stepIndex]);

  const patchRow = useCallback(
    (clientId: string, patch: Partial<ProductBatchCreateRow>) => {
      setRows((current) => {
        if (!current) return current;
        return current.map((row) =>
          row.clientId === clientId ? { ...row, ...patch } : row,
        );
      });
    },
    [],
  );

  const onPhotoJobsChange = useCallback(
    (clientId: string, jobs: PipelineJobItem[]) => {
      setPhotoJobsById((current) => {
        const prev = current[clientId];
        if (
          prev &&
          prev.length === jobs.length &&
          prev.every(
            (job, index) =>
              job.id === jobs[index]?.id &&
              job.status === jobs[index]?.status &&
              job.progressPct === jobs[index]?.progressPct &&
              job.detail === jobs[index]?.detail,
          )
        ) {
          return current;
        }
        return { ...current, [clientId]: jobs };
      });
    },
    [],
  );

  const getRow = useCallback(
    (clientId: string) =>
      rowsRef.current.find((row) => row.clientId === clientId),
    [],
  );

  const restoreDraft = () => {
    if (!draftBanner) return;
    skipNextPersistRef.current = true;
    const restored =
      draftBanner.rows.length > 0
        ? draftBanner.rows
        : [createEmptyBatchRow()];
    setRows(restored);
    setActiveId(restored[0]?.clientId ?? null);
    setStepIndex(draftBanner.stepIndex);
    const withModel = restored.find((row) => row.selectedModelId);
    if (withModel?.selectedModelId) {
      setBatchModelId(withModel.selectedModelId);
      setPhotographyStyle(
        parseLilaPhotographyStyle(withModel.photographyStyle),
      );
    }
    setDraftBanner(null);
  };

  const discardDraft = () => {
    clearProductBatchCreateDraft(boutiqueId);
    setDraftBanner(null);
    const first = createEmptyBatchRow();
    setRows([first]);
    setActiveId(first.clientId);
    setStepIndex(0);
  };

  const addRow = () => {
    if (!rows) return;
    if (rows.length >= TR_OWNER_PRODUCT_LIMITS.maxBatchCreateRows) return;
    const next = createEmptyBatchRow();
    setRows([...rows, next]);
    setActiveId(next.clientId);
  };

  const removeRow = (clientId: string) => {
    setRows((current) => {
      if (!current) return current;
      const next = current.filter((row) => row.clientId !== clientId);
      if (next.length === 0) return [createEmptyBatchRow()];
      return next;
    });
    setPhotoJobsById((current) => {
      const { [clientId]: _removed, ...rest } = current;
      return rest;
    });
  };

  useEffect(() => {
    if (!rows || rows.length === 0) return;
    if (activeId && rows.some((row) => row.clientId === activeId)) return;
    setActiveId(rows[0]!.clientId);
  }, [activeId, rows]);

  const continueFromPhotos = (options?: { skipFailedIdentify?: boolean }) => {
    if (!rows) return;
    setError(null);
    const captured = capturedBatchRows(rows);
    if (captured.length === 0) {
      setError("En az bir ürünün ön ve arka fotoğrafını ekleyin.");
      return;
    }
    if (captured.some((row) => !batchRowHasBothPhotos(row))) {
      setError("Her üründe ön ve arka fotoğraf gerekli.");
      return;
    }
    const counts = batchIdentifyCounts(captured, photoJobsById);
    if (counts.identifying.length > 0) {
      setError("Ürün tanıması bitmeden devam edilemez.");
      return;
    }
    if (counts.failed.length > 0 && !options?.skipFailedIdentify) {
      setError("Tanıma hatalarını çözün veya elle devam edin.");
      return;
    }
    setRows(captured);
    setStepIndex(1);
  };

  const goNext = () => {
    setError(null);
    if (!rows) return;
    const step = BATCH_CREATE_STEPS[stepIndex];
    if (step === "photos") {
      continueFromPhotos();
      return;
    }
    if (step === "listings") {
      if (!rows.every(listingRowValid)) {
        setError("Her üründe isim ve geçerli fiyat gerekli.");
        return;
      }
      setStepIndex(2);
      return;
    }
    if (step === "models") {
      setStepIndex(3);
      return;
    }
    if (step === "stock") {
      if (!rows.every(stockRowValid)) {
        setError(
          "Her üründe geçerli stok girin; en az bir bedende stok 1 veya daha fazla olmalı.",
        );
        return;
      }
      setStepIndex(4);
    }
  };

  const goBack = () => {
    setError(null);
    setStepIndex((current) => Math.max(0, current - 1));
  };

  const applySizeChart = (clientId: string, chart: TrSizeChartId) => {
    const row = rowsRef.current.find((item) => item.clientId === clientId);
    if (chart === "none") {
      patchRow(clientId, { sizeChart: chart, sizeStockInputs: {} });
      return;
    }
    const nextInputs = emptyStockInputsForChart(chart, "0");
    if (row) {
      for (const size of Object.keys(nextInputs)) {
        if (row.sizeStockInputs[size] !== undefined) {
          nextInputs[size] = row.sizeStockInputs[size]!;
        }
      }
    }
    patchRow(clientId, { sizeChart: chart, sizeStockInputs: nextInputs });
  };

  async function saveAll() {
    if (!rows) return;
    if (jobsRunning(photoJobsById, modelStatusById)) {
      setError(
        "Katalog veya model görselleri hâlâ hazırlanıyor. Bitmesini bekleyin.",
      );
      return;
    }
    if (!rows.every(listingRowValid) || !rows.every(stockRowValid)) {
      setError("Eksik isim, fiyat veya stok var.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaveErrors({});
    const snapshot = rowsRef.current;
    const result = await runOwnerPatches(
      snapshot.map((row) => row.clientId),
      async (clientId) => {
        const row = snapshot.find((item) => item.clientId === clientId);
        if (!row) throw new Error("Ürün bulunamadı.");
        return createOwnerProduct(buildCreatePayload(boutiqueId, row));
      },
      { concurrency: 4 },
    );
    const failedIds = new Set(result.failed.map((item) => item.id));
    setSaved((current) => [...current, ...result.ok]);
    if (result.failed.length > 0) {
      const nextErrors: Record<string, string> = {};
      for (const item of result.failed) nextErrors[item.id] = item.error;
      setSaveErrors(nextErrors);
      setRows(snapshot.filter((row) => failedIds.has(row.clientId)));
      setError(
        `${result.ok.length} ürün kaydedildi, ${result.failed.length} ürün başarısız. Hatalı olanları düzeltip tekrar kaydedin.`,
      );
    } else {
      clearProductBatchCreateDraft(boutiqueId);
      setRows([]);
    }
    setSaving(false);
  }

  const step = BATCH_CREATE_STEPS[stepIndex] ?? "photos";
  const packing = jobsRunning(photoJobsById, modelStatusById);

  return (
    <TrPanelFadeIn>
      <div className="space-y-6">
        {draftBanner ? (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="batch-create-draft-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-xl sm:p-6">
              <p
                id="batch-create-draft-title"
                className="text-[20px] font-semibold text-neutral-900"
              >
                Yarım kalan toplu yükleme
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
                Kaldığınız yerden devam etmek ister misiniz?
                {draftBanner.updatedAt
                  ? ` Son kayıt: ${new Date(draftBanner.updatedAt).toLocaleString("tr-TR")}.`
                  : ""}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className={`${panelSecondaryBtnClass} flex-1`}
                  onClick={discardDraft}
                >
                  Yeni başla
                </button>
                <button
                  type="button"
                  className={`${panelPrimaryBtnClass} flex-1`}
                  onClick={restoreDraft}
                >
                  Devam et
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div>
          <Link href={trPanelProductsPath()} className={panelBackLinkClass}>
            ← Listeye dön
          </Link>
          <h2 className={panelPageTitleClass}>Toplu ürün ekle</h2>
          <p className={`mt-2 ${panelHintClass}`}>
            Önce fotoğrafları çekin. Tanıma bitince isim ve fiyatı doldurun;
            katalog görselleri arka planda hazırlanır.
          </p>
        </div>

        <p className="text-[14px] font-medium text-neutral-600">
          Adım {stepIndex + 1} / {BATCH_CREATE_STEPS.length} · {STEP_LABELS[step]}
        </p>

        {saved.length > 0 ? (
          <ul className="space-y-2">
            {saved.map((product) => (
              <SavedProductChip
                key={product.id}
                product={product}
                boutiqueSlug={boutiqueSlug}
              />
            ))}
          </ul>
        ) : null}

        {error ? <p className={panelErrorClass}>{error}</p> : null}

        {rows && rows.length > 0 ? (
          <>
            <div className={step === "photos" ? "" : "hidden"}>
              <TrOwnerBatchPhotoStep
                boutiqueId={boutiqueId}
                rows={rows}
                activeId={activeId}
                photoJobsById={photoJobsById}
                onActiveIdChange={setActiveId}
                onPatchRow={patchRow}
                onPhotoJobsChange={onPhotoJobsChange}
                onAddRow={addRow}
                onRemoveRow={removeRow}
                onContinue={continueFromPhotos}
              />
            </div>

            {step === "listings" ? (
              <TrOwnerBatchListingsStep
                boutiqueId={boutiqueId}
                rows={rows}
                photoJobsById={photoJobsById}
                onPatchRow={patchRow}
              />
            ) : null}

            {step === "models" ? (
              <TrOwnerBatchModelsStep
                boutiqueId={boutiqueId}
                boutiqueSlug={boutiqueSlug}
                rows={rows}
                modelId={batchModelId}
                photographyStyle={photographyStyle}
                modelStatusById={modelStatusById}
                getRow={getRow}
                onModelIdChange={setBatchModelId}
                onPhotographyStyleChange={setPhotographyStyle}
                onPatchRow={patchRow}
                onModelStatusChange={(clientId, status) =>
                  setModelStatusById((current) => ({
                    ...current,
                    [clientId]: status,
                  }))
                }
              />
            ) : null}

            {step === "stock" ? (
              <div className="space-y-4">
                {rows.map((row, index) => (
                  <section
                    key={row.clientId}
                    className="rounded-xl border border-neutral-200/80 bg-white p-4"
                  >
                    <p className="mb-4 text-[16px] font-semibold text-neutral-900">
                      {row.title.trim() || `Ürün ${index + 1}`}
                    </p>
                    <TrOwnerSizeChartStock
                      chart={row.sizeChart}
                      onChartChange={(chart) =>
                        applySizeChart(row.clientId, chart)
                      }
                      stockInputs={row.sizeStockInputs}
                      onStockInputsChange={(sizeStockInputs) =>
                        patchRow(row.clientId, { sizeStockInputs })
                      }
                      stock={row.stock}
                      onStockChange={(stock) =>
                        patchRow(row.clientId, { stock })
                      }
                      variant="wizard"
                    />
                  </section>
                ))}
              </div>
            ) : null}

            {step === "preview" ? (
              <div className="space-y-8">
                {rows.map((row, index) => (
                  <section key={row.clientId} className="space-y-3">
                    <p className="text-[16px] font-semibold text-neutral-900">
                      {row.title.trim() || `Ürün ${index + 1}`}
                    </p>
                    {saveErrors[row.clientId] ? (
                      <p className={panelErrorClass}>
                        {saveErrors[row.clientId]}
                      </p>
                    ) : null}
                    <TrOwnerStorePreview
                      title={row.title}
                      description={row.description}
                      priceTry={
                        row.discountEnabled ? row.salePriceTry : row.priceTry
                      }
                      compareAtPriceTry={
                        row.discountEnabled ? row.priceTry : null
                      }
                      images={row.images}
                      marketplaceImages={row.marketplaceImages}
                      lifestyleImages={row.lifestyleImages}
                      catalogBackgroundId={row.catalogBackgroundId}
                      sizes={
                        row.sizeChart === "none"
                          ? []
                          : sizesForChart(row.sizeChart)
                      }
                    />
                  </section>
                ))}
                <button
                  type="button"
                  className={`${panelPrimaryBtnClass} w-full`}
                  disabled={saving || packing}
                  onClick={() => void saveAll()}
                >
                  {saving
                    ? "Kaydediliyor…"
                    : packing
                      ? "Görseller bitince kaydedin"
                      : "Hepsini kaydet"}
                </button>
              </div>
            ) : null}

            {step !== "photos" && step !== "preview" ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className={`${panelSecondaryBtnClass} flex-1`}
                  onClick={goBack}
                >
                  Geri
                </button>
                <button
                  type="button"
                  className={`${panelPrimaryBtnClass} flex-1`}
                  onClick={goNext}
                >
                  {step === "models" ? "Devam (model isteğe bağlı)" : "Devam"}
                </button>
              </div>
            ) : null}

            {step === "preview" ? (
              <button
                type="button"
                className={panelSecondaryBtnClass}
                onClick={goBack}
              >
                Geri
              </button>
            ) : null}
          </>
        ) : saved.length > 0 ? (
          <p className={panelHintClass}>
            Tüm ürünler kaydedildi. Listeden düzenleyebilir veya yeni bir toplu
            yükleme başlatabilirsiniz.
          </p>
        ) : null}

        {rows && rows.length === 0 ? (
          <button
            type="button"
            className={panelPrimaryBtnClass}
            onClick={() => {
              const first = createEmptyBatchRow();
              setRows([first]);
              setActiveId(first.clientId);
              setStepIndex(0);
              setSaved([]);
            }}
          >
            Yeni toplu yükleme
          </button>
        ) : null}
      </div>
    </TrPanelFadeIn>
  );
}

function buildCreatePayload(
  boutiqueId: string,
  row: ProductBatchCreateRow,
): TrOwnerProductPayload {
  const listPrice = Number(row.priceTry.replace(",", "."));
  let sellPrice = listPrice;
  let compareAtPriceTry: number | null = null;
  if (row.discountEnabled) {
    sellPrice = Number(row.salePriceTry.replace(",", "."));
    compareAtPriceTry = listPrice;
  }
  const sizes =
    row.sizeChart === "none" ? [] : sizesForChart(row.sizeChart);
  let stockValue: number;
  let sizeStocks: Record<string, number> = {};
  if (sizes.length > 0) {
    sizeStocks = parseSizeStockInputs(sizes, row.sizeStockInputs) ?? {};
    stockValue = sumSizeStocks(sizeStocks);
  } else {
    stockValue = Number.parseInt(row.stock, 10);
  }
  return {
    boutiqueId,
    title: row.title.trim(),
    description: row.description.trim() || null,
    features: row.features,
    priceTry: sellPrice,
    compareAtPriceTry,
    sizes,
    colors: [],
    category: row.category,
    images: row.images,
    marketplaceImages: row.images.map(
      (_, index) => row.marketplaceImages[index] ?? "",
    ),
    lifestyleImages: row.lifestyleImages
      .map((url) => url.trim())
      .filter(Boolean)
      .slice(0, 1),
    catalogBackgroundId: row.catalogBackgroundId,
    stock: stockValue,
    sizeStocks,
    status: "available" as const,
  };
}

function SavedProductChip({
  product,
  boutiqueSlug,
}: {
  product: TrProduct;
  boutiqueSlug: string;
}) {
  const cover = getPanelProductCover(product);
  return (
    <li className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-3">
      <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-white">
        {cover ? (
          <Image
            src={cover}
            alt={product.title}
            fill
            className="object-contain p-1"
            sizes="44px"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[13px] font-semibold text-neutral-400">
            {product.title.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-neutral-900">
          {product.title}
        </p>
        <p className="text-[13px] text-emerald-800">
          Kaydedildi · {formatTryFromKurus(product.priceKurus)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-1 text-right">
        <Link
          href={trPanelEditProductPath(product.id)}
          className="text-[13px] font-semibold text-neutral-800 underline-offset-2 hover:underline"
        >
          Düzenle
        </Link>
        <Link
          href={trBoutiqueProductPath(boutiqueSlug, product.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-medium text-neutral-600 underline-offset-2 hover:underline"
        >
          Mağazada gör
        </Link>
      </div>
    </li>
  );
}
