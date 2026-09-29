import { DEFAULT_CATALOG_BACKGROUND_ID } from "@/lib/tr/catalogBackgrounds/registry";
import { isManualListing, withManualListing } from "@/lib/tr/catalog/productFeatures";
import {
  constructionCatalogFamily,
  isAltGiyimShopLeaf,
  isTakimShopLeaf,
  isUstGiyimShopLeaf,
  requiredPhotoSlotsForUploadType,
  type ConstructionCatalogFamily,
} from "@/lib/tr/fashion/garmentUploadTypes";
import { isTakimCatalogProduct } from "@/lib/tr/fashion/takimUpload";
import {
  isValidStock,
  isValidTryPrice,
  kurusToPriceInput,
  parseTryPrice,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import type { TrOwnerProductPatch } from "@/lib/tr/panel/ownerClient";
import {
  hasManualGalleryPhoto,
  hasRequiredProductPhotos,
} from "@/lib/tr/productPhotoChecks";
import { alignMarketplaceSlots, cleanedLifestyleImages } from "@/lib/tr/productImages";
import { detectSizeChart, type TrSizeChartId } from "@/lib/tr/productOptions";
import {
  sizesFromStockInputs,
  stockInputsFromSizeStocks,
  type SizeStockInputs,
} from "@/lib/tr/sizeStockInputs";
import { parseSizeStockInputs, sumSizeStocks } from "@/lib/tr/sizeStocks";
import type {
  TrProduct,
  TrProductColor,
  TrProductFeatures,
  TrProductStatus,
} from "@/types/tr-marketplace";

/**
 * Form state of the fashion (garment) product editor, kept as the strings the owner
 * typed. The editor and its tests share it so the rules live in one place.
 *
 * Prices follow the fashion editor's model: `priceTry` is the normal price; with
 * `discountEnabled`, `salePriceTry` is what the customer pays and the normal price is
 * shown struck through.
 *
 * Durum is derived from stock (Mert, 2026-09-29): the owner only chooses whether the
 * product is hidden; it is "Satıldı" when its stock is 0 and "Satışta" otherwise.
 */
export interface FashionProductFormState {
  title: string;
  priceTry: string;
  discountEnabled: boolean;
  salePriceTry: string;
  /** Plain text: meta description, Google feed and AI fill read it. */
  description: string;
  features: TrProductFeatures;
  category: string | null;
  /** "Kendi fotoğraflarım": a plain gallery instead of the guided front/back upload. */
  manualMode: boolean;
  /** `none` = no sizes; the product then has one stock count. */
  sizeChart: TrSizeChartId;
  sizeStockInputs: SizeStockInputs;
  /** The single stock count when there are no sizes. */
  stock: string;
  colorsEnabled: boolean;
  colors: TrProductColor[];
  images: string[];
  marketplaceImages: string[];
  lifestyleImages: string[];
  catalogBackgroundId: string;
  hidden: boolean;
}

export function fashionFormFromProduct(
  product: TrProduct,
): FashionProductFormState {
  const onSale =
    typeof product.compareAtPriceKurus === "number" &&
    product.compareAtPriceKurus > product.priceKurus;
  const sizeChart = detectSizeChart(product.sizes);
  return {
    title: product.title,
    priceTry: kurusToPriceInput(
      onSale ? product.compareAtPriceKurus! : product.priceKurus,
    ),
    discountEnabled: onSale,
    salePriceTry: onSale ? kurusToPriceInput(product.priceKurus) : "",
    description: product.description ?? "",
    features: product.features ?? {},
    category: product.category,
    manualMode: isManualListing(product),
    sizeChart,
    sizeStockInputs:
      sizeChart === "none"
        ? {}
        : stockInputsFromSizeStocks(sizeChart, product.sizeStocks),
    stock: String(product.stock ?? 1),
    colorsEnabled: product.colors.length > 0,
    colors: product.colors,
    images: product.images,
    marketplaceImages: product.marketplaceImages ?? [],
    lifestyleImages: product.lifestyleImages ?? [],
    catalogBackgroundId: product.catalogBackgroundId ?? DEFAULT_CATALOG_BACKGROUND_ID,
    hidden: product.status === "hidden",
  };
}

/** What kind of garment the form is editing; decides the photo rules and hints. */
export interface FashionFormFacts {
  /** Two-piece set: its photos come from the Takım flow and its category is fixed. */
  takim: boolean;
  /** The construction family (elbise / üst giyim / alt giyim), or null. */
  family: ConstructionCatalogFamily | null;
  elbise: boolean;
  requiredPhotoSlots: number;
}

export function fashionFormFacts(
  form: Pick<FashionProductFormState, "features" | "category">,
): FashionFormFacts {
  const takim =
    isTakimCatalogProduct({ features: form.features }) ||
    isTakimShopLeaf(form.category);
  const family = takim ? null : constructionCatalogFamily(null, form.category);
  return {
    takim,
    family,
    elbise: family != null,
    requiredPhotoSlots: requiredPhotoSlotsForUploadType(family),
  };
}

/** The sizes that will be saved (none when the chart is `none`). */
export function fashionFormSizes(form: FashionProductFormState): string[] {
  return form.sizeChart === "none"
    ? []
    : sizesFromStockInputs(form.sizeChart, form.sizeStockInputs);
}

/**
 * First problem in the form as a sentence for the owner, or null when it can be saved.
 * Same checks and wording as the old autosaving editor.
 */
export function validateFashionProductForm(
  form: FashionProductFormState,
): string | null {
  if (!isValidTryPrice(form.priceTry)) {
    return `Fiyat ${TR_OWNER_PRODUCT_LIMITS.priceMinTry}–${TR_OWNER_PRODUCT_LIMITS.priceMaxTry} TL arası olmalı.`;
  }
  if (!form.title.trim()) return "Başlık zorunlu.";

  const { takim, family, elbise, requiredPhotoSlots } = fashionFormFacts(form);
  if (family === "ust-giyim" && !isUstGiyimShopLeaf(form.category)) {
    return "Üst giyim için alt kategori seçin (bluz, gömlek, tişört…).";
  }
  if (family === "alt-giyim" && !isAltGiyimShopLeaf(form.category)) {
    return "Alt giyim için alt kategori seçin (etek, pantolon, eşofman).";
  }
  if (form.manualMode) {
    if (!takim && !hasManualGalleryPhoto(form.images)) {
      return "En az bir fotoğraf ekleyin.";
    }
  } else if (!takim && !hasRequiredProductPhotos(form.images, requiredPhotoSlots)) {
    return elbise
      ? "Ön ve arka fotoğraf zorunlu. Dekolte / detay isteğe bağlı."
      : "Ön ve arka fotoğraf zorunlu.";
  }

  const sizes = fashionFormSizes(form);
  if (sizes.length > 0) {
    if (!parseSizeStockInputs(sizes, form.sizeStockInputs)) {
      return `Her beden için stok ${TR_OWNER_PRODUCT_LIMITS.stockMin}–${TR_OWNER_PRODUCT_LIMITS.stockMax} arası olmalı.`;
    }
  } else if (!isValidStock(form.stock)) {
    return `Stok ${TR_OWNER_PRODUCT_LIMITS.stockMin}–${TR_OWNER_PRODUCT_LIMITS.stockMax} arası olmalı.`;
  }

  if (form.discountEnabled) {
    if (!isValidTryPrice(form.salePriceTry)) {
      return "Geçerli bir indirimli fiyat girin.";
    }
    if (parseTryPrice(form.salePriceTry)! >= parseTryPrice(form.priceTry)!) {
      return "İndirimli fiyat, normal fiyattan düşük olmalı.";
    }
  }
  return null;
}

/**
 * The product's stock: the sum of its sizes, or its single count. Call after
 * `validateFashionProductForm`; an unreadable size map counts as 0.
 */
export function fashionFormStock(form: FashionProductFormState): number {
  const sizes = fashionFormSizes(form);
  if (sizes.length > 0) {
    const parsed = parseSizeStockInputs(sizes, form.sizeStockInputs);
    return parsed ? sumSizeStocks(parsed) : 0;
  }
  const stock = Number.parseInt(form.stock, 10);
  return Number.isFinite(stock) ? stock : 0;
}

export function fashionProductStatus(
  form: FashionProductFormState,
): TrProductStatus {
  if (form.hidden) return "hidden";
  return fashionFormStock(form) > 0 ? "available" : "sold";
}

/**
 * PATCH body for the editor's Kaydet. Call `validateFashionProductForm` first.
 *
 * Unlike the old autosaving editor, sizes always travel with their stock: typing 0 in
 * every size saves 0 (the old editor dropped the stock in that case, so a sold-out
 * garment kept its previous stock). A product without sizes sends an empty size map
 * so no stale per-size stock is left behind.
 */
export function fashionProductPatch(
  form: FashionProductFormState,
): TrOwnerProductPatch {
  const price = parseTryPrice(form.priceTry)!;
  const sale = form.discountEnabled ? parseTryPrice(form.salePriceTry)! : null;

  const sizes = fashionFormSizes(form);
  const sizeStocks =
    sizes.length > 0 ? (parseSizeStockInputs(sizes, form.sizeStockInputs) ?? {}) : {};

  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    features: withManualListing(form.features, form.manualMode),
    priceTry: sale ?? price,
    compareAtPriceTry: sale !== null ? price : null,
    sizes,
    sizeStocks,
    stock: fashionFormStock(form),
    colors: form.colorsEnabled ? form.colors : [],
    category: form.category,
    images: form.images,
    marketplaceImages: alignMarketplaceSlots(form.images, form.marketplaceImages),
    lifestyleImages: cleanedLifestyleImages(form.lifestyleImages),
    catalogBackgroundId: form.catalogBackgroundId,
    status: fashionProductStatus(form),
  };
}

/** Fields that the AI and colour-group actions save on the server by themselves. */
export type FashionServerSavedFields = Partial<
  Pick<
    FashionProductFormState,
    "images" | "marketplaceImages" | "lifestyleImages" | "features"
  >
>;

/** Picks the given fields from a product the server just saved. */
export function fashionServerSavedFields(
  saved: TrProduct,
  keys: ReadonlyArray<keyof FashionServerSavedFields>,
): FashionServerSavedFields {
  const out: FashionServerSavedFields = {};
  for (const key of keys) {
    if (key === "images") out.images = saved.images;
    if (key === "marketplaceImages") out.marketplaceImages = saved.marketplaceImages ?? [];
    if (key === "lifestyleImages") out.lifestyleImages = saved.lifestyleImages ?? [];
    if (key === "features") out.features = saved.features ?? {};
  }
  return out;
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * An action (AI restyle, model photos, colour-group link) saved some fields on the
 * server while the form may hold unsaved edits. The saved values become the new
 * baseline for those fields; the form takes them too unless the owner has changed
 * that field since the baseline, in which case their edit is kept (and stays dirty).
 * `features` is merged key by key, so a restyle's new model id doesn't discard an
 * unsaved Özellikler edit and vice versa.
 */
export function rebaseFashionForm(
  state: { form: FashionProductFormState; baseline: FashionProductFormState },
  server: FashionServerSavedFields,
): { form: FashionProductFormState; baseline: FashionProductFormState } {
  const form = { ...state.form };
  const baseline = { ...state.baseline };

  for (const key of ["images", "marketplaceImages", "lifestyleImages"] as const) {
    const saved = server[key];
    if (saved === undefined) continue;
    if (same(state.form[key], state.baseline[key])) form[key] = saved;
    baseline[key] = saved;
  }

  if (server.features !== undefined) {
    const merged: TrProductFeatures = { ...server.features };
    const keys = new Set([
      ...Object.keys(state.form.features),
      ...Object.keys(state.baseline.features),
    ]) as Set<keyof TrProductFeatures>;
    for (const key of keys) {
      const edited = state.form.features[key];
      if (same(edited, state.baseline.features[key])) continue;
      if (edited === undefined) delete merged[key];
      else (merged as Record<string, unknown>)[key] = edited;
    }
    form.features = merged;
    baseline.features = server.features;
  }

  return { form, baseline };
}
