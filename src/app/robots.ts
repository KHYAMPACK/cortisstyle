import type { MetadataRoute } from "next";
import {
  resolveSeoHostContext,
  SEO_DISALLOW_PATHS,
} from "@/lib/tr/seo/storefrontSeo";

/** Host-aware robots.txt. Custom domains must passthrough `/robots.txt` (see customDomain.ts). */

export default async function robots(): Promise<MetadataRoute.Robots> {
  const ctx = await resolveSeoHostContext();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...SEO_DISALLOW_PATHS],
      },
    ],
    sitemap: `${ctx.origin}/sitemap.xml`,
    host: ctx.origin,
  };
}
