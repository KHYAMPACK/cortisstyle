/** Browser hold for an in-flight iyzico Checkout Form (not paid yet). */

export type IyzicoCheckoutHold = {
  orderId: string;
  confirmToken: string;
  /** Checkout Form token — used to retrieve if they hit back after paying. */
  checkoutToken?: string;
};

export type IyzicoHoldRelease = "none" | "paid" | "released";

const releasing = new Map<string, Promise<IyzicoHoldRelease>>();

function holdKey(slug: string): string {
  return `cortis-tr-iyzico-hold:${slug.trim().toLowerCase()}`;
}

export function saveIyzicoCheckoutHold(
  boutiqueSlug: string,
  hold: IyzicoCheckoutHold,
): void {
  if (typeof window === "undefined") return;
  const slug = boutiqueSlug.trim();
  if (!slug || !hold.orderId || !hold.confirmToken) return;
  try {
    sessionStorage.setItem(holdKey(slug), JSON.stringify(hold));
  } catch {
    // private mode / quota
  }
}

export function loadIyzicoCheckoutHold(
  boutiqueSlug: string,
): IyzicoCheckoutHold | null {
  if (typeof window === "undefined") return null;
  const slug = boutiqueSlug.trim();
  if (!slug) return null;
  try {
    const raw = sessionStorage.getItem(holdKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<IyzicoCheckoutHold>;
    const orderId = parsed.orderId?.trim() ?? "";
    const confirmToken = parsed.confirmToken?.trim() ?? "";
    const checkoutToken = parsed.checkoutToken?.trim() || undefined;
    if (!orderId || !confirmToken) return null;
    return { orderId, confirmToken, checkoutToken };
  } catch {
    return null;
  }
}

export function clearIyzicoCheckoutHold(boutiqueSlug: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(holdKey(boutiqueSlug.trim()));
  } catch {
    // ignore
  }
}

export function isBackForwardNavigation(): boolean {
  if (typeof performance === "undefined") return false;
  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return nav?.type === "back_forward";
}

export async function releaseIyzicoCheckoutHold(
  boutiqueSlug: string,
): Promise<IyzicoHoldRelease> {
  const hold = loadIyzicoCheckoutHold(boutiqueSlug);
  if (!hold) return "none";
  const gate = `${boutiqueSlug.trim().toLowerCase()}:${hold.orderId}`;
  const existing = releasing.get(gate);
  if (existing) return existing;

  const pending = (async (): Promise<IyzicoHoldRelease> => {
    try {
      const response = await fetch("/api/tr/checkout/iyzico/abandon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boutiqueSlug,
          orderId: hold.orderId,
          confirmToken: hold.confirmToken,
          checkoutToken: hold.checkoutToken,
        }),
        keepalive: true,
      });
      if (!response.ok) return "none";
      clearIyzicoCheckoutHold(boutiqueSlug);
      let paymentStatus = "";
      try {
        const data = (await response.json()) as { paymentStatus?: string };
        paymentStatus = data.paymentStatus?.trim() ?? "";
      } catch {
        // abandoned even if the body is empty
      }
      return paymentStatus === "paid" ? "paid" : "released";
    } catch {
      // Keep the hold so a retry / stale cleanup can still restore stock.
      return "none";
    } finally {
      releasing.delete(gate);
    }
  })();

  releasing.set(gate, pending);
  return pending;
}
