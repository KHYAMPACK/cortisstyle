import { TR_LOOK_DEFINITIONS } from "@/data/tr/looks/looks";
import { withLookbookPieceImages } from "@/lib/tr/lookbookImages";
import { getProductCoverImage, trKombinlerPath } from "@/lib/tr/paths";
import { listPublicAvailableProducts } from "@/lib/tr/products";
import type { TrLookDefinition, TrLookWithProducts } from "@/types/tr-look";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

export const TR_LOOKS_SECTION_ID = "kombinler";

/** First mosaic teaser count on Cadde home. */
export const TR_HOME_LOOK_TEASER_COUNT = 6;

/** Lookbook section anchor — home mosaic / strips jump to `/tr/kombinler#…`. */
export function caddeLookAnchorId(slug: string): string {
  return `kombin-${slug}`;
}

export function trKombinlerLookHref(slug: string): string {
  return `${trKombinlerPath()}#${caddeLookAnchorId(slug)}`;
}

function uniqueBoutiqueCount(products: TrProductWithBoutique[]): number {
  return new Set(products.map((p) => p.boutique.id)).size;
}

/**
 * Prefer unused products from boutiques not yet in the look, then any unused.
 */
function autoPickProducts(
  catalog: TrProductWithBoutique[],
  already: TrProductWithBoutique[],
  count: number,
): TrProductWithBoutique[] {
  if (count <= 0) return [];

  const usedIds = new Set(already.map((p) => p.id));
  const usedBoutiqueIds = new Set(already.map((p) => p.boutique.id));
  const available = catalog.filter(
    (p) => p.status === "available" && !usedIds.has(p.id),
  );

  const picked: TrProductWithBoutique[] = [];
  const take = (predicate: (p: TrProductWithBoutique) => boolean) => {
    for (const product of available) {
      if (picked.length >= count) break;
      if (usedIds.has(product.id)) continue;
      if (!predicate(product)) continue;
      picked.push(product);
      usedIds.add(product.id);
      usedBoutiqueIds.add(product.boutique.id);
    }
  };

  take((p) => !usedBoutiqueIds.has(p.boutique.id));
  take(() => true);

  return picked;
}

function hydrateLook(
  definition: TrLookDefinition,
  catalog: TrProductWithBoutique[],
): TrLookWithProducts | null {
  const byId = new Map(catalog.map((p) => [p.id, p]));

  const fromIds: TrProductWithBoutique[] = [];
  for (const id of definition.productIds) {
    const product = byId.get(id);
    if (product && product.status === "available") {
      fromIds.push(product);
    }
  }

  const need =
    definition.autoPickCount != null
      ? Math.max(0, definition.autoPickCount - fromIds.length)
      : 0;
  const auto = autoPickProducts(catalog, fromIds, need);
  const products = [...fromIds, ...auto].map((product) =>
    withLookbookPieceImages(product),
  );

  if (products.length === 0) return null;

  const coverImage =
    definition.coverImage?.trim() ||
    getProductCoverImage(products[0]!) ||
    null;

  return {
    id: definition.id,
    slug: definition.slug,
    title: definition.title,
    subtitle: definition.subtitle?.trim() || null,
    coverImage,
    sortOrder: definition.sortOrder,
    products,
    boutiqueCount: uniqueBoutiqueCount(products),
  };
}

export async function listPublishedTrLooks(): Promise<TrLookWithProducts[]> {
  const catalog = await listPublicAvailableProducts();
  const available = catalog.filter((p) => p.status === "available");

  // Empty live catalog → showable demo looks (silhouettes + logo’d boutiques)
  if (available.length === 0) {
    const { buildTrDemoLooks } = await import("@/lib/tr/looks/demoCatalog");
    return buildTrDemoLooks();
  }

  const looks: TrLookWithProducts[] = [];
  const usedAcrossLooks = new Set<string>();

  const published = [...TR_LOOK_DEFINITIONS]
    .filter((d) => d.status === "published")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  for (const definition of published) {
    const preferFresh = available.filter((p) => !usedAcrossLooks.has(p.id));
    const pool = preferFresh.length > 0 ? preferFresh : available;

    const look = hydrateLook(definition, [
      ...pool,
      ...available.filter((p) => definition.productIds.includes(p.id)),
    ]);

    if (!look) continue;

    for (const product of look.products) {
      usedAcrossLooks.add(product.id);
    }
    looks.push(look);
  }

  return looks;
}

export async function safeListPublishedTrLooks(): Promise<TrLookWithProducts[]> {
  try {
    return await listPublishedTrLooks();
  } catch (error) {
    console.error("Failed to load TR looks:", error);
    const { buildTrDemoLooks } = await import("@/lib/tr/looks/demoCatalog");
    return buildTrDemoLooks();
  }
}

export async function getPublishedTrLookBySlug(
  slug: string,
): Promise<TrLookWithProducts | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const looks = await listPublishedTrLooks();
  return looks.find((look) => look.slug.toLowerCase() === normalized) ?? null;
}

export async function safeGetPublishedTrLookBySlug(
  slug: string,
): Promise<TrLookWithProducts | null> {
  try {
    return await getPublishedTrLookBySlug(slug);
  } catch (error) {
    console.error(`Failed to load TR look (${slug}):`, error);
    try {
      const { buildTrDemoLooks } = await import("@/lib/tr/looks/demoCatalog");
      const normalized = slug.trim().toLowerCase();
      return (
        buildTrDemoLooks().find(
          (look) => look.slug.toLowerCase() === normalized,
        ) ?? null
      );
    } catch {
      return null;
    }
  }
}
