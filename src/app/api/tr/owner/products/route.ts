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

export const runtime = "nodejs";

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
    const product = await createProductAdmin({
      boutiqueId: boutique.id,
      title,
      description:
        typeof body.description === "string" ? body.description : null,
      priceKurus,
      compareAtPriceKurus,
      sizes,
      colors: readColors(body.colors) ?? [],
      category: typeof body.category === "string" ? body.category : null,
      images: readStringArray(body.images) ?? [],
      marketplaceImages: readStringArray(body.marketplaceImages) ?? [],
      lifestyleImages: readStringArray(body.lifestyleImages) ?? [],
      catalogBackgroundId:
        typeof body.catalogBackgroundId === "string"
          ? body.catalogBackgroundId.trim() || null
          : null,
      features: sanitizeProductFeatures(body.features),
      conditionLabel:
        typeof body.conditionLabel === "string" ? body.conditionLabel : null,
      status,
      stock,
      sizeStocks,
    });

    return Response.json({ product }, { status: 201 });
  } catch (error) {
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
