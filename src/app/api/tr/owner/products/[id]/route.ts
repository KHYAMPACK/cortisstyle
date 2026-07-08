import {
  requireOwnedProductBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import { getProductByIdAdmin, updateProductAdmin } from "@/lib/tr/products";
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

  if (body.sizes !== undefined) patch.sizes = readStringArray(body.sizes) ?? [];
  if (body.colors !== undefined) patch.colors = readColors(body.colors) ?? [];
  if (body.images !== undefined) patch.images = readStringArray(body.images) ?? [];
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
