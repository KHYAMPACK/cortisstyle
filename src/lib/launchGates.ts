import { WARDROBE_COMING_SOON_PATH } from "@/lib/wardrobeGate";

export const HOMEPAGE_LOOK_LIMIT = 5;

export const CHECKOUT_COMING_SOON_PATH = "/checkout-coming-soon";

export const NOTIFY_DEPLOY_PATH = "/notify";

/** When true, sign-up is disabled and profile routes to /notify. */
export function isAuthGateEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_GATE_ENABLED !== "false";
}

export function getNotifyDeployPath(): string {
  return NOTIFY_DEPLOY_PATH;
}

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
  NOTIFY_DEPLOY_PATH,
] as const;

export function isDarkGatePath(pathname: string): boolean {
  return DARK_GATE_PATHS.some((path) => pathname.startsWith(path));
}
