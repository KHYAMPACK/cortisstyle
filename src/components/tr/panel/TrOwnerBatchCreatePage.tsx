"use client";

import Image from "next/image";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { useCallback, useEffect, useRef, useState } from "react";
import { TrOwnerBatchListingsStep } from "@/components/tr/panel/TrOwnerBatchListingsStep";
import { useRegisterLeaveBusy } from "@/components/tr/panel/TrOwnerLeaveGuard";
import { TrOwnerBatchPhotoStep } from "@/components/tr/panel/TrOwnerBatchPhotoStep";
import { TrOwnerBatchPricesStep } from "@/components/tr/panel/TrOwnerBatchPricesStep";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import { TrOwnerSizeChartStock } from "@/components/tr/panel/TrOwnerSizeChartStock";
import { useOwnerCategoryList } from "@/components/tr/panel/useOwnerCategories";
import { useOwnerSizeSources } from "@/components/tr/panel/useOwnerSizeSources";
import { categoryPayloadForGarment } from "@/lib/tr/fashion/garmentCategory";
import type { TrCategoryListEntry } from "@/lib/tr/categories/types";
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
import { withManualListing } from "@/lib/tr/catalog/productFeatures";
import { hasManualGalleryPhoto } from "@/components/tr/panel/TrOwnerManualPhotoGallery";
import { DEFAULT_CATALOG_BACKGROUND_ID } from "@/lib/tr/catalogBackgrounds/registry";
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
  capturedBatchRows,
  createEmptyBatchRow,
  clearProductBatchCreateDraft,
  readProductBatchCreateDraft,
  writeProductBatchCreateDraft,
  type ProductBatchCreateDraft,
  type ProductBatchCreateRow,
  type BatchCreateStepId,
} from "@/lib/tr/productBatchCreateDraft";
import { getPanelProductCover } from "@/lib/tr/productImages";
import { parseSizeStockInputs, sumSizeStocks } from "@/lib/tr/sizeStocks";
import {
  trBoutiqueProductPath,
  trPanelEditProductPath,
  trPanelProductsPath,
} from "@/lib/tr/paths";
import { formatTryFromKurus, type TrProduct } from "@/types/tr-marketplace";

const STEP_LABELS: Record<BatchCreateStepId, string> = {
  photos: "Fotoğraf",
  listings: "İsim",
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

export function TrOwnerBatchCreatePage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
          <BatchCreateFlow
            boutiqueId={activeBoutique.id}
            boutiqueSlug={activeBoutique.slug}
          />
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}

/** Toplu ekle: several products in one session, each added by hand. */
function BatchCreateFlow({
  boutiqueId,
  boutiqueSlug,
}: {
  boutiqueId: string;
  boutiqueSlug: string;
}) {
  const { sources: sizeSources, loaded: sizeSourcesLoaded } =
    useOwnerSizeSources(boutiqueId);
  // A boutique on its own categories files each garment under the category keyed with
  // its built-in id (see garmentCategory.ts).
  const { categoryList, loaded: categoriesLoaded } = useOwnerCategoryList(boutiqueId);
  const [rows, setRows] = useState<ProductBatchCreateRow[] | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saved, setSaved] = useState<TrProduct[]>([]);
  const [draftBanner, setDraftBanner] =
    useState<ProductBatchCreateDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
        const next = current.map((row) =>
          row.clientId === clientId ? { ...row, ...patch } : row,
        );
        rowsRef.current = next;
        return next;
      });
    },
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
  };

  useEffect(() => {
    if (!rows || rows.length === 0) return;
    if (activeId && rows.some((row) => row.clientId === activeId)) return;
    setActiveId(rows[0]!.clientId);
  }, [activeId, rows]);

  const continueFromPhotos = () => {
    if (!rows) return;
    setError(null);
    const captured = capturedBatchRows(rows);
    if (captured.length === 0) {
      setError("En az bir ürünün fotoğrafını ekleyin.");
      return;
    }
    if (captured.some((row) => !hasManualGalleryPhoto(row.images))) {
      setError("Her üründe en az bir fotoğraf gerekli.");
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
      Math.min(current + 1, BATCH_CREATE_STEPS.length - 1),
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
    if (!categoriesLoaded) {
      setError("Kategoriler yükleniyor; birkaç saniye sonra tekrar deneyin.");
      return;
    }
    if (!rows) return;
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
        return createOwnerProduct(buildCreatePayload(boutiqueId, row, sizeSources, categoryList));
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
  useRegisterLeaveBusy("batch-create", uploading || saving);

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
            Önce her ürünün fotoğraflarını ekleyin; sonra isim, fiyat ve stok.
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
            {step === "photos" ? (
              <TrOwnerBatchPhotoStep
                boutiqueId={boutiqueId}
                rows={rows}
                activeId={activeId}
                onActiveIdChange={setActiveId}
                onPatchRow={patchRow}
                onAddRow={addRow}
                onRemoveRow={removeRow}
                onContinue={continueFromPhotos}
                uploading={uploading}
                onUploadingChange={setUploading}
              />
            ) : null}

            {step === "listings" ? (
              <TrOwnerBatchListingsStep rows={rows} onPatchRow={patchRow} />
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
                      sizes={sizesFromStockInputs(
                        findSizeSource(sizeSources, row.sizeChart),
                        row.sizeStockInputs,
                      )}
                    />
                  </section>
                ))}
              </div>
            ) : null}

            {step !== "photos" ? (
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
                      Devam
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${panelPrimaryBtnClass} flex-1`}
                      disabled={saving}
                      onClick={() => void saveAll()}
                    >
                      {saving ? "Kaydediliyor…" : "Hepsini kaydet"}
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
  categoryList: readonly TrCategoryListEntry[] | null,
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
    // Photos are shown as uploaded (see productImages.ts).
    features: withManualListing(row.features, true),
    priceTry: sellPrice,
    compareAtPriceTry,
    sizes,
    colors: [],
    ...categoryPayloadForGarment(row.category, categoryList),
    images: row.images,
    catalogBackgroundId: DEFAULT_CATALOG_BACKGROUND_ID,
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
