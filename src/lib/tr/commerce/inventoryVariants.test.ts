import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decrementVariantLine,
  restoreVariantLine,
  syncProductStockFromVariants,
  type InventoryClient,
} from "@/lib/tr/commerce/inventory";
import type { TrProduct } from "@/types/tr-marketplace";

/**
 * A tiny in-memory stand-in for the Supabase client: just the calls inventory.ts makes
 * (`from().select()/update()` with `.eq()` filters and `.maybeSingle()`), so the stock
 * rules can be tested without a database.
 */
type Row = Record<string, unknown>;

function fakeClient(
  tables: Record<string, Row[]>,
  hooks: { beforeUpdate?: (table: string) => void } = {},
): InventoryClient {
  function builder(table: string) {
    const filters: Array<[string, unknown]> = [];
    let patch: Row | null = null;
    const matches = () =>
      (tables[table] ?? []).filter((row) =>
        filters.every(([column, value]) => row[column] === value),
      );
    const run = () => {
      if (patch) {
        hooks.beforeUpdate?.(table);
        const rows = matches();
        for (const row of rows) Object.assign(row, patch);
        return { data: rows.map((row) => ({ ...row })), error: null };
      }
      return { data: matches().map((row) => ({ ...row })), error: null };
    };
    const api: Record<string, unknown> = {
      select: () => api,
      update: (values: Row) => {
        patch = values;
        return api;
      },
      eq: (column: string, value: unknown) => {
        filters.push([column, value]);
        return api;
      },
      maybeSingle: async () => {
        const result = run();
        return { data: result.data[0] ?? null, error: null };
      },
      then: (resolve: (value: unknown) => unknown) => resolve(run()),
    };
    return api;
  }
  return { from: builder } as unknown as InventoryClient;
}

function product(over: Partial<TrProduct> = {}): TrProduct {
  return { id: "p1", title: "Keten Elbise", status: "available", stock: 5, ...over } as TrProduct;
}

function setup(
  variants: Row[],
  productRow: Row = { id: "p1", stock: 5, status: "available" },
) {
  const tables = {
    tr_product_variants: variants,
    tr_products: [productRow],
  };
  return { tables, client: fakeClient(tables) };
}

const v = (id: string, stock: number, over: Row = {}): Row => ({
  id,
  product_id: "p1",
  stock,
  active: true,
  ...over,
});

describe("decrementVariantLine", () => {
  it("takes the stock and keeps the product's stock as the sum of active variants", async () => {
    const { tables, client } = setup([v("a", 3), v("b", 2), v("c", 4, { active: false })]);
    await decrementVariantLine(client, product(), "a", 2);
    assert.equal(tables.tr_product_variants[0]!.stock, 1);
    assert.equal(tables.tr_products[0]!.stock, 3); // 1 + 2; the inactive variant doesn't count
    assert.equal(tables.tr_products[0]!.status, "available");
  });

  it("marks the product sold when the last unit goes", async () => {
    const { tables, client } = setup([v("a", 1), v("b", 0)]);
    await decrementVariantLine(client, product(), "a", 1);
    assert.equal(tables.tr_products[0]!.stock, 0);
    assert.equal(tables.tr_products[0]!.status, "sold");
  });

  it("refuses more than the variant has and changes nothing", async () => {
    const { tables, client } = setup([v("a", 1)]);
    await assert.rejects(decrementVariantLine(client, product(), "a", 2), /stokta yok/);
    assert.equal(tables.tr_product_variants[0]!.stock, 1);
    assert.equal(tables.tr_products[0]!.stock, 5);
  });

  it("refuses an inactive variant", async () => {
    const { client } = setup([v("a", 3, { active: false })]);
    await assert.rejects(decrementVariantLine(client, product(), "a", 1), /satışta değil/);
  });

  it("refuses a variant of another product", async () => {
    const { client } = setup([v("a", 3, { product_id: "other" })]);
    await assert.rejects(decrementVariantLine(client, product(), "a", 1), /bulunamadı/);
  });

  it("refuses a line whose variant was removed", async () => {
    const { client } = setup([v("a", 3)]);
    await assert.rejects(
      decrementVariantLine(client, product(), null, 1),
      /artık satışta değil/,
    );
  });

  it("loses the race when the stock changed after it was read", async () => {
    const tables = {
      tr_product_variants: [v("a", 1)],
      tr_products: [{ id: "p1", stock: 1, status: "available" }],
    };
    // Another order takes the last unit between our read and our update.
    const client = fakeClient(tables, {
      beforeUpdate: (table) => {
        if (table === "tr_product_variants") tables.tr_product_variants[0]!.stock = 0;
      },
    });
    await assert.rejects(decrementVariantLine(client, product(), "a", 1), /eşzamanlı/);
    assert.equal(tables.tr_product_variants[0]!.stock, 0); // not driven negative
  });
});

describe("restoreVariantLine", () => {
  it("gives the stock back and makes a sold product available again", async () => {
    const { tables, client } = setup([v("a", 0)], { id: "p1", stock: 0, status: "sold" });
    await restoreVariantLine(client, product({ status: "sold", stock: 0 }), "a", 2);
    assert.equal(tables.tr_product_variants[0]!.stock, 2);
    assert.equal(tables.tr_products[0]!.stock, 2);
    assert.equal(tables.tr_products[0]!.status, "available");
  });

  it("does nothing for a variant that no longer exists", async () => {
    const { tables, client } = setup([v("a", 3)]);
    await restoreVariantLine(client, product(), null, 2);
    await restoreVariantLine(client, product(), "gone", 2);
    assert.equal(tables.tr_product_variants[0]!.stock, 3);
    assert.equal(tables.tr_products[0]!.stock, 5);
  });

  it("puts stock on an inactive variant without adding to the product's total", async () => {
    const { tables, client } = setup([v("a", 0, { active: false }), v("b", 2)], {
      id: "p1",
      stock: 2,
      status: "available",
    });
    await restoreVariantLine(client, product({ stock: 2 }), "a", 3);
    assert.equal(tables.tr_product_variants[0]!.stock, 3);
    assert.equal(tables.tr_products[0]!.stock, 2);
  });
});

describe("syncProductStockFromVariants", () => {
  it("leaves a hidden product's status alone even at zero stock", async () => {
    const { tables, client } = setup([v("a", 0)], { id: "p1", stock: 4, status: "hidden" });
    await syncProductStockFromVariants(client, product({ status: "hidden" }));
    assert.equal(tables.tr_products[0]!.stock, 0);
    assert.equal(tables.tr_products[0]!.status, "hidden");
  });
});
