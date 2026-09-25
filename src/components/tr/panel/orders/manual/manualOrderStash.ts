import {
  readManualOrderDraft,
  type ManualOrderDraft,
} from "@/lib/tr/orders/manualOrder";

/**
 * A half-built order kept in this tab while the owner adds a customer on another page
 * and comes back. `sessionStorage` is per tab and gone when it closes; anything that
 * fails (private window, blocked storage) just means the order isn't carried over.
 */

const KEY = "tr-panel-manual-order-stash";

interface Stash {
  pathname: string;
  boutiqueId: string;
  order: ManualOrderDraft;
}

export function saveManualOrderStash(stash: Stash): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(stash));
  } catch {
    /* the order is simply not carried over */
  }
}

/**
 * The stashed order for this editor page and boutique, removed as it is read. A stash
 * left by another page, another boutique or a corrupt value is ignored.
 */
export function takeManualOrderStash(
  pathname: string,
  boutiqueId: string,
): ManualOrderDraft | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Stash>;
    if (parsed.pathname !== pathname || parsed.boutiqueId !== boutiqueId) return null;
    window.sessionStorage.removeItem(KEY);
    const read = readManualOrderDraft(parsed.order);
    return read.ok ? read.draft : null;
  } catch {
    return null;
  }
}
