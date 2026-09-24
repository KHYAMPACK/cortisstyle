import {
  isValidStock,
  isValidTryPrice,
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
import type { TrProductCategories } from "@/lib/tr/categories/types";
import type {
  TrFulfillmentType,
  TrProduct,
  TrProductPrivate,
  TrProductStatus,
  TrUnitType,
} from "@/types/tr-marketplace";

/**
 * Form state of the Basit ürün editor, kept as the strings the owner typed. The
 * editor and its tests share this so the price rules live in one place.
 *
 * Prices follow the storefront's model: `priceTry` is the normal price
 * ("Satış fiyatı"); if `salePriceTry` is set it is what the customer pays and the
 * normal price is shown struck through.
 */
export interface SimpleProductFormState {
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

export function emptySimpleProductForm(
  categories: TrProductCategories | null = null,
): SimpleProductFormState {
  return {
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

function kurusToInput(kurus: number): string {
  const lira = kurus / 100;
  return Number.isInteger(lira) ? String(lira) : lira.toFixed(2);
}

export function simpleFormFromProduct(
  product: TrProduct,
  ownerOnly: TrProductPrivate,
  categories: TrProductCategories | null = null,
): SimpleProductFormState {
  const onSale =
    typeof product.compareAtPriceKurus === "number" &&
    product.compareAtPriceKurus > product.priceKurus;
  return {
    title: product.title,
    fulfillmentType: product.fulfillmentType ?? "physical",
    priceTry: kurusToInput(
      onSale ? product.compareAtPriceKurus! : product.priceKurus,
    ),
    salePriceTry: onSale ? kurusToInput(product.priceKurus) : "",
    costPriceTry:
      ownerOnly.costPriceKurus != null
        ? kurusToInput(ownerOnly.costPriceKurus)
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
function detailFields(form: SimpleProductFormState) {
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
export function validateSimpleProductForm(
  form: SimpleProductFormState,
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
  if (!isValidStock(form.stock)) {
    return `Stok ${TR_OWNER_PRODUCT_LIMITS.stockMin}–${TR_OWNER_PRODUCT_LIMITS.stockMax} arası bir sayı olmalı.`;
  }
  if (form.images.filter((url) => url.trim()).length === 0) {
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

export function simpleProductStatus(
  form: SimpleProductFormState,
): TrProductStatus {
  if (form.hidden) return "hidden";
  return Number.parseInt(form.stock, 10) > 0 ? "available" : "sold";
}

/**
 * The API payload. Call `validateSimpleProductForm` first. `costPriceTry` is always
 * sent (`null` clears it) so an edit can remove a cost.
 */
export function simpleProductPayload(
  form: SimpleProductFormState,
  boutiqueId: string,
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
    productType: "simple",
    title: form.title.trim(),
    fulfillmentType: form.fulfillmentType,
    priceTry: sale ?? price,
    compareAtPriceTry: sale !== null ? price : null,
    costPriceTry: cost,
    stock: Number.parseInt(form.stock, 10),
    status: simpleProductStatus(form),
    images: form.images.map((url) => url.trim()).filter(Boolean),
    sizes: [],
    colors: [],
    category: null,
    // Empty = the server derives it from the title.
    slug: form.seo.slug.replace(/-+$/, "") || undefined,
    seo: seoFromForm(form.seo),
    ...detailFields(form),
    ...(form.categories ? { categories: form.categories } : {}),
  };
}

/**
 * PATCH body for an existing product: only the fields this editor owns, so saving
 * never touches things it doesn't show (category, features, variants later).
 */
export function simpleProductPatch(
  form: SimpleProductFormState,
): TrOwnerProductPatch {
  const {
    title,
    fulfillmentType,
    priceTry,
    compareAtPriceTry,
    costPriceTry,
    stock,
    status,
    images,
    seo,
    categories,
  } = simpleProductPayload(form, "");
  return {
    title,
    fulfillmentType,
    priceTry,
    compareAtPriceTry,
    costPriceTry,
    stock,
    status,
    images,
    seo,
    ...detailFields(form),
    // An emptied slug clears it; the old address then redirects to the id URL.
    slug: form.seo.slug.replace(/-+$/, "") || null,
    ...(categories ? { categories } : {}),
  };
}
