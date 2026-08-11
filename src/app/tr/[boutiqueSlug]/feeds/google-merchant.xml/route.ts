import { getPublicBoutiqueBySlug } from "@/lib/tr/boutiques";
import {
  buildGoogleMerchantFeedItems,
  renderGoogleMerchantRssXml,
} from "@/lib/tr/googleMerchant/feed";
import { listPublicProductsByBoutiqueId } from "@/lib/tr/products";
import {
  preferredBoutiqueOrigin,
  resolveSeoHostContext,
} from "@/lib/tr/seo/storefrontSeo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ boutiqueSlug: string }>;
}

/**
 * Google Merchant product feed (RSS 2.0).
 * Custom domain: /feeds/google-merchant.xml → rewritten to this path.
 * Platform: /tr/{slug}/feeds/google-merchant.xml
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { boutiqueSlug } = await params;
  const slug = boutiqueSlug.trim().toLowerCase();

  const boutique = await getPublicBoutiqueBySlug(slug);
  if (!boutique) {
    return new Response("Boutique not found", { status: 404 });
  }

  const products = await listPublicProductsByBoutiqueId(boutique.id, boutique);
  const ctx = await resolveSeoHostContext();
  const requestOrigin =
    preferredBoutiqueOrigin(boutique.slug) ?? ctx.origin;

  const items = buildGoogleMerchantFeedItems({
    boutique,
    products,
    requestOrigin,
  });

  const xml = renderGoogleMerchantRssXml({
    boutique,
    items,
    requestOrigin,
  });

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
