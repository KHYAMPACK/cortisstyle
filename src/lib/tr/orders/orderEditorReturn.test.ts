import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isOrderEditorPath,
  withNewCustomer,
  withoutNewCustomer,
} from "@/lib/tr/orders/orderEditorReturn";

describe("isOrderEditorPath", () => {
  it("recognises a new order and a draft, with or without a query", () => {
    for (const path of [
      "/tr/panel/siparisler/yeni",
      "/tr/panel/siparisler/yeni/",
      "/tr/panel/siparisler/yeni?from=%2Ftr%2Fpanel%2Fsiparisler",
      "/tr/panel/taslaklar/abc-123",
      "/tr/panel/taslaklar/abc-123?musteri=c1",
    ]) {
      assert.equal(isOrderEditorPath(path), true, path);
    }
  });

  it("does not take other pages for the editor", () => {
    for (const path of [
      "/tr/panel/siparisler",
      "/tr/panel/siparisler/abc-123",
      "/tr/panel/taslaklar",
      "/tr/panel/taslaklar/abc/baska",
      "/tr/panel/musteriler/yeni",
      "/tr/panel",
    ]) {
      assert.equal(isOrderEditorPath(path), false, path);
    }
  });
});

describe("withNewCustomer / withoutNewCustomer", () => {
  it("adds the customer to a path without a query", () => {
    assert.equal(
      withNewCustomer("/tr/panel/siparisler/yeni", "c1"),
      "/tr/panel/siparisler/yeni?musteri=c1",
    );
  });

  it("keeps the rest of the query and replaces an earlier customer", () => {
    assert.equal(
      withNewCustomer("/tr/panel/taslaklar/d1?from=%2Ftr%2Fpanel&musteri=old", "c2"),
      "/tr/panel/taslaklar/d1?from=%2Ftr%2Fpanel&musteri=c2",
    );
  });

  it("takes the customer back out, leaving the rest", () => {
    assert.equal(
      withoutNewCustomer("/tr/panel/siparisler/yeni?musteri=c1"),
      "/tr/panel/siparisler/yeni",
    );
    assert.equal(
      withoutNewCustomer("/tr/panel/taslaklar/d1?from=%2Ftr%2Fpanel&musteri=c1"),
      "/tr/panel/taslaklar/d1?from=%2Ftr%2Fpanel",
    );
    assert.equal(withoutNewCustomer("/tr/panel/taslaklar/d1"), "/tr/panel/taslaklar/d1");
  });
});
