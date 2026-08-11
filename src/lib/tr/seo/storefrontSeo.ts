/**
 * Host-aware storefront SEO helpers for robots.txt / sitemap.xml
 * and boutique Search Console properties (custom domain vs platform).
 */

import { headers } from "next/headers";
import { siteLegal } from "@/lib/siteLegal";
import {
  getBoutiqueDomainMap,
  normalizeBoutiqueHost,
  resolveBoutiqueSlugFromHost,
} from "@/lib/tr/customDomain";
import { TR_LEGAL_DOC_IDS } from "@/lib/tr/legal/docs";
import {
  trBoutiqueLegalPath,
  trBoutiquePath,
  trBoutiqueProductPath,
  trBoutiqueProductsPath,
  trHomePath,
} from "@/lib/tr/paths";

export type SeoHostContext =
  | {
      kind: "boutique";
      origin: string;
      host: string;
      boutiqueSlug: string;
    }
  | {
      kind: "platform";
      origin: string;
      host: string;
    };

function requestProtocol(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded === "http" || forwarded === "https") return forwarded;
  return "https";
}

function requestHost(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-host")?.split(",")[0]?.trim();
  const raw = forwarded || headerList.get("host") || "";
  return normalizeBoutiqueHost(raw);
}

/** Absolute origin for the current request (custom domain or platform). */
export async function resolveSeoHostContext(): Promise<SeoHostContext> {
  const headerList = await headers();
  const host = requestHost(headerList);
  const protocol = requestProtocol(headerList);
  const boutiqueSlug = host ? resolveBoutiqueSlugFromHost(host) : null;

  if (host && boutiqueSlug) {
    return {
      kind: "boutique",
      host,
      boutiqueSlug,
      origin: `${protocol}://${host}`,
    };
  }

  const platformHost = normalizeBoutiqueHost(
    new URL(siteLegal.siteUrl).host,
  );
  return {
    kind: "platform",
    host: host || platformHost,
    origin: host ? `${protocol}://${host}` : siteLegal.siteUrl,
  };
}

/** Preferred public https origin for a boutique (www first). */
export function preferredBoutiqueOrigin(slug: string): string | null {
  const key = slug.trim().toLowerCase();
  const hosts = Object.entries(getBoutiqueDomainMap())
    .filter(([, mapped]) => mapped === key)
    .map(([host]) => host);
  if (hosts.length === 0) return null;
  const www = hosts.find((h) => h.startsWith("www."));
  return `https://${www ?? hosts[0]!}`;
}

export function absoluteUrl(origin: string, path: string): string {
  const base = origin.replace(/\/$/, "");
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Customer-facing path for a boutique URL.
 * On custom domains strip `/tr/{slug}`; on platform keep full `/tr/{slug}/…`.
 */
export function boutiqueCustomerPath(
  boutiqueSlug: string,
  platformPath: string,
  mode: "boutique-domain" | "platform",
): string {
  if (mode === "platform") return platformPath;
  const prefix = trBoutiquePath(boutiqueSlug);
  if (platformPath === prefix) return "/";
  if (platformPath.startsWith(`${prefix}/`)) {
    return platformPath.slice(prefix.length) || "/";
  }
  return platformPath;
}

export function boutiqueStaticPlatformPaths(boutiqueSlug: string): string[] {
  return [
    trBoutiquePath(boutiqueSlug),
    trBoutiqueProductsPath(boutiqueSlug),
    ...TR_LEGAL_DOC_IDS.map((doc) => trBoutiqueLegalPath(boutiqueSlug, doc)),
  ];
}

export function boutiqueProductPlatformPath(
  boutiqueSlug: string,
  productId: string,
): string {
  return trBoutiqueProductPath(boutiqueSlug, productId);
}

/** Paths search engines should not index (cart, auth, panel, APIs). */
export const SEO_DISALLOW_PATHS = [
  "/api/",
  "/auth/",
  "/studio",
  "/tr/panel",
  "/tr/*/sepet",
  "/tr/*/odeme",
  "/tr/*/giris",
  "/tr/*/hesap",
  "/tr/*/favoriler",
  "/tr/*/siparis-onay",
  "/sepet",
  "/odeme",
  "/giris",
  "/hesap",
  "/favoriler",
  "/siparis-onay",
] as const;

export function platformMarketingPaths(): Array<{
  path: string;
  changeFrequency: "weekly" | "monthly" | "daily";
  priority: number;
}> {
  return [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "/wardrobe", changeFrequency: "weekly", priority: 0.8 },
    { path: "/privacy", changeFrequency: "monthly", priority: 0.4 },
    { path: "/terms", changeFrequency: "monthly", priority: 0.4 },
    { path: "/affiliate-disclosure", changeFrequency: "monthly", priority: 0.4 },
    { path: "/about", changeFrequency: "monthly", priority: 0.5 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
    { path: trHomePath(), changeFrequency: "daily", priority: 0.9 },
  ];
}
