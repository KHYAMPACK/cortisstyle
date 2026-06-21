/** Public path shown while the wardrobe studio is in pre-launch. */
export const WARDROBE_COMING_SOON_PATH = "/wardrobe-coming-soon";

/** Full wardrobe app route (kept intact — gated via flag + middleware). */
export const WARDROBE_APP_PATH = "/wardrobe";

/**
 * When true, all wardrobe entry points route to the coming-soon gate.
 * Set `NEXT_PUBLIC_WARDROBE_GATE_ENABLED=false` in `.env.local` to unlock `/wardrobe` during development.
 */
export function isWardrobeGateEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WARDROBE_GATE_ENABLED !== "false";
}

export function getWardrobeEntryPath(): string {
  return isWardrobeGateEnabled()
    ? WARDROBE_COMING_SOON_PATH
    : WARDROBE_APP_PATH;
}

export function isWardrobeComingSoonPath(pathname: string): boolean {
  return pathname === WARDROBE_COMING_SOON_PATH;
}
