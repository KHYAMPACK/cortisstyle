import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  getCheckoutComingSoonPath,
  isPurchaseGateEnabled,
} from "@/lib/launchGates";

export { isPurchaseGateEnabled };

export function goToCheckoutGate(
  lookId: string,
  router: AppRouterInstance,
  onNavigate?: () => void,
): void {
  void fetch("/api/purchase-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lookId }),
    keepalive: true,
  }).catch(() => {
    // Non-blocking — checkout gate still opens.
  });

  onNavigate?.();
  router.push(getCheckoutComingSoonPath(lookId));
}
