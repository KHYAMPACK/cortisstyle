"use client";

import { useEffect } from "react";
import { removeBoutiqueCheckedOutCartLines } from "@/lib/tr/checkoutSelection";
import {
  clearIyzicoCheckoutHold,
  isBackForwardNavigation,
  loadIyzicoCheckoutHold,
  releaseIyzicoCheckoutHold,
} from "@/lib/tr/payments/iyzicoCheckoutHold";

/**
 * iyzico hold / cart side-effects:
 * - checkout: browser-back from iyzico releases the unpaid stock hold; cart stays
 * - unpaid confirmation: same if they return without paying
 * - paid: drop checked-out lines only after SUCCESS (and only if this tab still
 *   has a hold — don't wipe a later cart on a revisited confirmation link)
 */
export function TrIyzicoCheckoutHoldEffects({
  boutiqueSlug,
  phase,
}: {
  boutiqueSlug: string;
  phase: "checkout" | "paid" | "unpaid";
}) {
  useEffect(() => {
    if (phase === "paid") {
      if (loadIyzicoCheckoutHold(boutiqueSlug)) {
        removeBoutiqueCheckedOutCartLines(boutiqueSlug);
        clearIyzicoCheckoutHold(boutiqueSlug);
      }
      return;
    }

    const release = () => {
      void releaseIyzicoCheckoutHold(boutiqueSlug).then((result) => {
        if (result === "paid") {
          removeBoutiqueCheckedOutCartLines(boutiqueSlug);
        }
      });
    };

    if (phase === "unpaid" || isBackForwardNavigation()) {
      release();
    }

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted || isBackForwardNavigation()) {
        release();
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [boutiqueSlug, phase]);

  return null;
}
