import { buildContentPackFormats } from "@/lib/tr/contentPacks/aspects";
import { buildContentPackCaption } from "@/lib/tr/contentPacks/captions";
import { buildContentPackDeepLink } from "@/lib/tr/contentPacks/deepLink";
import type {
  BuildTrContentPackPayloadInput,
  CreateTrContentPackInput,
} from "@/lib/tr/contentPacks/types";
import { formatTryFromKurus } from "@/types/tr-marketplace";

/** Pure builder — caption, deep link, formats from product + variant URLs. */
export function buildContentPackPayload(
  input: BuildTrContentPackPayloadInput,
): CreateTrContentPackInput {
  const variantImageUrls = input.variantImageUrls
    .map((url) => url.trim())
    .filter(Boolean);

  const deepLink = buildContentPackDeepLink({
    boutiqueSlug: input.boutiqueSlug,
    productId: input.productId,
    campaign: input.campaignKey ?? input.boutiqueSlug,
    content: input.productId,
  });

  const caption = buildContentPackCaption({
    title: input.productTitle,
    boutiqueName: input.boutiqueName,
    priceLabel: formatTryFromKurus(input.priceKurus),
    deepLink,
    category: input.category,
  });

  const formats = buildContentPackFormats(variantImageUrls);
  const hasAssets = variantImageUrls.length > 0;
  const status =
    input.status ??
    (hasAssets ? "ready" : "failed");

  return {
    boutiqueId: input.boutiqueId,
    productId: input.productId,
    status,
    variantImageUrls,
    formats,
    caption,
    deepLink,
    usedAiLifestyle: input.usedAiLifestyle && hasAssets,
    error:
      input.error ??
      (hasAssets
        ? null
        : "İçerik paketi için görsel bulunamadı. Önce ürün kesiti yükleyin."),
  };
}
