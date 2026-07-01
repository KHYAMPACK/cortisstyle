import { getLooks } from "@/data/looks";
import type { Look } from "@/types/look";

/** Free wardrobe tier: max saved outfit blueprints in archive. */
export const FREE_TIER_SAVED_OUTFIT_LIMIT = 3;

export const FREE_TIER_ARCHIVE_LIMIT_MESSAGE =
  "FREE TIER LIMIT REACHED // UPGRADE TO UNLOCK UNLIMITED ARCHIVE SLOTS";

function hasShoppableItems(look: Look): boolean {
  return look.items.length > 0;
}

/** Looks with item metadata shown on the homepage grid. */
export function getPublicHomepageLooks(): Look[] {
  return getLooks().filter(hasShoppableItems);
}

export function isUnlockedArchiveLook(lookId: string): boolean {
  const look = getLooks().find((entry) => entry.id === lookId);
  return Boolean(look && hasShoppableItems(look));
}

export const MAINTENANCE_PATH = "/maintenance";

/** When true, all routes redirect to the maintenance gate except static assets. */
export function isMaintenanceModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
}

export function isMaintenancePath(pathname: string): boolean {
  return pathname === MAINTENANCE_PATH;
}
