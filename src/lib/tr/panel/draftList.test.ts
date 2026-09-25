import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EMPTY_MANUAL_ORDER } from "@/lib/tr/orders/manualOrder";
import type { TrOrderDraft } from "@/lib/tr/orders/orderDraft";
import { filterDrafts, sortDrafts } from "@/lib/tr/panel/draftList";

function draft(id: string, over: Partial<TrOrderDraft> = {}): TrOrderDraft {
  return {
    id,
    boutiqueId: "b1",
    customerId: null,
    customerName: null,
    order: EMPTY_MANUAL_ORDER,
    totalKurus: 0,
    itemCount: 0,
    createdAt: "2026-09-25T10:00:00.000Z",
    updatedAt: "2026-09-25T10:00:00.000Z",
    ...over,
  };
}

const DRAFTS = [
  draft("aaaa1111-0000-4000-8000-000000000001", {
    customerName: "Ayşe Yılmaz",
    totalKurus: 30_000,
    updatedAt: "2026-09-25T09:00:00.000Z",
  }),
  draft("bbbb2222-0000-4000-8000-000000000002", {
    customerName: "Işıl İnan",
    totalKurus: 10_000,
    updatedAt: "2026-09-25T11:00:00.000Z",
    order: { ...EMPTY_MANUAL_ORDER, customerNote: "Hediye paketi lütfen" },
  }),
  draft("cccc3333-0000-4000-8000-000000000003", {
    totalKurus: 20_000,
    updatedAt: "2026-09-25T10:00:00.000Z",
  }),
];

describe("filterDrafts", () => {
  it("keeps everything for an empty search", () => {
    assert.equal(filterDrafts(DRAFTS, "").length, 3);
    assert.equal(filterDrafts(DRAFTS, "  ").length, 3);
  });

  it("finds by the draft's code, in any letter case", () => {
    assert.deepEqual(filterDrafts(DRAFTS, "aaaa1111").map((d) => d.id.slice(0, 4)), ["aaaa"]);
    assert.deepEqual(filterDrafts(DRAFTS, "CCCC3333").map((d) => d.id.slice(0, 4)), ["cccc"]);
  });

  it("finds by customer name, ignoring Turkish letter case", () => {
    assert.deepEqual(filterDrafts(DRAFTS, "IŞIL").map((d) => d.customerName), ["Işıl İnan"]);
    assert.deepEqual(filterDrafts(DRAFTS, "ayşe yılmaz").map((d) => d.customerName), ["Ayşe Yılmaz"]);
  });

  it("finds by the note", () => {
    assert.deepEqual(filterDrafts(DRAFTS, "hediye").map((d) => d.customerName), ["Işıl İnan"]);
  });

  it("needs every word to match", () => {
    assert.equal(filterDrafts(DRAFTS, "ayşe hediye").length, 0);
  });
});

describe("sortDrafts", () => {
  const ids = (list: TrOrderDraft[]) => list.map((d) => d.id.slice(0, 4));

  it("sorts by when it was last changed", () => {
    assert.deepEqual(ids(sortDrafts(DRAFTS, "date", "desc")), ["bbbb", "cccc", "aaaa"]);
    assert.deepEqual(ids(sortDrafts(DRAFTS, "date", "asc")), ["aaaa", "cccc", "bbbb"]);
  });

  it("sorts by total", () => {
    assert.deepEqual(ids(sortDrafts(DRAFTS, "total", "desc")), ["aaaa", "cccc", "bbbb"]);
    assert.deepEqual(ids(sortDrafts(DRAFTS, "total", "asc")), ["bbbb", "cccc", "aaaa"]);
  });

  it("sorts by code", () => {
    assert.deepEqual(ids(sortDrafts(DRAFTS, "reference", "asc")), ["aaaa", "bbbb", "cccc"]);
  });

  it("does not change the list it was given", () => {
    const before = ids(DRAFTS);
    sortDrafts(DRAFTS, "total", "asc");
    assert.deepEqual(ids(DRAFTS), before);
  });
});
