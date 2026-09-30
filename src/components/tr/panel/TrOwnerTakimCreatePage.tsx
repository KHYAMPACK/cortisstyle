"use client";

import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { useEffect, useRef, useState } from "react";
import { useRegisterLeaveBusy } from "@/components/tr/panel/TrOwnerLeaveGuard";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import {
  hasManualGalleryPhoto,
  TrOwnerManualPhotoGallery,
} from "@/components/tr/panel/TrOwnerManualPhotoGallery";
import { TrOwnerProductCreatedSuccess } from "@/components/tr/panel/TrOwnerProductCreatedSuccess";
import { TrOwnerStorePreview } from "@/components/tr/panel/TrOwnerStorePreview";
import { TrOwnerProductFeaturesFields } from "@/components/tr/panel/TrOwnerProductFeaturesFields";
import { TrPanelFadeIn } from "@/components/tr/panel/TrPanelMotion";
import { TrProductImageLightbox } from "@/components/tr/panel/TrProductImageLightbox";
import { TrOwnerSizeChartStock } from "@/components/tr/panel/TrOwnerSizeChartStock";
import { useOwnerCategoryList } from "@/components/tr/panel/useOwnerCategories";
import { useOwnerSizeSources } from "@/components/tr/panel/useOwnerSizeSources";
import { categoryPayloadForGarment } from "@/lib/tr/fashion/garmentCategory";
import { findSizeSource, resolveSizeSourceId } from "@/lib/tr/sizeSources";
import { emptyStockInputs, sizesFromStockInputs } from "@/lib/tr/sizeStockInputs";
import {
  panelBackLinkClass,
  panelErrorClass,
  panelFieldClass,
  panelHintClass,
  panelPageTitleClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
  panelStickyActionsClass,
  panelStickyActionsSpacerClass,
} from "@/components/tr/panel/panelUi";
import { DEFAULT_CATALOG_BACKGROUND_ID } from "@/lib/tr/catalogBackgrounds/registry";
import { withManualListing } from "@/lib/tr/catalog/productFeatures";
import { TAKIM_SHOP_LEAF } from "@/lib/tr/fashion/garmentUploadTypes";
import { createOwnerProduct } from "@/lib/tr/ownerClient";
import {
  clampDescription,
  clampTitle,
  isValidStock,
  isValidTryPrice,
  sanitizeTryPriceInput,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import {
  clearProductTakimCreateDraft,
  createEmptyTakimDraft,
  readProductTakimCreateDraft,
  TAKIM_CREATE_STEPS,
  takimDraftHasProgress,
  writeProductTakimCreateDraft,
  type TakimCreateStepId,
} from "@/lib/tr/productTakimCreateDraft";
import { trPanelProductsPath } from "@/lib/tr/paths";
import { parseSizeStockInputs, sumSizeStocks } from "@/lib/tr/sizeStocks";
import type { TrProduct, TrProductFeatures } from "@/types/tr-marketplace";

const STEP_LABELS: Record<TakimCreateStepId, string> = {
  photos: "Fotoğraf",
  listing: "İsim",
  prices: "Fiyat",
  stock: "Stok",
  preview: "Önizleme",
};

export function TrOwnerTakimCreatePage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
          <TakimCreateFlow
            boutiqueId={activeBoutique.id}
            boutiqueSlug={activeBoutique.slug}
            boutiqueName={activeBoutique.name}
          />
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}

/** Takım: a two-piece set saved as one product in the Takım category, added by hand. */
function TakimCreateFlow({
  boutiqueId,
  boutiqueSlug,
  boutiqueName,
}: {
  boutiqueId: string;
  boutiqueSlug: string;
  boutiqueName: string;
}) {
  const empty = createEmptyTakimDraft();
  const [stepIndex, setStepIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<TrProductFeatures>({});
  const [priceTry, setPriceTry] = useState("");
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [salePriceTry, setSalePriceTry] = useState("");
  const [stock, setStock] = useState("1");
  // A size source id (a Beden type, or the built-in `letter` / `numeric`) or `none`.
  const [sizeChart, setSizeChart] = useState<string>("letter");
  const [sizeStockInputs, setSizeStockInputs] = useState(empty.sizeStockInputs);
  const { sources: sizeSources, loaded: sizeSourcesLoaded } =
    useOwnerSizeSources(boutiqueId);
  // A boutique on its own categories files the set under the category keyed `takim`.
  const { categoryList, loaded: categoriesLoaded } = useOwnerCategoryList(boutiqueId);
  const sizeSource = findSizeSource(sizeSources, sizeChart);
  const applySizeChart = (chart: string) => {
    setSizeChart(chart);
    setSizeStockInputs(emptyStockInputs(findSizeSource(sizeSources, chart), "0"));
  };
  // Once the boutique's Beden types are in, move a built-in list (the default, or one
  // restored from an older draft) onto the matching type.
  useEffect(() => {
    if (!sizeSourcesLoaded) return;
    const resolved = resolveSizeSourceId(sizeSources, sizeChart);
    if (resolved !== sizeChart) applySizeChart(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applySizeChart reads the latest sources
  }, [sizeSourcesLoaded, sizeSources, sizeChart]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<TrProduct | null>(null);
  const [draftBanner, setDraftBanner] = useState(false);
  const [lightbox, setLightbox] = useState<{
    src: string;
    label: string;
  } | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const existing = readProductTakimCreateDraft(boutiqueId);
    if (existing && takimDraftHasProgress(existing)) {
      setDraftBanner(true);
      setImages(existing.images);
      setStepIndex(existing.stepIndex);
      setTitle(existing.title);
      setDescription(existing.description);
      setFeatures(existing.features ?? {});
      setPriceTry(existing.priceTry);
      setDiscountEnabled(existing.discountEnabled);
      setSalePriceTry(existing.salePriceTry);
      setStock(existing.stock);
      setSizeChart(existing.sizeChart);
      setSizeStockInputs(existing.sizeStockInputs);
    }
    hydratedRef.current = true;
  }, [boutiqueId]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    writeProductTakimCreateDraft(boutiqueId, {
      stepIndex,
      images,
      title,
      description,
      features,
      priceTry,
      discountEnabled,
      salePriceTry,
      stock,
      sizeChart,
      sizeStockInputs,
    });
  }, [
    boutiqueId,
    stepIndex,
    images,
    title,
    description,
    features,
    priceTry,
    discountEnabled,
    salePriceTry,
    stock,
    sizeChart,
    sizeStockInputs,
  ]);

  const step = TAKIM_CREATE_STEPS[Math.min(stepIndex, TAKIM_CREATE_STEPS.length - 1)] ?? "photos";
  const photosReady = hasManualGalleryPhoto(images) && !uploading;

  useRegisterLeaveBusy("takim-create", uploading || saving);

  const goNext = () => {
    if (step === "photos" && !photosReady) return;
    if (step === "listing" && !title.trim()) return;
    if (step === "prices") {
      if (!isValidTryPrice(priceTry)) return;
      if (discountEnabled) {
        if (!isValidTryPrice(salePriceTry)) return;
        if (
          Number(salePriceTry.replace(",", ".")) >=
          Number(priceTry.replace(",", "."))
        ) {
          return;
        }
      }
    }
    if (step === "stock") {
      if (!sizeSource) {
        if (!isValidStock(stock)) return;
      } else {
        const sizes = sizesFromStockInputs(sizeSource, sizeStockInputs);
        if (!sizes.every((size) => isValidStock(sizeStockInputs[size] ?? ""))) {
          return;
        }
        const parsed = parseSizeStockInputs(sizes, sizeStockInputs);
        if (!parsed || sumSizeStocks(parsed) <= 0) return;
      }
    }
    setStepIndex((current) =>
      Math.min(current + 1, TAKIM_CREATE_STEPS.length - 1),
    );
  };

  const save = async () => {
    if (!categoriesLoaded) {
      setError("Kategoriler yükleniyor; birkaç saniye sonra tekrar deneyin.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const listPrice = Number(priceTry.replace(",", "."));
      let sellPrice = listPrice;
      let compareAtPriceTry: number | null = null;
      if (discountEnabled) {
        sellPrice = Number(salePriceTry.replace(",", "."));
        compareAtPriceTry = listPrice;
      }
      const sizes = sizesFromStockInputs(sizeSource, sizeStockInputs);
      let stockValue: number;
      let sizeStocks: Record<string, number> = {};
      if (sizes.length > 0) {
        sizeStocks = parseSizeStockInputs(sizes, sizeStockInputs) ?? {};
        stockValue = sumSizeStocks(sizeStocks);
      } else {
        stockValue = Number.parseInt(stock, 10);
      }
      const product = await createOwnerProduct({
        boutiqueId,
        title: title.trim(),
        description: description.trim() || null,
        // Photos are shown as uploaded (see productImages.ts).
        features: withManualListing({ ...features, uploadKind: "takim" }, true),
        priceTry: sellPrice,
        compareAtPriceTry,
        sizes,
        colors: [],
        ...categoryPayloadForGarment(TAKIM_SHOP_LEAF, categoryList),
        images,
        catalogBackgroundId: DEFAULT_CATALOG_BACKGROUND_ID,
        stock: stockValue,
        sizeStocks,
        status: "available",
      });
      clearProductTakimCreateDraft(boutiqueId);
      setCreated(product);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Kayıt başarısız.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    return (
      <TrOwnerProductCreatedSuccess
        product={created}
        boutiqueSlug={boutiqueSlug}
        boutiqueName={boutiqueName}
        onAddAnother={() => {
          const next = createEmptyTakimDraft();
          setCreated(null);
          setImages(next.images);
          setStepIndex(0);
          setTitle("");
          setDescription("");
          setFeatures({});
          setPriceTry("");
          setDiscountEnabled(false);
          setSalePriceTry("");
          setStock("1");
          setSizeChart("letter");
          setSizeStockInputs(next.sizeStockInputs);
          setError(null);
        }}
      />
    );
  }

  return (
    <TrPanelFadeIn className="space-y-5">
      <Link href={trPanelProductsPath()} className={panelBackLinkClass}>
        Ürünler
      </Link>
      <h1 className={panelPageTitleClass}>Takım yükle</h1>
      <p className={panelHintClass}>
        İki parça, tek ürün. Takımın fotoğraflarını ekleyin; sonra isim, fiyat ve
        stok.
      </p>
      {draftBanner ? (
        <p className={panelHintClass}>Taslak geri yüklendi.</p>
      ) : null}

      <ol className="flex gap-1 overflow-x-auto pb-1 text-[12px] font-semibold uppercase tracking-wide text-neutral-500">
        {TAKIM_CREATE_STEPS.map((id, index) => (
          <li
            key={id}
            className={
              index === stepIndex
                ? "text-[color:var(--panel-accent)]"
                : index < stepIndex
                  ? "text-neutral-800"
                  : ""
            }
          >
            {STEP_LABELS[id]}
            {index < TAKIM_CREATE_STEPS.length - 1 ? (
              <span className="mx-1 text-neutral-300">·</span>
            ) : null}
          </li>
        ))}
      </ol>

      {error ? <p className={panelErrorClass}>{error}</p> : null}

      {step === "photos" ? (
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

      {step === "listing" ? (
        <div className="space-y-4">
          <p className={panelHintClass}>Kategori Takım olarak kaydedilir.</p>
          <label className="block space-y-2">
            <span className="text-[14px] font-semibold text-neutral-800">
              Ürün adı
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(clampTitle(event.target.value))}
              className={panelFieldClass}
              maxLength={TR_OWNER_PRODUCT_LIMITS.titleMax}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-[14px] font-semibold text-neutral-800">
              Açıklama
            </span>
            <textarea
              value={description}
              onChange={(event) =>
                setDescription(clampDescription(event.target.value))
              }
              className={`${panelFieldClass} min-h-24`}
              maxLength={TR_OWNER_PRODUCT_LIMITS.descriptionMax}
            />
          </label>
          <TrOwnerProductFeaturesFields
            value={features}
            onChange={setFeatures}
            disabled={saving}
            fieldClass={panelFieldClass}
          />
        </div>
      ) : null}

      {step === "prices" ? (
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-[14px] font-semibold text-neutral-800">
              Fiyat (TL)
            </span>
            <input
              value={priceTry}
              onChange={(event) =>
                setPriceTry(sanitizeTryPriceInput(event.target.value))
              }
              className={panelFieldClass}
              inputMode="decimal"
              placeholder="1890"
            />
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={discountEnabled}
            onClick={() => {
              setDiscountEnabled((current) => !current);
              if (discountEnabled) setSalePriceTry("");
            }}
            className="text-[14px] font-semibold text-neutral-800 underline-offset-2 hover:underline"
          >
            {discountEnabled ? "İndirimi kaldır" : "İndirimli fiyat ekle"}
          </button>
          {discountEnabled ? (
            <label className="block space-y-1.5">
              <span className="text-[14px] font-semibold text-neutral-800">
                İndirimli fiyat (TL)
              </span>
              <input
                value={salePriceTry}
                onChange={(event) =>
                  setSalePriceTry(sanitizeTryPriceInput(event.target.value))
                }
                className={panelFieldClass}
                inputMode="decimal"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {step === "stock" ? (
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

      {step === "preview" ? (
        <TrOwnerStorePreview
          title={title}
          description={description}
          priceTry={discountEnabled ? salePriceTry : priceTry}
          compareAtPriceTry={discountEnabled ? priceTry : null}
          images={images}
          sizes={sizesFromStockInputs(sizeSource, sizeStockInputs)}
        />
      ) : null}

      <div className={panelStickyActionsSpacerClass} aria-hidden />
      <div className={panelStickyActionsClass}>
        {stepIndex > 0 ? (
          <button
            type="button"
            className={`${panelSecondaryBtnClass} flex-1`}
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
          >
            Geri
          </button>
        ) : null}
        {step !== "preview" ? (
          <button
            type="button"
            className={`${panelPrimaryBtnClass} flex-1`}
            disabled={
              (step === "photos" && !photosReady) ||
              (step === "listing" && !title.trim())
            }
            onClick={goNext}
          >
            Devam
          </button>
        ) : (
          <button
            type="button"
            className={`${panelPrimaryBtnClass} flex-1`}
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? "Kaydediliyor…" : "Takımı kaydet"}
          </button>
        )}
      </div>

      <TrProductImageLightbox
        open={Boolean(lightbox)}
        src={lightbox?.src ?? null}
        label={lightbox?.label}
        onClose={() => setLightbox(null)}
      />
    </TrPanelFadeIn>
  );
}
