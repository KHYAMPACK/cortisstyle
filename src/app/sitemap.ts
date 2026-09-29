import type { MetadataRoute } from "next";
import { getPublicBoutiqueBySlug, listPublicBoutiques } from "@/lib/tr/boutiques";
import { listPublicProductsByBoutiqueId } from "@/lib/tr/products";
import { listProductSlugInfo } from "@/lib/tr/catalog/productSlug";
import {
  getBoutiqueCategoryMode,
  listCategories,
} from "@/lib/tr/catalog/categories";
import { trBoutiqueCategoryPath } from "@/lib/tr/paths";
import { storesDomainFromEnv } from "@/lib/tr/customDomain";
import { canonicalStoreHost } from "@/lib/tr/seo/storeAddress";
import {
  absoluteUrl,
  boutiqueCustomerPath,
  boutiqueProductPlatformPath,
  boutiqueStaticPlatformPaths,
  platformMarketingPaths,
  resolveSeoHostContext,
} from "@/lib/tr/seo/storefrontSeo";

/** Host-aware sitemap. Custom domains must passthrough `/sitemap.xml` (see customDomain.ts). */

async function boutiqueSitemapEntries(input: {
  boutiqueSlug: string;
  origin: string;
  mode: "boutique-domain" | "platform";
  lastModified: Date;
}): Promise<MetadataRoute.Sitemap> {
  const { boutiqueSlug, origin, mode, lastModified } = input;
  const entries: MetadataRoute.Sitemap = [];

  for (const platformPath of boutiqueStaticPlatformPaths(boutiqueSlug)) {
    const path = boutiqueCustomerPath(boutiqueSlug, platformPath, mode);
    entries.push({
      url: absoluteUrl(origin, path),
      lastModified,
      changeFrequency: path.includes("/yasal/") ? "monthly" : "weekly",
      priority: path === "/" || platformPath.endsWith(`/${boutiqueSlug}`) ? 1 : 0.8,
    });
  }

  try {
    const boutique = await getPublicBoutiqueBySlug(boutiqueSlug);
    if (!boutique) return entries;

    const products = await listPublicProductsByBoutiqueId(
      boutique.id,
      boutique,
    );
    // Category pages of a boutique with its own categories (none until the patch is applied).
    if ((await getBoutiqueCategoryMode(boutique.id)) === "custom") {
      for (const category of await listCategories(boutique.id)) {
        if (category.seo.noindex) continue;
        const path = boutiqueCustomerPath(
          boutiqueSlug,
          trBoutiqueCategoryPath(boutiqueSlug, category.slug),
          mode,
        );
        entries.push({
          url: absoluteUrl(origin, path),
          lastModified: category.updatedAt
            ? new Date(category.updatedAt)
            : lastModified,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }

    // Slug and noindex per product (empty until the SEO patch is applied).
    const slugInfo = await listProductSlugInfo(boutique.id);
    for (const product of products) {
      if (product.status !== "available") continue;
      const info = slugInfo.get(product.id);
      if (info?.noindex) continue;
      const platformPath = boutiqueProductPlatformPath(
        boutiqueSlug,
        info?.slug ?? product.id,
      );
      const path = boutiqueCustomerPath(boutiqueSlug, platformPath, mode);
      entries.push({
        url: absoluteUrl(origin, path),
        lastModified: product.updatedAt
          ? new Date(product.updatedAt)
          : lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (error) {
    console.warn(
      "[sitemap] boutique products skipped:",
      boutiqueSlug,
      error instanceof Error ? error.message : error,
    );
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ctx = await resolveSeoHostContext();
  const lastModified = new Date();

  if (ctx.kind === "boutique") {
    return boutiqueSitemapEntries({
      boutiqueSlug: ctx.boutiqueSlug,
      origin: ctx.origin,
      mode: "boutique-domain",
      lastModified,
    });
  }

  const entries: MetadataRoute.Sitemap = platformMarketingPaths().map(
    ({ path, changeFrequency, priority }) => ({
      url: absoluteUrl(ctx.origin, path || "/"),
      lastModified,
      changeFrequency,
      priority,
    }),
  );

  try {
    const storesDomain = storesDomainFromEnv();
    const boutiques = await listPublicBoutiques();
    for (const boutique of boutiques) {
      // A boutique with its own canonical host (a custom domain, or its default
      // subdomain once TR_STORES_DOMAIN is set) is only ever listed on ITS OWN
      // sitemap — matching ikas, which never cross-lists a merchant store from its
      // own marketing-site sitemap (verified live, 2026-09-29).
      const hasOwnHost = canonicalStoreHost({
        slug: boutique.slug,
        customDomain: boutique.customDomain,
        storesDomain,
      });
      if (hasOwnHost) continue;

      const boutiqueEntries = await boutiqueSitemapEntries({
        boutiqueSlug: boutique.slug,
        origin: ctx.origin,
        mode: "platform",
        lastModified,
      });
      entries.push(...boutiqueEntries);
    }
  } catch (error) {
    console.warn(
      "[sitemap] boutique list skipped:",
      error instanceof Error ? error.message : error,
    );
  }

  return entries;
}
