import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import {
  ensureDraftInvoiceForBoutiqueOrder,
  listInvoicesByBoutiqueIdAdmin,
} from "@/lib/tr/invoices";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/invoices?boutiqueId=
 * POST /api/tr/owner/invoices { boutiqueId, orderId } — ensure draft
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
    const invoices = await listInvoicesByBoutiqueIdAdmin(boutique.id);
    return Response.json({
      boutique: {
        id: boutique.id,
        slug: boutique.slug,
        name: boutique.name,
      },
      invoices,
    });
  } catch (error) {
    console.error("[tr/owner/invoices] list failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Faturalar yüklenemedi.",
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
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json(
      { error: "Bu butik için yetkiniz yok." },
      { status: 403 },
    );
  }
  if (!orderId) {
    return Response.json({ error: "orderId zorunlu." }, { status: 400 });
  }

  try {
    const invoice = await ensureDraftInvoiceForBoutiqueOrder(
      boutique.id,
      orderId,
    );
    return Response.json({ invoice });
  } catch (error) {
    console.error("[tr/owner/invoices] create failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Fatura kaydı oluşturulamadı.",
      },
      { status: 500 },
    );
  }
}
