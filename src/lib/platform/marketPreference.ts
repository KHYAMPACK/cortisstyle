/** Paths under the Turkey product surface (`/tr`, `/tr/...`). */
export function isTrMarketPath(pathname: string): boolean {
  return pathname === "/tr" || pathname.startsWith("/tr/");
}
