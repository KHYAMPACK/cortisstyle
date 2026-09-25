import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CustomerStats } from "@/lib/tr/customers/customerModel";
import type { TrBoutiqueCustomer } from "@/types/tr-marketplace";
import {
  adjacentCustomers,
  customerFilterCount,
  filterCustomers,
  NO_CUSTOMER_FILTERS,
  sortCustomers,
  type CustomerListFilters,
  type CustomerRow,
} from "./customerList";

const at = (iso: string) => Date.parse(iso);
// Thursday 24 Sep 2026, 15:00 in Istanbul.
const NOW = at("2026-09-24T15:00:00+03:00");

function row(
  id: string,
  name: string,
  createdAt: string,
  orders = 0,
  spendKurus = 0,
  over: Record<string, unknown> = {},
): CustomerRow {
  const stats: CustomerStats = {
    orderCount: orders,
    spendKurus,
    averageOrderKurus: 0,
    itemsPerOrder: 0,
    lastOrderAt: null,
  };
  return {
    customer: {
      id,
      boutiqueId: "b1",
      name,
      email: `${id}@example.com`,
      phone: null,
      note: null,
      addresses: [],
      createdAt: new Date(at(createdAt)).toISOString(),
      updatedAt: new Date(at(createdAt)).toISOString(),
      ...over,
    } as TrBoutiqueCustomer,
    stats,
  };
}

const ROWS = [
  row("ayse", "Ayşe Yılmaz", "2026-09-24T09:00:00+03:00", 2, 300_000, { phone: "+90 555 111 22 33", note: "VIP" }),
  row("mehmet", "Mehmet Öz", "2026-09-20T09:00:00+03:00", 0, 0),
  row("zeynep", "Zeynep Kaya", "2026-08-01T09:00:00+03:00", 1, 900_000),
  row("can", "Can Demir", "2026-09-10T09:00:00+03:00", 1, 300_000),
];

const filters = (patch: Partial<CustomerListFilters>): CustomerListFilters => ({
  ...NO_CUSTOMER_FILTERS,
  ...patch,
});
const ids = (rows: CustomerRow[]) => rows.map((r) => r.customer.id);

describe("filterCustomers", () => {
  it("returns everyone with no filters", () => {
    assert.equal(filterCustomers(ROWS, NO_CUSTOMER_FILTERS, NOW).length, 4);
  });

  it("splits customers who have ordered from those who have not", () => {
    assert.deepEqual(ids(filterCustomers(ROWS, filters({ orders: "with" }), NOW)), ["ayse", "zeynep", "can"]);
    assert.deepEqual(ids(filterCustomers(ROWS, filters({ orders: "without" }), NOW)), ["mehmet"]);
  });

  it("filters by when the customer was added, in Istanbul days", () => {
    assert.deepEqual(ids(filterCustomers(ROWS, filters({ period: "today" }), NOW)), ["ayse"]);
    assert.deepEqual(ids(filterCustomers(ROWS, filters({ period: "7d" }), NOW)), ["ayse", "mehmet"]);
    assert.deepEqual(ids(filterCustomers(ROWS, filters({ period: "30d" }), NOW)), ["ayse", "mehmet", "can"]);
  });

  it("searches name, e-mail, phone digits and note, ignoring case", () => {
    const find = (search: string) => ids(filterCustomers(ROWS, filters({ search }), NOW));
    assert.deepEqual(find("ayşe"), ["ayse"]);
    assert.deepEqual(find("ÖZ"), ["mehmet"]);
    assert.deepEqual(find("zeynep@example"), ["zeynep"]);
    assert.deepEqual(find("5551112233"), ["ayse"]);
    assert.deepEqual(find("vip"), ["ayse"]);
    assert.deepEqual(find("VIP"), ["ayse"]);
    assert.deepEqual(find("nobody"), []);
  });

  it("needs every word of the search to match", () => {
    assert.deepEqual(ids(filterCustomers(ROWS, filters({ search: "ayşe yılmaz" }), NOW)), ["ayse"]);
    assert.deepEqual(ids(filterCustomers(ROWS, filters({ search: "ayşe demir" }), NOW)), []);
  });
});

describe("customerFilterCount", () => {
  it("counts the popover filters but not the search box", () => {
    assert.equal(customerFilterCount(NO_CUSTOMER_FILTERS), 0);
    assert.equal(customerFilterCount(filters({ search: "x" })), 0);
    assert.equal(customerFilterCount(filters({ orders: "with", period: "7d" })), 2);
  });
});

describe("sortCustomers", () => {
  it("sorts by name using Turkish collation", () => {
    assert.deepEqual(ids(sortCustomers(ROWS, "name", "asc")), ["ayse", "can", "mehmet", "zeynep"]);
    assert.deepEqual(ids(sortCustomers(ROWS, "name", "desc")), ["zeynep", "mehmet", "can", "ayse"]);
  });

  it("sorts by date added and by spend", () => {
    assert.deepEqual(ids(sortCustomers(ROWS, "createdAt", "desc")), ["ayse", "mehmet", "can", "zeynep"]);
    assert.equal(ids(sortCustomers(ROWS, "spend", "desc"))[0], "zeynep");
    assert.equal(ids(sortCustomers(ROWS, "spend", "asc"))[0], "mehmet");
  });

  it("keeps equal values in their original order and leaves the input alone", () => {
    // can and ayse both spend 300.000.
    assert.deepEqual(ids(sortCustomers(ROWS, "spend", "desc")).slice(1, 3), ["ayse", "can"]);
    assert.deepEqual(ids(ROWS), ["ayse", "mehmet", "zeynep", "can"]);
  });
});

describe("adjacentCustomers", () => {
  it("finds the neighbours in the newest-first list", () => {
    // newest first: ayse, mehmet, can, zeynep
    assert.deepEqual(adjacentCustomers(ROWS, "mehmet"), {
      previousId: "ayse",
      nextId: "can",
      position: 2,
      total: 4,
    });
  });

  it("has no neighbour past either end, and copes with an unknown id", () => {
    assert.equal(adjacentCustomers(ROWS, "ayse").previousId, null);
    assert.equal(adjacentCustomers(ROWS, "zeynep").nextId, null);
    assert.deepEqual(adjacentCustomers(ROWS, "nope"), {
      previousId: null,
      nextId: null,
      position: null,
      total: 4,
    });
  });
});
