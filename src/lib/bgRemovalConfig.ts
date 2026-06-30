export type BgRemovalProvider = "local" | "photoroom";

/** Default `local` — Photoroom kept behind `BG_REMOVAL_PROVIDER=photoroom` */
export function getBgRemovalProvider(): BgRemovalProvider {
  const raw = process.env.BG_REMOVAL_PROVIDER?.trim().toLowerCase();
  if (raw === "photoroom") return "photoroom";
  return "local";
}

/** Writable model cache — Vercel only persists `/tmp` across warm invocations. */
export function getLocalBgRemovalCacheDir(): string | undefined {
  if (process.env.RMBG_CACHE_DIR?.trim()) {
    return process.env.RMBG_CACHE_DIR.trim();
  }

  if (process.env.VERCEL) {
    return "/tmp/rmbg-cache";
  }

  return undefined;
}
