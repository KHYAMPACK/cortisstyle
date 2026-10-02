"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { TrOwnerStorePreview } from "@/components/tr/panel/TrOwnerStorePreview";
import { useRegisterLeaveBusy } from "@/components/tr/panel/TrOwnerLeaveGuard";
import { TrProductImageLightbox } from "@/components/tr/panel/TrProductImageLightbox";
import { TrOwnerSizeChartStock } from "@/components/tr/panel/TrOwnerSizeChartStock";
import { useOwnerCategoryList } from "@/components/tr/panel/useOwnerCategories";
import { useOwnerSizeSources } from "@/components/tr/panel/useOwnerSizeSources";
import { categoryPayloadForGarment } from "@/lib/tr/fashion/garmentCategory";
import {
  BUILT_IN_SIZE_SOURCES,
  findSizeSource,
  resolveSizeSourceId,
  type TrSizeSource,
} from "@/lib/tr/sizeSources";
import { emptyStockInputs, sizesFromStockInputs } from "@/lib/tr/sizeStockInputs";
import { TrOwnerCategoryPicker } from "@/components/tr/panel/TrOwnerCategoryPicker";
import {
  hasManualGalleryPhoto,
  TrOwnerManualPhotoGallery,
} from "@/components/tr/panel/TrOwnerManualPhotoGallery";
import { TrOwnerProductFeaturesFields } from "@/components/tr/panel/TrOwnerProductFeaturesFields";
import {
  panelFieldClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
  panelStickyActionsClass,
  panelStickyActionsSpacerClass,
} from "@/components/tr/panel/panelUi";
import {
  constructionCatalogFamily,
  isAltGiyimShopLeaf,
  isUstGiyimShopLeaf,
} from "@/lib/tr/fashion/garmentUploadTypes";
import { withManualListing } from "@/lib/tr/catalog/productFeatures";
import { DEFAULT_CATALOG_BACKGROUND_ID } from "@/lib/tr/catalogBackgrounds/registry";
import {
  clampDescription,
  clampTitle,
  isValidStock,
  isValidTryPrice,
  sanitizeTryPriceInput,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import { createOwnerProduct } from "@/lib/tr/ownerClient";
import {
  clearProductCreateDraft,
  draftHasProgress,
  readProductCreateDraft,
  writeProductCreateDraft,
  type ProductCreateDraft,
} from "@/lib/tr/productCreateDraft";
import { colorSwatchFromName } from "@/lib/tr/catalog/colorSiblings";
import {
  parseSizeStockInputs,
  sumSizeStocks,
} from "@/lib/tr/sizeStocks";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProduct, TrProductFeatures } from "@/types/tr-marketplace";

const STEPS = [
  {
    id: "photo",
    title: "Fotoğraf",
    hint: "Ürün fotoğraflarını ekleyin; ilki kapak olur.",
  },
  {
    id: "name",
    title: "İsim",
    hint: "Ürün adı, açıklama, kategori ve özellikler",
  },
  {
    id: "price",
    title: "Fiyat",
    hint: "Satış fiyatı",
  },
  {
    id: "sizes",
    title: "Beden",
    hint: "Beden tablosu seçin, stokları yazın",
  },
  {
    id: "review",
    title: "Önizleme",
    hint: "Kontrol edin ve kaydedin",
  },
] as const;

function remapStockInputsForChart(
  source: TrSizeSource | null,
  current: Record<string, string>,
): Record<string, string> {
  const nextInputs = emptyStockInputs(source, "0");
  for (const size of Object.keys(nextInputs)) {
    if (current[size] !== undefined) nextInputs[size] = current[size]!;
  }
  return nextInputs;
}

function stockInputsReady(
  source: TrSizeSource | null,
  chartSizes: string[],
  stock: string,
  sizeStockInputs: Record<string, string>,
): boolean {
  if (!source) return isValidStock(stock);
  if (!chartSizes.every((size) => isValidStock(sizeStockInputs[size] ?? ""))) {
    return false;
  }
  const parsed = parseSizeStockInputs(chartSizes, sizeStockInputs);
  return parsed !== null && sumSizeStocks(parsed) > 0;
}

function parseListingStock(
  source: TrSizeSource | null,
  stock: string,
  sizeStockInputs: Record<string, string>,
): { stockValue: number; sizeStocks: Record<string, number>; sizes: string[] } {
  const sizes = sizesFromStockInputs(source, sizeStockInputs);
  if (sizes.length > 0) {
    const parsed = parseSizeStockInputs(sizes, sizeStockInputs);
    if (!parsed) {
      throw new Error(
        `Her beden için stok ${TR_OWNER_PRODUCT_LIMITS.stockMin}–${TR_OWNER_PRODUCT_LIMITS.stockMax} arası olmalı.`,
      );
    }
    const stockValue = sumSizeStocks(parsed);
    if (stockValue <= 0) {
      throw new Error("En az bir bedende stok girin.");
    }
    return { stockValue, sizeStocks: parsed, sizes };
  }
  if (!isValidStock(stock)) {
    throw new Error(
      `Stok ${TR_OWNER_PRODUCT_LIMITS.stockMin}–${TR_OWNER_PRODUCT_LIMITS.stockMax} arası olmalı.`,
    );
  }
  return {
    stockValue: Number.parseInt(stock, 10),
    sizeStocks: {},
    sizes,
  };
}

interface TrProductCreateWizardProps {
  boutiqueId: string;
  onSaved: (product: TrProduct) => void;
}

/**
 * Tek parça: the owner adds photos and fills in the listing by hand, one step at a time.
 * A local draft survives a reload until the product is saved.
 */
export function TrProductCreateWizard({
  boutiqueId,
  onSaved,
}: TrProductCreateWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[Math.min(stepIndex, STEPS.length - 1)]!;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<TrProductFeatures>({});
  const [priceTry, setPriceTry] = useState("");
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [salePriceTry, setSalePriceTry] = useState("");
  const [stock, setStock] = useState("1");
  // A size source id (a Beden type, or the built-in `letter` / `numeric`) or `none`.
  const [sizeChart, setSizeChart] = useState<string>("letter");
  const [sizeStockInputs, setSizeStockInputs] = useState<
    Record<string, string>
  >(() => emptyStockInputs(findSizeSource(BUILT_IN_SIZE_SOURCES, "letter"), "0"));
  const { sources: sizeSources, loaded: sizeSourcesLoaded } =
    useOwnerSizeSources(boutiqueId);
  // A boutique on its own categories files the garment under the category keyed with
  // its built-in id (see garmentCategory.ts).
  const { categoryList, loaded: categoriesLoaded } = useOwnerCategoryList(boutiqueId);
  const sizeSource = findSizeSource(sizeSources, sizeChart);
  const [category, setCategory] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<{
    src: string;
    label: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftBanner, setDraftBanner] = useState<ProductCreateDraft | null>(
    null,
  );
  const draftHydratedRef = useRef(false);
  const skipNextPersistRef = useRef(false);

  useEffect(() => {
    const existing = readProductCreateDraft(boutiqueId);
    if (existing && draftHasProgress(existing)) {
      setDraftBanner(existing);
    }
    draftHydratedRef.current = true;
  }, [boutiqueId]);

  useEffect(() => {
    if (!draftHydratedRef.current) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    if (draftBanner) return;
    const handle = window.setTimeout(() => {
      writeProductCreateDraft(boutiqueId, {
        stepIndex,
        title,
        description,
        features,
        priceTry,
        discountEnabled,
        salePriceTry,
        stock,
        sizeChart,
        sizeStockInputs,
        category,
        images,
      });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [
    boutiqueId,
    category,
    description,
    features,
    discountEnabled,
    draftBanner,
    images,
    priceTry,
    salePriceTry,
    sizeChart,
    sizeStockInputs,
    stepIndex,
    stock,
    title,
  ]);

  const chartSizes = useMemo(
    () => sizesFromStockInputs(sizeSource, sizeStockInputs),
    [sizeSource, sizeStockInputs],
  );

  useRegisterLeaveBusy("product-create", uploading || saving);

  const applySizeChart = (next: string) => {
    setSizeChart(next);
    const nextSource = findSizeSource(sizeSources, next);
    if (!nextSource) {
      setSizeStockInputs({});
      return;
    }
    setSizeStockInputs((current) => remapStockInputsForChart(nextSource, current));
  };

  // Once the boutique's Beden types are in, move a built-in list (the default, or one
  // restored from an older draft) onto the matching type.
  useEffect(() => {
    if (!sizeSourcesLoaded) return;
    const resolved = resolveSizeSourceId(sizeSources, sizeChart);
    if (resolved !== sizeChart) applySizeChart(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applySizeChart reads the latest sources
  }, [sizeSourcesLoaded, sizeSources, sizeChart]);

  useEffect(() => {
    if (!sizeSource) return;
    setSizeStockInputs((current) => {
      const defaults = emptyStockInputs(sizeSource, "0");
      let changed = false;
      const next = { ...current };
      for (const [size, fill] of Object.entries(defaults)) {
        if (next[size] === undefined) {
          next[size] = fill;
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [sizeSource]);

  const family = constructionCatalogFamily(null, category);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const photosReady = hasManualGalleryPhoto(images);

  const canContinue = useMemo(() => {
    if (step.id === "photo") return photosReady;
    if (step.id === "name") return title.trim().length > 0;
    if (step.id === "price") {
      if (!isValidTryPrice(priceTry)) return false;
      if (discountEnabled) {
        if (!isValidTryPrice(salePriceTry)) return false;
        const price = Number(priceTry.replace(",", "."));
        const sale = Number(salePriceTry.replace(",", "."));
        return sale < price;
      }
      return true;
    }
    if (step.id === "sizes") {
      return stockInputsReady(sizeSource, chartSizes, stock, sizeStockInputs);
    }
    return true;
  }, [
    chartSizes,
    discountEnabled,
    photosReady,
    priceTry,
    salePriceTry,
    sizeSource,
    sizeStockInputs,
    step.id,
    stock,
    title,
  ]);

  const goNext = () => {
    setError(null);
    if (!canContinue) {
      if (step.id === "name") setError("Ürün adı zorunlu.");
      else if (step.id === "price") {
        setError(
          discountEnabled
            ? "İndirimli fiyat, normal fiyattan düşük olmalı."
            : "Geçerli bir fiyat girin.",
        );
      } else if (step.id === "sizes") {
        setError(
          !sizeSource
            ? "Geçerli bir stok girin."
            : "Her beden için stok girin; en az bir bedende stok 1 veya daha fazla olmalı.",
        );
      }
      return;
    }
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const restoreDraft = () => {
    if (!draftBanner) return;
    const draft = draftBanner;
    skipNextPersistRef.current = true;
    setStepIndex(Math.min(Math.max(0, draft.stepIndex), STEPS.length - 1));
    setTitle(draft.title);
    setDescription(draft.description);
    setFeatures(draft.features ?? {});
    setPriceTry(draft.priceTry);
    setDiscountEnabled(draft.discountEnabled);
    setSalePriceTry(draft.salePriceTry);
    setStock(draft.stock);
    setSizeChart(draft.sizeChart);
    setSizeStockInputs({
      ...emptyStockInputs(findSizeSource(sizeSources, draft.sizeChart), "0"),
      ...(draft.sizeStockInputs ?? {}),
    });
    setCategory(draft.category);
    setImages(draft.images ?? []);
    setDraftBanner(null);
  };

  const discardDraft = () => {
    clearProductCreateDraft(boutiqueId);
    setDraftBanner(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!isValidTryPrice(priceTry)) {
        throw new Error(
          `Fiyat ${TR_OWNER_PRODUCT_LIMITS.priceMinTry}–${TR_OWNER_PRODUCT_LIMITS.priceMaxTry} TL arası olmalı.`,
        );
      }
      const listPrice = Number(priceTry.replace(",", "."));
      if (!title.trim()) throw new Error("Başlık zorunlu.");
      if (family === "ust-giyim" && !isUstGiyimShopLeaf(category)) {
        throw new Error(
          "Üst giyim için alt kategori seçin (bluz, gömlek, tişört…).",
        );
      }
      if (family === "alt-giyim" && !isAltGiyimShopLeaf(category)) {
        throw new Error(
          "Alt giyim için alt kategori seçin (etek, pantolon, eşofman).",
        );
      }
      if (!hasManualGalleryPhoto(images)) {
        throw new Error("En az bir fotoğraf ekleyin.");
      }

      const { stockValue, sizeStocks, sizes } = parseListingStock(
        sizeSource,
        stock,
        sizeStockInputs,
      );

      let sellPrice = listPrice;
      let compareAtPriceTryValue: number | null = null;
      if (discountEnabled) {
        if (!isValidTryPrice(salePriceTry)) {
          throw new Error("Geçerli bir indirimli fiyat girin.");
        }
        const sale = Number(salePriceTry.replace(",", "."));
        if (sale >= listPrice) {
          throw new Error("İndirimli fiyat, normal fiyattan düşük olmalı.");
        }
        sellPrice = sale;
        compareAtPriceTryValue = listPrice;
      }

      if (!categoriesLoaded) {
        throw new Error("Kategoriler yükleniyor; birkaç saniye sonra tekrar deneyin.");
      }
      const product = await createOwnerProduct({
        boutiqueId,
        title: title.trim(),
        description: description.trim() || null,
        // Photos are shown as uploaded (see productImages.ts).
        features: withManualListing(features, true),
        priceTry: sellPrice,
        compareAtPriceTry: compareAtPriceTryValue,
        sizes,
        colors: features.color?.trim()
          ? [colorSwatchFromName(features.color)]
          : [],
        ...categoryPayloadForGarment(category, categoryList),
        images,
        catalogBackgroundId: DEFAULT_CATALOG_BACKGROUND_ID,
        stock: stockValue,
        sizeStocks,
        status: "available",
      });

      clearProductCreateDraft(boutiqueId);
      onSaved(product);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Kayıt başarısız.",
      );
    } finally {
      setSaving(false);
    }
  };

  const displaySellPrice = discountEnabled ? salePriceTry : priceTry;
  const displayListPrice = discountEnabled ? priceTry : null;

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {draftBanner ? (
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
              aria-labelledby="product-create-draft-title"
              className="w-full max-w-md rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-xl sm:p-6"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <p
                id="product-create-draft-title"
                className="text-[20px] font-semibold text-neutral-900"
              >
                Yarım kalan ürün var
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
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[16px] font-semibold text-neutral-700">
            Adım {stepIndex + 1} / {STEPS.length}
          </p>
          <p
            className="text-[16px] font-semibold"
            style={{ color: "var(--panel-accent-deep)" }}
          >
            {step.title}
          </p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[color:var(--panel-accent-soft)]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: "var(--panel-accent)",
            }}
          />
        </div>
        <p className="mt-3 text-[18px] text-neutral-700">{step.hint}</p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-[16px] text-red-800">
          {error}
        </p>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-sm sm:p-6"
        >
          {step.id === "photo" ? (
            <TrOwnerManualPhotoGallery
              boutiqueId={boutiqueId}
              images={images}
              onImagesChange={setImages}
              onError={setError}
              onLightbox={setLightbox}
              disabled={saving}
              uploading={uploading}
              onUploadingChange={setUploading}
            />
          ) : null}

          {step.id === "name" ? (
            <div className="space-y-5">
              <label className="block space-y-2">
                <span className="text-[17px] font-semibold text-neutral-800">
                  Ürün adı
                </span>
                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(clampTitle(event.target.value))
                  }
                  className={panelFieldClass}
                  placeholder="Örn. Siyah Bluz"
                  maxLength={TR_OWNER_PRODUCT_LIMITS.titleMax}
                  autoFocus
                  required
                />
                <span className="text-[13px] text-neutral-500">
                  {title.length}/{TR_OWNER_PRODUCT_LIMITS.titleMax}
                </span>
              </label>
              <label className="block space-y-2">
                <span className="text-[17px] font-semibold text-neutral-800">
                  Kısa açıklama (isteğe bağlı)
                </span>
                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(clampDescription(event.target.value))
                  }
                  className={`${panelFieldClass} min-h-28`}
                  placeholder="Kumaş, kesim, kullanım…"
                  maxLength={TR_OWNER_PRODUCT_LIMITS.descriptionMax}
                />
                <span className="text-[13px] text-neutral-500">
                  {description.length}/
                  {TR_OWNER_PRODUCT_LIMITS.descriptionMax}
                </span>
              </label>
              <div className="space-y-2">
                <p className="text-[17px] font-semibold text-neutral-800">
                  Kategori
                </p>
                <TrOwnerCategoryPicker value={category} onChange={setCategory} />
              </div>
              <TrOwnerProductFeaturesFields
                value={features}
                onChange={setFeatures}
                disabled={saving}
                fieldClass={panelFieldClass}
                variant={family ? "dress" : "default"}
                family={family ?? "elbise"}
                shopCategory={category}
              />
            </div>
          ) : null}

          {step.id === "price" ? (
            <div className="space-y-6">
              <label className="block space-y-2">
                <span className="text-[17px] font-semibold text-neutral-800">
                  Fiyat (TL)
                </span>
                <input
                  value={priceTry}
                  onChange={(event) =>
                    setPriceTry(sanitizeTryPriceInput(event.target.value))
                  }
                  className={panelFieldClass}
                  inputMode="decimal"
                  placeholder="890"
                  autoFocus
                  required
                />
                {priceTry && isValidTryPrice(priceTry) ? (
                  <span className="text-[15px] text-neutral-600">
                    {formatTryFromKurus(
                      Math.round(Number(priceTry.replace(",", ".")) * 100),
                    )}
                  </span>
                ) : (
                  <span className="text-[13px] text-neutral-500">
                    {TR_OWNER_PRODUCT_LIMITS.priceMinTry}–
                    {TR_OWNER_PRODUCT_LIMITS.priceMaxTry} TL
                  </span>
                )}
              </label>

              <button
                type="button"
                role="switch"
                aria-checked={discountEnabled}
                onClick={() => {
                  setDiscountEnabled((current) => !current);
                  if (discountEnabled) setSalePriceTry("");
                }}
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-softer)] px-4 py-4 text-left"
              >
                <span
                  className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                    discountEnabled
                      ? "bg-[color:var(--panel-accent)]"
                      : "bg-neutral-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                      discountEnabled ? "translate-x-6" : ""
                    }`}
                  />
                </span>
                <span>
                  <span className="block text-[18px] font-semibold text-neutral-900">
                    İndirim var mı?
                  </span>
                  <span className="mt-0.5 block text-[15px] text-neutral-600">
                    Açınca indirimli satış fiyatını girebilirsiniz
                  </span>
                </span>
              </button>

              {discountEnabled ? (
                <label className="block space-y-2">
                  <span className="text-[17px] font-semibold text-neutral-800">
                    İndirimli fiyat (TL)
                  </span>
                  <input
                    value={salePriceTry}
                    onChange={(event) =>
                      setSalePriceTry(
                        sanitizeTryPriceInput(event.target.value),
                      )
                    }
                    className={panelFieldClass}
                    inputMode="decimal"
                    placeholder="690"
                  />
                  <span className="text-[15px] text-neutral-600">
                    Müşteri bunu öder; üstteki fiyat üstü çizili görünür.
                  </span>
                </label>
              ) : null}
            </div>
          ) : null}

          {step.id === "sizes" ? (
            <TrOwnerSizeChartStock
              chart={sizeChart}
              onChartChange={applySizeChart}
              sources={sizeSources}
              stockInputs={sizeStockInputs}
              onStockInputsChange={setSizeStockInputs}
              stock={stock}
              onStockChange={setStock}
            />
          ) : null}

          {step.id === "review" ? (
            <div className="space-y-5">
              <TrOwnerStorePreview
                title={title}
                description={description}
                priceTry={displaySellPrice}
                compareAtPriceTry={displayListPrice}
                images={images}
                sizes={chartSizes}
              />
              <p className="rounded-xl bg-[color:var(--panel-accent-soft)] px-4 py-3 text-[16px] text-neutral-800">
                Kaydettiğinizde ürün satışta görünür.
                {uploading ? " Fotoğraflar yüklenmeden kaydetmeyin." : ""}
              </p>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className={panelStickyActionsSpacerClass} aria-hidden />
      <div className={panelStickyActionsClass}>
        <div className="mx-auto flex w-full max-w-4xl flex-wrap gap-3">
          {stepIndex > 0 ? (
            <button type="button" className={panelSecondaryBtnClass} onClick={goBack}>
              Geri
            </button>
          ) : null}
          {step.id !== "review" && (step.id !== "photo" || photosReady) ? (
            <button
              type="button"
              className={`${panelPrimaryBtnClass} flex-1 disabled:opacity-60`}
              onClick={goNext}
              disabled={!canContinue || uploading}
            >
              Devam
            </button>
          ) : null}
          {step.id === "review" ? (
            <button
              type="button"
              className={`${panelPrimaryBtnClass} flex-1`}
              onClick={() => void save()}
              disabled={saving || uploading}
            >
              {saving
                ? "Kaydediliyor…"
                : uploading
                  ? "Fotoğraflar yükleniyor…"
                  : "Ürünü kaydet"}
            </button>
          ) : null}
        </div>
      </div>

      <TrProductImageLightbox
        open={Boolean(lightbox)}
        src={lightbox?.src ?? null}
        label={lightbox?.label}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
