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
import type {
  TrFulfillmentType,
  TrProduct,
  TrProductPrivate,
  TrProductStatus,
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
}

export function emptySimpleProductForm(): SimpleProductFormState {
  return {
    title: "",
    fulfillmentType: "physical",
    priceTry: "",
    salePriceTry: "",
    costPriceTry: "",
    hidden: false,
    stock: "1",
    images: [],
  };
}

function kurusToInput(kurus: number): string {
  const lira = kurus / 100;
  return Number.isInteger(lira) ? String(lira) : lira.toFixed(2);
}

export function simpleFormFromProduct(
  product: TrProduct,
  ownerOnly: TrProductPrivate,
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
  };
}

/** First problem in the form as a sentence for the owner, or null when it can be saved. */
export function validateSimpleProductForm(
  form: SimpleProductFormState,
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
  };
}
