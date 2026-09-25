import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CUSTOMER_PICK_LIMIT,
  pickCustomers,
  preferredAddressId,
} from "@/lib/tr/orders/customerPick";
import type {
  TrBoutiqueCustomer,
  TrBoutiqueCustomerAddress,
} from "@/types/tr-marketplace";

function customer(id: string, name: string, over: Partial<TrBoutiqueCustomer> = {}): TrBoutiqueCustomer {
  return {
    id,
    boutiqueId: "b1",
    name,
    email: `${id}@example.com`,
    phone: null,
    note: null,
    addresses: [],
    createdAt: "",
    updatedAt: "",
    ...over,
  };
}

function address(id: string, isDefault = false): TrBoutiqueCustomerAddress {
  return {
    id,
    title: id,
    name: "Ayşe",
    line1: "Gül Sok.",
    line2: "",
    district: "Çankaya",
    city: "Ankara",
    postalCode: "06680",
    country: "TR",
    isDefault,
  };
}

describe("pickCustomers", () => {
  const list = [
    customer("c1", "Ayşe Yılmaz", { phone: "+905551112233" }),
    customer("c2", "Işıl İnan"),
    customer("c3", "Mehmet Öz", { email: "mehmet@firma.com" }),
  ];

  it("lists the first few for an empty query", () => {
    assert.equal(pickCustomers(list, "").length, 3);
    const many = Array.from({ length: 20 }, (_, i) => customer(`c${i}`, `Müşteri ${i}`));
    assert.equal(pickCustomers(many, " ").length, CUSTOMER_PICK_LIMIT);
  });

  it("finds by name ignoring Turkish letter case", () => {
    assert.deepEqual(pickCustomers(list, "IŞIL").map((c) => c.id), ["c2"]);
    assert.deepEqual(pickCustomers(list, "ayşe").map((c) => c.id), ["c1"]);
  });

  it("finds by e-mail", () => {
    assert.deepEqual(pickCustomers(list, "firma.com").map((c) => c.id), ["c3"]);
  });

  it("finds by phone digits however they were typed", () => {
    assert.deepEqual(pickCustomers(list, "0555 111").map((c) => c.id), ["c1"]);
    assert.deepEqual(pickCustomers(list, "555").map((c) => c.id), ["c1"]);
  });

  it("needs every word to match", () => {
    assert.deepEqual(pickCustomers(list, "ayşe yılmaz").map((c) => c.id), ["c1"]);
    assert.equal(pickCustomers(list, "ayşe öz").length, 0);
  });

  it("caps the result", () => {
    const many = Array.from({ length: 30 }, (_, i) => customer(`c${i}`, `Deniz ${i}`));
    assert.equal(pickCustomers(many, "deniz").length, CUSTOMER_PICK_LIMIT);
  });
});

describe("preferredAddressId", () => {
  it("takes the default address, else the first, else none", () => {
    assert.equal(preferredAddressId([address("a"), address("b", true)]), "b");
    assert.equal(preferredAddressId([address("a"), address("b")]), "a");
    assert.equal(preferredAddressId([]), null);
  });
});
