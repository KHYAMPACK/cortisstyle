import { getSiteUrl } from "@/lib/authRedirect";
import { trBoutiqueProductPath } from "@/lib/tr/paths";

export type BuildContentPackDeepLinkInput = {
  boutiqueSlug: string;
  productId: string;
  /** utm_campaign — boutique slug or pack id. */
  campaign?: string;
  /** utm_content — defaults to productId. */
  content?: string;
};

/** Absolute product PDP URL with Instagram content-pack UTMs. */
export function buildContentPackDeepLink(
  input: BuildContentPackDeepLinkInput,
): string {
  const path = trBoutiqueProductPath(
    input.boutiqueSlug.trim(),
    input.productId.trim(),
  );
  const url = new URL(`${getSiteUrl()}${path}`);
  url.searchParams.set("utm_source", "instagram");
  url.searchParams.set("utm_medium", "content_pack");
  url.searchParams.set(
    "utm_campaign",
    (input.campaign ?? input.boutiqueSlug).trim().toLowerCase() || "boutique",
  );
  url.searchParams.set(
    "utm_content",
    (input.content ?? input.productId).trim() || input.productId,
  );
  return url.toString();
}
