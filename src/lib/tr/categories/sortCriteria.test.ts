import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CATEGORY_SORT_OPTIONS,
  categorySortLabel,
  readCategorySortCriterion,
  sortProductsByCriterion,
} from "./sortCriteria";

const p = (
  id: string,
  priceKurus: number,
  compareAtPriceKurus: number | null,
  createdAt: string,
) => ({ id, priceKurus, compareAtPriceKurus, createdAt });

const products = [
  p("a", 30000, null, "2026-01-01T00:00:00Z"),
  p("b", 10000, 20000, "2026-03-01T00:00:00Z"), // 50% off
  p("c", 20000, 25000, "2026-02-01T00:00:00Z"), // 20% off
  p("d", 20000, null, "2026-04-01T00:00:00Z"),
];
const ids = (list: Array<{ id: string }>) => list.map((x) => x.id).join("");

describe("sortProductsByCriterion", () => {
  it("keeps the incoming order when the category has no criterion", () => {
    assert.equal(ids(sortProductsByCriterion(products, null)), "abcd");
  });

  it("sorts by price, either way, keeping ties in their original order", () => {
    assert.equal(ids(sortProductsByCriterion(products, "price_asc")), "bcda");
    assert.equal(ids(sortProductsByCriterion(products, "price_desc")), "acdb");
  });

  it("sorts by discount ratio; products not on sale count as no discount", () => {
    assert.equal(ids(sortProductsByCriterion(products, "discount_desc")), "bcad");
    assert.equal(ids(sortProductsByCriterion(products, "discount_asc")), "adcb");
  });

  it("sorts newest first", () => {
    assert.equal(ids(sortProductsByCriterion(products, "newest")), "dbca");
  });

  it("sorts best sellers by units sold, unsold last", () => {
    const sales = new Map([
      ["c", 9],
      ["a", 2],
    ]);
    assert.equal(ids(sortProductsByCriterion(products, "best_selling", sales)), "cabd");
  });

  it("does not modify the list it is given", () => {
    const original = ids(products);
    sortProductsByCriterion(products, "price_desc");
    assert.equal(ids(products), original);
  });
});

describe("criteria list", () => {
  it("has the six ikas options, and rejects anything else", () => {
    assert.equal(CATEGORY_SORT_OPTIONS.length, 6);
    assert.equal(readCategorySortCriterion("price_asc"), "price_asc");
    assert.equal(readCategorySortCriterion("oldest"), null);
    assert.equal(categorySortLabel("best_selling"), "En Çok Satanlar");
    assert.equal(categorySortLabel(null), "");
  });
});
