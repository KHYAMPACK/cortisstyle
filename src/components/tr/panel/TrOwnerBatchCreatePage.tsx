"use client";

import Image from "next/image";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { useCallback, useEffect, useRef, useState } from "react";
import { TrOwnerAiJobQueueProvider, useScheduleAiJob } from "@/components/tr/panel/TrOwnerAiJobQueue";
import { TrOwnerBatchListingsStep } from "@/components/tr/panel/TrOwnerBatchListingsStep";
import { TrOwnerBatchChipsStep } from "@/components/tr/panel/TrOwnerBatchChipsStep";
import { useRegisterLeaveBusy } from "@/components/tr/panel/TrOwnerLeaveGuard";
import {
  TrOwnerBatchModelsStep,
  type ModelRowStatus,
} from "@/components/tr/panel/TrOwnerBatchModelsStep";
import { TrOwnerBatchPhotoStep } from "@/components/tr/panel/TrOwnerBatchPhotoStep";
import { TrOwnerBatchPricesStep } from "@/components/tr/panel/TrOwnerBatchPricesStep";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import { TrOwnerManualListingToggle } from "@/components/tr/panel/TrOwnerManualListingToggle";
import { TrOwnerSizeChartStock } from "@/components/tr/panel/TrOwnerSizeChartStock";
import { useOwnerSizeSources } from "@/components/tr/panel/useOwnerSizeSources";
import {
  findSizeSource,
  resolveSizeSourceId,
  type TrSizeSource,
} from "@/lib/tr/sizeSources";
import { emptyStockInputs, sizesFromStockInputs } from "@/lib/tr/sizeStockInputs";
import { TrOwnerStorePreview } from "@/components/tr/panel/TrOwnerStorePreview";
import { TrPanelFadeIn } from "@/components/tr/panel/TrPanelMotion";
import {
  panelBackLinkClass,
  panelErrorClass,
  panelHintClass,
  panelPageTitleClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
  panelStickyActionsClass,
  panelStickyActionsSpacerClass,
} from "@/components/tr/panel/panelUi";
import type { PipelineJobItem } from "@/lib/tr/aiCatalog/pipelineProgress";
import { applyConstructionListingTitle } from "@/lib/tr/fashion/aiCatalog/listingDraft";
import { mergeElbiseRestyleFeatures } from "@/lib/tr/fashion/aiCatalog/elbiseRestyle";
import { withManualListing } from "@/lib/tr/catalog/productFeatures";
import { hasManualGalleryPhoto } from "@/components/tr/panel/TrOwnerManualPhotoGallery";
import { runConstructionPackshot } from "@/lib/tr/fashion/aiCatalog/runConstructionPackshot";
import { describeModelPackageShots } from "@/lib/tr/fashion/aiCatalog/uploadCostHints";
import { emptyElbiseGateChips } from "@/components/tr/fashion/panel/TrOwnerElbiseConstructionGate";
import { ELBISE_PACKSHOT_SLOT } from "@/lib/tr/fashion/garmentUploadTypes";
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
  type BatchCreateStepId,
} from "@/lib/tr/productBatchCreateDraft";
import {
  batchIdentifyCounts,
  batchRowChipsReady,
  batchRowFamily,
  batchRowHasBothPhotos,
  batchRowPackshotReady,
  capturedBatchRows,
} from "@/lib/tr/productBatchCreateFlow";
import {
  alignMarketplaceSlots,
  cleanedLifestyleImages,
  getPanelProductCover,
} from "@/lib/tr/productImages";
import { parseSizeStockInputs, sumSizeStocks } from "@/lib/tr/sizeStocks";
import {
  trBoutiqueProductPath,
  trPanelEditProductPath,
  trPanelProductsPath,
} from "@/lib/tr/paths";
import { formatTryFromKurus, type TrProduct } from "@/types/tr-marketplace";

const MANUAL_BATCH_STEPS = [
  "photos",
  "listings",
  "prices",
  "stock",
  "preview",
] as const satisfies readonly BatchCreateStepId[];

function stepsForBatch(manual: boolean): readonly BatchCreateStepId[] {
  return manual ? MANUAL_BATCH_STEPS : BATCH_CREATE_STEPS;
}

const STEP_LABELS: Record<BatchCreateStepId, string> = {
  photos: "Fotoğraf",
  chips: "Özellikler",
  listings: "İsim",
  models: "Model",
  prices: "Fiyat",
  stock: "Stok",
  preview: "Önizleme",
};

function listingRowValid(row: ProductBatchCreateRow): boolean {
  return row.title.trim().length > 0;
}

function priceRowValid(row: ProductBatchCreateRow): boolean {
  if (!isValidTryPrice(row.priceTry)) return false;
  if (!row.discountEnabled) return true;
  if (!isValidTryPrice(row.salePriceTry)) return false;
  const price = Number(row.priceTry.replace(",", "."));
  const sale = Number(row.salePriceTry.replace(",", "."));
  return sale < price;
}

function stockRowValid(
  row: ProductBatchCreateRow,
  sources: readonly TrSizeSource[],
): boolean {
  const source = findSizeSource(sources, row.sizeChart);
  if (!source) return isValidStock(row.stock);
  const sizes = sizesFromStockInputs(source, row.sizeStockInputs);
  if (!sizes.every((size) => isValidStock(row.sizeStockInputs[size] ?? ""))) {
    return false;
  }
  const parsed = parseSizeStockInputs(sizes, row.sizeStockInputs);
  return parsed !== null && sumSizeStocks(parsed) > 0;
}

function setSlotInList(list: string[], slotIndex: number, value: string): string[] {
  const next = [...list];
  while (next.length <= slotIndex) next.push("");
  next[slotIndex] = value;
  return next;
}

function jobsRunning(
  photoJobsById: Record<string, PipelineJobItem[]>,
  modelStatusById: Record<string, { status: ModelRowStatus }>,
  packingById: Record<string, boolean>,
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
  const packshots = Object.values(packingById).some(Boolean);
  return photos || models || packshots;
}

export function TrOwnerBatchCreatePage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
        <TrOwnerAiJobQueueProvider>
          <BatchCreateFlow
            boutiqueId={activeBoutique.id}
            boutiqueSlug={activeBoutique.slug}
          />
        </TrOwnerAiJobQueueProvider>
        </TrOwnerProductRouteGate>
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
  const scheduleAiJob = useScheduleAiJob();
  const { sources: sizeSources, loaded: sizeSourcesLoaded } =
    useOwnerSizeSources(boutiqueId);
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
  const [packingById, setPackingById] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const [manualMode, setManualMode] = useState(false);
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
      writeProductBatchCreateDraft(boutiqueId, {
        stepIndex,
        rows,
        manualMode,
      });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [boutiqueId, draftBanner, rows, stepIndex, manualMode]);

  const patchRow = useCallback(
    (clientId: string, patch: Partial<ProductBatchCreateRow>) => {
      setRows((current) => {
        if (!current) return current;
        const next = current.map((row) =>
          row.clientId === clientId ? { ...row, ...patch } : row,
        );
        rowsRef.current = next;
        return next;
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
    setManualMode(draftBanner.manualMode === true);
    const withModel = restored.find((row) => row.selectedModelId);
    if (withModel?.selectedModelId) {
      setBatchModelId(withModel.selectedModelId);
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
      setError(
        manualMode
          ? "En az bir ürünün fotoğrafını ekleyin."
          : "En az bir ürünün ön ve arka fotoğrafını ekleyin.",
      );
      return;
    }
    if (manualMode) {
      if (captured.some((row) => !hasManualGalleryPhoto(row.images))) {
        setError("Her üründe en az bir fotoğraf gerekli.");
        return;
      }
      setRows(captured);
      setStepIndex(1);
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

  const runRowPackshot = async (row: ProductBatchCreateRow) => {
    if (batchRowPackshotReady(row)) return;
    const family = batchRowFamily(row);
    const chips = row.gateChips;
    if (!family || !chips) {
      throw new Error("Tür ve özellikler eksik.");
    }
    setPackingById((current) => ({ ...current, [row.clientId]: true }));
    patchRow(row.clientId, { packshotError: null });
    try {
      const { packshotUrl, draft } = await runConstructionPackshot({
        boutiqueId,
        frontUrl: row.images[0]!.trim(),
        backUrl: row.images[1]!.trim(),
        detailUrl: row.images[2]?.trim() || "",
        family,
        chips,
        proposed: row.proposedChips ?? chips,
        preparedPrompt: row.preparedPrompt,
        listingDraft: row.listingDraft,
        title: row.title,
        category: row.category,
        scheduleAiJob,
      });
      const latest = rowsRef.current.find((item) => item.clientId === row.clientId);
      const images = latest?.images ?? row.images;
      const marketplace = latest?.marketplaceImages ?? row.marketplaceImages;
      patchRow(row.clientId, {
        images: setSlotInList(images, ELBISE_PACKSHOT_SLOT, packshotUrl),
        marketplaceImages: setSlotInList(
          marketplace,
          ELBISE_PACKSHOT_SLOT,
          packshotUrl,
        ),
        listingDraft: draft,
        title: draft.title.trim() || row.title,
        description: draft.description || row.description,
        features: draft.features ?? row.features,
        category: draft.category ?? row.category,
        packshotError: null,
      });
    } catch (packError) {
      patchRow(row.clientId, {
        packshotError:
          packError instanceof Error
            ? packError.message
            : "Packshot oluşturulamadı.",
      });
    } finally {
      setPackingById((current) => {
        const { [row.clientId]: _removed, ...rest } = current;
        return rest;
      });
    }
  };

  const confirmChips = () => {
    const current = rowsRef.current;
    if (current.some((row) => !batchRowChipsReady(row))) {
      setError("Her üründe tür ve zorunlu özellikleri seçin.");
      return;
    }
    setError(null);
    const next = current.map((row) => {
      const family = batchRowFamily(row)!;
      const chips =
        row.gateChips ??
        emptyElbiseGateChips(undefined, {
          hasDetailPhoto: Boolean(row.images[2]?.trim()),
        });
      const features = mergeElbiseRestyleFeatures(
        row.features,
        chips,
        family,
      );
      const titled = applyConstructionListingTitle(
        {
          title: row.title,
          features,
          category: family === "elbise" ? "elbise" : row.category,
        },
        family,
      );
      return {
        ...row,
        features: titled.features ?? features,
        title: titled.title,
        category: titled.category ?? row.category,
        uploadType: family,
      };
    });
    rowsRef.current = next;
    setRows(next);
    setStepIndex(2);
    void Promise.all(next.map((row) => runRowPackshot(row)));
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
        setError("Her üründe isim gerekli.");
        return;
      }
    }
    if (step === "prices") {
      if (!rows.every(priceRowValid)) {
        setError(
          "Her üründe geçerli bir fiyat girin. İndirim varsa satış fiyatı daha düşük olmalı.",
        );
        return;
      }
    }
    if (step === "stock") {
      if (!rows.every((row) => stockRowValid(row, sizeSources))) {
        setError(
          "Her üründe geçerli stok girin; en az bir bedende stok 1 veya daha fazla olmalı.",
        );
        return;
      }
    }
    setStepIndex((current) =>
      Math.min(current + 1, stepsForBatch(manualMode).length - 1),
    );
  };

  const goBack = () => {
    setError(null);
    setStepIndex((current) => Math.max(0, current - 1));
  };

  const applySizeChart = (clientId: string, chart: string) => {
    const row = rowsRef.current.find((item) => item.clientId === clientId);
    const source = findSizeSource(sizeSources, chart);
    if (!source) {
      patchRow(clientId, { sizeChart: chart, sizeStockInputs: {} });
      return;
    }
    const nextInputs = emptyStockInputs(source, "0");
    if (row) {
      for (const size of Object.keys(nextInputs)) {
        if (row.sizeStockInputs[size] !== undefined) {
          nextInputs[size] = row.sizeStockInputs[size]!;
        }
      }
    }
    patchRow(clientId, { sizeChart: chart, sizeStockInputs: nextInputs });
  };

  // Once the boutique's Beden types are in, move rows on a built-in list (new rows, or
  // rows restored from an older draft) onto the matching type.
  useEffect(() => {
    if (!sizeSourcesLoaded || !rows) return;
    for (const row of rows) {
      const resolved = resolveSizeSourceId(sizeSources, row.sizeChart);
      if (resolved !== row.sizeChart) applySizeChart(row.clientId, resolved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applySizeChart reads the latest rows
  }, [sizeSourcesLoaded, sizeSources, rows]);

  async function saveAll() {
    if (!rows) return;
    if (!manualMode && jobsRunning(photoJobsById, modelStatusById, packingById)) {
      setError(
        "Katalog veya model görselleri hâlâ hazırlanıyor. Bitmesini bekleyin.",
      );
      return;
    }
    if (!manualMode && rows.some((row) => !batchRowPackshotReady(row))) {
      setError("Her üründe packshot gerekli. Özellikler adımından tekrar deneyin.");
      return;
    }
    if (
      !rows.every(listingRowValid) ||
      !rows.every(priceRowValid) ||
      !rows.every((row) => stockRowValid(row, sizeSources))
    ) {
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
        return createOwnerProduct(buildCreatePayload(boutiqueId, row, sizeSources, manualMode));
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

  const batchSteps = stepsForBatch(manualMode);
  const step = batchSteps[stepIndex] ?? "photos";
  const packing = jobsRunning(photoJobsById, modelStatusById, packingById);
  useRegisterLeaveBusy("batch-create", packing || saving);

  const applyManualMode = (next: boolean) => {
    setManualMode(next);
    setStepIndex((current) => {
      const from = stepsForBatch(!next);
      const to = stepsForBatch(next);
      const id = from[Math.min(current, from.length - 1)];
      const idx = to.findIndex((entry) => entry === id);
      return idx >= 0 ? idx : 0;
    });
  };

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
            {manualMode
              ? "Kategori ve özellikleri sen seç — AI çalışmaz."
              : "Önce fotoğrafları çekin. Sonra özellikleri onaylayın — packshot o zaman üretilir. İsim ve fiyatı beklerken doldurabilirsiniz."}
          </p>
        </div>

        <TrOwnerManualListingToggle
          checked={manualMode}
          onChange={applyManualMode}
          disabled={saving}
        />

        <p className="text-[14px] font-medium text-neutral-600">
          Adım {stepIndex + 1} / {batchSteps.length} · {STEP_LABELS[step]}
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
                manualMode={manualMode}
              />
            </div>

            {step === "chips" ? (
              <TrOwnerBatchChipsStep
                boutiqueId={boutiqueId}
                rows={rows}
                packingById={packingById}
                onPatchRow={patchRow}
                onBack={goBack}
                onConfirm={confirmChips}
              />
            ) : null}

            {step === "listings" ? (
              <TrOwnerBatchListingsStep
                boutiqueId={boutiqueId}
                rows={rows}
                packingById={packingById}
                onPatchRow={patchRow}
                manualMode={manualMode}
              />
            ) : null}

            {step === "models" ? (
              <TrOwnerBatchModelsStep
                boutiqueId={boutiqueId}
                boutiqueSlug={boutiqueSlug}
                rows={rows}
                modelId={batchModelId}
                modelStatusById={modelStatusById}
                getRow={getRow}
                onModelIdChange={setBatchModelId}
                onPatchRow={patchRow}
                onModelStatusChange={(clientId, status) =>
                  setModelStatusById((current) => ({
                    ...current,
                    [clientId]: status,
                  }))
                }
              />
            ) : null}

            {step === "prices" ? (
              <TrOwnerBatchPricesStep rows={rows} onPatchRow={patchRow} />
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
                      sources={sizeSources}
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
                      sizes={sizesFromStockInputs(
                        findSizeSource(sizeSources, row.sizeChart),
                        row.sizeStockInputs,
                      )}
                      onModelGallery
                      modelShotsPending={
                        modelStatusById[row.clientId]?.status === "running" ||
                        modelStatusById[row.clientId]?.status === "queued" ||
                        modelStatusById[row.clientId]?.status ===
                          "waiting-catalog"
                      }
                      pendingModelShotCount={describeModelPackageShots(
                        batchModelId ?? row.selectedModelId,
                        {
                          uploadType: batchRowFamily(row) ?? "elbise",
                          features: row.gateChips,
                          detailImageUrl: row.images[2]?.trim() || null,
                        },
                      )}
                    />
                  </section>
                ))}
              </div>
            ) : null}

            {step !== "photos" && step !== "chips" ? (
              <>
                <div className={panelStickyActionsSpacerClass} aria-hidden />
                <div className={panelStickyActionsClass}>
                  <button
                    type="button"
                    className={`${panelSecondaryBtnClass} flex-1`}
                    onClick={goBack}
                  >
                    Geri
                  </button>
                  {step !== "preview" ? (
                    <button
                      type="button"
                      className={`${panelPrimaryBtnClass} flex-1`}
                      onClick={goNext}
                    >
                      {step === "models"
                        ? "Devam (model isteğe bağlı)"
                        : "Devam"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${panelPrimaryBtnClass} flex-1`}
                      disabled={saving || packing}
                      onClick={() => void saveAll()}
                    >
                      {saving
                        ? "Kaydediliyor…"
                        : packing
                          ? "Görseller bitince kaydedin"
                          : "Hepsini kaydet"}
                    </button>
                  )}
                </div>
              </>
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
  sources: readonly TrSizeSource[],
  manualMode = false,
): TrOwnerProductPayload {
  const listPrice = Number(row.priceTry.replace(",", "."));
  let sellPrice = listPrice;
  let compareAtPriceTry: number | null = null;
  if (row.discountEnabled) {
    sellPrice = Number(row.salePriceTry.replace(",", "."));
    compareAtPriceTry = listPrice;
  }
  const sizes = sizesFromStockInputs(
    findSizeSource(sources, row.sizeChart),
    row.sizeStockInputs,
  );
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
    features: withManualListing(row.features, manualMode),
    priceTry: sellPrice,
    compareAtPriceTry,
    sizes,
    colors: [],
    category: row.category,
    images: row.images,
    marketplaceImages: alignMarketplaceSlots(row.images, row.marketplaceImages),
    lifestyleImages: cleanedLifestyleImages(row.lifestyleImages),
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
