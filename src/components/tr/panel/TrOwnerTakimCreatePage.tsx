"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  TrOwnerAiJobQueueProvider,
  useScheduleAiJob,
} from "@/components/tr/panel/TrOwnerAiJobQueue";
import { TrOwnerAiModelPicker } from "@/components/tr/panel/TrOwnerAiModelPicker";
import { TrOwnerCreditsCostLine } from "@/components/tr/panel/TrOwnerCreditsInfo";
import { TrOwnerGuidedPhotoUpload } from "@/components/tr/panel/TrOwnerGuidedPhotoUpload";
import { useRegisterLeaveBusy } from "@/components/tr/panel/TrOwnerLeaveGuard";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductCreatedSuccess } from "@/components/tr/panel/TrOwnerProductCreatedSuccess";
import { TrOwnerStorePreview } from "@/components/tr/panel/TrOwnerStorePreview";
import { TrOwnerTakimChipsStep } from "@/components/tr/panel/TrOwnerTakimChipsStep";
import { TrOwnerModelShotProgress } from "@/components/tr/panel/TrOwnerModelShotProgress";
import { TrOwnerWizardPipelineStatus } from "@/components/tr/panel/TrOwnerWizardPipelineStatus";
import { TrPanelFadeIn } from "@/components/tr/panel/TrPanelMotion";
import { TrProductImageLightbox } from "@/components/tr/panel/TrProductImageLightbox";
import {
  emptyStockInputsForChart,
  sizesFromStockInputs,
  TrOwnerSizeChartStock,
} from "@/components/tr/panel/TrOwnerSizeChartStock";
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
import { featuresWithLifestyleModels } from "@/lib/tr/aiCatalog/elbiseRestyle";
import type { PipelineJobItem } from "@/lib/tr/aiCatalog/pipelineProgress";
import { runConstructionPackshot } from "@/lib/tr/aiCatalog/runConstructionPackshot";
import { runTakimSequentialTryOn } from "@/lib/tr/aiCatalog/runTakimSequentialTryOn";
import { TR_AI_CATALOG_CREDITS } from "@/lib/tr/aiCatalog/uploadCostHints";
import { getElbiseTryOnPlates, listAiModelOptions } from "@/lib/tr/aiModel/registry";
import { getCatalogBackground } from "@/lib/tr/catalogBackgrounds/registry";
import { constructionCatalogFamily } from "@/lib/tr/catalog/garmentUploadTypes";
import {
  assembleTakimProductImages,
  formatTakimProductTitle,
  setItemsFromTakimDraft,
  TAKIM_SHOP_LEAF,
  takimItemChipsReady,
  takimItemHasBothPhotos,
  takimItemPackshotUrl,
} from "@/lib/tr/catalog/takimUpload";
import { createOwnerProduct, type TrOwnerProductPayload } from "@/lib/tr/ownerClient";
import {
  clampDescription,
  clampTitle,
  isValidStock,
  isValidTryPrice,
  sanitizeTryPriceInput,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import { cleanedLifestyleImages } from "@/lib/tr/productImages";
import type { TrSizeChartId } from "@/lib/tr/productOptions";
import {
  applyTakimItemListingDraft,
  clearProductTakimCreateDraft,
  createEmptyTakimDraft,
  readProductTakimCreateDraft,
  TAKIM_CREATE_STEPS,
  takimDraftHasProgress,
  writeProductTakimCreateDraft,
  type TakimCreateStepId,
  type TakimItemDraft,
} from "@/lib/tr/productTakimCreateDraft";
import { trPanelProductsPath } from "@/lib/tr/paths";
import { parseSizeStockInputs, sumSizeStocks } from "@/lib/tr/sizeStocks";
import type { TrProduct } from "@/types/tr-marketplace";

const STEP_LABELS: Record<TakimCreateStepId, string> = {
  photos: "Fotoğraf",
  chips: "Özellikler",
  listing: "İsim",
  models: "Model",
  prices: "Fiyat",
  stock: "Stok",
  preview: "Önizleme",
};

function setSlotInList(list: string[], slotIndex: number, value: string): string[] {
  const next = [...list];
  while (next.length <= slotIndex) next.push("");
  next[slotIndex] = value;
  return next;
}

export function TrOwnerTakimCreatePage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerAiJobQueueProvider>
          <TakimCreateFlow
            boutiqueId={activeBoutique.id}
            boutiqueSlug={activeBoutique.slug}
            boutiqueName={activeBoutique.name}
          />
        </TrOwnerAiJobQueueProvider>
      )}
    </TrOwnerPanelGate>
  );
}

function TakimCreateFlow({
  boutiqueId,
  boutiqueSlug,
  boutiqueName,
}: {
  boutiqueId: string;
  boutiqueSlug: string;
  boutiqueName: string;
}) {
  const scheduleAiJob = useScheduleAiJob();
  const empty = createEmptyTakimDraft();
  const [stepIndex, setStepIndex] = useState(0);
  const [items, setItems] = useState<[TakimItemDraft, TakimItemDraft]>(
    empty.items,
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceTry, setPriceTry] = useState("");
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [salePriceTry, setSalePriceTry] = useState("");
  const [stock, setStock] = useState("1");
  const [sizeChart, setSizeChart] = useState<TrSizeChartId>("letter");
  const [sizeStockInputs, setSizeStockInputs] = useState(empty.sizeStockInputs);
  const [lifestyleImages, setLifestyleImages] = useState<string[]>([]);
  const [catalogBackgroundId] = useState(empty.catalogBackgroundId);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [photoJobs, setPhotoJobs] = useState<
    [PipelineJobItem[], PipelineJobItem[]]
  >([[], []]);
  const [packing, setPacking] = useState<[boolean, boolean]>([false, false]);
  const [modelStatus, setModelStatus] = useState<
    "idle" | "running" | "done" | "error"
  >("idle");
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelProgressPct, setModelProgressPct] = useState(0);
  const [modelProgressTarget, setModelProgressTarget] = useState(0);
  const [modelProgressLabel, setModelProgressLabel] = useState("");
  const [modelRunMode, setModelRunMode] = useState<"create" | "replace" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<TrProduct | null>(null);
  const [draftBanner, setDraftBanner] = useState(false);
  const [lightbox, setLightbox] = useState<{
    src: string;
    label: string;
  } | null>(null);
  const hydratedRef = useRef(false);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const existing = readProductTakimCreateDraft(boutiqueId);
    if (existing && takimDraftHasProgress(existing)) {
      setDraftBanner(true);
      setItems(existing.items);
      setStepIndex(existing.stepIndex);
      setTitle(existing.title);
      setDescription(existing.description);
      setPriceTry(existing.priceTry);
      setDiscountEnabled(existing.discountEnabled);
      setSalePriceTry(existing.salePriceTry);
      setStock(existing.stock);
      setSizeChart(existing.sizeChart);
      setSizeStockInputs(existing.sizeStockInputs);
      setLifestyleImages(existing.lifestyleImages);
      setSelectedModelId(existing.selectedModelId);
    }
    hydratedRef.current = true;
  }, [boutiqueId]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    writeProductTakimCreateDraft(boutiqueId, {
      stepIndex,
      items,
      title,
      description,
      features: {},
      priceTry,
      discountEnabled,
      salePriceTry,
      stock,
      sizeChart,
      sizeStockInputs,
      lifestyleImages,
      catalogBackgroundId,
      selectedModelId,
    });
  }, [
    boutiqueId,
    stepIndex,
    items,
    title,
    description,
    priceTry,
    discountEnabled,
    salePriceTry,
    stock,
    sizeChart,
    sizeStockInputs,
    lifestyleImages,
    catalogBackgroundId,
    selectedModelId,
  ]);

  const step = TAKIM_CREATE_STEPS[stepIndex] ?? "photos";
  const identifying = items.some(
    (item) => takimItemHasBothPhotos(item.images) && !item.frontAnalysisDone,
  );
  const photosReady =
    items.every((item) => takimItemHasBothPhotos(item.images)) &&
    items.every((item) => item.frontAnalysisDone) &&
    !identifying;
  const packingBusy = packing.some(Boolean);
  const photosBusy = photoJobs.some((jobs) =>
    jobs.some((job) => job.status === "running"),
  );
  const modelBusy = modelStatus === "running";
  const modelShotCount = getElbiseTryOnPlates(selectedModelId)?.back ? 2 : 1;

  useEffect(() => {
    if (!modelBusy || modelProgressPct >= modelProgressTarget) return;
    const timer = window.setInterval(() => {
      setModelProgressPct((current) => {
        if (current >= modelProgressTarget) return current;
        return Math.min(modelProgressTarget, current + 0.55);
      });
    }, 120);
    return () => window.clearInterval(timer);
  }, [modelBusy, modelProgressPct, modelProgressTarget]);
  useRegisterLeaveBusy(
    "takim-create",
    photosBusy || packingBusy || modelBusy || saving,
  );

  const assembled = assembleTakimProductImages(items);
  const catalogCss = getCatalogBackground(catalogBackgroundId).css;
  const packshotsReady = items.every((item) =>
    Boolean(takimItemPackshotUrl(item)),
  );
  const packshotFailed = items.some((item) => Boolean(item.packshotError));

  const patchItem = useCallback((index: 0 | 1, patch: Partial<TakimItemDraft>) => {
    setItems((current) => {
      const next: [TakimItemDraft, TakimItemDraft] = [
        { ...current[0] },
        { ...current[1] },
      ];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }, []);

  const runItemPackshot = async (index: 0 | 1) => {
    const item = itemsRef.current[index];
    if (takimItemPackshotUrl(item)) return;
    const family = item.uploadType;
    const chips = item.gateChips;
    if (!family || !chips) throw new Error("Tür ve özellikler eksik.");
    setPacking((current) => {
      const next: [boolean, boolean] = [...current] as [boolean, boolean];
      next[index] = true;
      return next;
    });
    patchItem(index, { packshotError: null });
    try {
      const { packshotUrl, draft } = await runConstructionPackshot({
        boutiqueId,
        frontUrl: item.images[0]!.trim(),
        backUrl: item.images[1]!.trim(),
        family,
        chips,
        proposed: item.proposedChips ?? chips,
        preparedPrompt: item.preparedPrompt,
        listingDraft: item.listingDraft,
        title: item.title,
        category: item.category,
        scheduleAiJob,
      });
      const latest = itemsRef.current[index];
      patchItem(index, {
        images: setSlotInList(latest.images, 3, packshotUrl),
        marketplaceImages: setSlotInList(latest.marketplaceImages, 3, packshotUrl),
        listingDraft: draft,
        title: draft.title.trim() || latest.title,
        description: draft.description || latest.description,
        features: draft.features ?? latest.features,
        category: draft.category ?? latest.category,
        packshotError: null,
      });
    } catch (packError) {
      patchItem(index, {
        packshotError:
          packError instanceof Error
            ? packError.message
            : "Packshot oluşturulamadı.",
      });
    } finally {
      setPacking((current) => {
        const next: [boolean, boolean] = [...current] as [boolean, boolean];
        next[index] = false;
        return next;
      });
    }
  };

  const confirmChips = () => {
    if (
      !items.every((item) =>
        takimItemChipsReady({
          family: item.uploadType,
          category: item.category,
          chips: item.gateChips,
        }),
      )
    ) {
      return;
    }
    setStepIndex(2);
    void Promise.all([runItemPackshot(0), runItemPackshot(1)]);
    const nextTitle = formatTakimProductTitle(itemsRef.current);
    if (!title.trim() && nextTitle) setTitle(nextTitle);
    if (!description.trim()) {
      const combined = itemsRef.current
        .map((item) => item.description.trim())
        .filter(Boolean)
        .join(" ");
      if (combined) setDescription(clampDescription(combined));
    }
  };

  const generateModels = async () => {
    if (!selectedModelId) {
      setModelError("Önce hazır bir model seçin.");
      return;
    }
    const replacing = lifestyleImages.some((url) => Boolean(url?.trim()));
    setModelRunMode(replacing ? "replace" : "create");
    setModelStatus("running");
    setModelError(null);
    setModelProgressPct(6);
    setModelProgressTarget(14);
    setModelProgressLabel(
      replacing
        ? "Model kareleri yenileniyor…"
        : "Model kareleri hazırlanıyor…",
    );
    try {
      for (let i = 0; i < 2; i += 1) {
        const deadline = Date.now() + 180_000;
        while (Date.now() < deadline) {
          if (takimItemPackshotUrl(itemsRef.current[i]!)) break;
          if (itemsRef.current[i]?.packshotError) {
            throw new Error(itemsRef.current[i]!.packshotError!);
          }
          setModelProgressLabel("Packshot bekleniyor…");
          await new Promise((resolve) => window.setTimeout(resolve, 800));
        }
        if (!takimItemPackshotUrl(itemsRef.current[i]!)) {
          throw new Error("Packshot hazır olmadı.");
        }
      }
      const urls = await runTakimSequentialTryOn({
        boutiqueId,
        modelId: selectedModelId,
        title: title.trim() || "Takım",
        items: itemsRef.current.map((item) => ({
          family: item.uploadType,
          gateChips: item.gateChips,
          images: item.images,
          marketplaceImages: item.marketplaceImages,
        })),
        scheduleAiJob,
        onProgress: (event) => {
          const steps = event.shotIndex * event.garmentCount + event.garmentIndex;
          const total = Math.max(1, event.shotCount * event.garmentCount);
          const pct = Math.round(
            18 + ((steps + (event.status === "running" ? 0.45 : 0)) / total) * 70,
          );
          setModelProgressLabel(event.label);
          setModelProgressTarget(pct);
          setModelProgressPct((current) => Math.max(current, Math.max(0, pct - 10)));
        },
        onShotReady: (shotIndex, url) => {
          setLifestyleImages((current) => {
            const next = [...current];
            while (next.length <= shotIndex) next.push("");
            next[shotIndex] = url;
            return next;
          });
          setModelProgressPct((current) => Math.max(current, 58 + shotIndex * 18));
          setModelProgressTarget((current) =>
            Math.max(current, 62 + shotIndex * 18),
          );
        },
      });
      setLifestyleImages(urls);
      setModelProgressPct(100);
      setModelProgressTarget(100);
      setModelProgressLabel("Model kareleri hazır.");
      setModelStatus("done");
      setModelRunMode(null);
    } catch (generateError) {
      setModelStatus("error");
      setModelRunMode(null);
      setModelError(
        generateError instanceof Error
          ? generateError.message
          : "Model oluşturulamadı.",
      );
    }
  };

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
      if (sizeChart === "none") {
        if (!isValidStock(stock)) return;
      } else {
        const sizes = sizesFromStockInputs(sizeChart, sizeStockInputs);
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
      const sizes =
        sizeChart === "none"
          ? []
          : sizesFromStockInputs(sizeChart, sizeStockInputs);
      let stockValue: number;
      let sizeStocks: Record<string, number> = {};
      if (sizes.length > 0) {
        sizeStocks = parseSizeStockInputs(sizes, sizeStockInputs) ?? {};
        stockValue = sumSizeStocks(sizeStocks);
      } else {
        stockValue = Number.parseInt(stock, 10);
      }
      if (!packshotsReady) {
        throw new Error("Önce her parçanın packshot’unu üretin.");
      }
      const color =
        items.map((item) => item.features?.color?.trim()).find(Boolean) ||
        undefined;
      const payload: TrOwnerProductPayload = {
        boutiqueId,
        title: title.trim(),
        description: description.trim() || null,
        features: {
          ...(color ? { color } : {}),
          uploadKind: "takim",
          setItems: setItemsFromTakimDraft(items),
          ...(selectedModelId
            ? featuresWithLifestyleModels(
                {
                  ...(color ? { color } : {}),
                  uploadKind: "takim",
                  setItems: setItemsFromTakimDraft(items),
                },
                selectedModelId,
                lifestyleImages.length,
              )
            : {}),
        },
        priceTry: sellPrice,
        compareAtPriceTry,
        sizes,
        colors: [],
        category: TAKIM_SHOP_LEAF,
        images: assembled.images,
        marketplaceImages: assembled.marketplaceImages,
        lifestyleImages: cleanedLifestyleImages(lifestyleImages),
        catalogBackgroundId,
        stock: stockValue,
        sizeStocks,
        status: "available",
      };
      const product = await createOwnerProduct(payload);
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
          setItems(next.items);
          setStepIndex(0);
          setTitle("");
          setDescription("");
          setPriceTry("");
          setDiscountEnabled(false);
          setSalePriceTry("");
          setStock("1");
          setSizeChart("letter");
          setSizeStockInputs(next.sizeStockInputs);
          setLifestyleImages([]);
          setSelectedModelId(null);
          setModelStatus("idle");
          setModelError(null);
          setModelProgressPct(0);
          setModelProgressTarget(0);
          setModelProgressLabel("");
          setModelRunMode(null);
          setError(null);
        }}
      />
    );
  }

  const selectedReady = listAiModelOptions(boutiqueSlug).find(
    (option) => option.id === selectedModelId,
  )?.ready;

  return (
    <TrPanelFadeIn className="space-y-5">
      <Link href={trPanelProductsPath()} className={panelBackLinkClass}>
        Ürünler
      </Link>
      <h1 className={panelPageTitleClass}>Takım yükle</h1>
      <p className={panelHintClass}>
        İki parça, tek ürün. Önce her parçanın ön ve arka fotoğrafı — packshot
        ve birlikte giydirme sonra.
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
        <div className="space-y-8">
          {identifying ? (
            <p className="rounded-xl border border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-softer)] px-4 py-3 text-[15px] font-semibold text-neutral-900">
              Parçalar tanınıyor…
            </p>
          ) : null}
          {items.map((item, index) => (
            <section key={item.clientId} className="space-y-3">
              <p className="text-[16px] font-semibold text-neutral-900">
                Parça {index + 1}
              </p>
              {item.frontDraftFailed ? (
                <p className={panelErrorClass}>
                  AI tanıyamadı — sonraki adımda türü elle seçin.
                </p>
              ) : null}
              <TrOwnerWizardPipelineStatus jobs={photoJobs[index] ?? []} />
              <TrOwnerGuidedPhotoUpload
                boutiqueId={boutiqueId}
                images={item.images}
                marketplaceImages={item.marketplaceImages}
                catalogBackgroundCss={catalogCss}
                title={item.title}
                category={item.category}
                uploadType={item.uploadType}
                deferConstructionPackshot
                photoSlotCount={2}
                uploading={Boolean(
                  (photoJobs[index] ?? []).some(
                    (job) => job.status === "running",
                  ),
                )}
                onUploadingChange={() => undefined}
                onImagesChange={(images) =>
                  patchItem(index as 0 | 1, { images })
                }
                onMarketplaceImagesChange={(marketplaceImages) =>
                  patchItem(index as 0 | 1, { marketplaceImages })
                }
                onError={setError}
                onLightbox={setLightbox}
                onPhotoJobsChange={(jobs) =>
                  setPhotoJobs((current) => {
                    const next: [PipelineJobItem[], PipelineJobItem[]] = [
                      current[0],
                      current[1],
                    ];
                    next[index as 0 | 1] = jobs;
                    return next;
                  })
                }
                onListingDraft={(draft) => {
                  if (draft.title.trim()) {
                    patchItem(
                      index as 0 | 1,
                      applyTakimItemListingDraft(item, draft),
                    );
                  }
                }}
                onConstructionPrepared={({ draft, proposed, preparedPrompt }) => {
                  const family = constructionCatalogFamily(
                    undefined,
                    draft?.category,
                  );
                  patchItem(index as 0 | 1, {
                    ...(draft?.title?.trim()
                      ? applyTakimItemListingDraft(item, draft)
                      : {}),
                    uploadType: family,
                    gateChips: proposed,
                    proposedChips: proposed,
                    preparedPrompt,
                    frontAnalysisDone: true,
                    frontDraftFailed: !family,
                  });
                }}
                onFrontAnalysisComplete={({ draft }) => {
                  if (!draft) {
                    patchItem(index as 0 | 1, {
                      frontAnalysisDone: true,
                      frontDraftFailed: true,
                    });
                  }
                }}
              />
            </section>
          ))}
        </div>
      ) : null}

      {step === "chips" ? (
        <TrOwnerTakimChipsStep
          boutiqueId={boutiqueId}
          items={items}
          packing={packing}
          onPatchItem={patchItem}
          onBack={() => setStepIndex(0)}
          onConfirm={confirmChips}
        />
      ) : null}

      {step === "listing" ? (
        <div className="space-y-4">
          <p className={panelHintClass}>
            Kategori Takım olarak kaydedilir. İsim formülü parçalardan gelir —
            düzeltebilirsiniz.
          </p>
          {packingBusy || packshotFailed || packshotsReady ? (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.clientId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200/80 px-3 py-2"
                >
                  <p className="text-[14px] text-neutral-800">
                    Parça {index + 1}
                    {packing[index]
                      ? " · packshot üretiliyor…"
                      : takimItemPackshotUrl(item)
                        ? " · packshot hazır"
                        : item.packshotError
                          ? ` · ${item.packshotError}`
                          : ""}
                  </p>
                  {item.packshotError ? (
                    <button
                      type="button"
                      className={panelSecondaryBtnClass}
                      onClick={() => void runItemPackshot(index as 0 | 1)}
                    >
                      Yeniden dene
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
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
        </div>
      ) : null}

      {step === "models" ? (
        <div className="space-y-5">
          <p className={panelHintClass}>
            İsteğe bağlı. Model her iki parçayı birlikte giyer — ön ve arka, 2
            kredi.
          </p>
          <TrOwnerAiModelPicker
            boutiqueSlug={boutiqueSlug}
            value={selectedModelId}
            onChange={setSelectedModelId}
            hidePhotographyStyle
            disabled={modelBusy}
          />
          <TrOwnerCreditsCostLine
            boutiqueId={boutiqueId}
            credits={2 * TR_AI_CATALOG_CREDITS.modelPackage}
            prefix="Takım model"
          />
          {modelError ? <p className={panelErrorClass}>{modelError}</p> : null}
          <button
            type="button"
            className={`${panelPrimaryBtnClass} w-full`}
            disabled={
              modelBusy ||
              !selectedModelId ||
              !selectedReady ||
              packingBusy ||
              !packshotsReady
            }
            onClick={() => void generateModels()}
          >
            {modelBusy
              ? modelRunMode === "replace"
                ? "Yenileniyor…"
                : "Model oluşturuluyor…"
              : packingBusy
                ? "Packshot bitince oluşturun"
                : !packshotsReady
                  ? "Önce packshot üretin"
                  : lifestyleImages.length > 0
                    ? "Modeli yeniden oluştur"
                    : "Model fotoğrafı oluştur"}
          </button>
          {modelBusy || lifestyleImages.some((url) => Boolean(url?.trim())) ? (
            <TrOwnerModelShotProgress
              urls={lifestyleImages}
              shotCount={modelShotCount}
              busy={modelBusy}
              regenerating={modelRunMode === "replace"}
              progressPct={modelProgressPct}
              progressLabel={modelProgressLabel}
              shotLabels={
                modelShotCount > 1 ? ["Üç-çeyrek", "Sırt"] : ["Model karesi"]
              }
            />
          ) : null}
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
          onChartChange={(chart) => {
            setSizeChart(chart);
            setSizeStockInputs(emptyStockInputsForChart(chart, "0"));
          }}
          stockInputs={sizeStockInputs}
          onStockInputsChange={setSizeStockInputs}
          stock={stock}
          onStockChange={setStock}
          variant="wizard"
        />
      ) : null}

      {step === "preview" ? (
        <TrOwnerStorePreview
          title={title}
          description={description}
          priceTry={discountEnabled ? salePriceTry : priceTry}
          compareAtPriceTry={discountEnabled ? priceTry : null}
          images={assembled.images}
          marketplaceImages={assembled.marketplaceImages}
          lifestyleImages={lifestyleImages}
          catalogBackgroundId={catalogBackgroundId}
          sizes={
            sizeChart === "none"
              ? []
              : sizesFromStockInputs(sizeChart, sizeStockInputs)
          }
          takimGallery
          modelShotsPending={modelBusy}
          pendingModelShotCount={2}
        />
      ) : null}

      {step !== "chips" ? (
        <>
          <div className={panelStickyActionsSpacerClass} aria-hidden />
          <div className={panelStickyActionsClass}>
            {stepIndex > 0 ? (
              <button
                type="button"
                className={`${panelSecondaryBtnClass} flex-1`}
                onClick={() =>
                  setStepIndex((current) => Math.max(0, current - 1))
                }
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
                  (step === "listing" && !title.trim()) ||
                  (step === "models" && modelBusy)
                }
                onClick={goNext}
              >
                {step === "photos" && identifying
                  ? "Tanıma bitince devam"
                  : step === "models"
                    ? "Devam (model isteğe bağlı)"
                    : "Devam"}
              </button>
            ) : (
              <button
                type="button"
                className={`${panelPrimaryBtnClass} flex-1`}
                disabled={saving || packingBusy || modelBusy || !packshotsReady}
                onClick={() => void save()}
              >
                {saving
                  ? "Kaydediliyor…"
                  : packingBusy
                    ? "Görseller bitince kaydedin"
                    : !packshotsReady
                      ? "Packshot eksik"
                      : "Takımı kaydet"}
              </button>
            )}
          </div>
        </>
      ) : null}

      <TrProductImageLightbox
        open={Boolean(lightbox)}
        src={lightbox?.src ?? null}
        label={lightbox?.label}
        onClose={() => setLightbox(null)}
      />
    </TrPanelFadeIn>
  );
}
