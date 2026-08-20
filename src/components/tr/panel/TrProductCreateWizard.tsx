"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { TrCatalogBackgroundPicker } from "@/components/tr/panel/TrCatalogBackgroundPicker";
import { TrOwnerAiCatalogEnhance } from "@/components/tr/panel/TrOwnerAiCatalogEnhance";
import { TrOwnerAiFillListing } from "@/components/tr/panel/TrOwnerAiFillListing";
import {
  hasRequiredProductPhotos,
  hasRequiredProductPhotosStarted,
  TrOwnerGuidedPhotoUpload,
} from "@/components/tr/panel/TrOwnerGuidedPhotoUpload";
import { TrOwnerStorePreview } from "@/components/tr/panel/TrOwnerStorePreview";
import { TrOwnerWizardPipelineStatus } from "@/components/tr/panel/TrOwnerWizardPipelineStatus";
import { TrProductImageLightbox } from "@/components/tr/panel/TrProductImageLightbox";
import {
  emptyStockInputsForChart,
  TrOwnerSizeChartStock,
} from "@/components/tr/panel/TrOwnerSizeChartStock";
import { TrOwnerCategoryPicker } from "@/components/tr/panel/TrOwnerCategoryPicker";
import { TrOwnerProductFeaturesFields } from "@/components/tr/panel/TrOwnerProductFeaturesFields";
import {
  panelFieldClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import type { PipelineJobItem } from "@/lib/tr/aiCatalog/pipelineProgress";
import {
  describeModelPackageShots,
} from "@/lib/tr/aiCatalog/uploadCostHints";
import {
  LILA_DEFAULT_PHOTOGRAPHY_STYLE,
  parseLilaPhotographyStyle,
  type TrLilaPhotographyStyle,
} from "@/lib/tr/aiModel/registry";
import {
  DEFAULT_CATALOG_BACKGROUND_ID,
  getCatalogBackground,
} from "@/lib/tr/catalogBackgrounds/registry";
import {
  sizesForChart,
  type TrSizeChartId,
} from "@/lib/tr/productOptions";
import {
  clampDescription,
  clampTitle,
  isValidStock,
  isValidTryPrice,
  sanitizeTryPriceInput,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import {
  createOwnerProduct,
  type OwnerListingDraft,
} from "@/lib/tr/ownerClient";
import {
  clearProductCreateDraft,
  draftHasProgress,
  readProductCreateDraft,
  writeProductCreateDraft,
  type ProductCreateDraftV1,
} from "@/lib/tr/productCreateDraft";
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
    hint: "Ön tanıma bitince devam — katalog arka planda üretilir",
  },
  {
    id: "name",
    title: "İsim",
    hint: "Ürün adı, açıklama ve özellikler",
  },
  {
    id: "price",
    title: "Fiyat",
    hint: "Fiyat ve kategori",
  },
  {
    id: "sizes",
    title: "Beden",
    hint: "Harf veya numara tablosu seçin, stokları yazın",
  },
  {
    id: "model",
    title: "Model",
    hint: "Model fotoğrafı (isteğe bağlı)",
  },
  {
    id: "review",
    title: "Önizleme",
    hint: "Kontrol edin ve kaydedin",
  },
] as const;

interface TrProductCreateWizardProps {
  boutiqueId: string;
  boutiqueSlug?: string | null;
  onSaved: (product: TrProduct) => void;
}

export function TrProductCreateWizard({
  boutiqueId,
  boutiqueSlug = null,
  onSaved,
}: TrProductCreateWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex]!;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<TrProductFeatures>({});
  const [priceTry, setPriceTry] = useState("");
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [salePriceTry, setSalePriceTry] = useState("");
  const [stock, setStock] = useState("1");
  const [sizeChart, setSizeChart] = useState<TrSizeChartId>("letter");
  const [sizeStockInputs, setSizeStockInputs] = useState<
    Record<string, string>
  >(() => emptyStockInputsForChart("letter", "0"));
  const [category, setCategory] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [marketplaceImages, setMarketplaceImages] = useState<string[]>([]);
  const [lifestyleImages, setLifestyleImages] = useState<string[]>([]);
  const [listingDraft, setListingDraft] = useState<OwnerListingDraft | null>(
    null,
  );
  const [frontAnalysisDone, setFrontAnalysisDone] = useState(false);
  const [frontDraftFailed, setFrontDraftFailed] = useState(false);
  const [catalogBackgroundId, setCatalogBackgroundId] = useState(
    DEFAULT_CATALOG_BACKGROUND_ID,
  );
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [photographyStyle, setPhotographyStyle] =
    useState<TrLilaPhotographyStyle>(LILA_DEFAULT_PHOTOGRAPHY_STYLE);
  const [photoJobs, setPhotoJobs] = useState<PipelineJobItem[]>([]);
  const [modelJobs, setModelJobs] = useState<PipelineJobItem[]>([]);
  const [lightbox, setLightbox] = useState<{
    src: string;
    label: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSkipModel, setConfirmSkipModel] = useState(false);
  const [draftBanner, setDraftBanner] = useState<ProductCreateDraftV1 | null>(
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
        marketplaceImages,
        lifestyleImages,
        listingDraft,
        frontAnalysisDone,
        frontDraftFailed,
        catalogBackgroundId,
        selectedModelId,
        photographyStyle,
      });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [
    boutiqueId,
    catalogBackgroundId,
    category,
    description,
    features,
    discountEnabled,
    draftBanner,
    frontAnalysisDone,
    frontDraftFailed,
    images,
    lifestyleImages,
    listingDraft,
    marketplaceImages,
    priceTry,
    salePriceTry,
    selectedModelId,
    photographyStyle,
    sizeChart,
    sizeStockInputs,
    stepIndex,
    stock,
    title,
  ]);

  const chartSizes = useMemo(() => sizesForChart(sizeChart), [sizeChart]);

  const catalogBackground = getCatalogBackground(catalogBackgroundId);
  const modelGenerating = modelJobs.some((j) => j.status === "running");
  const pipelineJobs = useMemo(
    () => [...photoJobs, ...modelJobs],
    [photoJobs, modelJobs],
  );

  const applySizeChart = (next: TrSizeChartId) => {
    setSizeChart(next);
    if (next === "none") {
      setSizeStockInputs({});
      return;
    }
    setSizeStockInputs((current) => {
      const nextInputs = emptyStockInputsForChart(next, "0");
      for (const size of Object.keys(nextInputs)) {
        if (current[size] !== undefined) nextInputs[size] = current[size]!;
      }
      return nextInputs;
    });
  };

  useEffect(() => {
    if (sizeChart === "none") return;
    setSizeStockInputs((current) => {
      const defaults = emptyStockInputsForChart(sizeChart, "0");
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
  }, [sizeChart]);

  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const photoStepPhotosReady = useMemo(
    () =>
      hasRequiredProductPhotosStarted(images, photoJobs) &&
      Boolean(images[0]?.trim()),
    [images, photoJobs],
  );

  /** Front AI prepare still running — Devam shows loading instead of an error. */
  const awaitingFrontAi =
    step.id === "photo" && photoStepPhotosReady && !frontAnalysisDone;

  /** Hide Devam entirely until photos are confirmed on the first step. */
  const showContinueButton =
    step.id !== "review" &&
    (step.id !== "photo" || photoStepPhotosReady);

  const hasModelPhoto = useMemo(
    () => lifestyleImages.some((url) => Boolean(url?.trim())),
    [lifestyleImages],
  );

  useEffect(() => {
    if (hasModelPhoto || modelGenerating) setConfirmSkipModel(false);
  }, [hasModelPhoto, modelGenerating]);

  const setLifestyleImagesSingle = (urls: string[]) => {
    setLifestyleImages(urls.map((url) => url.trim()).filter(Boolean));
  };

  const canContinue = useMemo(() => {
    if (step.id === "photo") {
      const draftReady =
        Boolean(listingDraft?.title?.trim()) || frontDraftFailed;
      return photoStepPhotosReady && frontAnalysisDone && draftReady;
    }
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
      if (sizeChart === "none") return isValidStock(stock);
      if (
        !chartSizes.every((size) => isValidStock(sizeStockInputs[size] ?? ""))
      ) {
        return false;
      }
      const parsed = parseSizeStockInputs(chartSizes, sizeStockInputs);
      return parsed !== null && sumSizeStocks(parsed) > 0;
    }
    if (step.id === "model") return true;
    return true;
  }, [
    chartSizes,
    discountEnabled,
    frontAnalysisDone,
    frontDraftFailed,
    listingDraft,
    photoStepPhotosReady,
    priceTry,
    salePriceTry,
    sizeChart,
    sizeStockInputs,
    step.id,
    stock,
    title,
  ]);

  const goNext = () => {
    setError(null);
    if (step.id === "photo" && (!photoStepPhotosReady || awaitingFrontAi)) {
      return;
    }
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
          sizeChart === "none"
            ? "Geçerli bir stok girin."
            : "Her beden için stok girin; en az bir bedende stok 1 veya daha fazla olmalı.",
        );
      }
      return;
    }
    if (step.id === "model" && modelGenerating) {
      return;
    }
    if (step.id === "model" && !hasModelPhoto) {
      setConfirmSkipModel(true);
      return;
    }
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const proceedWithoutModel = () => {
    setConfirmSkipModel(false);
    setError(null);
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setError(null);
    setConfirmSkipModel(false);
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
      ...emptyStockInputsForChart(draft.sizeChart, "0"),
      ...(draft.sizeStockInputs ?? {}),
    });
    setCategory(draft.category);
    setImages(draft.images ?? []);
    setMarketplaceImages(draft.marketplaceImages ?? []);
    setLifestyleImages(draft.lifestyleImages ?? []);
    setListingDraft(draft.listingDraft);
    setFrontAnalysisDone(draft.frontAnalysisDone);
    setFrontDraftFailed(draft.frontDraftFailed);
    setCatalogBackgroundId(
      draft.catalogBackgroundId || DEFAULT_CATALOG_BACKGROUND_ID,
    );
    setSelectedModelId(draft.selectedModelId);
    setPhotographyStyle(parseLilaPhotographyStyle(draft.photographyStyle));
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
      if (!hasRequiredProductPhotos(images)) {
        throw new Error(
          uploading
            ? "Fotoğraflar hâlâ hazırlanıyor. Biraz bekleyip tekrar deneyin."
            : "Ön ve arka fotoğraf zorunlu.",
        );
      }

      if (modelGenerating) {
        throw new Error("Model görselleri hâlâ hazırlanıyor. Biraz bekleyin.");
      }

      let stockValue: number;
      let sizeStocks: Record<string, number> = {};
      const sizes =
        sizeChart === "none" ? [] : sizesForChart(sizeChart);
      if (sizes.length > 0) {
        const parsed = parseSizeStockInputs(sizes, sizeStockInputs);
        if (!parsed) {
          throw new Error(
            `Her beden için stok ${TR_OWNER_PRODUCT_LIMITS.stockMin}–${TR_OWNER_PRODUCT_LIMITS.stockMax} arası olmalı.`,
          );
        }
        sizeStocks = parsed;
        stockValue = sumSizeStocks(sizeStocks);
        if (stockValue <= 0) {
          throw new Error("En az bir bedende stok girin.");
        }
      } else {
        if (!isValidStock(stock)) {
          throw new Error(
            `Stok ${TR_OWNER_PRODUCT_LIMITS.stockMin}–${TR_OWNER_PRODUCT_LIMITS.stockMax} arası olmalı.`,
          );
        }
        stockValue = Number.parseInt(stock, 10);
      }

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

      const product = await createOwnerProduct({
        boutiqueId,
        title: title.trim(),
        description: description.trim() || null,
        features,
        priceTry: sellPrice,
        compareAtPriceTry: compareAtPriceTryValue,
        sizes,
        colors: [],
        category,
        images,
        marketplaceImages: images.map(
          (_, index) => marketplaceImages[index] ?? "",
        ),
        lifestyleImages: lifestyleImages
          .map((url) => url.trim())
          .filter(Boolean)
          .slice(0, 1),
        catalogBackgroundId,
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

      <TrOwnerWizardPipelineStatus jobs={pipelineJobs} />

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-[16px] text-red-800">
          {error}
        </p>
      ) : null}

      {/* Photo step stays mounted (hidden) so packshot jobs survive Geri */}
      <div
        className={`rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-sm sm:p-6 ${
          step.id === "photo" ? "space-y-6" : "hidden"
        }`}
      >
        <TrOwnerGuidedPhotoUpload
          boutiqueId={boutiqueId}
          images={images}
          marketplaceImages={marketplaceImages}
          catalogBackgroundCss={catalogBackground.css}
          title={title}
          category={category}
          uploading={uploading}
          onUploadingChange={setUploading}
          onImagesChange={setImages}
          onMarketplaceImagesChange={setMarketplaceImages}
          onError={setError}
          onLightbox={setLightbox}
          onListingDraft={(draft) => {
            if (draft.title.trim()) setListingDraft(draft);
          }}
          onFrontAnalysisComplete={({ draft }) => {
            setFrontAnalysisDone(true);
            if (draft?.title?.trim()) {
              setListingDraft(draft);
              setFrontDraftFailed(false);
            } else {
              setFrontDraftFailed(true);
              setListingDraft(null);
            }
          }}
          onFrontSlotReset={() => {
            setFrontAnalysisDone(false);
            setFrontDraftFailed(false);
            setListingDraft(null);
          }}
          onPhotoJobsChange={setPhotoJobs}
          disabled={saving}
        />
        {frontAnalysisDone && listingDraft?.title ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-900">
            Ön fotoğraf tanındı — sonraki adımda “AI ile doldur” hazır.
          </p>
        ) : null}
        {frontDraftFailed && frontAnalysisDone ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-950">
            AI isim önerisi alınamadı. İsim adımında tekrar deneyebilir veya elle
            yazabilirsiniz.
          </p>
        ) : null}
      </div>

      <AnimatePresence mode="wait">
        {step.id !== "photo" ? (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-sm sm:p-6"
          >
            {step.id === "name" ? (
              <div className="space-y-5">
                <TrOwnerAiFillListing
                  boutiqueId={boutiqueId}
                  sourceImageUrl={
                    marketplaceImages[0]?.trim() || images[0]?.trim() || null
                  }
                  category={category}
                  cachedDraft={listingDraft}
                  awaitingDraft={
                    !frontAnalysisDone &&
                    photoJobs.some(
                      (j) =>
                        j.kind === "photo-front" && j.status === "running",
                    )
                  }
                  disabled={saving}
                  onError={setError}
                  onApply={(draft) => {
                    setTitle(clampTitle(draft.title));
                    setDescription(clampDescription(draft.description));
                    if (draft.features) setFeatures(draft.features);
                    if (draft.category) setCategory(draft.category);
                    setListingDraft(draft);
                  }}
                />
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
                <TrOwnerProductFeaturesFields
                  value={features}
                  onChange={setFeatures}
                  disabled={saving}
                  fieldClass={panelFieldClass}
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

                <div className="space-y-3">
                  <p className="text-[17px] font-semibold text-neutral-800">
                    Kategori
                  </p>
                  <TrOwnerCategoryPicker
                    value={category}
                    onChange={setCategory}
                  />
                </div>
              </div>
            ) : null}

            {step.id === "sizes" ? (
              <TrOwnerSizeChartStock
                chart={sizeChart}
                onChartChange={applySizeChart}
                stockInputs={sizeStockInputs}
                onStockInputsChange={setSizeStockInputs}
                stock={stock}
                onStockChange={setStock}
                variant="wizard"
              />
            ) : null}

            {step.id === "model" ? (
              <div className="space-y-6">
                {!hasRequiredProductPhotos(images) ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-950">
                    Katalog fotoğrafları hazırlanıyor. Hazır olunca model
                    çekimini başlatabilirsiniz — diğer adımlara geçebilirsiniz.
                  </p>
                ) : null}
                <TrOwnerAiCatalogEnhance
                  boutiqueId={boutiqueId}
                  boutiqueSlug={boutiqueSlug}
                  title={title}
                  category={category}
                  images={images}
                  marketplaceImages={marketplaceImages}
                  lifestyleImages={lifestyleImages}
                  selectedModelId={selectedModelId}
                  onSelectedModelIdChange={setSelectedModelId}
                  photographyStyle={photographyStyle}
                  onPhotographyStyleChange={setPhotographyStyle}
                  onMarketplaceImagesChange={setMarketplaceImages}
                  onLifestyleImagesChange={setLifestyleImagesSingle}
                  onListingDraft={setListingDraft}
                  onModelJobsChange={setModelJobs}
                  onSkip={() => setConfirmSkipModel(true)}
                  disabled={saving || !hasRequiredProductPhotos(images)}
                />
                {confirmSkipModel && !modelGenerating ? (
                  <div
                    className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5"
                    role="alertdialog"
                    aria-labelledby="skip-model-title"
                    aria-describedby="skip-model-body"
                  >
                    <p
                      id="skip-model-title"
                      className="text-[18px] font-semibold text-neutral-900"
                    >
                      Model fotoğrafı oluşturmadınız
                    </p>
                    <p
                      id="skip-model-body"
                      className="mt-2 text-[15px] leading-relaxed text-neutral-700"
                    >
                      Model görseli ürünü mağazada daha iyi gösterir. Şimdi
                      oluşturabilir veya yine de devam edebilirsiniz.
                    </p>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        className={`${panelPrimaryBtnClass} flex-1`}
                        onClick={() => setConfirmSkipModel(false)}
                      >
                        Model fotoğrafı oluştur
                      </button>
                      <button
                        type="button"
                        className={`${panelSecondaryBtnClass} flex-1`}
                        onClick={proceedWithoutModel}
                      >
                        Yine de devam
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {step.id === "review" ? (
              <div className="space-y-5">
                <TrCatalogBackgroundPicker
                  value={catalogBackgroundId}
                  onChange={setCatalogBackgroundId}
                  disabled={saving}
                />
                <TrOwnerStorePreview
                  title={title}
                  description={description}
                  priceTry={displaySellPrice}
                  compareAtPriceTry={displayListPrice}
                  images={images}
                  marketplaceImages={marketplaceImages}
                  lifestyleImages={lifestyleImages}
                  catalogBackgroundId={catalogBackgroundId}
                  sizes={chartSizes}
                  modelShotsPending={modelGenerating}
                  pendingModelShotCount={describeModelPackageShots(
                    selectedModelId,
                  )}
                />
                <p className="rounded-xl bg-[color:var(--panel-accent-soft)] px-4 py-3 text-[16px] text-neutral-800">
                  Kaydettiğinizde ürün satışta görünür.
                  {uploading || modelGenerating
                    ? " Arka plan işleri bitmeden kaydetmeyin."
                    : ""}
                </p>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex flex-wrap gap-3">
        {stepIndex > 0 ? (
          <button type="button" className={panelSecondaryBtnClass} onClick={goBack}>
            Geri
          </button>
        ) : null}
        {showContinueButton ? (
          <button
            type="button"
            className={`${panelPrimaryBtnClass} flex-1 disabled:opacity-60`}
            onClick={goNext}
            disabled={
              awaitingFrontAi || (step.id === "model" && modelGenerating)
            }
          >
            {awaitingFrontAi
              ? "AI ile hazırlanıyor…"
              : step.id === "model" && modelGenerating
                ? "Model oluşturuluyor…"
                : "Devam"}
          </button>
        ) : null}
        {step.id === "review" ? (
          <button
            type="button"
            className={`${panelPrimaryBtnClass} flex-1`}
            onClick={() => void save()}
            disabled={saving || uploading || modelGenerating}
          >
            {saving
              ? "Kaydediliyor…"
              : uploading || modelGenerating
                ? "Görseller hazırlanıyor…"
                : "Ürünü kaydet"}
          </button>
        ) : null}
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
