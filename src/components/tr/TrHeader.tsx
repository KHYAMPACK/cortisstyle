import { TrFloatingChrome } from "@/components/tr/TrFloatingChrome";
import { isTrMarketplaceCartEnabled } from "@/lib/tr/platform";

/** Marketplace chrome entry — Zara-style floating controls, no header bar. */
export async function TrHeader() {
  const cartEnabled = await isTrMarketplaceCartEnabled();
  return <TrFloatingChrome cartEnabled={cartEnabled} />;
}
