/**
 * Host-aware storefront SEO helpers for robots.txt / sitemap.xml
 * and boutique Search Console properties (custom domain vs platform).
 */

import { headers } from "next/headers";
import { BOUTIQUE_SLUG_HEADER } from "@/lib/introLoader";
import { siteLegal } from "@/lib/siteLegal";
import { normalizeBoutiqueHost } from "@/lib/tr/customDomain";
import { TR_LEGAL_DOC_IDS } from "@/lib/tr/legal/docs";
import {
  trBoutiqueLegalPath,
  trBoutiquePath,
  trBoutiqueProductPath,
  trBoutiqueProductsPath,
  trHomePath,
  trKombinlerPath,
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
  const boutiqueSlug = headerList.get(BOUTIQUE_SLUG_HEADER)?.trim() || null;

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
  "/tr/panel",
  "/tr/*/sepet",
  "/tr/*/odeme",
  "/tr/*/giris",
  "/tr/*/hesap",
  "/tr/*/adresler",
  "/tr/*/favoriler",
  "/tr/*/siparis-onay",
  "/tr/*/siparisler",
  "/sepet",
  "/odeme",
  "/giris",
  "/hesap",
  "/adresler",
  "/favoriler",
  "/siparis-onay",
  "/siparisler",
] as const;

export function platformMarketingPaths(): Array<{
  path: string;
  changeFrequency: "weekly" | "monthly" | "daily";
  priority: number;
}> {
  return [
    { path: trHomePath(), changeFrequency: "daily", priority: 1 },
    { path: trKombinlerPath(), changeFrequency: "daily", priority: 0.8 },
    { path: "/privacy", changeFrequency: "monthly", priority: 0.4 },
    { path: "/terms", changeFrequency: "monthly", priority: 0.4 },
  ];
}
