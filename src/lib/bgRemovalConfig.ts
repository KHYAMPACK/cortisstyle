export type BgRemovalProvider = "local" | "photoroom";

/** Default `local` — Photoroom kept behind `BG_REMOVAL_PROVIDER=photoroom` */
export function getBgRemovalProvider(): BgRemovalProvider {
  const raw = process.env.BG_REMOVAL_PROVIDER?.trim().toLowerCase();
  if (raw === "photoroom") return "photoroom";
  return "local";
}
