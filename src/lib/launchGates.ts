import { WARDROBE_COMING_SOON_PATH } from "@/lib/wardrobeGate";

export const HOMEPAGE_LOOK_LIMIT = 3;

export const CHECKOUT_COMING_SOON_PATH = "/checkout-coming-soon";

/** When true, purchase actions route to checkout coming-soon + intent tracking. */
export function isPurchaseGateEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PURCHASE_GATE_ENABLED !== "false";
}

export function getCheckoutComingSoonPath(lookId: string): string {
  return `${CHECKOUT_COMING_SOON_PATH}?look=${encodeURIComponent(lookId)}`;
}

const DARK_GATE_PATHS = [
  WARDROBE_COMING_SOON_PATH,
  CHECKOUT_COMING_SOON_PATH,
] as const;

export function isDarkGatePath(pathname: string): boolean {
  return DARK_GATE_PATHS.some((path) => pathname.startsWith(path));
}
