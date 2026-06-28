import { WARDROBE_COMING_SOON_PATH } from "@/lib/wardrobeGate";
import { looks } from "@/data/looks";
import type { Look } from "@/types/look";

/** Free wardrobe tier: max saved outfit blueprints in archive. */
export const FREE_TIER_SAVED_OUTFIT_LIMIT = 3;

export const FREE_TIER_ARCHIVE_LIMIT_MESSAGE =
  "FREE TIER LIMIT REACHED // UPGRADE TO UNLOCK UNLIMITED ARCHIVE SLOTS";

export function isArchiveLimitStatus(
  status: string | null | undefined,
): boolean {
  return status === "free-tier-limit";
}

/** First N looks visible on the public homepage stream. */
export const HOMEPAGE_PUBLIC_LOOK_COUNT = 7;

/** First N visible looks are fully interactive (indices 0..N-1). */
export const HOMEPAGE_FREE_LOOK_COUNT = 6;

export function getPublicHomepageLooks(): Look[] {
  return looks.slice(0, HOMEPAGE_PUBLIC_LOOK_COUNT);
}

export function isHomepageLookLocked(streamIndex: number): boolean {
  return streamIndex >= HOMEPAGE_FREE_LOOK_COUNT;
}

export function getHomepageLookStreamIndex(lookId: string): number {
  return looks.findIndex((look) => look.id === lookId);
}

export function isUnlockedArchiveLook(lookId: string): boolean {
  const index = getHomepageLookStreamIndex(lookId);
  if (index < 0) return false;
  return !isHomepageLookLocked(index);
}

export const CHECKOUT_COMING_SOON_PATH = "/checkout-coming-soon";

export const NOTIFY_DEPLOY_PATH = "/notify";

export const MAINTENANCE_PATH = "/maintenance";

/** When true, all routes redirect to the maintenance gate except static assets. */
export function isMaintenanceModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
}

export function isMaintenancePath(pathname: string): boolean {
  return pathname === MAINTENANCE_PATH;
}

/** When true, sign-up is disabled and profile routes to /notify. */
export function isAuthGateEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_GATE_ENABLED === "true";
}

export function getNotifyDeployPath(): string {
  return NOTIFY_DEPLOY_PATH;
}

const DARK_GATE_PATHS = [
  WARDROBE_COMING_SOON_PATH,
  CHECKOUT_COMING_SOON_PATH,
  NOTIFY_DEPLOY_PATH,
  MAINTENANCE_PATH,
] as const;

export function isDarkGatePath(pathname: string): boolean {
  return DARK_GATE_PATHS.some((path) => pathname.startsWith(path));
}
