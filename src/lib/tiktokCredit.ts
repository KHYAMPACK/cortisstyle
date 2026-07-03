/** Default Cortisstyle TikTok — used when a look has no per-look handle. */
export const DEFAULT_TIKTOK_HANDLE = "cortisstyl";

export function resolveTikTokHandle(handle: string | undefined): string {
  const trimmed = handle?.trim().replace(/^@/, "");
  return trimmed || DEFAULT_TIKTOK_HANDLE;
}

export function tikTokProfileUrl(handle: string): string {
  return `https://www.tiktok.com/@${resolveTikTokHandle(handle)}`;
}
