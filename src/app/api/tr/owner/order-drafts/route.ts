import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";
import { manualOrderErrorResponse } from "@/lib/tr/commerce/manualOrderHttp";
import {
  createOrderDraftAdmin,
  listOrderDraftsAdmin,
} from "@/lib/tr/commerce/orderDrafts";
import { readManualOrderDraft } from "@/lib/tr/orders/manualOrder";

export const runtime = "nodejs";

const FORBIDDEN = () =>
  Response.json({ error: "Bu butik için yetkiniz yok." }, { status: 403 });

/**
 * GET /api/tr/owner/order-drafts?boutiqueId=
 * POST /api/tr/owner/order-drafts { boutiqueId, ...the order (see readManualOrderDraft) }
 */
export async function GET(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const boutiqueId = new URL(request.url).searchParams.get("boutiqueId")?.trim() ?? "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) return FORBIDDEN();

  try {
    return Response.json({ drafts: await listOrderDraftsAdmin(boutique.id) });
  } catch (error) {
    return manualOrderErrorResponse(error, "Taslaklar yüklenemedi.");
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
  const boutiqueId = typeof body.boutiqueId === "string" ? body.boutiqueId.trim() : "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) return FORBIDDEN();

  const read = readManualOrderDraft(body);
  if (!read.ok) return Response.json({ error: read.error }, { status: 400 });

  try {
    const draft = await createOrderDraftAdmin(boutique.id, read.draft);
    return Response.json({ draft }, { status: 201 });
  } catch (error) {
    return manualOrderErrorResponse(error, "Taslak kaydedilemedi.");
  }
}
