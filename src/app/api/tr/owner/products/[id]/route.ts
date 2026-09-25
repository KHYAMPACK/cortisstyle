import {
  requireOwnedProductBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import {
  deleteProductAdmin,
  duplicateProductAdmin,
  getProductByIdAdmin,
  updateProductAdmin,
} from "@/lib/tr/products";
import { sortProductSizes } from "@/lib/tr/productOptions";
import {
  readSizeStocks,
  sizeStocksForSizes,
  sumSizeStocks,
} from "@/lib/tr/sizeStocks";
import { parseTryToKurus } from "@/types/tr-marketplace";
import type {
  TrProductColor,
  TrProductStatus,
  UpdateTrProductInput,
} from "@/types/tr-marketplace";
import { sanitizeProductFeatures } from "@/lib/tr/catalog/productFeatures";
import { readFulfillmentType } from "@/lib/tr/catalog/mappers";
import {
  assertProductSlugFree,
  ProductSlugTakenError,
  setProductSlugAdmin,
} from "@/lib/tr/catalog/productSlug";
import { sanitizeSeo } from "@/lib/tr/seo/seoFields";
import { readProductDetailsBody } from "@/lib/tr/productDetails";
import { richHtmlToPlainText } from "@/lib/tr/richText";
import { sanitizeRichHtml } from "@/lib/tr/richTextSanitize";
import { EMPTY_PRODUCT_VARIANTS } from "@/lib/tr/variants/types";
import {
  copyProductVariants,
  getProductVariants,
  productVariantsErrorResponse,
  saveProductVariants,
} from "@/lib/tr/catalog/productVariants";
import {
  readVariantsBody,
  sumActiveStock,
} from "@/lib/tr/variants/productVariantRules";
import {
  CategoryError,
  getProductCategories,
  setProductCategories,
} from "@/lib/tr/catalog/categories";
import { readCategoriesBody } from "@/lib/tr/catalog/categoryApi";
import { isValidSlug } from "@/lib/tr/seo/slug";
import {
  getProductPrivateAdmin,
  readCostPriceKurus,
  saveProductPrivateAdmin,
} from "@/lib/tr/catalog/productPrivate";
import { ensureColorSiblingLifestyleModelRecord } from "@/lib/tr/catalog/syncColorGroup";
import {
  alignMarketplaceSlots,
  cleanedLifestyleImages,
} from "@/lib/tr/productImages";

export const runtime = "nodejs";
export const maxDuration = 120;

interface RouteContext {
  params: Promise<{ id: string }>;
}

function readColors(value: unknown): TrProductColor[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name.trim() : "";
      const hex = typeof record.hex === "string" ? record.hex.trim() : "";
      if (!name || !hex) return null;
      return { name, hex };
    })
    .filter((entry): entry is TrProductColor => entry !== null);
}

function readStringArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

/**
 * GET /api/tr/owner/products/[id]
 * PATCH /api/tr/owner/products/[id]
 */
export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const owned = await requireOwnedProductBoutique(authResult.auth, id);
  if (!owned) {
    return Response.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  const product = await getProductByIdAdmin(id);
  if (!product) {
    return Response.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  let resolved = product;
  try {
    resolved = await ensureColorSiblingLifestyleModelRecord(product);
  } catch (error) {
    console.error(
      "[tr/owner/products/[id]] color sibling model kaydı copy failed:",
      error,
    );
  }

  const ownerOnly = await getProductPrivateAdmin(id);
  const categories = await getProductCategories(id);
  // Only a Gelişmiş ürün has options and variants: skip the two lookups for the rest.
  const variants =
    resolved.productType === "advanced"
      ? await getProductVariants(id)
      : EMPTY_PRODUCT_VARIANTS;

  return Response.json({
    product: resolved,
    private: ownerOnly,
    categories,
    variants,
    boutique: {
      id: owned.boutique.id,
      slug: owned.boutique.slug,
      name: owned.boutique.name,
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const owned = await requireOwnedProductBoutique(authResult.auth, id);
  if (!owned) {
    return Response.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const patch: UpdateTrProductInput = {};

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return Response.json({ error: "Başlık boş olamaz." }, { status: 400 });
    }
    patch.title = title;
  }

  if (body.description !== undefined) {
    patch.description =
      typeof body.description === "string" ? body.description : null;
  }

  if (body.priceKurus !== undefined || body.priceTry !== undefined) {
    try {
      if (typeof body.priceKurus === "number") {
        patch.priceKurus = Math.round(body.priceKurus);
      } else if (
        typeof body.priceTry === "number" ||
        typeof body.priceTry === "string"
      ) {
        patch.priceKurus = parseTryToKurus(body.priceTry);
      }
    } catch (error) {
      return Response.json(
        {
          error: error instanceof Error ? error.message : "Geçersiz fiyat.",
        },
        { status: 400 },
      );
    }

    if (patch.priceKurus !== undefined && patch.priceKurus <= 0) {
      return Response.json(
        { error: "Fiyat 0'dan büyük olmalı." },
        { status: 400 },
      );
    }
  }

  if (
    body.compareAtPriceKurus !== undefined ||
    body.compareAtPriceTry !== undefined
  ) {
    if (body.compareAtPriceKurus === null || body.compareAtPriceTry === null) {
      patch.compareAtPriceKurus = null;
    } else {
      try {
        if (typeof body.compareAtPriceKurus === "number") {
          patch.compareAtPriceKurus = Math.round(body.compareAtPriceKurus);
        } else if (
          typeof body.compareAtPriceTry === "number" ||
          typeof body.compareAtPriceTry === "string"
        ) {
          const raw = String(body.compareAtPriceTry).trim();
          patch.compareAtPriceKurus = raw
            ? parseTryToKurus(body.compareAtPriceTry)
            : null;
        }
      } catch (error) {
        return Response.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Geçersiz eski fiyat.",
          },
          { status: 400 },
        );
      }
    }
  }

  if (body.sizes !== undefined) patch.sizes = readStringArray(body.sizes) ?? [];
  if (body.colors !== undefined) patch.colors = readColors(body.colors) ?? [];
  if (body.images !== undefined) patch.images = readStringArray(body.images) ?? [];
  if (body.marketplaceImages !== undefined) {
    patch.marketplaceImages = alignMarketplaceSlots(
      patch.images ?? [],
      readStringArray(body.marketplaceImages) ?? [],
    );
  }
  if (body.lifestyleImages !== undefined) {
    patch.lifestyleImages = cleanedLifestyleImages(
      readStringArray(body.lifestyleImages),
    );
  }
  if (body.catalogBackgroundId !== undefined) {
    patch.catalogBackgroundId =
      typeof body.catalogBackgroundId === "string"
        ? body.catalogBackgroundId.trim() || null
        : null;
  }
  if (body.features !== undefined) {
    patch.features = sanitizeProductFeatures(body.features);
  }
  if (typeof body.category === "string" || body.category === null) {
    patch.category = typeof body.category === "string" ? body.category : null;
  }
  if (typeof body.conditionLabel === "string" || body.conditionLabel === null) {
    patch.conditionLabel =
      typeof body.conditionLabel === "string" ? body.conditionLabel : null;
  }
  if (
    body.status === "available" ||
    body.status === "sold" ||
    body.status === "hidden"
  ) {
    patch.status = body.status as TrProductStatus;
  }
  if (body.stock !== undefined && body.stock !== null) {
    const parsed = Number(body.stock);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
      return Response.json(
        { error: "Stok 0 veya daha büyük bir tam sayı olmalı." },
        { status: 400 },
      );
    }
    patch.stock = parsed;
  }
  if (body.sizeStocks !== undefined) {
    const incoming = readSizeStocks(body.sizeStocks);
    const existingSizes =
      patch.sizes ??
      (await getProductByIdAdmin(id))?.sizes ??
      [];
    // New keys (e.g. expanded 42–52) must land on `sizes`, not only size_stocks.
    const sizes =
      patch.sizes ??
      sortProductSizes([
        ...new Set([...existingSizes, ...Object.keys(incoming)]),
      ]);
    const sizeStocks = sizeStocksForSizes(sizes, incoming);
    patch.sizes = sizes;
    patch.sizeStocks = sizeStocks;
    if (sizes.length > 0) {
      patch.stock = sumSizeStocks(sizeStocks);
    }
  }
  if (typeof body.sortOrder === "number") {
    patch.sortOrder = body.sortOrder;
  }
  const fulfillmentType = readFulfillmentType(body.fulfillmentType);
  if (fulfillmentType) patch.fulfillmentType = fulfillmentType;
  if (body.seo !== undefined) patch.seo = sanitizeSeo(body.seo);

  // `undefined`: not sent. `null`: clear the slug (the product is then addressed by id only).
  let slugChange: string | null | undefined;
  if (body.slug !== undefined) {
    const raw = typeof body.slug === "string" ? body.slug.trim() : "";
    if (raw && !isValidSlug(raw)) {
      return Response.json(
        { error: "Geçersiz slug: küçük harf, rakam ve tek tire kullanın." },
        { status: 400 },
      );
    }
    slugChange = raw || null;
  }

  const categories = readCategoriesBody(body.categories);

  let costPriceKurus: number | null | undefined;
  try {
    costPriceKurus = readCostPriceKurus(body);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Alış fiyatı geçersiz." },
      { status: 400 },
    );
  }

  let details: ReturnType<typeof readProductDetailsBody>;
  try {
    details = readProductDetailsBody(body);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Ürün ayrıntıları geçersiz." },
      { status: 400 },
    );
  }
  const { supplier, hsCode, descriptionHtml, ...publicDetails } = details;
  Object.assign(patch, publicDetails);

  // Variants (Gelişmiş ürün): `undefined` leaves them alone. With variants the product's
  // stock is the sum of the active variants' stock, whatever the client sent.
  let variantsInput: ReturnType<typeof readVariantsBody>;
  try {
    variantsInput = readVariantsBody(body.variants);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Varyantlar geçersiz." },
      { status: 400 },
    );
  }
  if (variantsInput && variantsInput.variants.length > 0) {
    patch.stock = sumActiveStock(variantsInput.variants);
  }
  if (descriptionHtml !== undefined) {
    // Sanitized here (the editor is client code); `description` keeps the plain text.
    const clean = sanitizeRichHtml(descriptionHtml);
    patch.descriptionHtml = clean;
    patch.description = richHtmlToPlainText(clean ?? "") || null;
  }

  try {
    // Check the slug first so a taken one rejects the whole save instead of half of it.
    if (typeof slugChange === "string") {
      await assertProductSlugFree(owned.productBoutiqueId, slugChange, id);
    }
    const product = await updateProductAdmin(id, patch);
    if (slugChange !== undefined) {
      await setProductSlugAdmin({
        productId: id,
        boutiqueId: owned.productBoutiqueId,
        slug: slugChange,
      });
      product.slug = slugChange;
    }
    if (variantsInput) {
      await saveProductVariants({
        productId: id,
        boutiqueId: owned.productBoutiqueId,
        input: variantsInput,
        productImages: product.images,
      });
    }
    if (categories) {
      await setProductCategories({
        productId: id,
        boutiqueId: owned.productBoutiqueId,
        categoryIds: categories.ids,
        primaryId: categories.primaryId,
      });
      // The primary category's slug is copied onto the product; return it fresh.
      product.category = (await getProductByIdAdmin(id))?.category ?? null;
    }
    if (
      costPriceKurus !== undefined ||
      supplier !== undefined ||
      hsCode !== undefined
    ) {
      await saveProductPrivateAdmin({
        productId: id,
        boutiqueId: owned.productBoutiqueId,
        costPriceKurus,
        supplier,
        hsCode,
      });
    }
    return Response.json({ product });
  } catch (error) {
    if (error instanceof ProductSlugTakenError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof CategoryError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    const variantsFailure = productVariantsErrorResponse(error);
    if (variantsFailure) return variantsFailure;
    console.error("[tr/owner/products/[id]] patch failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Ürün güncellenemedi.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const owned = await requireOwnedProductBoutique(authResult.auth, id);
  if (!owned) {
    return Response.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  try {
    const result = await deleteProductAdmin(id);
    return Response.json({
      ok: true,
      mode: result.mode,
      message:
        result.mode === "hidden"
          ? "Ürün sipariş geçmişinde olduğu için kalıcı silinemedi; mağazadan gizlendi."
          : undefined,
    });
  } catch (error) {
    console.error("[tr/owner/products/[id]] delete failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Ürün silinemedi.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const owned = await requireOwnedProductBoutique(authResult.auth, id);
  if (!owned) {
    return Response.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  if (body.action !== "duplicate") {
    return Response.json(
      { error: "Desteklenmeyen işlem. action: duplicate kullanın." },
      { status: 400 },
    );
  }

  try {
    const product = await duplicateProductAdmin(id);

    // The copy keeps the owner-only details and the categories. The copy exists
    // already, so a failure here is logged, not reported as a failed duplicate.
    try {
      const [ownerOnly, categories] = await Promise.all([
        getProductPrivateAdmin(id),
        getProductCategories(id),
      ]);
      if (ownerOnly.costPriceKurus != null || ownerOnly.supplier || ownerOnly.hsCode) {
        await saveProductPrivateAdmin({
          productId: product.id,
          boutiqueId: owned.productBoutiqueId,
          costPriceKurus: ownerOnly.costPriceKurus,
          supplier: ownerOnly.supplier,
          hsCode: ownerOnly.hsCode,
        });
      }
      if (product.productType === "advanced") {
        await copyProductVariants({
          fromProductId: id,
          toProductId: product.id,
          boutiqueId: owned.productBoutiqueId,
          toProductImages: product.images,
        });
      }
      if (categories.ids.length > 0) {
        await setProductCategories({
          productId: product.id,
          boutiqueId: owned.productBoutiqueId,
          categoryIds: categories.ids,
          primaryId: categories.primaryId,
        });
        product.category = (await getProductByIdAdmin(product.id))?.category ?? null;
      }
    } catch (copyError) {
      console.error("[tr/owner/products/[id]] duplicate extras failed:", copyError);
    }

    return Response.json({ product }, { status: 201 });
  } catch (error) {
    console.error("[tr/owner/products/[id]] duplicate failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Ürün kopyalanamadı.",
      },
      { status: 500 },
    );
  }
}
