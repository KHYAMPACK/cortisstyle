import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildGoogleMerchantFeedItems, renderGoogleMerchantRssXml } from "./feed";
import type { TrPublicVariants } from "@/lib/tr/variants/storefront";
import type { TrBoutiquePublic, TrProduct } from "@/types/tr-marketplace";

const boutique = { id: "b", slug: "deneme", name: "Deneme", customDomain: null } as unknown as TrBoutiquePublic;

function product(overrides: Partial<TrProduct>): TrProduct {
  return {
    id: "p1",
    boutiqueId: "b",
    title: "Elbise",
    description: "Uzun elbise",
    priceKurus: 100000,
    compareAtPriceKurus: null,
    status: "available",
    stock: 5,
    sizes: [],
    sizeStocks: {},
    colors: [],
    images: ["https://cdn.example/p.jpg"],
    category: "Elbise",
    ...overrides,
  } as unknown as TrProduct;
}

const variants: TrPublicVariants = {
  options: [
    {
      typeId: "renk",
      name: "Renk",
      role: "color",
      photos: true,
      selectionStyle: "list",
      values: [{ id: "kirmizi", label: "Kırmızı", hex: null, imageUrl: null }],
    },
    {
      typeId: "beden",
      name: "Beden",
      role: "size",
      photos: false,
      selectionStyle: "list",
      values: [
        { id: "s", label: "S", hex: null, imageUrl: null },
        { id: "m", label: "M", hex: null, imageUrl: null },
      ],
    },
  ],
  variants: [
    { id: "v1", optionValueIds: ["kirmizi", "s"], priceKurus: 100000, compareAtPriceKurus: null, stock: 0, images: ["https://cdn.example/r.jpg"] },
    { id: "v2", optionValueIds: ["kirmizi", "m"], priceKurus: 90000, compareAtPriceKurus: 100000, stock: 2, images: [] },
  ],
};

describe("google merchant feed", () => {
  it("lists one item per variant, grouped by the product", () => {
    const items = buildGoogleMerchantFeedItems({
      boutique,
      products: [product({ productType: "advanced" })],
      requestOrigin: "https://cortisstyle.com",
      variants: new Map([["p1", variants]]),
    });
    assert.equal(items.length, 2);
    const [first, second] = items;
    assert.equal(first!.id, "v1");
    assert.equal(first!.itemGroupId, "p1");
    assert.equal(first!.title, "Elbise - Kırmızı / S");
    assert.equal(first!.color, "Kırmızı");
    assert.equal(first!.size, "S");
    assert.equal(first!.availability, "out_of_stock");
    assert.equal(first!.imageLink, "https://cdn.example/r.jpg");
    assert.match(first!.link, /\?renk=kirmizi$/);
    assert.equal(second!.availability, "in_stock");
    assert.equal(second!.price, "1000.00 TRY");
    assert.equal(second!.salePrice, "900.00 TRY");
    assert.equal(second!.imageLink, "https://cdn.example/p.jpg");
    const xml = renderGoogleMerchantRssXml({ boutique, items, requestOrigin: "https://cortisstyle.com" });
    assert.match(xml, /<g:item_group_id>p1<\/g:item_group_id>/);
  });

  it("leaves out a Gelişmiş ürün without variants", () => {
    const items = buildGoogleMerchantFeedItems({
      boutique,
      products: [product({ productType: "advanced" }), product({ id: "p2" })],
      requestOrigin: "https://cortisstyle.com",
    });
    assert.deepEqual(items.map((item) => item.id), ["p2"]);
    assert.equal(items[0]!.itemGroupId, null);
  });
});
