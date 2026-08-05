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

export const runtime = "nodejs";

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

  return Response.json({
    product,
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
    patch.marketplaceImages = readStringArray(body.marketplaceImages) ?? [];
  }
  if (body.lifestyleImages !== undefined) {
    patch.lifestyleImages = readStringArray(body.lifestyleImages) ?? [];
  }
  if (body.catalogBackgroundId !== undefined) {
    patch.catalogBackgroundId =
      typeof body.catalogBackgroundId === "string"
        ? body.catalogBackgroundId.trim() || null
        : null;
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
    const sizes =
      patch.sizes ??
      (await getProductByIdAdmin(id))?.sizes ??
      [];
    const sizeStocks = sizeStocksForSizes(sizes, readSizeStocks(body.sizeStocks));
    patch.sizeStocks = sizeStocks;
    if (sizes.length > 0) {
      patch.stock = sumSizeStocks(sizeStocks);
    }
  }
  if (typeof body.sortOrder === "number") {
    patch.sortOrder = body.sortOrder;
  }

  try {
    const product = await updateProductAdmin(id, patch);
    return Response.json({ product });
  } catch (error) {
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
