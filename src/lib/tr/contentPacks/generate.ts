import { generateBoutiqueAiModelImage } from "@/lib/tr/aiModel/generate";
import type { TrAiModelPose } from "@/lib/tr/aiModel/types";
import { getBoutiqueByIdAdmin } from "@/lib/tr/boutiques";
import { buildContentPackPayload } from "@/lib/tr/contentPacks/buildPack";
import { createContentPackAdmin } from "@/lib/tr/contentPacks/persist";
import type { TrContentPack } from "@/lib/tr/contentPacks/types";
import {
  getBoutiqueProductImages,
  hasRealMarketplaceImagery,
} from "@/lib/tr/productImages";
import {
  getProductByIdAdmin,
  updateProductAdmin,
} from "@/lib/tr/products";

/** Poses to attempt for a pack — keep small for foundation latency. */
const PACK_POSES: TrAiModelPose[] = [
  "standing-front",
  "standing-three-quarter",
  "full-body",
];

export type GenerateContentPackResult = {
  pack: TrContentPack;
  /** Human-readable note when AI lifestyle was skipped. */
  warning?: string;
};

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    const trimmed = url.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/**
 * Product cutout → optional AI lifestyle variants → content pack + lifestyleImages.
 * Falls back to marketplace cutouts when AI is stub / not configured so packs still ship.
 */
export async function generateContentPackForProduct(input: {
  boutiqueId: string;
  productId: string;
  /** Required for FASHN re-host into tr-assets. */
  userId?: string;
}): Promise<GenerateContentPackResult> {
  const boutique = await getBoutiqueByIdAdmin(input.boutiqueId);
  if (!boutique) {
    throw new Error("Butik bulunamadı.");
  }

  const product = await getProductByIdAdmin(input.productId);
  if (!product) {
    throw new Error("Ürün bulunamadı.");
  }
  if (product.boutiqueId !== boutique.id) {
    throw new Error("Ürün bu butiğe ait değil.");
  }

  const cutoutCandidates = product.marketplaceImages
    .map((url) => url.trim())
    .filter(Boolean);
  const cutoutImageUrl = cutoutCandidates[0] ?? null;

  if (!cutoutImageUrl || !hasRealMarketplaceImagery(product)) {
    const payload = buildContentPackPayload({
      boutiqueId: boutique.id,
      productId: product.id,
      boutiqueSlug: boutique.slug,
      boutiqueName: boutique.name,
      productTitle: product.title,
      priceKurus: product.priceKurus,
      category: product.category,
      variantImageUrls: [],
      usedAiLifestyle: false,
      status: "failed",
      error:
        "Bu üründe katalog kesiti yok. Ürünler’den fotoğraf yükleyip arka plan temizliği tamamlayın.",
    });
    const pack = await createContentPackAdmin(payload);
    return { pack, warning: pack.error ?? undefined };
  }

  const originalImageUrl = getBoutiqueProductImages(product)[0];
  const aiUrls: string[] = [];
  let aiWarning: string | undefined;
  const userId = input.userId?.trim();

  for (const pose of PACK_POSES) {
    const result = await generateBoutiqueAiModelImage({
      boutiqueSlug: boutique.slug,
      boutiqueId: boutique.id,
      userId,
      garment: {
        productId: product.id,
        title: product.title,
        cutoutImageUrl,
        originalImageUrl,
        category: product.category,
      },
      pose,
    });

    if (result.status === "succeeded" && result.imageUrl?.trim()) {
      aiUrls.push(result.imageUrl.trim());
      continue;
    }

    if (!aiWarning) {
      aiWarning =
        result.error ??
        "AI model görseli üretilemedi; katalog kesiti ile paket oluşturuldu.";
    }
  }

  const usedAiLifestyle = aiUrls.length > 0;
  const fallbackUrls = cutoutCandidates.slice(0, 3);
  const variantImageUrls = uniqueUrls(
    usedAiLifestyle ? aiUrls : fallbackUrls,
  );

  if (usedAiLifestyle) {
    const mergedLifestyle = uniqueUrls([
      ...product.lifestyleImages,
      ...aiUrls,
    ]);
    await updateProductAdmin(product.id, {
      lifestyleImages: mergedLifestyle,
    });
  }

  const payload = buildContentPackPayload({
    boutiqueId: boutique.id,
    productId: product.id,
    boutiqueSlug: boutique.slug,
    boutiqueName: boutique.name,
    productTitle: product.title,
    priceKurus: product.priceKurus,
    category: product.category,
    variantImageUrls,
    usedAiLifestyle,
    campaignKey: boutique.slug,
    status: variantImageUrls.length > 0 ? "ready" : "failed",
    error:
      variantImageUrls.length > 0
        ? null
        : "İçerik paketi için görsel üretilemedi.",
  });

  const pack = await createContentPackAdmin(payload);
  return {
    pack,
    warning: usedAiLifestyle ? undefined : aiWarning,
  };
}
