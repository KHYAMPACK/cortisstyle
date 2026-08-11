"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { TrCatalogBackgroundPicker } from "@/components/tr/panel/TrCatalogBackgroundPicker";
import { TrOwnerAiCatalogEnhance } from "@/components/tr/panel/TrOwnerAiCatalogEnhance";
import { TrOwnerAiFillListing } from "@/components/tr/panel/TrOwnerAiFillListing";
import {
  emptyStockInputsForChart,
  sizesFromStockInputs,
  stockInputsFromSizeStocks,
  TrOwnerSizeChartStock,
} from "@/components/tr/panel/TrOwnerSizeChartStock";
import {
  hasRequiredProductPhotos,
  TrOwnerGuidedPhotoUpload,
} from "@/components/tr/panel/TrOwnerGuidedPhotoUpload";
import { TrProductImageLightbox } from "@/components/tr/panel/TrProductImageLightbox";
import { TrOwnerCategoryPicker } from "@/components/tr/panel/TrOwnerCategoryPicker";
import { TR_BOUTIQUE_CATEGORIES } from "@/lib/tr/categories";
import {
  DEFAULT_CATALOG_BACKGROUND_ID,
  getCatalogBackground,
} from "@/lib/tr/catalogBackgrounds/registry";
import {
  detectSizeChart,
  type TrSizeChartId,
} from "@/lib/tr/productOptions";
import {
  clampDescription,
  clampTitle,
  isValidStock,
  isValidTryPrice,
  sanitizeColorName,
  sanitizeStockInput,
  sanitizeTryPriceInput,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import {
  createOwnerProduct,
  deleteOwnerProduct,
  type OwnerListingDraft,
  updateOwnerProduct,
} from "@/lib/tr/ownerClient";
import {
  parseSizeStockInputs,
  sumSizeStocks,
} from "@/lib/tr/sizeStocks";
import {
  panelAddChipClass,
  panelChipClass,
  panelErrorClass,
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
  panelSectionClass,
} from "@/components/tr/panel/panelUi";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProduct, TrProductColor, TrProductStatus } from "@/types/tr-marketplace";

function InlineBusySpinner() {
  return (
    <motion.span
      aria-hidden
      className="inline-block h-4 w-4 shrink-0 border-2 border-current border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    />
  );
}

function OptionToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-9 w-16 shrink-0 rounded-full transition-colors ${
        checked ? "bg-[color:var(--panel-accent)]" : "bg-neutral-300"
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-1 left-1 h-7 w-7 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-7" : "translate-x-0"
        }`}
      />
    </button>
  );
}

const PRESET_COLORS: TrProductColor[] = [
  { name: "Siyah", hex: "#1A1A1A" },
  { name: "Beyaz", hex: "#F5F5F5" },
  { name: "Lacivert", hex: "#1E3A5F" },
  { name: "Kahverengi", hex: "#6B4423" },
  { name: "Bej", hex: "#D4C4A8" },
  { name: "Kırmızı", hex: "#B71C1C" },
  { name: "Pembe", hex: "#C2185B" },
  { name: "Yeşil", hex: "#2E5A3C" },
];

const STATUS_OPTIONS: Array<{ id: TrProductStatus; label: string }> = [
  { id: "available", label: "Satışta" },
  { id: "sold", label: "Satıldı" },
  { id: "hidden", label: "Gizli" },
];

/** Edit mode: jump between sections (durum stays visible except on Sil). */
const EDIT_STEPS = [
  { id: "photos", title: "Fotoğraflar" },
  { id: "name", title: "İsim" },
  { id: "price", title: "Fiyat" },
  { id: "category", title: "Kategori" },
  { id: "sizes", title: "Beden" },
  { id: "colors", title: "Renkler" },
  { id: "danger", title: "Sil" },
] as const;

type EditStepId = (typeof EDIT_STEPS)[number]["id"];

function slugifyCustomId(label: string): string {
  return label
    .trim()
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

interface TrProductEditorFormProps {
  boutiqueId: string;
  boutiqueSlug?: string | null;
  mode: "create" | "edit";
  initialProduct?: TrProduct | null;
  onSaved: (product: TrProduct) => void;
  onDeleted?: () => void;
}

export function TrProductEditorForm({
  boutiqueId,
  boutiqueSlug = null,
  mode,
  initialProduct,
  onSaved,
  onDeleted,
}: TrProductEditorFormProps) {
  const [editStepIndex, setEditStepIndex] = useState(0);
  const editStep = EDIT_STEPS[editStepIndex] ?? EDIT_STEPS[0]!;
  const sectioned = mode === "edit";
  const showSection = (id: EditStepId) =>
    !sectioned || editStep.id === id;
  const showStatusEverywhere = sectioned && editStep.id !== "danger";

  const [title, setTitle] = useState(initialProduct?.title ?? "");
  const initialOnSale =
    typeof initialProduct?.compareAtPriceKurus === "number" &&
    initialProduct.compareAtPriceKurus > initialProduct.priceKurus;
  const [priceTry, setPriceTry] = useState(() => {
    if (!initialProduct) return "";
    if (initialOnSale) {
      return String(initialProduct.compareAtPriceKurus! / 100);
    }
    return String(initialProduct.priceKurus / 100);
  });
  const [discountEnabled, setDiscountEnabled] = useState(initialOnSale);
  const [salePriceTry, setSalePriceTry] = useState(() =>
    initialOnSale ? String(initialProduct!.priceKurus / 100) : "",
  );
  const [description, setDescription] = useState(
    initialProduct?.description ?? "",
  );
  const [category, setCategory] = useState<string | null>(
    initialProduct?.category ?? null,
  );
  const [extraCategories, setExtraCategories] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [sizesEnabled, setSizesEnabled] = useState(
    () => (initialProduct?.sizes.length ?? 0) > 0,
  );
  const [sizeChart, setSizeChart] = useState<TrSizeChartId>(() =>
    detectSizeChart(initialProduct?.sizes ?? []),
  );
  const [sizeStockInputs, setSizeStockInputs] = useState<
    Record<string, string>
  >(() => {
    const chart = detectSizeChart(initialProduct?.sizes ?? []);
    if (chart === "none") return {};
    return stockInputsFromSizeStocks(chart, initialProduct?.sizeStocks);
  });
  const [colorsEnabled, setColorsEnabled] = useState(
    () => (initialProduct?.colors.length ?? 0) > 0,
  );
  const [colors, setColors] = useState<TrProductColor[]>(
    initialProduct?.colors ?? [],
  );
  const [stock, setStock] = useState(
    String(initialProduct?.stock ?? 1),
  );
  const [images, setImages] = useState<string[]>(initialProduct?.images ?? []);
  const [marketplaceImages, setMarketplaceImages] = useState<string[]>(
    initialProduct?.marketplaceImages ?? [],
  );
  const [lifestyleImages, setLifestyleImages] = useState<string[]>(
    initialProduct?.lifestyleImages ?? [],
  );
  const [listingDraft, setListingDraft] = useState<OwnerListingDraft | null>(
    null,
  );
  const [catalogBackgroundId, setCatalogBackgroundId] = useState(
    initialProduct?.catalogBackgroundId ?? DEFAULT_CATALOG_BACKGROUND_ID,
  );
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{
    src: string;
    label: string;
  } | null>(null);
  const [status, setStatus] = useState<TrProductStatus>(
    initialProduct?.status ?? "available",
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<
    "idle" | "pending" | "saving" | "saved" | "error"
  >("idle");
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);
  const autosaveReadyRef = useRef(false);
  const autosaveSeqRef = useRef(0);
  const lastSavedFingerprintRef = useRef<string | null>(null);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [addingColor, setAddingColor] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#C2185B");

  const catalogBackground = getCatalogBackground(catalogBackgroundId);

  const applySizeChart = (next: TrSizeChartId) => {
    setSizeChart(next);
    setSizesEnabled(next !== "none");
    if (next === "none") {
      setSizeStockInputs({});
      return;
    }
    setSizeStockInputs((current) => {
      const prevDefaults =
        sizeChart === "none"
          ? new Set<string>()
          : new Set(Object.keys(emptyStockInputsForChart(sizeChart, "0")));
      const nextInputs = emptyStockInputsForChart(next, "0");
      for (const [size, value] of Object.entries(current)) {
        if (size in nextInputs) {
          nextInputs[size] = value;
        } else if (!prevDefaults.has(size)) {
          nextInputs[size] = value;
        }
      }
      return nextInputs;
    });
  };

  useEffect(() => {
    if (!initialProduct) return;
    autosaveReadyRef.current = false;
    setTitle(initialProduct.title);
    const onSale =
      typeof initialProduct.compareAtPriceKurus === "number" &&
      initialProduct.compareAtPriceKurus > initialProduct.priceKurus;
    setDiscountEnabled(onSale);
    if (onSale) {
      setPriceTry(String(initialProduct.compareAtPriceKurus! / 100));
      setSalePriceTry(String(initialProduct.priceKurus / 100));
    } else {
      setPriceTry(String(initialProduct.priceKurus / 100));
      setSalePriceTry("");
    }
    setDescription(initialProduct.description ?? "");
    setCategory(initialProduct.category);
    const chart = detectSizeChart(initialProduct.sizes);
    setSizeChart(chart);
    setSizesEnabled(chart !== "none");
    setSizeStockInputs(
      chart === "none"
        ? {}
        : stockInputsFromSizeStocks(chart, initialProduct.sizeStocks),
    );
    setColorsEnabled(initialProduct.colors.length > 0);
    setColors(initialProduct.colors);
    setStock(String(initialProduct.stock ?? 1));
    setImages(initialProduct.images);
    setMarketplaceImages(initialProduct.marketplaceImages ?? []);
    setLifestyleImages(initialProduct.lifestyleImages ?? []);
    setCatalogBackgroundId(
      initialProduct.catalogBackgroundId ?? DEFAULT_CATALOG_BACKGROUND_ID,
    );
    setStatus(initialProduct.status);
    setAutoSaveState("idle");
    setAutoSaveError(null);
    lastSavedFingerprintRef.current = null;

    if (
      initialProduct.category &&
      !TR_BOUTIQUE_CATEGORIES.some((entry) => entry.id === initialProduct.category)
    ) {
      setExtraCategories([
        {
          id: initialProduct.category,
          label: initialProduct.category.replace(/-/g, " "),
        },
      ]);
    }

    // Allow autosave after hydrate settles (avoid saving the load itself).
    const readyTimer = window.setTimeout(() => {
      autosaveReadyRef.current = true;
    }, 400);
    return () => window.clearTimeout(readyTimer);
  }, [initialProduct?.id]);

  const categoryOptions = useMemo(() => {
    const seen = new Set(TR_BOUTIQUE_CATEGORIES.map((entry) => entry.id));
    return extraCategories.filter((entry) => {
      if (seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    });
  }, [extraCategories]);

  const toggleColor = (color: TrProductColor) => {
    setColors((current) => {
      const exists = current.some(
        (entry) => entry.hex.toLowerCase() === color.hex.toLowerCase(),
      );
      if (exists) {
        return current.filter(
          (entry) => entry.hex.toLowerCase() !== color.hex.toLowerCase(),
        );
      }
      return [...current, color];
    });
  };

  const commitCategory = () => {
    const label = newCategoryLabel.trim();
    if (!label) return;
    const id = slugifyCustomId(label) || `kategori-${Date.now()}`;
    const existing = categoryOptions.find(
      (entry) => entry.id === id || entry.label.toLocaleLowerCase("tr") === label.toLocaleLowerCase("tr"),
    );
    if (existing) {
      setCategory(existing.id);
    } else {
      setExtraCategories((current) => [...current, { id, label }]);
      setCategory(id);
    }
    setNewCategoryLabel("");
    setAddingCategory(false);
  };

  const commitColor = () => {
    const name = sanitizeColorName(newColorName).trim();
    let hex = newColorHex.trim();
    if (!name) return;
    if (!hex.startsWith("#")) hex = `#${hex}`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setError("Renk için geçerli bir hex kodu girin (ör. #C2185B).");
      return;
    }
    toggleColor({ name, hex: hex.toUpperCase() });
    setNewColorName("");
    setNewColorHex("#C2185B");
    setAddingColor(false);
  };

  const buildPayload = () => {
    if (!isValidTryPrice(priceTry)) {
      throw new Error(
        `Fiyat ${TR_OWNER_PRODUCT_LIMITS.priceMinTry}–${TR_OWNER_PRODUCT_LIMITS.priceMaxTry} TL arası olmalı.`,
      );
    }
    const price = Number(priceTry.replace(",", "."));
    if (!title.trim()) {
      throw new Error("Başlık zorunlu.");
    }
    if (!hasRequiredProductPhotos(images)) {
      throw new Error("Ön ve arka fotoğraf zorunlu.");
    }

    const activeSizes =
      sizeChart === "none" || !sizesEnabled
        ? []
        : sizesFromStockInputs(sizeChart, sizeStockInputs);
    let stockValue: number;
    let sizeStocks: Record<string, number> = {};
    if (activeSizes.length > 0) {
      const parsed = parseSizeStockInputs(activeSizes, sizeStockInputs);
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

    let sellPrice = price;
    let compareAtPriceTryValue: number | null = null;
    if (discountEnabled) {
      if (!isValidTryPrice(salePriceTry)) {
        throw new Error("Geçerli bir indirimli fiyat girin.");
      }
      const sale = Number(salePriceTry.replace(",", "."));
      if (sale >= price) {
        throw new Error("İndirimli fiyat, normal fiyattan düşük olmalı.");
      }
      sellPrice = sale;
      compareAtPriceTryValue = price;
    }

    return {
      boutiqueId,
      title: title.trim(),
      description: description.trim() || null,
      priceTry: sellPrice,
      compareAtPriceTry: compareAtPriceTryValue,
      sizes: activeSizes,
      colors: colorsEnabled ? colors : [],
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
      status,
    };
  };

  const payloadFingerprint = useMemo(() => {
    try {
      return JSON.stringify(buildPayload());
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fingerprint follows form fields
  }, [
    boutiqueId,
    title,
    description,
    priceTry,
    discountEnabled,
    salePriceTry,
    sizeChart,
    sizesEnabled,
    sizeStockInputs,
    colorsEnabled,
    colors,
    category,
    images,
    marketplaceImages,
    lifestyleImages,
    catalogBackgroundId,
    stock,
    status,
  ]);

  const persistProduct = async (options?: { manual?: boolean }) => {
    const payload = buildPayload();
    const fingerprint = JSON.stringify(payload);
    if (
      !options?.manual &&
      lastSavedFingerprintRef.current === fingerprint
    ) {
      return null;
    }

    const product =
      mode === "create"
        ? await createOwnerProduct(payload)
        : await updateOwnerProduct(initialProduct!.id, payload);

    lastSavedFingerprintRef.current = fingerprint;
    onSaved(product);
    return product;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "edit") {
      // Edit relies on autosave; submit is a no-op safety net.
      return;
    }
    setSaving(true);
    setError(null);

    try {
      await persistProduct({ manual: true });
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Kayıt başarısız.",
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (mode !== "edit") return;
    if (!autosaveReadyRef.current) return;
    if (uploading || deleting) return;
    if (!payloadFingerprint) {
      setAutoSaveState("pending");
      return;
    }
    if (lastSavedFingerprintRef.current === payloadFingerprint) {
      setAutoSaveState((current) => (current === "saving" ? current : "saved"));
      return;
    }

    setAutoSaveState("pending");
    const seq = ++autosaveSeqRef.current;
    const timer = window.setTimeout(() => {
      void (async () => {
        if (seq !== autosaveSeqRef.current) return;
        if (!autosaveReadyRef.current) return;

        // Seed baseline after hydrate — don't PATCH identical load state.
        if (
          lastSavedFingerprintRef.current === null &&
          payloadFingerprint
        ) {
          lastSavedFingerprintRef.current = payloadFingerprint;
          setAutoSaveState("saved");
          return;
        }

        setAutoSaveState("saving");
        setAutoSaveError(null);
        setError(null);
        try {
          await persistProduct();
          if (seq !== autosaveSeqRef.current) return;
          setAutoSaveState("saved");
        } catch (saveError) {
          if (seq !== autosaveSeqRef.current) return;
          const message =
            saveError instanceof Error ? saveError.message : "Kayıt başarısız.";
          setAutoSaveState("error");
          setAutoSaveError(message);
          setError(message);
        }
      })();
    }, 700);

    return () => window.clearTimeout(timer);
    // persistProduct closes over latest fields; fingerprint drives the effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    payloadFingerprint,
    uploading,
    deleting,
  ]);

  const chipClass = (active: boolean) => panelChipClass(active);
  const addChipClass = panelAddChipClass;
  const fieldClass = panelFieldClass;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === "edit" ? (
        <section
          className={`${panelSectionClass} ${showStatusEverywhere ? "" : "hidden"}`}
        >
          <p className={panelLabelClass}>Durum</p>
          <p className={`mt-1 ${panelHintClass}`}>
            Satışta görünür, gizlide mağazada çıkmaz.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={chipClass(status === option.id)}
                style={
                  status === option.id
                    ? { backgroundColor: "var(--panel-accent)" }
                    : undefined
                }
                onClick={() => setStatus(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {sectioned ? (
        <div className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {EDIT_STEPS.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setError(null);
                  setEditStepIndex(index);
                }}
                className={panelChipClass(index === editStepIndex)}
                style={
                  index === editStepIndex
                    ? { backgroundColor: "var(--panel-accent)" }
                    : undefined
                }
              >
                {step.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <section
        className={`${panelSectionClass} ${showSection("photos") ? "" : "hidden"}`}
      >
        <div>
          <p className={panelLabelClass}>Fotoğraflar</p>
          <p className={`mt-1 ${panelHintClass}`}>
            Önce ön, sonra arka — her fotoğraf önizlenir.
          </p>
        </div>

        <TrOwnerGuidedPhotoUpload
          boutiqueId={boutiqueId}
          images={images}
          marketplaceImages={marketplaceImages}
          catalogBackgroundCss={catalogBackground.css}
          title={title}
          category={category}
          productId={initialProduct?.id}
          uploading={uploading}
          onUploadingChange={setUploading}
          onImagesChange={setImages}
          onMarketplaceImagesChange={setMarketplaceImages}
          onError={setError}
          onLightbox={setLightbox}
          onListingDraft={setListingDraft}
          disabled={saving}
        />

        {hasRequiredProductPhotos(images) ? (
          <div className="space-y-6 rounded-xl border border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-soft)] p-4 sm:p-5">
            <TrOwnerAiCatalogEnhance
              boutiqueId={boutiqueId}
              boutiqueSlug={boutiqueSlug}
              productId={initialProduct?.id}
              title={title}
              category={category}
              images={images}
              marketplaceImages={marketplaceImages}
              lifestyleImages={lifestyleImages}
              selectedModelId={selectedModelId}
              onSelectedModelIdChange={setSelectedModelId}
              onMarketplaceImagesChange={setMarketplaceImages}
              onLifestyleImagesChange={(urls) => {
                const first = urls.find((url) => url?.trim())?.trim();
                setLifestyleImages(first ? [first] : []);
              }}
              onListingDraft={setListingDraft}
              disabled={uploading || saving}
            />
            {(marketplaceImages.some((url) => url?.trim()) ||
              lifestyleImages.length > 0) && (
              <TrCatalogBackgroundPicker
                value={catalogBackgroundId}
                onChange={setCatalogBackgroundId}
                disabled={uploading || saving}
              />
            )}
          </div>
        ) : null}
      </section>

      <section
        className={`${panelSectionClass} ${showSection("name") ? "" : "hidden"}`}
      >
        <TrOwnerAiFillListing
          boutiqueId={boutiqueId}
          sourceImageUrl={
            marketplaceImages[0]?.trim() || images[0]?.trim() || null
          }
          category={category}
          cachedDraft={listingDraft}
          disabled={saving}
          onError={setError}
          onApply={(draft) => {
            setTitle(clampTitle(draft.title));
            setDescription(clampDescription(draft.description));
            setListingDraft(draft);
          }}
        />
        <label className="block space-y-2">
          <span className={panelLabelClass}>Ürün adı</span>
          <input
            value={title}
            onChange={(event) => setTitle(clampTitle(event.target.value))}
            className={fieldClass}
            maxLength={TR_OWNER_PRODUCT_LIMITS.titleMax}
            required
          />
          <span className={panelHintClass}>
            {title.length}/{TR_OWNER_PRODUCT_LIMITS.titleMax}
          </span>
        </label>

        <label className="block space-y-2">
          <span className={panelLabelClass}>Açıklama</span>
          <textarea
            value={description}
            onChange={(event) =>
              setDescription(clampDescription(event.target.value))
            }
            rows={5}
            maxLength={TR_OWNER_PRODUCT_LIMITS.descriptionMax}
            className={fieldClass}
          />
          <span className={panelHintClass}>
            {description.length}/{TR_OWNER_PRODUCT_LIMITS.descriptionMax}
          </span>
        </label>
      </section>

      <section
        className={`${panelSectionClass} ${showSection("price") ? "" : "hidden"}`}
      >
        <label className="block space-y-2">
          <span className={panelLabelClass}>Fiyat (TL)</span>
          <input
            value={priceTry}
            onChange={(event) =>
              setPriceTry(sanitizeTryPriceInput(event.target.value))
            }
            inputMode="decimal"
            placeholder="899"
            className={fieldClass}
            required
          />
          {priceTry && Number(priceTry.replace(",", ".")) > 0 ? (
            <span className={panelHintClass}>
              {formatTryFromKurus(
                Math.round(Number(priceTry.replace(",", ".")) * 100),
              )}
              {discountEnabled
                ? " — normal / üstü çizili fiyat"
                : " — müşterinin ödeyeceği fiyat"}
            </span>
          ) : null}
        </label>

        <button
          type="button"
          role="switch"
          aria-checked={discountEnabled}
          onClick={() => {
            setDiscountEnabled((current) => !current);
            if (discountEnabled) setSalePriceTry("");
          }}
          className="flex w-full items-center gap-4 rounded-2xl border-2 border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-soft)] px-4 py-4 text-left"
        >
          <span
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
              discountEnabled ? "" : "bg-neutral-300"
            }`}
            style={
              discountEnabled
                ? { backgroundColor: "var(--panel-accent)" }
                : undefined
            }
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
            <span className={panelLabelClass}>İndirimli fiyat (TL)</span>
            <input
              value={salePriceTry}
              onChange={(event) =>
                setSalePriceTry(sanitizeTryPriceInput(event.target.value))
              }
              inputMode="decimal"
              placeholder="690"
              className={fieldClass}
            />
            <span className={panelHintClass}>
              Müşteri bunu öder; üstteki fiyat üstü çizili görünür.
            </span>
          </label>
        ) : null}
      </section>

      <section
        className={`${panelSectionClass} ${showSection("category") ? "" : "hidden"}`}
      >
        <p className={panelLabelClass}>Kategori</p>
        <TrOwnerCategoryPicker
          value={category}
          onChange={setCategory}
          extras={categoryOptions}
        />
        <div className="mt-3 flex flex-wrap gap-3">
          {!addingCategory ? (
            <button
              type="button"
              className={addChipClass}
              onClick={() => setAddingCategory(true)}
            >
              + Kategori ekle
            </button>
          ) : null}
        </div>
        <AnimatePresence>
          {addingCategory ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-3 flex flex-wrap items-center gap-3"
            >
              <input
                value={newCategoryLabel}
                onChange={(event) => setNewCategoryLabel(event.target.value)}
                placeholder="Örn. Aksesuar"
                className={`${fieldClass} min-w-[160px] flex-1`}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitCategory();
                  }
                }}
              />
              <button
                type="button"
                className={panelPrimaryBtnClass}
                style={{ backgroundColor: "var(--panel-accent)" }}
                onClick={commitCategory}
              >
                Ekle
              </button>
              <button
                type="button"
                className={panelSecondaryBtnClass}
                onClick={() => {
                  setAddingCategory(false);
                  setNewCategoryLabel("");
                }}
              >
                Vazgeç
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <section
        className={`${panelSectionClass} ${showSection("sizes") ? "" : "hidden"}`}
      >
        <TrOwnerSizeChartStock
          chart={sizeChart}
          onChartChange={applySizeChart}
          stockInputs={sizeStockInputs}
          onStockInputsChange={setSizeStockInputs}
          stock={stock}
          onStockChange={setStock}
          allowCustomSizes
          variant="editor"
        />
      </section>

      <section
        className={`${panelSectionClass} ${showSection("colors") ? "" : "hidden"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={panelLabelClass}>Renkler</p>
            <p className={`mt-1 ${panelHintClass}`}>
              İsterseniz açın — kapalıysa mağazada renk seçimi çıkmaz.
            </p>
          </div>
          <OptionToggle
            label="Renk seçenekleri"
            checked={colorsEnabled}
            onChange={(next) => {
              setColorsEnabled(next);
              if (!next) {
                setAddingColor(false);
                setNewColorName("");
                setNewColorHex("#C2185B");
              }
            }}
          />
        </div>
        <AnimatePresence initial={false}>
          {colorsEnabled ? (
            <motion.div
              key="colors-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-3">
                {PRESET_COLORS.map((color) => {
                  const active = colors.some(
                    (entry) =>
                      entry.hex.toLowerCase() === color.hex.toLowerCase(),
                  );
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      title={color.name}
                      aria-label={color.name}
                      onClick={() => toggleColor(color)}
                      className="h-12 w-12 rounded-lg border-2"
                      style={{
                        backgroundColor: color.hex,
                        borderColor: active
                          ? "var(--panel-accent)"
                          : "rgba(0,0,0,0.15)",
                      }}
                    />
                  );
                })}
                {colors
                  .filter(
                    (color) =>
                      !PRESET_COLORS.some(
                        (preset) =>
                          preset.hex.toLowerCase() === color.hex.toLowerCase(),
                      ),
                  )
                  .map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      title={color.name}
                      aria-label={color.name}
                      onClick={() => toggleColor(color)}
                      className="h-12 w-12 rounded-lg border-2"
                      style={{
                        backgroundColor: color.hex,
                        borderColor: "var(--panel-accent)",
                      }}
                    />
                  ))}
                {!addingColor ? (
                  <button
                    type="button"
                    className={addChipClass}
                    onClick={() => setAddingColor(true)}
                  >
                    + Renk ekle
                  </button>
                ) : null}
              </div>
              {colors.length > 0 ? (
                <p className="text-[16px] text-neutral-700">
                  Seçili: {colors.map((color) => color.name).join(", ")}
                </p>
              ) : null}
              <AnimatePresence>
                {addingColor ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <input
                      value={newColorName}
                      onChange={(event) => setNewColorName(event.target.value)}
                      placeholder="Renk adı"
                      className={`${fieldClass} min-w-[140px] flex-1`}
                    />
                    <input
                      type="color"
                      value={
                        /^#[0-9A-Fa-f]{6}$/.test(newColorHex)
                          ? newColorHex
                          : "#C2185B"
                      }
                      onChange={(event) => setNewColorHex(event.target.value)}
                      className="h-14 w-16 cursor-pointer rounded-xl border-2 border-[color:var(--panel-accent-border)] bg-white p-1"
                      title="Renk seç"
                    />
                    <input
                      value={newColorHex}
                      onChange={(event) => setNewColorHex(event.target.value)}
                      placeholder="#C2185B"
                      className={`${fieldClass} w-36`}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          commitColor();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className={panelPrimaryBtnClass}
                      style={{ backgroundColor: "var(--panel-accent)" }}
                      onClick={commitColor}
                    >
                      Ekle
                    </button>
                    <button
                      type="button"
                      className={panelSecondaryBtnClass}
                      onClick={() => {
                        setAddingColor(false);
                        setNewColorName("");
                        setNewColorHex("#C2185B");
                      }}
                    >
                      Vazgeç
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      {error ? <p className={panelErrorClass}>{error}</p> : null}

      {mode === "edit" && initialProduct ? (
        <div className={showSection("danger") ? "" : "hidden"}>
          <section className={panelSectionClass}>
            <p className={panelLabelClass}>Ürünü sil</p>
            <p className={`mt-1 ${panelHintClass}`}>
              Bu işlem mağazadan ürünü kaldırır. Emin değilseniz dokunmayın.
            </p>
            {!confirmDelete ? (
              <button
                type="button"
                disabled={saving || uploading || deleting}
                onClick={() => setConfirmDelete(true)}
                className={`${panelSecondaryBtnClass} mt-4 w-full border-red-300 text-red-800`}
              >
                Ürünü sil
              </button>
            ) : (
              <div
                className="mt-4 space-y-4 rounded-2xl border-2 border-red-300 bg-red-50 p-5"
                role="alertdialog"
                aria-labelledby="delete-product-title"
              >
                <p
                  id="delete-product-title"
                  className="text-[18px] font-semibold text-neutral-900"
                >
                  Ürünü silmek istediğinize emin misiniz?
                </p>
                <p className="text-[16px] leading-relaxed text-neutral-700">
                  <span className="font-semibold">{initialProduct.title}</span>{" "}
                  kalıcı olarak silinir. Bu işlem geri alınamaz.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={deleting}
                    className={`${panelPrimaryBtnClass} bg-red-700`}
                    onClick={() => {
                      void (async () => {
                        setDeleting(true);
                        setError(null);
                        try {
                          const result = await deleteOwnerProduct(
                            initialProduct.id,
                          );
                          if (result.message && typeof window !== "undefined") {
                            window.sessionStorage.setItem(
                              "tr-panel-product-delete-notice",
                              result.message,
                            );
                          }
                          onDeleted?.();
                        } catch (deleteError) {
                          setError(
                            deleteError instanceof Error
                              ? deleteError.message
                              : "Ürün silinemedi.",
                          );
                          setConfirmDelete(false);
                        } finally {
                          setDeleting(false);
                        }
                      })();
                    }}
                  >
                    {deleting ? (
                      <>
                        <InlineBusySpinner />
                        Siliniyor…
                      </>
                    ) : (
                      "Evet, sil"
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    className={panelSecondaryBtnClass}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {sectioned ? (
        <div className="sticky bottom-3 z-10 rounded-2xl border border-[color:var(--panel-accent-border)] bg-white/95 p-4 shadow-lg backdrop-blur-sm sm:p-5">
          <div className="flex items-center gap-3 text-[14px] font-medium text-neutral-700">
            {autoSaveState === "saving" || autoSaveState === "pending" ? (
              <>
                <InlineBusySpinner />
                <span>
                  {autoSaveState === "pending"
                    ? "Değişiklikler bekleniyor…"
                    : "Otomatik kaydediliyor…"}
                </span>
              </>
            ) : autoSaveState === "saved" ? (
              <span className="text-emerald-800">
                Kaydedildi — değişiklikler otomatik güncellenir
              </span>
            ) : autoSaveState === "error" ? (
              <span className="text-red-700">
                {autoSaveError ?? "Kaydedilemedi"}
              </span>
            ) : (
              <span className="text-neutral-500">
                Değişiklikler otomatik kaydedilir
              </span>
            )}
          </div>
        </div>
      ) : (
        <button
          type="submit"
          disabled={saving || uploading || deleting}
          className={`${panelPrimaryBtnClass} w-full gap-3`}
          style={{ backgroundColor: "var(--panel-accent)" }}
        >
          {saving ? (
            <>
              <InlineBusySpinner />
              Kaydediliyor…
            </>
          ) : (
            "Ürünü ekle"
          )}
        </button>
      )}

      <TrProductImageLightbox
        open={Boolean(lightbox)}
        src={lightbox?.src ?? null}
        label={lightbox?.label}
        onClose={() => setLightbox(null)}
      />
    </form>
  );
}
