import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import {
  createDiscountCodeAdmin,
  listDiscountCodesByBoutiqueIdAdmin,
} from "@/lib/tr/discountCodes";
import { parseTryToKurus } from "@/types/tr-marketplace";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/discounts?boutiqueId=
 * POST /api/tr/owner/discounts
 */
export async function GET(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const boutiqueId =
    new URL(request.url).searchParams.get("boutiqueId")?.trim() ?? "";
  if (!boutiqueId) {
    return Response.json({ error: "boutiqueId zorunlu." }, { status: 400 });
  }

  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json(
      { error: "Bu butik için yetkiniz yok." },
      { status: 403 },
    );
  }

  try {
    const codes = await listDiscountCodesByBoutiqueIdAdmin(boutique.id);
    return Response.json({
      boutique: {
        id: boutique.id,
        slug: boutique.slug,
        name: boutique.name,
      },
      codes,
    });
  } catch (error) {
    console.error("[tr/owner/discounts] failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kuponlar yüklenemedi.",
      },
      { status: 500 },
    );
  }
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

  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) {
    return Response.json({ error: "Kupon kodu zorunlu." }, { status: 400 });
  }

  let percentOff: number | null = null;
  let amountOffKurus: number | null = null;

  if (body.percentOff !== undefined && body.percentOff !== null) {
    const parsed = Number(body.percentOff);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) {
      return Response.json(
        { error: "Yüzde indirim 1–100 arası olmalı." },
        { status: 400 },
      );
    }
    percentOff = Math.round(parsed);
  } else if (
    body.amountOffTry !== undefined ||
    body.amountOffKurus !== undefined
  ) {
    try {
      if (typeof body.amountOffKurus === "number") {
        amountOffKurus = Math.round(body.amountOffKurus);
      } else if (
        typeof body.amountOffTry === "number" ||
        typeof body.amountOffTry === "string"
      ) {
        amountOffKurus = parseTryToKurus(body.amountOffTry);
      }
    } catch (error) {
      return Response.json(
        {
          error:
            error instanceof Error ? error.message : "Geçersiz tutar.",
        },
        { status: 400 },
      );
    }
  }

  try {
    const discount = await createDiscountCodeAdmin({
      boutiqueId: boutique.id,
      code,
      percentOff,
      amountOffKurus,
      usageLimit:
        typeof body.usageLimit === "number" ? body.usageLimit : null,
    });
    return Response.json({ code: discount }, { status: 201 });
  } catch (error) {
    console.error("[tr/owner/discounts] create failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Kupon oluşturulamadı.",
      },
      { status: 500 },
    );
  }
}
