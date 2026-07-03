import type { MetadataRoute } from "next";
import { siteLegal } from "@/lib/siteLegal";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${siteLegal.siteUrl}/sitemap.xml`,
  };
}
