import { foldForSearch } from "@/lib/tr/panel/searchFold";
import { orderDraftReference, type TrOrderDraft } from "@/lib/tr/orders/orderDraft";

/**
 * The Taslaklar list: searching and sorting saved drafts. Pure.
 */

export type DraftSortKey = "reference" | "date" | "total";
export type DraftSortDirection = "asc" | "desc";

/** Every word of `query` must appear in the draft's code, customer name or note. */
export function filterDrafts(
  drafts: readonly TrOrderDraft[],
  query: string,
): TrOrderDraft[] {
  const words = foldForSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...drafts];
  return drafts.filter((draft) => {
    const haystack = foldForSearch(
      `${orderDraftReference(draft.id)} ${draft.customerName ?? ""} ${draft.order.customerNote}`,
    );
    return words.every((word) => haystack.includes(word));
  });
}

/** A new array: by code, by when it was last changed, or by total. Ties keep the newest first. */
export function sortDrafts(
  drafts: readonly TrOrderDraft[],
  key: DraftSortKey,
  direction: DraftSortDirection,
): TrOrderDraft[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...drafts].sort((a, b) => {
    let order = 0;
    if (key === "reference") {
      order = orderDraftReference(a.id).localeCompare(orderDraftReference(b.id));
    } else if (key === "total") {
      order = a.totalKurus - b.totalKurus;
    } else {
      order = a.updatedAt.localeCompare(b.updatedAt);
    }
    if (order !== 0) return order * sign;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}
