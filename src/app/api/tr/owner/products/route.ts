import { ProductKindError, readProductKindId } from "@/lib/tr/catalog/productKinds";
import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import { createProductAdmin, listOwnerProductsLiteAdmin } from "@/lib/tr/products";
import {
  readSizeStocks,
  sizeStocksForSizes,
  sumSizeStocks,
} from "@/lib/tr/sizeStocks";
import { parseTryToKurus } from "@/types/tr-marketplace";
import type { TrProductColor, TrProductStatus } from "@/types/tr-marketplace";
import { sanitizeProductFeatures } from "@/lib/tr/catalog/productFeatures";
import {
  readFulfillmentType,
  readProductType,
} from "@/lib/tr/catalog/mappers";
import {
  readCostPriceKurus,
  saveProductPrivateAdmin,
} from "@/lib/tr/catalog/productPrivate";
import {
  assertProductSlugFree,
  generateUniqueProductSlug,
  isProductSlugConflict,
  ProductSlugTakenError,
} from "@/lib/tr/catalog/productSlug";
import { sanitizeSeo } from "@/lib/tr/seo/seoFields";
import { readProductDetailsBody } from "@/lib/tr/productDetails";
import { richHtmlToPlainText } from "@/lib/tr/richText";
import { sanitizeRichHtml } from "@/lib/tr/richTextSanitize";
import {
  ProductVariantsError,
  saveProductVariants,
} from "@/lib/tr/catalog/productVariants";
import {
  readVariantsBody,
  sumActiveStock,
} from "@/lib/tr/variants/productVariantRules";
import { CategoryError, setProductCategories } from "@/lib/tr/catalog/categories";
import { readCategoriesBody } from "@/lib/tr/catalog/categoryApi";
import { isValidSlug } from "@/lib/tr/seo/slug";
import {
  alignMarketplaceSlots,
  cleanedLifestyleImages,
} from "@/lib/tr/productImages";

export const runtime = "nodejs";
export const maxDuration = 120;

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
 * GET /api/tr/owner/products?boutiqueId=
 * POST /api/tr/owner/products
 */
export async function GET(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { searchParams } = new URL(request.url);
  const boutiqueId = searchParams.get("boutiqueId")?.trim() ?? "";

  if (!boutiqueId) {
    if (authResult.auth.boutiques.length === 0) {
      return Response.json({ boutiques: [], products: [] });
    }

    const boutique = authResult.auth.boutiques[0];
    const products = await listOwnerProductsLiteAdmin(boutique.id);
    return Response.json({
      boutiques: authResult.auth.boutiques.map((entry) => ({
        id: entry.id,
        slug: entry.slug,
        name: entry.name,
      })),
      boutique: { id: boutique.id, slug: boutique.slug, name: boutique.name },
      products,
    });
  }

  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json(
      { error: "Bu butik için yetkiniz yok." },
      { status: 403 },
    );
  }

  const products = await listOwnerProductsLiteAdmin(boutique.id);
  return Response.json({
    boutiques: authResult.auth.boutiques.map((entry) => ({
      id: entry.id,
      slug: entry.slug,
      name: entry.name,
    })),
    boutique: { id: boutique.id, slug: boutique.slug, name: boutique.name },
    products,
  });
}

export async function POST(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const boutiqueId =
    typeof body.boutiqueId === "string" ? body.boutiqueId.trim() : "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json(
      { error: "Bu butik için yetkiniz yok." },
      { status: 403 },
    );
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return Response.json({ error: "Başlık zorunlu." }, { status: 400 });
  }

  let priceKurus: number;
  try {
    if (typeof body.priceKurus === "number") {
      priceKurus = Math.round(body.priceKurus);
    } else if (typeof body.priceTry === "number" || typeof body.priceTry === "string") {
      priceKurus = parseTryToKurus(body.priceTry);
    } else {
      throw new Error("Fiyat zorunlu.");
    }
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Geçersiz fiyat.",
      },
      { status: 400 },
    );
  }

  if (priceKurus <= 0) {
    return Response.json({ error: "Fiyat 0'dan büyük olmalı." }, { status: 400 });
  }

  const status =
    body.status === "available" || body.status === "sold" || body.status === "hidden"
      ? (body.status as TrProductStatus)
      : "available";

  let stock = 1;
  if (body.stock !== undefined && body.stock !== null) {
    const parsed = Number(body.stock);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
      return Response.json(
        { error: "Stok 0 veya daha büyük bir tam sayı olmalı." },
        { status: 400 },
      );
    }
    stock = parsed;
  }

  const sizes = readStringArray(body.sizes) ?? [];
  let sizeStocks: Record<string, number> = {};
  if (body.sizeStocks !== undefined) {
    sizeStocks = sizeStocksForSizes(sizes, readSizeStocks(body.sizeStocks));
    if (sizes.length > 0) {
      stock = sumSizeStocks(sizeStocks);
    }
  }

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
  // The editor is client code: the description is sanitized here, and its plain-text
  // form is what the meta description, the feed and AI fill read.
  const cleanDescription =
    descriptionHtml !== undefined ? sanitizeRichHtml(descriptionHtml) : undefined;

  // Gelişmiş ürün: its variants come with the product. With variants the product's
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
    stock = sumActiveStock(variantsInput.variants);
  }

  // A Basit ürün gets a slug from its title unless the owner chose one; a chosen
  // slug must be valid and free. Garment products only get one when asked.
  const productType = readProductType(body.productType);
  const requestedSlug =
    typeof body.slug === "string" && body.slug.trim() ? body.slug.trim() : null;
  if (requestedSlug && !isValidSlug(requestedSlug)) {
    return Response.json(
      { error: "Geçersiz slug: küçük harf, rakam ve tek tire kullanın." },
      { status: 400 },
    );
  }
  const seo = body.seo !== undefined ? sanitizeSeo(body.seo) : undefined;
  const categories = readCategoriesBody(body.categories);

  let kindId: string | null | undefined;
  try {
    kindId = await readProductKindId(boutique.id, body.kindId);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Ürün türü geçersiz." },
      { status: error instanceof ProductKindError ? error.status : 400 },
    );
  }

  let compareAtPriceKurus: number | null | undefined;
  if (
    body.compareAtPriceKurus !== undefined ||
    body.compareAtPriceTry !== undefined
  ) {
    if (body.compareAtPriceKurus === null || body.compareAtPriceTry === null) {
      compareAtPriceKurus = null;
    } else if (typeof body.compareAtPriceKurus === "number") {
      compareAtPriceKurus = Math.round(body.compareAtPriceKurus);
    } else if (
      typeof body.compareAtPriceTry === "number" ||
      typeof body.compareAtPriceTry === "string"
    ) {
      const raw = String(body.compareAtPriceTry).trim();
      if (!raw) {
        compareAtPriceKurus = null;
      } else {
        try {
          compareAtPriceKurus = parseTryToKurus(body.compareAtPriceTry);
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
  }

  try {
    const images = readStringArray(body.images) ?? [];
    const marketplaceImages = alignMarketplaceSlots(
      images,
      readStringArray(body.marketplaceImages) ?? [],
    );
    const catalogBackgroundId =
      typeof body.catalogBackgroundId === "string"
        ? body.catalogBackgroundId.trim() || null
        : null;

    const input = {
      boutiqueId: boutique.id,
      title,
      description:
        cleanDescription !== undefined
          ? richHtmlToPlainText(cleanDescription ?? "") || null
          : typeof body.description === "string"
            ? body.description
            : null,
      ...(cleanDescription !== undefined ? { descriptionHtml: cleanDescription } : {}),
      ...publicDetails,
      priceKurus,
      compareAtPriceKurus,
      sizes,
      colors: readColors(body.colors) ?? [],
      category: typeof body.category === "string" ? body.category : null,
      images,
      marketplaceImages,
      storefrontImages: [],
      lifestyleImages: cleanedLifestyleImages(
        readStringArray(body.lifestyleImages),
      ),
      catalogBackgroundId,
      features: sanitizeProductFeatures(body.features),
      conditionLabel:
        typeof body.conditionLabel === "string" ? body.conditionLabel : null,
      status,
      stock,
      sizeStocks,
      productType,
      fulfillmentType: readFulfillmentType(body.fulfillmentType),
      seo,
      kindId,
    };

    if (requestedSlug) await assertProductSlugFree(boutique.id, requestedSlug);
    const autoSlug = !requestedSlug && productType === "simple";
    const lostRaces = new Set<string>();
    let slug: string | undefined = requestedSlug ?? undefined;
    let product: Awaited<ReturnType<typeof createProductAdmin>> | null = null;
    for (let attempt = 0; product === null; attempt += 1) {
      if (autoSlug) {
        slug = await generateUniqueProductSlug(boutique.id, title, lostRaces);
      }
      try {
        product = await createProductAdmin({ ...input, slug });
      } catch (createError) {
        // Two products created at once can pick the same slug; the unique index
        // rejects the second, which then takes the next free one.
        if (autoSlug && slug && attempt < 2 && isProductSlugConflict(createError)) {
          lostRaces.add(slug);
          continue;
        }
        throw createError;
      }
    }

    // The product exists at this point, so a failure to store the cost is reported
    // as a warning instead of an error (a retry would create a duplicate).
    let warning: string | undefined;
    const privateValues = {
      ...(costPriceKurus != null ? { costPriceKurus } : {}),
      ...(supplier ? { supplier } : {}),
      ...(hsCode ? { hsCode } : {}),
    };
    if (Object.keys(privateValues).length > 0) {
      try {
        await saveProductPrivateAdmin({
          productId: product.id,
          boutiqueId: boutique.id,
          ...privateValues,
        });
      } catch (privateError) {
        console.error("[tr/owner/products] private save failed:", privateError);
        warning =
          privateError instanceof Error
            ? privateError.message
            : "Ürünün özel bilgileri kaydedilemedi.";
      }
    }

    if (variantsInput && variantsInput.typeIds.length > 0) {
      try {
        await saveProductVariants({
          productId: product.id,
          boutiqueId: boutique.id,
          input: variantsInput,
          productImages: product.images,
        });
      } catch (variantsError) {
        console.error("[tr/owner/products] variants failed:", variantsError);
        warning =
          variantsError instanceof ProductVariantsError
            ? variantsError.message
            : "Varyantlar kaydedilemedi.";
      }
    }

    if (categories) {
      try {
        await setProductCategories({
          productId: product.id,
          boutiqueId: boutique.id,
          categoryIds: categories.ids,
          primaryId: categories.primaryId,
        });
      } catch (categoryError) {
        console.error("[tr/owner/products] categories failed:", categoryError);
        warning =
          categoryError instanceof CategoryError
            ? categoryError.message
            : "Kategoriler kaydedilemedi.";
      }
    }

    return Response.json({ product, warning }, { status: 201 });
  } catch (error) {
    if (error instanceof ProductSlugTakenError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    console.error("[tr/owner/products] create failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Ürün oluşturulamadı.",
      },
      { status: 500 },
    );
  }
}
