import {
  ELBISE_DETAIL_SLOT,
  ELBISE_PACKSHOT_SLOT,
  constructionCatalogFamily,
  isConstructionCatalogCategory,
} from "@/lib/tr/catalog/garmentUploadTypes";
import { isManualListing } from "@/lib/tr/catalog/productFeatures";
import { isTakimCatalogProduct } from "@/lib/tr/catalog/takimUpload";
import {
  describeModelPackageCredits,
  TR_AI_CATALOG_CREDITS,
} from "@/lib/tr/aiCatalog/uploadCostHints";
import { chipsFromProductFeatures } from "@/lib/tr/aiModel/elbiseTryOn";
import { dressFeatureOptionId } from "@/lib/tr/catalog/dressFeatures";
import { withLifestyleModelsAll } from "@/lib/tr/catalog/productFeatures";
import { alignMarketplaceSlots } from "@/lib/tr/catalog/productImages";
import type { TrProduct, TrProductFeatures } from "@/types/tr-marketplace";

const ISTANBUL_YMD = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function istanbulCalendarDay(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return ISTANBUL_YMD.format(date);
}

export function isSameIstanbulDay(
  value: string | Date,
  now: Date = new Date(),
): boolean {
  const left = istanbulCalendarDay(value);
  return Boolean(left) && left === istanbulCalendarDay(now);
}

export function elbiseSourceUrls(product: Pick<TrProduct, "images">): {
  frontUrl: string;
  backUrl: string;
  detailUrl: string;
} {
  return {
    frontUrl: product.images[0]?.trim() || "",
    backUrl: product.images[1]?.trim() || "",
    detailUrl: product.images[ELBISE_DETAIL_SLOT]?.trim() || "",
  };
}

export function isElbiseRestyleCandidate(
  product: Pick<TrProduct, "category" | "images" | "features">,
): boolean {
  if (isTakimCatalogProduct(product)) return false;
  if (isManualListing(product)) return false;
  if (!isConstructionCatalogCategory(product.category)) return false;
  const { frontUrl, backUrl } = elbiseSourceUrls(product);
  return Boolean(frontUrl && backUrl);
}

export function applyElbisePipelineImages(input: {
  images: string[];
  marketplaceImages: string[];
  packshotUrl: string;
}): { images: string[]; marketplaceImages: string[] } {
  const packshot = input.packshotUrl.trim();
  const images = input.images.slice();
  while (images.length < ELBISE_PACKSHOT_SLOT) images.push("");
  images[ELBISE_PACKSHOT_SLOT] = packshot;

  const marketplace = alignMarketplaceSlots(images, input.marketplaceImages);
  while (marketplace.length <= ELBISE_PACKSHOT_SLOT) marketplace.push("");
  marketplace[0] = "";
  marketplace[1] = "";
  marketplace[2] = "";
  marketplace[ELBISE_PACKSHOT_SLOT] = packshot;

  return { images, marketplaceImages: marketplace };
}

export function mergeElbiseRestyleFeatures(
  current: TrProductFeatures | null | undefined,
  chips: {
    neckline: string;
    sleeves: string;
    fit?: string;
    length: string;
    decollete: string;
    rise?: string;
    hem?: string;
  },
  family?: "elbise" | "ust-giyim" | "alt-giyim" | null,
): TrProductFeatures {
  const next: TrProductFeatures = { ...(current ?? {}) };
  next.length = chips.length;
  if (chips.fit?.trim()) {
    next.fit = chips.fit.trim();
    delete next.silhouette;
  } else delete next.fit;
  if (family === "alt-giyim") {
    delete next.neckline;
    delete next.sleeves;
    delete next.decollete;
    if (chips.rise?.trim()) next.rise = chips.rise.trim();
    else delete next.rise;
    if (chips.hem?.trim()) next.neckHem = chips.hem.trim();
    else delete next.neckHem;
    return next;
  }
  next.neckline = chips.neckline;
  next.sleeves = chips.sleeves;
  delete next.rise;
  delete next.neckHem;
  const decolleteId = dressFeatureOptionId("decollete", chips.decollete);
  if (chips.decollete.trim() && decolleteId && decolleteId !== "yok") {
    next.decollete = chips.decollete.trim();
  } else delete next.decollete;
  return next;
}

export function featuresWithLifestyleModels(
  current: TrProductFeatures | null | undefined,
  modelId: string | null | undefined,
  shotCount: number,
): TrProductFeatures {
  return withLifestyleModelsAll(current, modelId?.trim() || "", shotCount);
}

export function estimateElbiseRestyleCredits(
  product: Pick<TrProduct, "features" | "images" | "category">,
  modelId: string | null,
): number {
  const { detailUrl } = elbiseSourceUrls(product);
  const family = constructionCatalogFamily(undefined, product.category);
  const modelCredits = describeModelPackageCredits(modelId, {
    uploadType: family ?? "elbise",
    features: chipsFromProductFeatures(product.features, family),
    detailImageUrl: detailUrl,
  });
  return TR_AI_CATALOG_CREDITS.productPackage + modelCredits;
}
