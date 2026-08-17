import { resolveBoutiqueFaviconFilePath } from "@/lib/tr/boutiqueBrand";

/** Well-known icon URLs Googlebot and browsers fetch on the host origin. */
export const BOUTIQUE_WELL_KNOWN_ICON_PATHS = new Set([
  "/favicon.ico",
  "/icon.png",
  "/apple-icon.png",
]);

const PLATFORM_FAVICON = "/brand/cortisstyle-favicon.png";

export function resolveHostFaviconPublicPath(slug: string | null): string {
  if (!slug) return PLATFORM_FAVICON;
  return resolveBoutiqueFaviconFilePath(slug) ?? PLATFORM_FAVICON;
}
