import type { MetadataRoute } from "next";
import { siteLegal } from "@/lib/siteLegal";

const PUBLIC_ROUTES = [
  { path: "", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/wardrobe", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.4 },
  { path: "/terms", changeFrequency: "monthly" as const, priority: 0.4 },
  { path: "/affiliate-disclosure", changeFrequency: "monthly" as const, priority: 0.4 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${siteLegal.siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
