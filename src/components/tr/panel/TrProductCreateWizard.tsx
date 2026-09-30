"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { TrCatalogBackgroundPicker } from "@/components/tr/panel/TrCatalogBackgroundPicker";
import { TrOwnerAiCatalogEnhance } from "@/components/tr/panel/TrOwnerAiCatalogEnhance";
import { TrOwnerAiFillListing } from "@/components/tr/panel/TrOwnerAiFillListing";
import { TrOwnerColorVariantPhotos, TrOwnerColorVariantProgress } from "@/components/tr/panel/TrOwnerColorVariantPhotos";
import {
  hasRequiredProductPhotos,
  hasRequiredProductPhotosStarted,
  TrOwnerGuidedPhotoUpload,
} from "@/components/tr/panel/TrOwnerGuidedPhotoUpload";
import { useScheduleAiJob } from "@/components/tr/panel/TrOwnerAiJobQueue";
import { TrOwnerStorePreview } from "@/components/tr/panel/TrOwnerStorePreview";
import { useRegisterLeaveBusy } from "@/components/tr/panel/TrOwnerLeaveGuard";
import { TrOwnerWizardPipelineStatus } from "@/components/tr/panel/TrOwnerWizardPipelineStatus";
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
import { TrOwnerManualListingToggle } from "@/components/tr/panel/TrOwnerManualListingToggle";
import {
  hasManualGalleryPhoto,
  TrOwnerManualPhotoGallery,
} from "@/components/tr/panel/TrOwnerManualPhotoGallery";
import { TrOwnerProductFeaturesFields } from "@/components/tr/panel/TrOwnerProductFeaturesFields";
import {
  panelFieldClass,
  panelHintClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
  panelStickyActionsClass,
  panelStickyActionsSpacerClass,
} from "@/components/tr/panel/panelUi";
import type { PipelineJobItem } from "@/lib/tr/aiCatalog/pipelineProgress";
import { formatConstructionProductTitle } from "@/lib/tr/fashion/aiCatalog/listingDraft";
import {
  runColorVariantPackshot,
  runColorVariantTryOn,
} from "@/lib/tr/fashion/aiCatalog/runColorVariantCatalog";
import {
  describeModelPackageShots,
} from "@/lib/tr/fashion/aiCatalog/uploadCostHints";
import { constructionChipsForFamily } from "@/lib/tr/fashion/aiCatalog/elbiseConstructionLock";
import { chipsFromProductFeatures } from "@/lib/tr/aiModel/elbiseTryOn";
import { constructionGateRequiredCopy } from "@/lib/tr/fashion/dressFeatures";
import {
  constructionCatalogFamily,
  isAltGiyimShopLeaf,
  isElbiseUpload,
  isUstGiyimShopLeaf,
  REQUIRED_PHOTO_SLOTS,
  type ConstructionCatalogFamily,
} from "@/lib/tr/fashion/garmentUploadTypes";
import {
  withLifestyleModelsAll,
  withManualListing,
} from "@/lib/tr/catalog/productFeatures";
import {
  DEFAULT_HOUSE_PHOTOGRAPHY_STYLE,
  parseHousePhotographyStyle,
  type TrHousePhotographyStyle,
} from "@/lib/tr/aiModel/registry";
import {
  DEFAULT_CATALOG_BACKGROUND_ID,
} from "@/lib/tr/catalogBackgrounds/registry";
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
  setOwnerColorGroup,
  type OwnerListingDraft,
} from "@/lib/tr/ownerClient";
import {
  clearProductCreateDraft,
  draftHasProgress,
  readProductCreateDraft,
  writeProductCreateDraft,
  type ProductCreateDraftV2,
} from "@/lib/tr/productCreateDraft";
import {
  colorSwatchFromName,
  colorVariantPhotosReady,
  constructionImagesForVariant,
  constructionMarketplaceForVariant,
  featuresForColorVariant,
  type ColorVariantUploadDraft,
} from "@/lib/tr/catalog/colorSiblings";
import {
  alignMarketplaceSlots,
  cleanedLifestyleImages,
} from "@/lib/tr/productImages";
import {
  parseSizeStockInputs,
  sumSizeStocks,
} from "@/lib/tr/sizeStocks";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProduct, TrProductFeatures } from "@/types/tr-marketplace";

const ALL_STEPS = [
  {
    id: "photo",
    title: "Fotoğraf",
    hint: "Ön ve arka manken — detay isteğe bağlı, packshot arka planda",
  },
  {
    id: "name",
    title: "İsim",
    hint: "Ürün adı, açıklama, özellikler — alt kategoriyi AI seçer",
  },
  {
    id: "price",
    title: "Fiyat",
    hint: "Satış fiyatı",
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
  colorLabel: string,
): { stockValue: number; sizeStocks: Record<string, number>; sizes: string[] } {
  const sizes = sizesFromStockInputs(source, sizeStockInputs);
  if (sizes.length > 0) {
    const parsed = parseSizeStockInputs(sizes, sizeStockInputs);
    if (!parsed) {
      throw new Error(
        `${colorLabel}: her beden için stok ${TR_OWNER_PRODUCT_LIMITS.stockMin}–${TR_OWNER_PRODUCT_LIMITS.stockMax} arası olmalı.`,
      );
    }
    const stockValue = sumSizeStocks(parsed);
    if (stockValue <= 0) {
      throw new Error(`${colorLabel}: en az bir bedende stok girin.`);
    }
    return { stockValue, sizeStocks: parsed, sizes };
  }
  if (!isValidStock(stock)) {
    throw new Error(
      `${colorLabel}: stok ${TR_OWNER_PRODUCT_LIMITS.stockMin}–${TR_OWNER_PRODUCT_LIMITS.stockMax} arası olmalı.`,
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
  boutiqueSlug?: string | null;
  onSaved: (product: TrProduct) => void;
}

export function TrProductCreateWizard({
  boutiqueId,
  boutiqueSlug = null,
  onSaved,
}: TrProductCreateWizardProps) {
  const [uploadType, setUploadType] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const steps = useMemo(
    () =>
      manualMode ? ALL_STEPS.filter((entry) => entry.id !== "model") : ALL_STEPS,
    [manualMode],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[Math.min(stepIndex, steps.length - 1)]!;

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
  const [marketplaceImages, setMarketplaceImages] = useState<string[]>([]);
  const [lifestyleImages, setLifestyleImages] = useState<string[]>([]);
  const [colorVariants, setColorVariants] = useState<ColorVariantUploadDraft[]>(
    [],
  );
  const [colorPackshotBusyIds, setColorPackshotBusyIds] = useState<string[]>(
    [],
  );
  const [colorTryOnBusyIds, setColorTryOnBusyIds] = useState<string[]>([]);
  const colorPackshotBusyRef = useRef(new Set<string>());
  const colorTryOnBusyRef = useRef(new Set<string>());
  const colorPackshotStartedRef = useRef(new Set<string>());
  const colorTryOnStartedRef = useRef(new Set<string>());
  const scheduleAiJob = useScheduleAiJob();
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
    useState<TrHousePhotographyStyle>(DEFAULT_HOUSE_PHOTOGRAPHY_STYLE);
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
  const [draftBanner, setDraftBanner] = useState<ProductCreateDraftV2 | null>(
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
        uploadType,
        colorVariants,
        manualMode,
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
    uploadType,
    colorVariants,
    manualMode,
  ]);

  const chartSizes = useMemo(
    () => sizesFromStockInputs(sizeSource, sizeStockInputs),
    [sizeSource, sizeStockInputs],
  );

  const modelGenerating = modelJobs.some((j) => j.status === "running");
  const photoBusy = photoJobs.some((job) => job.status === "running");
  useRegisterLeaveBusy(
    "product-create",
    uploading ||
      photoBusy ||
      modelGenerating ||
      saving ||
      colorPackshotBusyIds.length > 0 ||
      colorTryOnBusyIds.length > 0,
  );
  const pipelineJobs = useMemo(
    () => [...photoJobs, ...modelJobs],
    [photoJobs, modelJobs],
  );

  const applySizeChart = (next: string) => {
    setSizeChart(next);
    const nextSource = findSizeSource(sizeSources, next);
    if (!nextSource) {
      setSizeStockInputs({});
      setColorVariants((current) =>
        current.map((variant) => ({
          ...variant,
          sizeStockInputs: {},
        })),
      );
      return;
    }
    setSizeStockInputs((current) => remapStockInputsForChart(nextSource, current));
    setColorVariants((current) =>
      current.map((variant) => ({
        ...variant,
        sizeStockInputs: remapStockInputsForChart(
          nextSource,
          variant.sizeStockInputs ?? {},
        ),
      })),
    );
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

  useEffect(() => {
    setColorVariants((current) => {
      let changed = false;
      const next = current.map((variant) => {
        if (variant.sizeStockInputs) return variant;
        changed = true;
        return {
          ...variant,
          sizeStockInputs: { ...sizeStockInputs },
          stock,
        };
      });
      return changed ? next : current;
    });
  }, [sizeStockInputs, stock, colorVariants]);

  const requiredSlots = REQUIRED_PHOTO_SLOTS;
  const family = constructionCatalogFamily(uploadType, category);
  const elbise = true;
  const extraColorPhotos = useMemo(
    () => colorVariants.filter(colorVariantPhotosReady),
    [colorVariants],
  );
  const linkedColors = extraColorPhotos.length > 0;
  const skuCount = 1 + extraColorPhotos.length;
  const extraModelShotCount = describeModelPackageShots(selectedModelId, {
    uploadType: family ?? "elbise",
    features,
    detailImageUrl: null,
  });

  const progress = ((stepIndex + 1) / steps.length) * 100;

  const photoStepPhotosReady = useMemo(
    () =>
      manualMode
        ? hasManualGalleryPhoto(images)
        : hasRequiredProductPhotosStarted(images, photoJobs, requiredSlots) &&
          Boolean(images[0]?.trim()),
    [images, manualMode, photoJobs, requiredSlots],
  );

  /** Front AI prepare still running — Devam shows loading instead of an error. */
  const awaitingFrontAi =
    !manualMode &&
    step.id === "photo" &&
    photoStepPhotosReady &&
    !frontAnalysisDone;

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
      if (manualMode) return photoStepPhotosReady;
      const draftReady =
        Boolean(listingDraft?.title?.trim()) || frontDraftFailed;
      const extrasReady = colorVariants.every(
        (variant) =>
          (!variant.frontUrl.trim() && !variant.backUrl.trim()) ||
          colorVariantPhotosReady(variant),
      );
      return (
        photoStepPhotosReady &&
        frontAnalysisDone &&
        draftReady &&
        Boolean(family) &&
        extrasReady
      );
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
      if (!stockInputsReady(sizeSource, chartSizes, stock, sizeStockInputs)) {
        return false;
      }
      return colorVariants
        .filter(colorVariantPhotosReady)
        .every((variant) =>
          stockInputsReady(
            sizeSource,
            sizesFromStockInputs(
              sizeSource,
              variant.sizeStockInputs ?? sizeStockInputs,
            ),
            variant.stock ?? stock,
            variant.sizeStockInputs ?? sizeStockInputs,
          ),
        );
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
    family,
    colorVariants,
    manualMode,
  ]);

  const primaryPackshotUrl =
    marketplaceImages[3]?.trim() || images[3]?.trim() || "";

  useEffect(() => {
    if (!elbise) {
      if (colorVariants.length) setColorVariants([]);
      return;
    }
    const chips = constructionChipsForFamily(
      chipsFromProductFeatures(features, family),
      family,
      "",
    );
    if (!primaryPackshotUrl || !frontAnalysisDone || !family) return;

    for (const variant of colorVariants) {
      if (!colorVariantPhotosReady(variant)) continue;
      if (variant.packshotUrl.trim()) continue;
      const token = `${variant.id}|${variant.frontUrl}|${variant.backUrl}`;
      if (colorPackshotStartedRef.current.has(token)) continue;
      colorPackshotStartedRef.current.add(token);
      colorPackshotBusyRef.current.add(variant.id);
      setColorPackshotBusyIds([...colorPackshotBusyRef.current]);
      const variantId = variant.id;
      void (async () => {
        try {
          const result = await runColorVariantPackshot({
            boutiqueId,
            frontUrl: variant.frontUrl,
            backUrl: variant.backUrl,
            family,
            chips,
            promptFront: listingDraft?.promptFront,
            title: listingDraft?.title || title,
            category,
            scheduleAiJob,
          });
          setColorVariants((current) =>
            current.map((entry) =>
              entry.id === variantId
                ? {
                    ...entry,
                    packshotUrl: result.packshotUrl,
                    colorName: result.colorName || entry.colorName,
                    colorHex: result.colorHex || entry.colorHex,
                    lifestyleImages: [],
                  }
                : entry,
            ),
          );
        } catch (packError) {
          colorPackshotStartedRef.current.delete(token);
          setError(
            packError instanceof Error
              ? packError.message
              : "Renk packshot oluşturulamadı.",
          );
        } finally {
          colorPackshotBusyRef.current.delete(variantId);
          setColorPackshotBusyIds([...colorPackshotBusyRef.current]);
        }
      })();
    }
  }, [
    boutiqueId,
    category,
    colorVariants,
    elbise,
    family,
    features,
    frontAnalysisDone,
    listingDraft?.promptFront,
    listingDraft?.title,
    primaryPackshotUrl,
    scheduleAiJob,
    title,
  ]);

  useEffect(() => {
    if (!elbise || !family || !selectedModelId) return;
    if (!lifestyleImages.some((url) => url.trim())) return;
    const chips = constructionChipsForFamily(
      chipsFromProductFeatures(features, family),
      family,
      "",
    );
    for (const variant of colorVariants) {
      if (!variant.packshotUrl.trim() || !variant.backUrl.trim()) continue;
      if (variant.lifestyleImages.length > 0) continue;
      const token = `${variant.id}|${variant.packshotUrl}|${selectedModelId}`;
      if (colorTryOnStartedRef.current.has(token)) continue;
      colorTryOnStartedRef.current.add(token);
      colorTryOnBusyRef.current.add(variant.id);
      setColorTryOnBusyIds([...colorTryOnBusyRef.current]);
      const variantId = variant.id;
      void (async () => {
        try {
          const urls = await runColorVariantTryOn({
            boutiqueId,
            packshotUrl: variant.packshotUrl,
            backMankenUrl: variant.backUrl,
            modelId: selectedModelId,
            family,
            chips,
            title: listingDraft?.title || title,
            category,
            scheduleAiJob,
          });
          setColorVariants((current) =>
            current.map((entry) =>
              entry.id === variantId
                ? { ...entry, lifestyleImages: urls }
                : entry,
            ),
          );
        } catch (tryOnError) {
          colorTryOnStartedRef.current.delete(token);
          setError(
            tryOnError instanceof Error
              ? tryOnError.message
              : "Renk model görseli üretilemedi.",
          );
        } finally {
          colorTryOnBusyRef.current.delete(variantId);
          setColorTryOnBusyIds([...colorTryOnBusyRef.current]);
        }
      })();
    }
  }, [
    boutiqueId,
    category,
    colorVariants,
    elbise,
    family,
    features,
    listingDraft?.title,
    lifestyleImages,
    scheduleAiJob,
    selectedModelId,
    title,
  ]);

  const applyManualMode = (next: boolean) => {
    setManualMode(next);
    setFeatures((current) => withManualListing(current, next));
    setConfirmSkipModel(false);
    setStepIndex((current) => {
      const from = next
        ? ALL_STEPS
        : ALL_STEPS.filter((entry) => entry.id !== "model");
      const to = next
        ? ALL_STEPS.filter((entry) => entry.id !== "model")
        : ALL_STEPS;
      const id = from[Math.min(current, from.length - 1)]?.id;
      const idx = to.findIndex((entry) => entry.id === id);
      return idx >= 0 ? idx : 0;
    });
  };

  const goNext = () => {
    setError(null);
    if (step.id === "photo" && (!photoStepPhotosReady || awaitingFrontAi)) {
      return;
    }
    if (!canContinue) {
      if (step.id === "photo") {
        const extrasIncomplete = colorVariants.some(
          (variant) =>
            (Boolean(variant.frontUrl.trim()) ||
              Boolean(variant.backUrl.trim())) &&
            !colorVariantPhotosReady(variant),
        );
        if (extrasIncomplete) {
          setError("Ek renk için ön ve arka fotoğrafı yükleyin.");
        }
      } else if (step.id === "name") setError("Ürün adı zorunlu.");
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
    if (step.id === "model" && modelGenerating) {
      return;
    }
    if (step.id === "model" && !hasModelPhoto) {
      setConfirmSkipModel(true);
      return;
    }
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  const proceedWithoutModel = () => {
    setConfirmSkipModel(false);
    setError(null);
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
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
    const restoredType = draft.uploadType ?? null;
    setUploadType(restoredType);
    setManualMode(draft.manualMode === true);
    setStepIndex(
      Math.min(Math.max(0, draft.stepIndex), ALL_STEPS.length - 1),
    );
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
    setMarketplaceImages(draft.marketplaceImages ?? []);
    setLifestyleImages(draft.lifestyleImages ?? []);
    setListingDraft(draft.listingDraft);
    setFrontAnalysisDone(draft.frontAnalysisDone);
    setFrontDraftFailed(draft.frontDraftFailed);
    setCatalogBackgroundId(
      draft.catalogBackgroundId || DEFAULT_CATALOG_BACKGROUND_ID,
    );
    setSelectedModelId(draft.selectedModelId);
    setPhotographyStyle(parseHousePhotographyStyle(draft.photographyStyle));
    setColorVariants(draft.colorVariants ?? []);
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
      if (!manualMode && !family) {
        throw new Error("Fotoğraf adımında türü onaylayın.");
      }
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
      if (manualMode) {
        if (!hasManualGalleryPhoto(images)) {
          throw new Error("En az bir fotoğraf ekleyin.");
        }
      } else if (!hasRequiredProductPhotos(images, requiredSlots)) {
        throw new Error(
          uploading
            ? "Fotoğraflar hâlâ hazırlanıyor. Biraz bekleyip tekrar deneyin."
            : elbise
              ? "Ön ve arka fotoğraf zorunlu. Dekolte / detay isteğe bağlı."
              : "Ön ve arka fotoğraf zorunlu.",
        );
      }

      if (modelGenerating) {
        throw new Error("Model görselleri hâlâ hazırlanıyor. Biraz bekleyin.");
      }

      let stockValue: number;
      let sizeStocks: Record<string, number> = {};
      const primaryStock = parseListingStock(
        sizeSource,
        stock,
        sizeStockInputs,
        features.color?.trim() || "Ana renk",
      );
      stockValue = primaryStock.stockValue;
      sizeStocks = primaryStock.sizeStocks;
      const sizes = primaryStock.sizes;

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

      const listingFeatures = withManualListing(
        selectedModelId
          ? withLifestyleModelsAll(
              features,
              selectedModelId,
              Math.max(cleanedLifestyleImages(lifestyleImages).length, 1),
            )
          : features,
        manualMode,
      );

      if (!categoriesLoaded) {
        throw new Error("Kategoriler yükleniyor; birkaç saniye sonra tekrar deneyin.");
      }
      const product = await createOwnerProduct({
        boutiqueId,
        title: title.trim(),
        description: description.trim() || null,
        features: listingFeatures,
        priceTry: sellPrice,
        compareAtPriceTry: compareAtPriceTryValue,
        sizes,
        colors: features.color?.trim()
          ? [colorSwatchFromName(features.color)]
          : [],
        ...categoryPayloadForGarment(category, categoryList),
        images,
        marketplaceImages: alignMarketplaceSlots(images, marketplaceImages),
        lifestyleImages: cleanedLifestyleImages(lifestyleImages),
        catalogBackgroundId,
        stock: stockValue,
        sizeStocks,
        status: "available",
      });

      const readyExtras = manualMode
        ? []
        : colorVariants.filter(
            (variant) =>
              colorVariantPhotosReady(variant) && variant.packshotUrl.trim(),
          );
      const incompleteExtras = manualMode
        ? []
        : colorVariants.filter(
            (variant) =>
              colorVariantPhotosReady(variant) && !variant.packshotUrl.trim(),
          );
      if (
        !manualMode &&
        (incompleteExtras.length > 0 || colorPackshotBusyIds.length > 0)
      ) {
        throw new Error(
          "Ek renk packshot’ları hâlâ hazırlanıyor. Biraz bekleyip kaydedin.",
        );
      }
      if (!manualMode && colorTryOnBusyIds.length > 0) {
        throw new Error(
          "Ek renk model kareleri hâlâ hazırlanıyor. Biraz bekleyip kaydedin.",
        );
      }

      if (!manualMode && elbise && family && readyExtras.length > 0) {
        const extraProducts: TrProduct[] = [];
        for (const extra of readyExtras) {
          const colorName: string =
            extra.colorName.trim() || `Renk ${extraProducts.length + 2}`;
          let extraFeatures = featuresForColorVariant(listingFeatures, colorName);
          const extraLifestyle = cleanedLifestyleImages(extra.lifestyleImages);
          const extraModelId = selectedModelId || extraFeatures.aiModelId;
          if (extraModelId) {
            extraFeatures = withLifestyleModelsAll(
              extraFeatures,
              extraModelId,
              Math.max(extraLifestyle.length, 1),
            );
          }
          const extraTitle: string =
            formatConstructionProductTitle({
              family,
              color: colorName,
              length: extraFeatures.length,
              neckline: extraFeatures.neckline,
              fit: extraFeatures.fit,
              hem: extraFeatures.neckHem,
              ornament: extraFeatures.ornament,
              category,
            }) || colorName;
          const extraStock = parseListingStock(
            sizeSource,
            extra.stock ?? stock,
            extra.sizeStockInputs ?? sizeStockInputs,
            colorName,
          );
          extraProducts.push(
            await createOwnerProduct({
              boutiqueId,
              title: extraTitle,
              description: description.trim() || null,
              features: extraFeatures,
              priceTry: sellPrice,
              compareAtPriceTry: compareAtPriceTryValue,
              sizes: extraStock.sizes,
              colors: [colorSwatchFromName(colorName)],
              ...categoryPayloadForGarment(category, categoryList),
              images: constructionImagesForVariant(extra),
              marketplaceImages: constructionMarketplaceForVariant(extra),
              lifestyleImages: extraLifestyle,
              catalogBackgroundId,
              stock: extraStock.stockValue,
              sizeStocks: extraStock.sizeStocks,
              status: "available",
            }),
          );
        }
        await setOwnerColorGroup({
          boutiqueId,
          anchorProductId: product.id,
          productIds: [product.id, ...extraProducts.map((entry) => entry.id)],
        });
      }

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

      <TrOwnerManualListingToggle
        checked={manualMode}
        onChange={applyManualMode}
        disabled={saving}
      />

      <div className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[16px] font-semibold text-neutral-700">
            Adım {stepIndex + 1} / {steps.length}
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
        <p className="mt-3 text-[18px] text-neutral-700">
          {manualMode
            ? "Kategori ve özellikleri sen seç — AI çalışmaz."
            : step.hint}
        </p>
      </div>

      {manualMode ? null : <TrOwnerWizardPipelineStatus jobs={pipelineJobs} />}

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
        {manualMode ? (
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
        ) : (
          <>
        <TrOwnerGuidedPhotoUpload
          boutiqueId={boutiqueId}
          images={images}
          marketplaceImages={marketplaceImages}
          title={title}
          category={category}
          uploadType={uploadType}
          features={features}
          listingDraft={listingDraft}
          onUploadingChange={setUploading}
          onImagesChange={setImages}
          onMarketplaceImagesChange={setMarketplaceImages}
          onError={setError}
          onLightbox={setLightbox}
          inferConstructionFamily
          onUploadTypeChange={(next: ConstructionCatalogFamily) =>
            setUploadType(next)
          }
          onCategoryChange={setCategory}
          onListingDraft={(draft) => {
            if (draft.features) setFeatures(draft.features);
            if (draft.title.trim()) {
              setListingDraft(draft);
              setTitle(clampTitle(draft.title));
            }
            if (draft.category) setCategory(draft.category);
            const inferred = constructionCatalogFamily(
              null,
              draft.category,
            );
            if (inferred) setUploadType(inferred);
          }}
          onFrontAnalysisComplete={({ draft }) => {
            setFrontAnalysisDone(true);
            if (draft?.features) setFeatures(draft.features);
            if (draft?.category) setCategory(draft.category);
            const inferred = constructionCatalogFamily(
              null,
              draft?.category,
            );
            if (inferred) setUploadType(inferred);
            if (draft?.title?.trim()) {
              setListingDraft(draft);
              setTitle(clampTitle(draft.title));
              setFrontDraftFailed(false);
            } else {
              setFrontDraftFailed(true);
            }
          }}
          onFrontSlotReset={() => {
            setFrontAnalysisDone(false);
            setFrontDraftFailed(false);
            setListingDraft(null);
            setUploadType(null);
            setCategory(null);
          }}
          onPhotoJobsChange={setPhotoJobs}
          disabled={saving}
          skipDetailSlot={colorVariants.length > 0}
        />
        {elbise ? (
          <TrOwnerColorVariantPhotos
            boutiqueId={boutiqueId}
            variants={colorVariants}
            onChange={setColorVariants}
            disabled={saving}
            generatingIds={new Set(colorPackshotBusyIds)}
            tryOnGeneratingIds={new Set(colorTryOnBusyIds)}
          />
        ) : null}
        {frontAnalysisDone && listingDraft?.title ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-900">
            {`${constructionGateRequiredCopy(family ?? "elbise", category)} onaylandı — packshot arka planda; “AI ile doldur” hazır.`}
          </p>
        ) : null}
        {frontDraftFailed && frontAnalysisDone ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-950">
            AI isim önerisi alınamadı. İsim adımında tekrar deneyebilir veya elle
            yazabilirsiniz.
          </p>
        ) : null}
          </>
        )}
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
                {linkedColors ? (
                  <p className="rounded-xl bg-[color:var(--panel-accent-soft)] px-4 py-3 text-[15px] text-neutral-800">
                    {skuCount} ayrı ürün kaydedilecek
                    {features.color?.trim()
                      ? ` (${[features.color.trim(), ...extraColorPhotos.map((entry) => entry.colorName.trim() || "renk")].join(", ")})`
                      : ""}
                    . Bu isim kalıbı ve özellikler tüm renklere kopyalanır;
                    her rengin kendi fotoğrafı ve stoğu olur.
                  </p>
                ) : null}
                {manualMode ? null : (
                <TrOwnerAiFillListing
                  boutiqueId={boutiqueId}
                  sourceImageUrl={images[0]?.trim() || null}
                  backImageUrl={elbise ? images[1]?.trim() || null : null}
                  detailImageUrl={elbise ? images[2]?.trim() || null : null}
                  category={category}
                  uploadType={uploadType}
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
                )}
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
                {manualMode ? (
                  <div className="space-y-2">
                    <p className="text-[17px] font-semibold text-neutral-800">
                      Kategori
                    </p>
                    <TrOwnerCategoryPicker
                      value={category}
                      onChange={setCategory}
                    />
                  </div>
                ) : isElbiseUpload(uploadType) ? (
                  <p className="rounded-xl bg-[color:var(--panel-accent-soft)] px-4 py-3 text-[15px] text-neutral-800">
                    Kategori: Elbise
                  </p>
                ) : family === "ust-giyim" || family === "alt-giyim" ? (
                  <div className="space-y-2">
                    <p className="text-[17px] font-semibold text-neutral-800">
                      Alt kategori
                    </p>
                    <p className={panelHintClass}>
                      {isUstGiyimShopLeaf(category) ||
                      isAltGiyimShopLeaf(category)
                        ? "AI fotoğraftan seçti. Gerekirse düzeltin."
                        : "AI fotoğraftan seçer — gerekirse aşağıdan düzeltin."}
                    </p>
                    <TrOwnerCategoryPicker
                      value={
                        isUstGiyimShopLeaf(category) ||
                        isAltGiyimShopLeaf(category)
                          ? category
                          : null
                      }
                      onChange={setCategory}
                      parentId={family}
                    />
                  </div>
                ) : null}
                <TrOwnerProductFeaturesFields
                  value={features}
                  onChange={setFeatures}
                  disabled={saving}
                  fieldClass={panelFieldClass}
                  variant={family ? "dress" : "default"}
                  family={family ?? "elbise"}
                  shopCategory={category}
                  hideColorField={!manualMode && linkedColors}
                />
                {linkedColors && features.color?.trim() ? (
                  <p className={panelHintClass}>
                    Ana ürün rengi fotoğraftan: {features.color.trim()}. Diğer
                    renkler kendi fotoğraflarından yazılır.
                  </p>
                ) : null}
              </div>
            ) : null}

            {step.id === "price" ? (
              <div className="space-y-6">
                {linkedColors ? (
                  <p className="rounded-xl bg-[color:var(--panel-accent-soft)] px-4 py-3 text-[15px] text-neutral-800">
                    Bu fiyat {skuCount} ürünün hepsine uygulanır. Stoklar bir
                    sonraki adımda renk başına ayrı girilir.
                  </p>
                ) : null}
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
              <div className="space-y-6">
                {linkedColors ? (
                  <p className="rounded-xl bg-[color:var(--panel-accent-soft)] px-4 py-3 text-[15px] text-neutral-800">
                    Beden tablosu ortak; stok her renk (ayrı ürün) için ayrı.
                  </p>
                ) : null}
                <TrOwnerSizeChartStock
                  chart={sizeChart}
                  onChartChange={applySizeChart}
                  sources={sizeSources}
                  stockInputs={sizeStockInputs}
                  onStockInputsChange={setSizeStockInputs}
                  stock={stock}
                  onStockChange={setStock}
                  heading={
                    linkedColors
                      ? `Ana ürün${features.color?.trim() ? ` — ${features.color.trim()}` : ""}`
                      : undefined
                  }
                />
                {extraColorPhotos.map((variant, index) => (
                  <div
                    key={variant.id}
                    className="rounded-xl border border-neutral-200/80 bg-[#F7F5F1] p-4"
                  >
                    <TrOwnerSizeChartStock
                      chart={sizeChart}
                      sources={sizeSources}
                      hideChart
                      heading={`Ürün ${index + 2}${
                        variant.colorName.trim()
                          ? ` — ${variant.colorName.trim()}`
                          : ""
                      }`}
                      stockInputs={variant.sizeStockInputs ?? sizeStockInputs}
                      onStockInputsChange={(next) =>
                        setColorVariants((current) =>
                          current.map((entry) =>
                            entry.id === variant.id
                              ? { ...entry, sizeStockInputs: next }
                              : entry,
                          ),
                        )
                      }
                      stock={variant.stock ?? stock}
                      onStockChange={(value) =>
                        setColorVariants((current) =>
                          current.map((entry) =>
                            entry.id === variant.id
                              ? { ...entry, stock: value }
                              : entry,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {step.id === "model" ? (
              <div className="space-y-6">
                {!hasRequiredProductPhotos(images, requiredSlots) ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-950">
                    Katalog fotoğrafları hazırlanıyor. Hazır olunca model
                    çekimini başlatabilirsiniz — diğer adımlara geçebilirsiniz.
                  </p>
                ) : elbise && !marketplaceImages[3]?.trim() && !images[3]?.trim() ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-950">
                    Ön packshot bitince model çekimini başlatabilirsiniz.
                  </p>
                ) : null}
                {linkedColors ? (
                  <p className="rounded-xl bg-[color:var(--panel-accent-soft)] px-4 py-3 text-[15px] text-neutral-800">
                    Model çekimi her renk için ayrı üretilir — {skuCount} ayrı
                    ürün.
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
                  onFeaturesChange={setFeatures}
                  onListingDraft={setListingDraft}
                  onModelJobsChange={setModelJobs}
                  onSkip={() => setConfirmSkipModel(true)}
                  disabled={
                    saving ||
                    !hasRequiredProductPhotos(images, requiredSlots)
                  }
                  skipPackshot={elbise}
                  features={features}
                  uploadType={uploadType}
                />
                {linkedColors ? (
                  <TrOwnerColorVariantProgress
                    variants={colorVariants}
                    packshotBusyIds={new Set(colorPackshotBusyIds)}
                    tryOnBusyIds={new Set(colorTryOnBusyIds)}
                  />
                ) : null}
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
                {elbise ? null : (
                  <TrCatalogBackgroundPicker
                    value={catalogBackgroundId}
                    onChange={setCatalogBackgroundId}
                    disabled={saving}
                  />
                )}
                {linkedColors ? (
                  <p className="rounded-xl bg-[color:var(--panel-accent-soft)] px-4 py-3 text-[15px] leading-relaxed text-neutral-800">
                    {skuCount} ayrı ürün kaydedilecek. Fiyat ortak; stoklar
                    ayrı. Mağazada “Diğer renkler” ile bağlanır.
                  </p>
                ) : null}
                <section className="space-y-3">
                  {linkedColors ? (
                    <p className="text-[16px] font-semibold text-neutral-900">
                      Ürün 1 / {skuCount}
                      {features.color?.trim()
                        ? ` — ${features.color.trim()}`
                        : ""}
                    </p>
                  ) : null}
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
                      elbise
                        ? {
                            uploadType: family ?? "elbise",
                            features,
                            detailImageUrl: images[2]?.trim() || null,
                          }
                        : undefined,
                    )}
                    onModelGallery={elbise}
                  />
                </section>
                {extraColorPhotos.map((variant, index) => {
                  const colorName =
                    variant.colorName.trim() || `Renk ${index + 2}`;
                  const extraTitle =
                    family
                      ? formatConstructionProductTitle({
                          family,
                          color: colorName,
                          length: features.length,
                          neckline: features.neckline,
                          fit: features.fit,
                          hem: features.neckHem,
                          ornament: features.ornament,
                          category,
                        }) || colorName
                      : colorName;
                  const extraTryingOn = colorTryOnBusyIds.includes(variant.id);
                  const extraPacking = colorPackshotBusyIds.includes(
                    variant.id,
                  );
                  return (
                    <section key={variant.id} className="space-y-3">
                      <p className="text-[16px] font-semibold text-neutral-900">
                        Ürün {index + 2} / {skuCount} — {colorName}
                      </p>
                      {extraPacking ? (
                        <p className="text-[14px] text-neutral-600">
                          Packshot üretiliyor…
                        </p>
                      ) : extraTryingOn ? (
                        <p className="text-[14px] text-neutral-600">
                          Model fotoğrafı hazırlanıyor…
                        </p>
                      ) : null}
                      <TrOwnerStorePreview
                        title={extraTitle}
                        description={description}
                        priceTry={displaySellPrice}
                        compareAtPriceTry={displayListPrice}
                        images={constructionImagesForVariant(variant)}
                        marketplaceImages={constructionMarketplaceForVariant(
                          variant,
                        )}
                        lifestyleImages={variant.lifestyleImages}
                        catalogBackgroundId={catalogBackgroundId}
                        sizes={sizesFromStockInputs(
                          sizeSource,
                          variant.sizeStockInputs ?? sizeStockInputs,
                        )}
                        modelShotsPending={extraTryingOn}
                        pendingModelShotCount={extraModelShotCount}
                        onModelGallery={elbise}
                      />
                    </section>
                  );
                })}
                <p className="rounded-xl bg-[color:var(--panel-accent-soft)] px-4 py-3 text-[16px] text-neutral-800">
                  {linkedColors
                    ? `Kaydettiğinizde ${skuCount} ürün satışta görünür.`
                    : "Kaydettiğinizde ürün satışta görünür."}
                  {uploading ||
                  modelGenerating ||
                  colorPackshotBusyIds.length > 0 ||
                  colorTryOnBusyIds.length > 0
                    ? " Arka plan işleri bitmeden kaydetmeyin."
                    : ""}
                </p>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className={panelStickyActionsSpacerClass} aria-hidden />
      <div className={panelStickyActionsClass}>
        <div className="mx-auto flex w-full max-w-4xl flex-wrap gap-3">
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
                awaitingFrontAi ||
                (step.id === "model" && modelGenerating) ||
                !canContinue
              }
            >
              {awaitingFrontAi
                ? "Gemini önerisini onaylayın…"
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
              disabled={
                saving ||
                uploading ||
                modelGenerating ||
                colorPackshotBusyIds.length > 0 ||
                colorTryOnBusyIds.length > 0
              }
            >
              {saving
                ? "Kaydediliyor…"
                : uploading ||
                    modelGenerating ||
                    colorPackshotBusyIds.length > 0 ||
                    colorTryOnBusyIds.length > 0
                  ? "Görseller hazırlanıyor…"
                  : linkedColors
                    ? `${skuCount} ürünü kaydet`
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
