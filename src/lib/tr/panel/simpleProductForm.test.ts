import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emptySimpleProductForm,
  simpleFormFromProduct,
  simpleProductPatch,
  simpleProductPayload,
  simpleProductStatus,
  validateSimpleProductForm,
  type SimpleProductFormState,
} from "./simpleProductForm";
import { EMPTY_PRODUCT_PRIVATE, type TrProduct } from "@/types/tr-marketplace";

/** The fields the detail cards add to every save, so an edit can also clear them. */
const DETAIL_KEYS = [
  "barcode",
  "brand",
  "continueSelling",
  "descriptionHtml",
  "desi",
  "googleCategory",
  "hsCode",
  "sku",
  "supplier",
  "tags",
  "unitPrice",
];

function form(
  overrides: Partial<SimpleProductFormState> = {},
): SimpleProductFormState {
  return {
    ...emptySimpleProductForm(),
    title: "Deri cüzdan",
    priceTry: "450",
    images: ["https://cdn.test/a.jpg"],
    ...overrides,
  };
}

describe("validateSimpleProductForm", () => {
  it("accepts a complete form", () => {
    assert.equal(validateSimpleProductForm(form()), null);
  });

  it("asks for the essentials in order", () => {
    assert.match(validateSimpleProductForm(form({ title: "  " }))!, /adı/);
    assert.match(
      validateSimpleProductForm(form({ priceTry: "" }))!,
      /Satış fiyatı/,
    );
    assert.match(validateSimpleProductForm(form({ stock: "" }))!, /Stok/);
    assert.match(validateSimpleProductForm(form({ images: [] }))!, /fotoğraf/);
  });

  it("requires the discounted price to be lower than the price", () => {
    assert.match(
      validateSimpleProductForm(form({ salePriceTry: "450" }))!,
      /düşük/,
    );
    assert.equal(
      validateSimpleProductForm(form({ salePriceTry: "399,90" })),
      null,
    );
  });

  it("treats the cost price as optional but rejects nonsense", () => {
    assert.equal(validateSimpleProductForm(form({ costPriceTry: "" })), null);
    assert.equal(
      validateSimpleProductForm(form({ costPriceTry: "120" })),
      null,
    );
    assert.match(
      validateSimpleProductForm(form({ costPriceTry: "abc" }))!,
      /Alış/,
    );
    assert.match(
      validateSimpleProductForm(form({ costPriceTry: "0" }))!,
      /Alış/,
    );
  });
});

describe("simpleProductPayload", () => {
  it("sends the normal price alone when there is no discount", () => {
    const payload = simpleProductPayload(form(), "b1");
    assert.equal(payload.productType, "simple");
    assert.equal(payload.priceTry, 450);
    assert.equal(payload.compareAtPriceTry, null);
    assert.equal(payload.costPriceTry, null);
    assert.deepEqual(payload.sizes, []);
    assert.equal(payload.category, null);
  });

  it("makes the discounted price the sell price and the normal price the struck one", () => {
    const payload = simpleProductPayload(
      form({ salePriceTry: "399,90" }),
      "b1",
    );
    assert.equal(payload.priceTry, 399.9);
    assert.equal(payload.compareAtPriceTry, 450);
  });

  it("carries the cost price and the fulfillment type", () => {
    const payload = simpleProductPayload(
      form({ costPriceTry: "120", fulfillmentType: "digital" }),
      "b1",
    );
    assert.equal(payload.costPriceTry, 120);
    assert.equal(payload.fulfillmentType, "digital");
  });
});

describe("simpleProductPatch", () => {
  it("only carries the fields the editor owns", () => {
    const patch = simpleProductPatch(form({ costPriceTry: "120" }));
    assert.deepEqual(Object.keys(patch).sort(), [
      "compareAtPriceTry",
      "costPriceTry",
      "fulfillmentType",
      "images",
      "priceTry",
      "seo",
      "slug",
      "status",
      "stock",
      "title",
      ...DETAIL_KEYS,
    ].sort());
    assert.equal(patch.costPriceTry, 120);
  });

  it("clears the cost price when the field is emptied", () => {
    assert.equal(simpleProductPatch(form()).costPriceTry, null);
  });
});

describe("simpleProductStatus", () => {
  it("is hidden when the owner hides it, sold at zero stock, otherwise available", () => {
    assert.equal(simpleProductStatus(form({ hidden: true })), "hidden");
    assert.equal(simpleProductStatus(form({ stock: "0" })), "sold");
    assert.equal(simpleProductStatus(form({ stock: "3" })), "available");
  });
});

describe("simpleFormFromProduct", () => {
  const product = {
    title: "Deri cüzdan",
    priceKurus: 39990,
    compareAtPriceKurus: 45000,
    status: "available",
    stock: 4,
    images: ["https://cdn.test/a.jpg"],
    fulfillmentType: "physical",
  } as TrProduct;

  it("turns a discounted product back into normal + discounted price", () => {
    const state = simpleFormFromProduct(product, {
      ...EMPTY_PRODUCT_PRIVATE,
      costPriceKurus: 12000,
    });
    assert.equal(state.priceTry, "450");
    assert.equal(state.salePriceTry, "399.90");
    assert.equal(state.costPriceTry, "120");
    assert.equal(state.stock, "4");
    assert.equal(state.hidden, false);
  });

  it("round-trips through the payload", () => {
    const state = simpleFormFromProduct(product, EMPTY_PRODUCT_PRIVATE);
    const payload = simpleProductPayload(state, "b1");
    assert.equal(Math.round(payload.priceTry * 100), 39990);
    assert.equal(Math.round(payload.compareAtPriceTry! * 100), 45000);
  });
});

describe("slug and SEO in the form", () => {
  it("leaves the slug out on create when it is empty, so the server derives it", () => {
    assert.equal(simpleProductPayload(form(), "b1").slug, undefined);
    assert.deepEqual(simpleProductPayload(form(), "b1").seo, {});
  });

  it("sends a chosen slug and the SEO overrides", () => {
    const payload = simpleProductPayload(
      form({
        seo: {
          slug: "deri-cuzdan-",
          title: " Deri Cüzdan ",
          description: "El yapımı",
          noindex: true,
          canonical: "urun/deri-cuzdan",
        },
      }),
      "b1",
    );
    assert.equal(payload.slug, "deri-cuzdan");
    assert.deepEqual(payload.seo, {
      title: "Deri Cüzdan",
      description: "El yapımı",
      noindex: true,
      canonical: "/urun/deri-cuzdan",
    });
  });

  it("clears the slug on an edit when the field is emptied", () => {
    assert.equal(simpleProductPatch(form()).slug, null);
  });

  it("validates the slug and the canonical path", () => {
    const withSeo = (seo: Partial<SimpleProductFormState["seo"]>) =>
      form({ seo: { ...emptySimpleProductForm().seo, ...seo } });
    assert.equal(validateSimpleProductForm(withSeo({ slug: "deri-cuzdan" })), null);
    assert.match(validateSimpleProductForm(withSeo({ slug: "Deri Cüzdan" }))!, /Slug/);
    assert.match(
      validateSimpleProductForm(withSeo({ slug: "" }), { requireSlug: true })!,
      /boş/,
    );
    assert.equal(validateSimpleProductForm(withSeo({ slug: "" })), null);
    assert.match(validateSimpleProductForm(withSeo({ canonical: "a//b c" }))!, /Canonical/);
  });

  it("loads a saved product's slug and SEO back into the card", () => {
    const state = simpleFormFromProduct(
      {
        title: "Deri cüzdan",
        priceKurus: 45000,
        compareAtPriceKurus: null,
        status: "available",
        stock: 1,
        images: ["a"],
        slug: "deri-cuzdan",
        seo: { title: "Cüzdan", noindex: true, canonical: "/urun/x" },
      } as TrProduct,
      EMPTY_PRODUCT_PRIVATE,
    );
    assert.deepEqual(state.seo, {
      slug: "deri-cuzdan",
      title: "Cüzdan",
      description: "",
      noindex: true,
      canonical: "urun/x",
    });
  });
});

describe("categories in the form", () => {
  it("are left out when the boutique uses the built-in tree", () => {
    assert.equal("categories" in simpleProductPayload(form(), "b1"), false);
    assert.equal("categories" in simpleProductPatch(form()), false);
  });

  it("are sent with the product when the boutique manages its own", () => {
    const categories = { ids: ["c1", "c2"], primaryId: "c2" };
    assert.deepEqual(simpleProductPayload(form({ categories }), "b1").categories, categories);
    assert.deepEqual(simpleProductPatch(form({ categories })).categories, categories);
  });

  it("start empty on a new product and load a saved product's on edit", () => {
    assert.equal(emptySimpleProductForm().categories, null);
    assert.deepEqual(emptySimpleProductForm({ ids: [], primaryId: null }).categories, {
      ids: [],
      primaryId: null,
    });
    const saved = { ids: ["c1"], primaryId: "c1" };
    const state = simpleFormFromProduct(
      { title: "x", priceKurus: 100, compareAtPriceKurus: null, status: "available", stock: 1, images: ["a"] } as TrProduct,
      EMPTY_PRODUCT_PRIVATE,
      saved,
    );
    assert.deepEqual(state.categories, saved);
  });
});

describe("detail fields in the form", () => {
  it("start empty and send nothing meaningful for a bare product", () => {
    const payload = simpleProductPayload(form(), "b1");
    assert.equal(payload.descriptionHtml, null);
    assert.equal(payload.brand, "");
    assert.deepEqual(payload.tags, []);
    assert.equal(payload.desi, null);
    assert.equal(payload.continueSelling, false);
    assert.deepEqual(payload.unitPrice, { enabled: false, amount: null, type: "kg" });
    assert.equal(validateSimpleProductForm(form()), null);
  });

  it("carries every detail to the payload and the patch", () => {
    const filled = form({
      descriptionHtml: "<p>El yapımı</p>",
      brand: "Lila",
      tags: ["deri", "yeni"],
      googleCategory: "Giyim ve Aksesuar",
      supplier: "Atölye A",
      sku: "LB-1",
      barcode: "8690000000012",
      desi: "1,5",
      hsCode: "4202.31.00.00.00",
      continueSelling: true,
      unitPriceEnabled: true,
      unitAmount: "500",
      unitType: "g",
    });
    const expected = {
      descriptionHtml: "<p>El yapımı</p>",
      brand: "Lila",
      tags: ["deri", "yeni"],
      googleCategory: "Giyim ve Aksesuar",
      supplier: "Atölye A",
      sku: "LB-1",
      barcode: "8690000000012",
      desi: 1.5,
      hsCode: "4202.31.00.00.00",
      continueSelling: true,
      unitPrice: { enabled: true, amount: 500, type: "g" },
    };
    assert.equal(validateSimpleProductForm(filled), null);
    assert.deepEqual(pick(simpleProductPayload(filled, "b1")), expected);
    assert.deepEqual(pick(simpleProductPatch(filled)), expected);
  });

  it("reports the first invalid detail with the API's own sentence", () => {
    assert.match(validateSimpleProductForm(form({ barcode: "12 34" }))!, /Barkod/);
    assert.match(validateSimpleProductForm(form({ hsCode: "ab" }))!, /HS kodu/);
    assert.match(validateSimpleProductForm(form({ desi: "0" }))!, /Desi/);
    assert.match(
      validateSimpleProductForm(form({ unitPriceEnabled: true, unitAmount: "" }))!,
      /miktar ve birim/,
    );
    assert.equal(
      validateSimpleProductForm(form({ unitPriceEnabled: true, unitAmount: "2,5", unitType: "l" })),
      null,
    );
  });

  it("loads a saved product's details, falling back to the plain description", () => {
    const state = simpleFormFromProduct(
      {
        title: "x",
        priceKurus: 100,
        compareAtPriceKurus: null,
        status: "available",
        stock: 1,
        images: ["a"],
        description: "Bir\n\nİki",
        brand: "Lila",
        tags: ["a"],
        sku: "S1",
        desi: 2.5,
        continueSelling: true,
        unitPrice: { enabled: true, amount: 250, type: "ml" },
      } as TrProduct,
      { costPriceKurus: null, supplier: "Toptancı", hsCode: "6109.10" },
    );
    assert.equal(state.descriptionHtml, "<p>Bir</p><p>İki</p>");
    assert.equal(state.brand, "Lila");
    assert.deepEqual(state.tags, ["a"]);
    assert.equal(state.sku, "S1");
    assert.equal(state.desi, "2.5");
    assert.equal(state.continueSelling, true);
    assert.equal(state.unitPriceEnabled, true);
    assert.equal(state.unitAmount, "250");
    assert.equal(state.unitType, "ml");
    assert.equal(state.supplier, "Toptancı");
    assert.equal(state.hsCode, "6109.10");
  });

  it("prefers the saved rich description over the plain one", () => {
    const state = simpleFormFromProduct(
      {
        title: "x",
        priceKurus: 100,
        compareAtPriceKurus: null,
        status: "available",
        stock: 1,
        images: ["a"],
        description: "düz",
        descriptionHtml: "<p><strong>zengin</strong></p>",
      } as TrProduct,
      EMPTY_PRODUCT_PRIVATE,
    );
    assert.equal(state.descriptionHtml, "<p><strong>zengin</strong></p>");
  });
});

function pick(source: object) {
  const record = source as Record<string, unknown>;
  return Object.fromEntries(DETAIL_KEYS.map((key) => [key, record[key]]));
}
