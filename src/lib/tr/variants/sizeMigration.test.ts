import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkSizeMigration,
  planSizeMigration,
  sizeMigrationSql,
  type MigrationProduct,
} from "./sizeMigration";

function ids() {
  let n = 0;
  return () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
}

function product(id: string, overrides: Partial<MigrationProduct> = {}): MigrationProduct {
  return {
    id,
    title: "Elbise",
    description: null,
    descriptionHtml: null,
    status: "available",
    createdAt: "2026-08-01T00:00:00Z",
    productType: "fashion",
    stock: 3,
    sizes: ["S", "M", "L"],
    sizeStocks: { S: 1, M: 2, L: 0 },
    features: {},
    images: [`https://cdn/${id}.jpg`],
    marketplaceImages: [],
    lifestyleImages: [],
    ...overrides,
  };
}

const P1 = "10000000-0000-4000-8000-000000000001";
const P2 = "10000000-0000-4000-8000-000000000002";
const P3 = "10000000-0000-4000-8000-000000000003";
const PANT = "10000000-0000-4000-8000-000000000004";
const BARE = "10000000-0000-4000-8000-000000000005";
const GROUP = "20000000-0000-4000-8000-000000000001";

const red = product(P1, {
  title: "Kırmızı Maxi Elbise",
  createdAt: "2026-08-01T00:00:00Z",
  features: { color: "Kırmızı", colorGroupId: GROUP, colorSiblingIds: [P1, P2] },
});
const black = product(P2, {
  title: "Siyah Maxi Elbise",
  createdAt: "2026-08-02T00:00:00Z",
  sizes: ["S", "M"],
  sizeStocks: { S: 4, M: 0 },
  stock: 4,
  features: { colorGroupId: GROUP },
});
const plain = product(P3);
const trousers = product(PANT, { sizes: ["26", "24"], sizeStocks: { 24: 1, 26: 2 }, stock: 3 });
const bare = product(BARE, { sizes: [], sizeStocks: {}, stock: 2 });
const all = [red, black, plain, trousers, bare];

describe("size migration plan", () => {
  it("blocks a group without a decision and a member without a colour", () => {
    const undecided = planSizeMigration({ products: all, answers: {}, existingTypeNames: [], newId: ids() });
    assert.ok(undecided.problems.some((p) => p.level === "block" && p.groupId === GROUP));
    const noColor = planSizeMigration({
      products: all,
      answers: { groups: { [GROUP]: { merge: true } } },
      existingTypeNames: [],
      newId: ids(),
    });
    assert.ok(noColor.problems.some((p) => p.level === "block" && p.productId === P2));
  });

  it("turns sizes into variants and merges a colour group", () => {
    const plan = planSizeMigration({
      products: all,
      answers: {
        colors: { [P2]: "Siyah" },
        groups: { [GROUP]: { merge: true, title: "Maxi Elbise" } },
      },
      existingTypeNames: [],
      newId: ids(),
    });
    assert.deepEqual(plan.problems.filter((p) => p.level === "block"), []);
    assert.deepEqual(plan.types.map((type) => [type.name, type.values.map((v) => v.label)]), [
      ["Beden", ["S", "M", "L"]],
      ["Pantolon bedeni", ["24", "26"]],
      ["Renk", ["Kırmızı", "Siyah"]],
    ]);
    assert.deepEqual(plan.untouched, [BARE]);

    const merged = plan.products.find((entry) => entry.productId === P1)!;
    assert.equal(merged.merge?.title, "Maxi Elbise");
    assert.deepEqual(merged.variants.map((variant) => [variant.label, variant.stock]), [
      ["Kırmızı / S", 1],
      ["Kırmızı / M", 2],
      ["Kırmızı / L", 0],
      ["Siyah / S", 4],
      ["Siyah / M", 0],
    ]);
    assert.equal(merged.stock, 7);
    assert.deepEqual(merged.sizes, ["S", "M", "L"]);
    assert.deepEqual(merged.merge?.images, [`https://cdn/${P1}.jpg`, `https://cdn/${P2}.jpg`]);
    assert.deepEqual(merged.variants[3]!.images, [`https://cdn/${P2}.jpg`]);
    assert.equal(merged.merge?.features.colorGroupId, undefined);
    assert.equal(merged.merge?.features.colorSiblingIds, undefined);
    assert.equal(merged.merge?.features.manualListing, true);
    assert.deepEqual(plan.merges.map((m) => [m.productId, m.intoId, m.color]), [[P2, P1, "Siyah"]]);
    assert.equal(plan.merges[0]!.features.color, "Siyah");

    const pants = plan.products.find((entry) => entry.productId === PANT)!;
    assert.deepEqual(pants.variants.map((variant) => variant.label), ["24", "26"]);
    assert.deepEqual(checkSizeMigration(plan, all), []);
  });

  it("keeps an unmerged group's members apart, without the group", () => {
    const plan = planSizeMigration({
      products: all,
      answers: { groups: { [GROUP]: { merge: false } } },
      existingTypeNames: [],
      newId: ids(),
    });
    assert.equal(plan.merges.length, 0);
    assert.ok(!plan.types.some((type) => type.name === "Renk"));
    const black2 = plan.products.find((entry) => entry.productId === P2)!;
    assert.equal(black2.features?.colorGroupId, undefined);
    assert.equal(black2.stock, 4);
  });

  it("writes SQL with a snapshot guard, and a rollback", () => {
    const plan = planSizeMigration({
      products: all,
      answers: { colors: { [P2]: "Siyah" }, groups: { [GROUP]: { merge: true } } },
      existingTypeNames: [],
      newId: ids(),
    });
    const sql = sizeMigrationSql({
      plan,
      products: all,
      boutiqueId: "30000000-0000-4000-8000-000000000001",
      boutiqueSlug: "deneme",
      snapshotAt: "2026-10-02",
    });
    assert.match(sql.apply, /^begin;$/m);
    assert.match(sql.apply, /raise exception 'F6: % product\(s\) changed/);
    assert.match(sql.apply, /set status = 'hidden', merged_into = '10000000-0000-4000-8000-000000000001'::uuid/);
    assert.match(sql.apply, /'Kırmızı Maxi Elbise'/);
    assert.match(sql.rollback, /merged_into = null/);
    assert.ok(!sql.apply.includes(BARE));
    assert.throws(() =>
      sizeMigrationSql({
        plan: { ...plan, problems: [{ level: "block", message: "x" }] },
        products: all,
        boutiqueId: "30000000-0000-4000-8000-000000000001",
        boutiqueSlug: "deneme",
        snapshotAt: "",
      }),
    );
  });
});
