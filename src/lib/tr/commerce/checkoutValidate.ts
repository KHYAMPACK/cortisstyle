import {
  getDiscountCodeForBoutiqueAdmin,
  incrementDiscountCodeUsageAdmin,
} from "@/lib/tr/discountCodes";
import { getBoutiqueByIdAdmin } from "@/lib/tr/boutiques";
import { isCustomArtCatalogProfile } from "@/lib/tr/catalogProfiles";
import {
  isCustomerReferenceAssetUrl,
} from "@/lib/tr/customArt/referenceAssets";
import {
  isMadeToOrderProduct,
  resolveCustomArtPriceKurus,
} from "@/lib/tr/customArt/pricing";
import { resolveProductSizes } from "@/lib/tr/productOptions";
import { listProductsByIdsAdmin } from "@/lib/tr/products";
import { isProductSizeSellable } from "@/lib/tr/sizeStocks";
import type {
  TrDiscountCode,
  TrOrderItemCustomization,
  TrProduct,
} from "@/types/tr-marketplace";

export type CheckoutClientItem = {
  productId: string;
  /** Client claim — verified against DB boutique_id. */
  boutiqueId: string;
  size?: string | null;
  quantity?: number;
  referenceImageUrl?: string | null;
  styleOption?: string | null;
  referenceId?: string | null;
};

export type ResolvedCheckoutLine = {
  productId: string;
  boutiqueId: string;
  title: string;
  priceKurus: number;
  quantity: number;
  size: string | null;
  referenceImageUrl: string | null;
  customization: TrOrderItemCustomization | null;
};

export type ResolvedCheckout = {
  lines: ResolvedCheckoutLine[];
  subtotalKurus: number;
  discountCode: string | null;
  discountKurus: number;
  totalKurus: number;
  discountRow: TrDiscountCode | null;
  /** When true, skip inventory decrement for all lines. */
  skipInventoryDecrement: boolean;
};

function normalizeSize(size: string | null | undefined): string | null {
  const trimmed = size?.trim() ?? "";
  return trimmed || null;
}

function resolveLineFromProduct(
  product: TrProduct,
  item: CheckoutClientItem,
  options: { customArt: boolean },
): ResolvedCheckoutLine | { error: string } {
  const quantity = Math.max(1, Math.floor(item.quantity ?? 1));
  if (quantity !== 1) {
    return { error: "Bu vitrinde adet şu an 1 ile sınırlı." };
  }

  if (product.status !== "available") {
    return {
      error: `"${product.title}" satışta değil.`,
    };
  }

  if (product.boutiqueId !== item.boutiqueId) {
    return {
      error: `"${product.title}" bu butiğe ait değil.`,
    };
  }

  const sizes = resolveProductSizes(product);
  const size = normalizeSize(item.size);
  const madeToOrder = isMadeToOrderProduct(product.features);
  const referenceImageUrl = item.referenceImageUrl?.trim() || null;
  const styleOption = item.styleOption?.trim() || null;
  const referenceId = item.referenceId?.trim() || null;

  if (options.customArt) {
    if (!referenceImageUrl) {
      return { error: "Tablo için fotoğraf yükleyin." };
    }
    if (!isCustomerReferenceAssetUrl(referenceImageUrl, product.boutiqueId)) {
      return { error: "Geçersiz referans fotoğrafı." };
    }
    if (product.colors.length > 0 && !styleOption) {
      return { error: `"${product.title}" için stil seçin.` };
    }
    if (
      styleOption &&
      !product.colors.some(
        (color) =>
          color.name.toLocaleUpperCase("tr") ===
          styleOption.toLocaleUpperCase("tr"),
      )
    ) {
      return { error: `"${product.title}" için geçersiz stil.` };
    }
  }

  let resolvedSize: string | null = null;
  let priceKurus = product.priceKurus;

  if (sizes.length > 0) {
    if (!size) {
      return {
        error: options.customArt
          ? `"${product.title}" için boyut seçin.`
          : `"${product.title}" için beden seçin.`,
      };
    }
    const match = sizes.find(
      (entry) =>
        entry.toLocaleUpperCase("en") === size.toLocaleUpperCase("en"),
    );
    if (!match) {
      return {
        error: options.customArt
          ? `"${product.title}" için geçersiz boyut.`
          : `"${product.title}" için geçersiz beden.`,
      };
    }
    resolvedSize = match;

    if (options.customArt) {
      const customPrice = resolveCustomArtPriceKurus(product, match);
      if (customPrice == null || customPrice <= 0) {
        return { error: `"${product.title}" için fiyat tanımlı değil.` };
      }
      priceKurus = customPrice;
    }

    if (
      !madeToOrder &&
      !isProductSizeSellable({
        sizes,
        size: match,
        sizeStocks: product.sizeStocks,
        unitStock: product.stock,
      })
    ) {
      return { error: `"${product.title}" (${match}) stokta yok.` };
    }
  } else if (!madeToOrder && product.stock < quantity) {
    return { error: `"${product.title}" stokta yok.` };
  }

  const customization: TrOrderItemCustomization | null =
    options.customArt && (styleOption || referenceId)
      ? {
          styleOption,
          referenceId,
        }
      : null;

  return {
    productId: product.id,
    boutiqueId: product.boutiqueId,
    title: product.title,
    priceKurus,
    quantity,
    size: resolvedSize,
    referenceImageUrl: options.customArt ? referenceImageUrl : null,
    customization,
  };
}

export function computeDiscountKurus(
  subtotalKurus: number,
  discount: TrDiscountCode,
): number {
  if (subtotalKurus <= 0) return 0;
  if (discount.percentOff != null) {
    return Math.min(
      subtotalKurus,
      Math.floor((subtotalKurus * discount.percentOff) / 100),
    );
  }
  if (discount.amountOffKurus != null) {
    return Math.min(subtotalKurus, discount.amountOffKurus);
  }
  return 0;
}

/**
 * Re-load products from DB; ignore client title/price.
 * Optional `expectedBoutiqueId` rejects any foreign boutique lines.
 */
export async function resolveCheckoutFromCatalog(input: {
  items: CheckoutClientItem[];
  expectedBoutiqueId?: string | null;
  discountCode?: string | null;
}): Promise<
  | { ok: true; checkout: ResolvedCheckout }
  | { ok: false; error: string; status: number }
> {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: "Sepet boş.", status: 400 };
  }

  const products = await listProductsByIdsAdmin(
    input.items.map((item) => item.productId),
  );
  const byId = new Map(products.map((product) => [product.id, product]));

  const boutiqueProfileCache = new Map<string, boolean>();

  async function isCustomArtBoutique(boutiqueId: string): Promise<boolean> {
    if (boutiqueProfileCache.has(boutiqueId)) {
      return boutiqueProfileCache.get(boutiqueId)!;
    }
    const boutique = await getBoutiqueByIdAdmin(boutiqueId);
    const customArt = boutique ? isCustomArtCatalogProfile(boutique) : false;
    boutiqueProfileCache.set(boutiqueId, customArt);
    return customArt;
  }

  const lines: ResolvedCheckoutLine[] = [];
  for (const item of input.items) {
    const product = byId.get(item.productId.trim());
    if (!product) {
      return { ok: false, error: "Sepetteki ürün bulunamadı.", status: 400 };
    }
    if (
      input.expectedBoutiqueId &&
      product.boutiqueId !== input.expectedBoutiqueId
    ) {
      return {
        ok: false,
        error: "Sepette başka satıcıya ait ürün var.",
        status: 400,
      };
    }
    const customArt = await isCustomArtBoutique(product.boutiqueId);
    const resolved = resolveLineFromProduct(product, item, { customArt });
    if ("error" in resolved) {
      return { ok: false, error: resolved.error, status: 400 };
    }
    lines.push(resolved);
  }

  const boutiqueIds = new Set(lines.map((line) => line.boutiqueId));
  if (boutiqueIds.size > 1) {
    return {
      ok: false,
      error:
        "Çoklu satıcı ödeme henüz bu uç noktada desteklenmiyor. Marketplace sepetini kullanın.",
      status: 400,
    };
  }

  const subtotalKurus = lines.reduce(
    (sum, line) => sum + line.priceKurus * line.quantity,
    0,
  );

  const codeRaw = input.discountCode?.trim().toUpperCase() ?? "";
  let discountRow: TrDiscountCode | null = null;
  let discountKurus = 0;

  if (codeRaw) {
    const boutiqueId = lines[0]?.boutiqueId;
    if (!boutiqueId) {
      return { ok: false, error: "Sepet boş.", status: 400 };
    }
    discountRow = await getDiscountCodeForBoutiqueAdmin(boutiqueId, codeRaw);
    if (!discountRow || !discountRow.active) {
      return { ok: false, error: "Kupon kodu geçersiz.", status: 400 };
    }
    if (
      discountRow.usageLimit != null &&
      discountRow.usedCount >= discountRow.usageLimit
    ) {
      return { ok: false, error: "Kupon kullanım limiti doldu.", status: 400 };
    }
    discountKurus = computeDiscountKurus(subtotalKurus, discountRow);
  }

  const skipInventoryDecrement = products.every((product) =>
    isMadeToOrderProduct(product.features),
  );

  return {
    ok: true,
    checkout: {
      lines,
      subtotalKurus,
      discountCode: discountRow?.code ?? null,
      discountKurus,
      totalKurus: Math.max(0, subtotalKurus - discountKurus),
      discountRow,
      skipInventoryDecrement,
    },
  };
}

export async function recordDiscountUsageIfNeeded(
  discountRow: TrDiscountCode | null,
): Promise<void> {
  if (!discountRow) return;
  const ok = await incrementDiscountCodeUsageAdmin(discountRow.id);
  if (!ok) {
    throw new Error("Kupon kullanım limiti doldu.");
  }
}
