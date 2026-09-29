import {
  countCustomerCampaignUses,
  getCampaign,
  incrementCampaignUsage,
  listAutomaticCampaigns,
} from "@/lib/tr/catalog/discountCampaigns";
import {
  countCustomerCodeUses,
  findCampaignCodeByCode,
  incrementCampaignCodeUsage,
} from "@/lib/tr/catalog/discountCampaignCodes";
import {
  evaluateCodeRedemption,
  resolveAutomaticDiscount,
  type DiscountCartContext,
} from "@/lib/tr/discounts/campaignRules";
import { normalizeCode } from "@/lib/tr/discounts/codeRules";
import type {
  TrDiscountCampaign,
  TrDiscountCampaignCode,
} from "@/lib/tr/discounts/types";
import { getBoutiqueByIdAdmin } from "@/lib/tr/boutiques";
import { isCustomArtCatalogProfile } from "@/lib/tr/catalogProfiles";
import {
  isCustomerReferenceAssetUrl,
} from "@/lib/tr/customArt/referenceAssets";
import {
  isMadeToOrderProduct,
  resolveCustomArtPriceKurus,
} from "@/lib/tr/customArt/pricing";
import {
  listVariantsByProductIds,
  variantValueLabelOf,
} from "@/lib/tr/catalog/productVariants";
import { resolveProductSizes } from "@/lib/tr/productOptions";
import { listProductsByIdsAdmin } from "@/lib/tr/products";
import { isProductSizeSellable } from "@/lib/tr/sizeStocks";
import type { TrProductVariant } from "@/lib/tr/variants/types";
import { resolveVariantSale } from "@/lib/tr/variants/variantSale";
import type { TrOrderItemCustomization, TrProduct } from "@/types/tr-marketplace";

export type CheckoutClientItem = {
  productId: string;
  /** Client claim — verified against DB boutique_id. */
  boutiqueId: string;
  size?: string | null;
  /** A Gelişmiş ürün's variant; required for a product that has variants. */
  variantId?: string | null;
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
  /** The variant sold and its label ("Kırmızı / S"); null for a product without variants. */
  variantId: string | null;
  variantLabel: string | null;
  referenceImageUrl: string | null;
  customization: TrOrderItemCustomization | null;
};

export type ResolvedCheckout = {
  lines: ResolvedCheckoutLine[];
  subtotalKurus: number;
  discountCode: string | null;
  /** Combined total off: the redeemed code's discount plus every matching automatic campaign's. */
  discountKurus: number;
  totalKurus: number;
  /** The `kind: 'code'` campaign's code that was redeemed, if any. */
  appliedCode: TrDiscountCampaignCode | null;
  /** Automatic campaigns that applied (M1's stacking rule already picked these). */
  appliedCampaigns: TrDiscountCampaign[];
  /** A label for the discount, joined when more than one campaign/code applied. */
  discountTitle: string | null;
  /** A code or an automatic campaign was `discount_type: 'free_shipping'`. */
  freeShipping: boolean;
  /** When true, skip inventory decrement for all lines. */
  skipInventoryDecrement: boolean;
};

/** Drops any campaign the customer has already used up to its own per-customer limit. */
async function excludeCampaignsAtCustomerLimit(
  campaigns: readonly TrDiscountCampaign[],
  customerEmail: string | null,
): Promise<TrDiscountCampaign[]> {
  const email = customerEmail?.trim();
  const limited = campaigns.filter((campaign) => campaign.usageLimitPerCustomer !== null);
  if (!email || limited.length === 0) return [...campaigns];
  const overLimit = new Set<string>();
  for (const campaign of limited) {
    const uses = await countCustomerCampaignUses(campaign.id, email);
    if (uses >= campaign.usageLimitPerCustomer!) overLimit.add(campaign.id);
  }
  return campaigns.filter((campaign) => !overLimit.has(campaign.id));
}

function normalizeSize(size: string | null | undefined): string | null {
  const trimmed = size?.trim() ?? "";
  return trimmed || null;
}

function resolveLineFromProduct(
  product: TrProduct,
  item: CheckoutClientItem,
  options: {
    customArt: boolean;
    /** The product's variants (empty for a product without any). */
    variants: readonly TrProductVariant[];
    labelOf: (valueId: string) => string;
  },
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

  // A product with variants is sold by choosing one: its price and stock come from it.
  const variantSale = resolveVariantSale({
    productTitle: product.title,
    productPriceKurus: product.priceKurus,
    variants: options.variants,
    // Client input: anything but a string is treated as "no variant chosen".
    variantId: typeof item.variantId === "string" ? item.variantId : null,
    quantity,
    labelOf: options.labelOf,
  });
  if (variantSale.kind === "error") return { error: variantSale.error };
  if (variantSale.kind === "variant") {
    return {
      productId: product.id,
      boutiqueId: product.boutiqueId,
      title: product.title,
      priceKurus: variantSale.priceKurus,
      quantity,
      size: null,
      variantId: variantSale.variant.id,
      variantLabel: variantSale.label,
      referenceImageUrl: null,
      customization: null,
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
    variantId: null,
    variantLabel: null,
    referenceImageUrl: options.customArt ? referenceImageUrl : null,
    customization,
  };
}

/**
 * Re-load products from DB; ignore client title/price.
 * Optional `expectedBoutiqueId` rejects any foreign boutique lines.
 */
export async function resolveCheckoutFromCatalog(input: {
  items: CheckoutClientItem[];
  expectedBoutiqueId?: string | null;
  discountCode?: string | null;
  /** For an automatic campaign's Müşteri başına kullanım limiti. */
  customerEmail?: string | null;
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

  // Only Gelişmiş products can have variants, so the others cost no extra query.
  const variantsByProduct = await listVariantsByProductIds(
    products
      .filter((product) => product.productType === "advanced")
      .map((product) => product.id),
  );
  const labelers = new Map<string, (valueId: string) => string>();
  async function labelerFor(boutiqueId: string) {
    let labelOf = labelers.get(boutiqueId);
    if (!labelOf) {
      labelOf = await variantValueLabelOf(boutiqueId);
      labelers.set(boutiqueId, labelOf);
    }
    return labelOf;
  }

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
    const variants = variantsByProduct.get(product.id) ?? [];
    const resolved = resolveLineFromProduct(product, item, {
      customArt,
      variants,
      labelOf:
        variants.length > 0
          ? await labelerFor(product.boutiqueId)
          : (valueId) => valueId,
    });
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

  const cart: DiscountCartContext = {
    lines: lines.map((line) => {
      const product = byId.get(line.productId);
      return {
        productId: line.productId,
        priceKurus: line.priceKurus,
        quantity: line.quantity,
        onSale: Boolean(
          product?.compareAtPriceKurus != null &&
            product.compareAtPriceKurus > product.priceKurus,
        ),
      };
    }),
  };

  const checkoutBoutiqueId = lines[0]?.boutiqueId;

  // A typed discount code: a `kind: 'code'` campaign's own Kuponlar.
  const codeRaw = input.discountCode?.trim() ?? "";
  let appliedCode: TrDiscountCampaignCode | null = null;
  let codeCampaignTitle: string | null = null;
  let codeDiscountKurus = 0;
  let codeFreeShipping = false;

  if (codeRaw) {
    if (!checkoutBoutiqueId) {
      return { ok: false, error: "Sepet boş.", status: 400 };
    }
    const codeRow = await findCampaignCodeByCode(
      checkoutBoutiqueId,
      normalizeCode(codeRaw),
    );
    const codeCampaign = codeRow ? await getCampaign(codeRow.campaignId) : null;
    if (!codeRow || !codeCampaign) {
      return { ok: false, error: "Kupon kodu geçersiz.", status: 400 };
    }
    const priorUses = input.customerEmail
      ? await countCustomerCodeUses(codeRow.code, input.customerEmail)
      : 0;
    const redemption = evaluateCodeRedemption({
      campaign: codeCampaign,
      code: codeRow,
      cart,
      customerPriorUses: priorUses,
    });
    if (!redemption.ok) {
      return { ok: false, error: redemption.error, status: 400 };
    }
    appliedCode = codeRow;
    codeCampaignTitle = codeCampaign.title;
    codeDiscountKurus = redemption.discountKurus;
    codeFreeShipping = redemption.freeShipping;
  }

  // Automatic campaigns: apply themselves, no code needed.
  let appliedCampaigns: TrDiscountCampaign[] = [];
  let campaignDiscountKurus = 0;
  let automaticFreeShipping = false;
  if (checkoutBoutiqueId) {
    const automatic = await listAutomaticCampaigns(checkoutBoutiqueId);
    if (automatic.length > 0) {
      const eligible = await excludeCampaignsAtCustomerLimit(
        automatic,
        input.customerEmail ?? null,
      );
      const resolved = resolveAutomaticDiscount(eligible, cart);
      appliedCampaigns = resolved.campaigns;
      campaignDiscountKurus = resolved.discountKurus;
      automaticFreeShipping = resolved.freeShipping;
    }
  }

  const totalDiscountKurus = Math.min(
    subtotalKurus,
    campaignDiscountKurus + codeDiscountKurus,
  );
  const discountTitles = [
    ...appliedCampaigns.map((campaign) => campaign.title),
    ...(codeCampaignTitle ? [codeCampaignTitle] : []),
  ];
  const discountTitle = discountTitles.length > 0 ? discountTitles.join(", ") : null;

  const skipInventoryDecrement = products.every((product) =>
    isMadeToOrderProduct(product.features),
  );

  return {
    ok: true,
    checkout: {
      lines,
      subtotalKurus,
      discountCode: appliedCode?.code ?? null,
      discountKurus: totalDiscountKurus,
      totalKurus: Math.max(0, subtotalKurus - totalDiscountKurus),
      appliedCode,
      appliedCampaigns,
      discountTitle,
      freeShipping: automaticFreeShipping || codeFreeShipping,
      skipInventoryDecrement,
    },
  };
}

/** Burns one use of a redeemed code's own Toplam kullanım limiti. */
export async function recordCodeUsageIfNeeded(
  appliedCode: TrDiscountCampaignCode | null,
): Promise<void> {
  if (!appliedCode) return;
  await incrementCampaignCodeUsage(appliedCode.id);
}

/** Burns one use of each applied automatic campaign's Toplam kullanım limiti. */
export async function recordCampaignUsageIfNeeded(
  appliedCampaigns: readonly TrDiscountCampaign[],
): Promise<void> {
  for (const campaign of appliedCampaigns) {
    await incrementCampaignUsage(campaign.id);
  }
}
