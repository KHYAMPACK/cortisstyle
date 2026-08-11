import type { MetadataRoute } from "next";
import { getPublicBoutiqueBySlug, listPublicBoutiques } from "@/lib/tr/boutiques";
import { listPublicProductsByBoutiqueId } from "@/lib/tr/products";
import {
  absoluteUrl,
  boutiqueCustomerPath,
  boutiqueProductPlatformPath,
  boutiqueStaticPlatformPaths,
  platformMarketingPaths,
  resolveSeoHostContext,
} from "@/lib/tr/seo/storefrontSeo";

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
    for (const product of products) {
      if (product.status !== "available") continue;
      const platformPath = boutiqueProductPlatformPath(
        boutiqueSlug,
        product.id,
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
    const boutiques = await listPublicBoutiques();
    for (const boutique of boutiques) {
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
