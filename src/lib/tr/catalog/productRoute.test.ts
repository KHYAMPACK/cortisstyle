import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveProductParam, type ProductRouteDeps } from "./productRoute";

const ID = "3f2b8c1e-5d4a-4b6e-9f10-2a7c9d8e1b34";
const OTHER_ID = "9a1c7e20-1111-4222-8333-444455556666";

function deps(overrides: Partial<ProductRouteDeps<{ id: string }>> = {}): ProductRouteDeps<{ id: string }> {
  return {
    getById: async (id) => (id === ID ? { id } : null),
    getIdBySlug: async (slug) => (slug === "keten-gomlek" ? ID : null),
    getRedirectedProductId: async (slug) => (slug === "eski-ad" ? ID : null),
    getCurrentSlug: async (id) => (id === ID ? "keten-gomlek" : null),
    ...overrides,
  };
}

describe("resolveProductParam", () => {
  it("finds a product by its id", async () => {
    assert.deepEqual(await resolveProductParam(ID, deps()), { kind: "found", product: { id: ID } });
  });

  it("finds a product by its slug", async () => {
    assert.deepEqual(await resolveProductParam("keten-gomlek", deps()), {
      kind: "found",
      product: { id: ID },
    });
  });

  it("is missing for an unknown id, an unknown slug, or a product outside this store", async () => {
    assert.deepEqual(await resolveProductParam(OTHER_ID, deps()), { kind: "missing" });
    assert.deepEqual(await resolveProductParam("yok", deps()), { kind: "missing" });
    assert.deepEqual(
      await resolveProductParam("keten-gomlek", deps({ getById: async () => null })),
      { kind: "missing" },
    );
    assert.deepEqual(await resolveProductParam("  ", deps()), { kind: "missing" });
  });

  it("redirects an old slug to the product's current slug", async () => {
    assert.deepEqual(await resolveProductParam("eski-ad", deps()), {
      kind: "redirect",
      toParam: "keten-gomlek",
    });
  });

  it("redirects to the id when the product no longer has a slug", async () => {
    assert.deepEqual(
      await resolveProductParam("eski-ad", deps({ getCurrentSlug: async () => null })),
      { kind: "redirect", toParam: ID },
    );
  });

  it("does not look at redirects for an id", async () => {
    let asked = false;
    await resolveProductParam(
      OTHER_ID,
      deps({
        getRedirectedProductId: async () => {
          asked = true;
          return ID;
        },
      }),
    );
    assert.equal(asked, false);
  });
});
