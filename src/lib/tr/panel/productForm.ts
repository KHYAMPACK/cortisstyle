import {
  isValidStock,
  isValidTryPrice,
  kurusToPriceInput,
  parseTryPrice,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import type {
  TrOwnerProductPatch,
  TrOwnerProductPayload,
} from "@/lib/tr/panel/ownerClient";
import {
  EMPTY_SEO_FORM,
  isValidCanonicalPath,
  seoFromForm,
  seoToForm,
  type TrSeoFormValue,
} from "@/lib/tr/seo/seoFields";
import { isValidSlug } from "@/lib/tr/seo/slug";
import { parseDecimalInput, readProductDetailsBody } from "@/lib/tr/productDetails";
import { plainTextToRichHtml } from "@/lib/tr/richText";
import { EMPTY_PRODUCT_VARIANTS, type TrProductVariants } from "@/lib/tr/variants/types";
import {
  EMPTY_VARIANTS_FORM,
  validateVariantsForm,
  variantsBody,
  variantsFormFromProduct,
  variantsTotalStock,
  type VariantsFormState,
} from "@/lib/tr/variants/variantForm";
import type { TrProductCategories } from "@/lib/tr/categories/types";
import { shopperGalleryUrls } from "@/lib/tr/catalog/productImages";
import { isManualListing, withManualListing } from "@/lib/tr/catalog/productFeatures";
import {
  BUILT_IN_SIZE_SOURCES,
  detectSizeSourceId,
  findSizeSource,
  NO_SIZE_SOURCE,
  type TrSizeSource,
} from "@/lib/tr/sizeSources";
import {
  sizesInStockInputs,
  stockInputsForProductSizes,
  type SizeStockInputs,
} from "@/lib/tr/sizeStockInputs";
import { parseSizeStockInputs, sumSizeStocks } from "@/lib/tr/sizeStocks";
import type {
  TrFulfillmentType,
  TrProduct,
  TrProductFeatures,
  TrProductPrivate,
  TrProductStatus,
  TrUnitType,
} from "@/types/tr-marketplace";

/**
 * Form state of the product editor (every product, create and edit), kept as the
 * strings the owner typed. The editor and its tests share this so the rules live in
 * one place.
 *
 * Stock: a product with variants sells per variant; any other product uses the size
 * table (sizes with a stock each, or "Beden yok" and one stock count). Products keep
 * their sizes on `tr_products.sizes` until they move to variants (F6).
 *
 * Photos: a plain ordered list. A product whose shop photos were made by the parked AI
 * pipeline keeps showing them (`generatedGallery`) until the owner turns them into a
 * plain list ("Fotoğrafları düzenle").
 *
 * Prices follow the storefront's model: `priceTry` is the normal price
 * ("Satış fiyatı"); if `salePriceTry` is set it is what the customer pays and the
 * normal price is shown struck through.
 */
export interface ProductFormState {
  /** Gelişmiş = Basit + variants. */
  productType: "simple" | "advanced";
  /** The product's kind (Ürün türü); decides the Özellikler fields. */
  kindId: string | null;
  /** The kind as saved, so an unchanged kind isn't sent. */
  savedKindId: string | null;
  /**
   * Every `features` value, built-in and the store's own fields alike, plus the
   * platform's own entries (colour group, takım parts…), which are kept as they are.
   */
  features: TrProductFeatures;
  /** The size table's source (a Beden type id, `letter` / `numeric`) or `none`. */
  sizeChart: string;
  /** Size → typed stock, for the size table. */
  sizeStockInputs: SizeStockInputs;
  /**
   * The shop's current AI-made gallery, shown read-only; `null` = plain photo list
   * (`images`). Becomes `null` when the owner chooses "Fotoğrafları düzenle".
   */
  generatedGallery: string[] | null;
  /** The owner turned an AI-made gallery into a plain list (saved with Kaydet). */
  galleryConverted: boolean;
  /** The Varyant card's rows (Gelişmiş only; empty = sells at product level). */
  variants: VariantsFormState;
  title: string;
  fulfillmentType: TrFulfillmentType;
  priceTry: string;
  salePriceTry: string;
  costPriceTry: string;
  /** Only the owner's choice: sold-out is derived from stock. */
  hidden: boolean;
  stock: string;
  images: string[];
  /** Slug and the SEO card's fields. */
  seo: TrSeoFormValue;
  /** Açıklama as the editor's HTML (`""` when empty); the server sanitizes it. */
  descriptionHtml: string;
  brand: string;
  tags: string[];
  googleCategory: string;
  /** Owner-only, like `costPriceTry`. */
  supplier: string;
  sku: string;
  barcode: string;
  desi: string;
  /** Owner-only. */
  hsCode: string;
  continueSelling: boolean;
  unitPriceEnabled: boolean;
  unitAmount: string;
  unitType: TrUnitType;
  /**
   * The product's categories when the boutique manages its own; `null` when it uses
   * the built-in tree (nothing is sent, nothing is shown).
   */
  categories: TrProductCategories | null;
}

export function emptyProductForm(
  categories: TrProductCategories | null = null,
  productType: "simple" | "advanced" = "simple",
  start: { kindId?: string | null; sizeChart?: string } = {},
): ProductFormState {
  return {
    productType,
    kindId: start.kindId ?? null,
    savedKindId: null,
    features: {},
    sizeChart: start.sizeChart ?? NO_SIZE_SOURCE,
    sizeStockInputs: {},
    generatedGallery: null,
    galleryConverted: false,
    variants: EMPTY_VARIANTS_FORM,
    title: "",
    fulfillmentType: "physical",
    priceTry: "",
    salePriceTry: "",
    costPriceTry: "",
    hidden: false,
    stock: "1",
    images: [],
    seo: { ...EMPTY_SEO_FORM },
    descriptionHtml: "",
    brand: "",
    tags: [],
    googleCategory: "",
    supplier: "",
    sku: "",
    barcode: "",
    desi: "",
    hsCode: "",
    continueSelling: false,
    unitPriceEnabled: false,
    unitAmount: "",
    unitType: "kg",
    categories,
  };
}

export function productFormFromProduct(
  product: TrProduct,
  ownerOnly: TrProductPrivate,
  categories: TrProductCategories | null = null,
  variants: TrProductVariants = EMPTY_PRODUCT_VARIANTS,
  sizeSources: readonly TrSizeSource[] = BUILT_IN_SIZE_SOURCES,
): ProductFormState {
  const onSale =
    typeof product.compareAtPriceKurus === "number" &&
    product.compareAtPriceKurus > product.priceKurus;
  const sizes = product.sizes ?? [];
  const sizeChart = detectSizeSourceId(sizeSources, sizes);
  const generated =
    !isManualListing(product) &&
    ((product.marketplaceImages ?? []).some((url) => url?.trim()) ||
      (product.lifestyleImages ?? []).some((url) => url?.trim()));
  return {
    productType: product.productType === "advanced" ? "advanced" : "simple",
    kindId: product.kindId ?? null,
    savedKindId: product.kindId ?? null,
    features: product.features ?? {},
    sizeChart,
    sizeStockInputs:
      sizeChart === NO_SIZE_SOURCE
        ? {}
        : stockInputsForProductSizes(sizes, product.sizeStocks ?? {}),
    generatedGallery: generated
      ? shopperGalleryUrls({
          images: product.images,
          marketplaceImages: product.marketplaceImages ?? [],
          lifestyleImages: product.lifestyleImages ?? [],
          features: product.features ?? {},
        })
      : null,
    galleryConverted: false,
    variants: variantsFormFromProduct(variants),
    title: product.title,
    fulfillmentType: product.fulfillmentType ?? "physical",
    priceTry: kurusToPriceInput(
      onSale ? product.compareAtPriceKurus! : product.priceKurus,
    ),
    salePriceTry: onSale ? kurusToPriceInput(product.priceKurus) : "",
    costPriceTry:
      ownerOnly.costPriceKurus != null
        ? kurusToPriceInput(ownerOnly.costPriceKurus)
        : "",
    hidden: product.status === "hidden",
    stock: String(product.stock),
    images: product.images,
    seo: seoToForm(product.slug, product.seo),
    descriptionHtml:
      product.descriptionHtml ?? plainTextToRichHtml(product.description),
    brand: product.brand ?? "",
    tags: product.tags ?? [],
    googleCategory: product.googleCategory ?? "",
    supplier: ownerOnly.supplier ?? "",
    sku: product.sku ?? "",
    barcode: product.barcode ?? "",
    desi: product.desi != null ? String(product.desi) : "",
    hsCode: ownerOnly.hsCode ?? "",
    continueSelling: product.continueSelling ?? false,
    unitPriceEnabled: product.unitPrice?.enabled ?? false,
    unitAmount:
      product.unitPrice?.amount != null ? String(product.unitPrice.amount) : "",
    unitType: product.unitPrice?.type ?? "kg",
    categories,
  };
}

/** The detail fields as the API body carries them (also what the validation reads). */
function detailFields(form: ProductFormState) {
  return {
    descriptionHtml: form.descriptionHtml || null,
    brand: form.brand,
    tags: form.tags,
    googleCategory: form.googleCategory,
    sku: form.sku,
    barcode: form.barcode,
    desi: parseDecimalInput(form.desi),
    continueSelling: form.continueSelling,
    unitPrice: {
      enabled: form.unitPriceEnabled,
      amount: parseDecimalInput(form.unitAmount),
      type: form.unitType,
    },
    supplier: form.supplier,
    hsCode: form.hsCode,
  };
}

/** First problem in the form as a sentence for the owner, or null when it can be saved. */
export function validateProductForm(
  form: ProductFormState,
  options: { requireSlug?: boolean } = {},
): string | null {
  if (!form.title.trim()) return "Ürün adı zorunlu.";
  if (!isValidTryPrice(form.priceTry)) {
    return `Satış fiyatı ${TR_OWNER_PRODUCT_LIMITS.priceMinTry}–${TR_OWNER_PRODUCT_LIMITS.priceMaxTry} TL arasında olmalı.`;
  }
  if (form.salePriceTry.trim()) {
    if (!isValidTryPrice(form.salePriceTry)) {
      return "Geçerli bir indirimli fiyat girin.";
    }
    if (parseTryPrice(form.salePriceTry)! >= parseTryPrice(form.priceTry)!) {
      return "İndirimli fiyat, satış fiyatından düşük olmalı.";
    }
  }
  if (form.costPriceTry.trim()) {
    const cost = parseTryPrice(form.costPriceTry);
    if (
      cost === null ||
      cost <= 0 ||
      cost > TR_OWNER_PRODUCT_LIMITS.priceMaxTry
    ) {
      return "Alış fiyatı geçersiz.";
    }
  }
  // With variants the stock is the sum of theirs; otherwise the size table's.
  if (form.variants.rows.length === 0) {
    const sizes = formSizes(form);
    if (form.sizeChart !== NO_SIZE_SOURCE && sizes.length === 0) {
      return "En az bir beden ekleyin ya da “Beden yok” seçin.";
    }
    if (sizes.length > 0) {
      if (!parseSizeStockInputs(sizes, form.sizeStockInputs)) {
        return `Her beden için stok ${TR_OWNER_PRODUCT_LIMITS.stockMin}–${TR_OWNER_PRODUCT_LIMITS.stockMax} arası olmalı.`;
      }
    } else if (!isValidStock(form.stock)) {
      return `Stok ${TR_OWNER_PRODUCT_LIMITS.stockMin}–${TR_OWNER_PRODUCT_LIMITS.stockMax} arası bir sayı olmalı.`;
    }
  }
  if (form.productType === "advanced") {
    const variantsProblem = validateVariantsForm(form.variants);
    if (variantsProblem) return variantsProblem;
  }
  if (form.generatedGallery === null && form.images.filter((url) => url.trim()).length === 0) {
    return "En az bir fotoğraf ekleyin.";
  }
  const slug = form.seo.slug.replace(/-+$/, "");
  if (slug ? !isValidSlug(slug) : options.requireSlug) {
    return slug
      ? "Slug yalnızca küçük harf, rakam ve tek tire içermeli."
      : "Slug boş olamaz.";
  }
  if (form.seo.canonical && !isValidCanonicalPath(`/${form.seo.canonical}`)) {
    return "Canonical URL geçersiz.";
  }
  // The API's own rules for the detail fields (lengths, formats, unit price).
  try {
    readProductDetailsBody(detailFields(form));
  } catch (problem) {
    return problem instanceof Error ? problem.message : "Ürün ayrıntıları geçersiz.";
  }
  return null;
}

export function productStatus(
  form: ProductFormState,
): TrProductStatus {
  if (form.hidden) return "hidden";
  return effectiveStock(form) > 0 ? "available" : "sold";
}

/** The sizes the size table will save, in the source's order (none for "Beden yok"). */
export function formSizes(
  form: ProductFormState,
  sizeSources: readonly TrSizeSource[] = [],
): string[] {
  if (form.sizeChart === NO_SIZE_SOURCE) return [];
  return sizesInStockInputs(form.sizeStockInputs, findSizeSource(sizeSources, form.sizeChart));
}

/**
 * The product's stock: the active variants' total, the sizes' total, or its own field.
 * Call after `validateProductForm`; an unreadable size map counts as 0.
 */
export function effectiveStock(form: ProductFormState): number {
  if (form.variants.rows.length > 0) return variantsTotalStock(form.variants);
  const sizes = formSizes(form);
  if (sizes.length > 0) {
    const parsed = parseSizeStockInputs(sizes, form.sizeStockInputs);
    return parsed ? sumSizeStocks(parsed) : 0;
  }
  return Number.parseInt(form.stock, 10);
}

/** Sizes and their stock for the API; nothing for a product sold per variant. */
function sizeFields(form: ProductFormState, sizeSources: readonly TrSizeSource[]) {
  if (form.variants.rows.length > 0) return {};
  // Saved in the size source's order (XS, S, M… as the Beden type lists them).
  const sizes = formSizes(form, sizeSources);
  return {
    sizes,
    sizeStocks:
      sizes.length > 0 ? (parseSizeStockInputs(sizes, form.sizeStockInputs) ?? {}) : {},
  };
}

/**
 * Photos for the API: the plain list, and when an AI-made gallery was just turned into
 * one, empty generated slots so the shop shows the list. Nothing while the AI-made
 * gallery is still shown as it is.
 */
function photoFields(form: ProductFormState) {
  if (form.generatedGallery !== null) return {};
  const images = form.images.map((url) => url.trim()).filter(Boolean);
  return form.galleryConverted
    ? { images, marketplaceImages: [], lifestyleImages: [] }
    : { images };
}

/** `features` as saved: the converted gallery marks the photos as the owner's own. */
function featuresField(form: ProductFormState): TrProductFeatures {
  return form.galleryConverted ? withManualListing(form.features, true) : form.features;
}

/**
 * The API payload. Call `validateProductForm` first. `costPriceTry` is always
 * sent (`null` clears it) so an edit can remove a cost.
 */
export function productPayload(
  form: ProductFormState,
  boutiqueId: string,
  sizeSources: readonly TrSizeSource[] = [],
): TrOwnerProductPayload {
  const price = parseTryPrice(form.priceTry)!;
  const sale = form.salePriceTry.trim()
    ? parseTryPrice(form.salePriceTry)!
    : null;
  const cost = form.costPriceTry.trim()
    ? parseTryPrice(form.costPriceTry)!
    : null;

  return {
    boutiqueId,
    productType: form.productType,
    title: form.title.trim(),
    fulfillmentType: form.fulfillmentType,
    priceTry: sale ?? price,
    compareAtPriceTry: sale !== null ? price : null,
    costPriceTry: cost,
    stock: effectiveStock(form),
    status: productStatus(form),
    images: form.images.map((url) => url.trim()).filter(Boolean),
    sizes: [],
    ...sizeFields(form, sizeSources),
    colors: [],
    category: null,
    features: featuresField(form),
    ...(form.kindId ? { kindId: form.kindId } : {}),
    // Empty = the server derives it from the title.
    slug: form.seo.slug.replace(/-+$/, "") || undefined,
    seo: seoFromForm(form.seo),
    ...detailFields(form),
    ...(form.productType === "advanced" ? { variants: variantsBody(form.variants) } : {}),
    ...(form.categories ? { categories: form.categories } : {}),
  };
}

/**
 * PATCH body for an existing product: only the fields this editor owns, so saving
 * never touches things it doesn't show (colours, the AI-made gallery while it is kept,
 * the category column, which the categories set).
 */
export function productPatch(
  form: ProductFormState,
  sizeSources: readonly TrSizeSource[] = [],
): TrOwnerProductPatch {
  const {
    title,
    fulfillmentType,
    priceTry,
    compareAtPriceTry,
    costPriceTry,
    stock,
    status,
    seo,
    categories,
    variants,
  } = productPayload(form, "");
  return {
    title,
    fulfillmentType,
    priceTry,
    compareAtPriceTry,
    costPriceTry,
    stock,
    status,
    ...photoFields(form),
    ...sizeFields(form, sizeSources),
    features: featuresField(form),
    // Only a changed kind is sent (a database without the kinds patch still saves).
    ...(form.kindId !== form.savedKindId ? { kindId: form.kindId } : {}),
    seo,
    ...detailFields(form),
    ...(variants ? { variants } : {}),
    // An emptied slug clears it; the old address then redirects to the id URL.
    slug: form.seo.slug.replace(/-+$/, "") || null,
    ...(categories ? { categories } : {}),
  };
}
