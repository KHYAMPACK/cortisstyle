import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TrOrderWithItems } from "@/types/tr-marketplace";
import {
  indexCustomerStats,
  ordersOfCustomer,
  validateCustomerAddress,
  validateCustomerInput,
  withSingleDefault,
} from "./customerModel";

const ADDRESS = {
  title: "Ev",
  name: "Ayşe Yılmaz",
  line1: "Gül Mah. Papatya Sok. No:5 D:3",
  line2: "",
  city: "Ankara",
  district: "Çankaya",
  postalCode: "06680",
  isDefault: true,
};

const VALID = {
  name: "  Ayşe   Yılmaz ",
  email: "  Ayse@Example.COM ",
  phone: "+90 555 111 22 33",
  note: "VIP müşteri\r\nKapıda ödeme yok",
  addresses: [ADDRESS],
};

describe("validateCustomerInput", () => {
  it("accepts a complete customer and tidies it", () => {
    const result = validateCustomerInput(VALID);
    assert.ok(result.ok);
    assert.equal(result.value.name, "Ayşe Yılmaz");
    assert.equal(result.value.email, "ayse@example.com");
    assert.equal(result.value.phone, "+90 555 111 22 33");
    assert.equal(result.value.note, "VIP müşteri\nKapıda ödeme yok");
    assert.equal(result.value.addresses.length, 1);
    assert.equal(result.value.addresses[0]!.country, "TR");
  });

  it("needs only a name and an e-mail", () => {
    const result = validateCustomerInput({ name: "Ali Veli", email: "ali@x.com" });
    assert.ok(result.ok);
    assert.equal(result.value.phone, null);
    assert.equal(result.value.note, null);
    assert.deepEqual(result.value.addresses, []);
  });

  it("rejects a bad name or e-mail", () => {
    assert.equal(validateCustomerInput({ ...VALID, name: "A" }).ok, false);
    assert.equal(validateCustomerInput({ ...VALID, name: "   " }).ok, false);
    assert.equal(validateCustomerInput({ ...VALID, email: "not-an-email" }).ok, false);
    assert.equal(validateCustomerInput({ ...VALID, email: "" }).ok, false);
    assert.equal(validateCustomerInput({ ...VALID, email: undefined }).ok, false);
  });

  it("checks the phone only when there is one", () => {
    assert.ok(validateCustomerInput({ ...VALID, phone: "" }).ok);
    assert.equal(validateCustomerInput({ ...VALID, phone: "12345" }).ok, false);
    assert.equal(validateCustomerInput({ ...VALID, phone: "call me maybe 5551112233" }).ok, false);
    assert.ok(validateCustomerInput({ ...VALID, phone: "0555 111 22 33" }).ok);
  });

  it("limits the note", () => {
    assert.equal(validateCustomerInput({ ...VALID, note: "x".repeat(2001) }).ok, false);
    assert.ok(validateCustomerInput({ ...VALID, note: "x".repeat(2000) }).ok);
  });

  it("rejects anything that is not an object", () => {
    for (const value of [null, undefined, "x", 5, []]) {
      // An array is an object, but has no name or e-mail.
      assert.equal(validateCustomerInput(value).ok, false);
    }
  });

  it("names the address that is wrong", () => {
    const result = validateCustomerInput({
      ...VALID,
      addresses: [ADDRESS, { ...ADDRESS, title: "İş", postalCode: "123" }],
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /^Adres 2: /);
  });

  it("limits how many addresses one customer can have", () => {
    const many = Array.from({ length: 11 }, (_, i) => ({ ...ADDRESS, title: `Adres ${i}` }));
    assert.equal(validateCustomerInput({ ...VALID, addresses: many }).ok, false);
  });
});

describe("validateCustomerAddress", () => {
  it("canonicalises il and ilçe and keeps a usable id", () => {
    const result = validateCustomerAddress({ ...ADDRESS, city: "ankara", district: "çankaya", id: "addr-1" });
    assert.ok(result.ok);
    assert.equal(result.value.city, "Ankara");
    assert.equal(result.value.district, "Çankaya");
    assert.equal(result.value.id, "addr-1");
  });

  it("gives an address without an id a fresh one, and rejects a hostile id", () => {
    const fresh = validateCustomerAddress(ADDRESS);
    const hostile = validateCustomerAddress({ ...ADDRESS, id: "../../etc" });
    assert.ok(fresh.ok && hostile.ok);
    assert.match(fresh.value.id, /^[0-9a-f-]{36}$/);
    assert.match(hostile.value.id, /^[0-9a-f-]{36}$/);
  });

  it("requires a title, a recipient and a real address", () => {
    assert.equal(validateCustomerAddress({ ...ADDRESS, title: " " }).ok, false);
    assert.equal(validateCustomerAddress({ ...ADDRESS, name: "A" }).ok, false);
    assert.equal(validateCustomerAddress({ ...ADDRESS, line1: "kısa" }).ok, false);
    assert.equal(validateCustomerAddress({ ...ADDRESS, city: "Atlantis" }).ok, false);
    assert.equal(validateCustomerAddress({ ...ADDRESS, title: "x".repeat(41) }).ok, false);
    assert.equal(validateCustomerAddress(null).ok, false);
  });
});

describe("withSingleDefault", () => {
  const address = (id: string, isDefault: boolean) => ({ ...ADDRESS, id, country: "TR", isDefault });

  it("keeps the marked default and unmarks the rest", () => {
    const out = withSingleDefault([address("a", true), address("b", true), address("c", false)]);
    assert.deepEqual(out.map((x) => x.isDefault), [true, false, false]);
  });

  it("makes the first the default when none is marked", () => {
    const out = withSingleDefault([address("a", false), address("b", false)]);
    assert.deepEqual(out.map((x) => x.isDefault), [true, false]);
  });

  it("moves the default to a later address when that one is marked", () => {
    const out = withSingleDefault([address("a", false), address("b", true)]);
    assert.deepEqual(out.map((x) => x.isDefault), [false, true]);
  });

  it("copes with no addresses", () => {
    assert.deepEqual(withSingleDefault([]), []);
  });
});

// --- stats -------------------------------------------------------------------

const BOUTIQUE = "b1";

function order(
  id: string,
  over: Record<string, unknown> = {},
): TrOrderWithItems {
  return {
    id,
    customerId: null,
    customerEmail: "ayse@example.com",
    paymentStatus: "paid",
    fulfillmentStatus: "created",
    isSandbox: false,
    discountKurus: 0,
    createdAt: "2026-09-20T10:00:00.000Z",
    items: [{ boutiqueId: BOUTIQUE, priceKurus: 100_000, quantity: 1 }],
    ...over,
  } as unknown as TrOrderWithItems;
}

const CUSTOMERS = [
  { id: "c1", email: "ayse@example.com" },
  { id: "c2", email: "mehmet@example.com" },
  { id: "c3", email: "nobody@example.com" },
];

describe("indexCustomerStats", () => {
  it("totals a customer's paid orders by the dashboard's revenue rule", () => {
    const stats = indexCustomerStats(
      [
        order("o1", { customerId: "c1", items: [{ boutiqueId: BOUTIQUE, priceKurus: 100_000, quantity: 1 }] }),
        order("o2", {
          customerId: "c1",
          createdAt: "2026-09-22T10:00:00.000Z",
          discountKurus: 10_000,
          items: [{ boutiqueId: BOUTIQUE, priceKurus: 50_000, quantity: 2 }],
        }),
      ],
      CUSTOMERS,
      BOUTIQUE,
    ).get("c1")!;
    assert.equal(stats.orderCount, 2);
    // 100.000 + (100.000 − 10.000 discount)
    assert.equal(stats.spendKurus, 190_000);
    assert.equal(stats.averageOrderKurus, 95_000);
    assert.equal(stats.itemsPerOrder, 1.5);
    assert.equal(stats.lastOrderAt, "2026-09-22T10:00:00.000Z");
  });

  it("ignores unpaid, failed and cancelled orders", () => {
    const stats = indexCustomerStats(
      [
        order("o1", { customerId: "c1", paymentStatus: "pending" }),
        order("o2", { customerId: "c1", paymentStatus: "failed" }),
        order("o3", { customerId: "c1", fulfillmentStatus: "cancelled" }),
      ],
      CUSTOMERS,
      BOUTIQUE,
    ).get("c1")!;
    assert.equal(stats.orderCount, 0);
    assert.equal(stats.spendKurus, 0);
    assert.equal(stats.lastOrderAt, null);
  });

  it("gives an order with no customer id to the customer with that e-mail", () => {
    const stats = indexCustomerStats(
      [order("o1", { customerEmail: " MEHMET@example.com " })],
      CUSTOMERS,
      BOUTIQUE,
    );
    assert.equal(stats.get("c2")!.orderCount, 1);
    assert.equal(stats.get("c1")!.orderCount, 0);
  });

  it("trusts the customer id over the e-mail on the order", () => {
    const stats = indexCustomerStats(
      [order("o1", { customerId: "c2", customerEmail: "ayse@example.com" })],
      CUSTOMERS,
      BOUTIQUE,
    );
    assert.equal(stats.get("c2")!.orderCount, 1);
    assert.equal(stats.get("c1")!.orderCount, 0);
  });

  it("has empty stats, not missing ones, for a customer with no orders", () => {
    const stats = indexCustomerStats([], CUSTOMERS, BOUTIQUE).get("c3")!;
    assert.deepEqual(stats, {
      orderCount: 0,
      spendKurus: 0,
      averageOrderKurus: 0,
      itemsPerOrder: 0,
      lastOrderAt: null,
    });
  });

  it("does not count another boutique's lines", () => {
    const stats = indexCustomerStats(
      [order("o1", { customerId: "c1", items: [{ boutiqueId: "other", priceKurus: 999_999, quantity: 1 }] })],
      CUSTOMERS,
      BOUTIQUE,
    ).get("c1")!;
    assert.equal(stats.spendKurus, 0);
  });
});

describe("ordersOfCustomer", () => {
  it("lists all of a customer's orders, any status, newest first", () => {
    const orders = [
      order("old", { customerId: "c1", createdAt: "2026-09-01T00:00:00.000Z" }),
      order("new", { customerId: "c1", paymentStatus: "pending", createdAt: "2026-09-30T00:00:00.000Z" }),
      order("other", { customerId: "c2" }),
      order("legacy", { customerEmail: "AYSE@example.com", createdAt: "2026-09-15T00:00:00.000Z" }),
    ];
    assert.deepEqual(
      ordersOfCustomer(orders, CUSTOMERS[0]!).map((o) => o.id),
      ["new", "legacy", "old"],
    );
  });
});
