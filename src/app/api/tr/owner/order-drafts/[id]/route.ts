import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";
import { manualOrderErrorResponse } from "@/lib/tr/commerce/manualOrderHttp";
import {
  deleteOrderDraftAdmin,
  getOrderDraftAdmin,
  updateOrderDraftAdmin,
} from "@/lib/tr/commerce/orderDrafts";
import { readManualOrderDraft } from "@/lib/tr/orders/manualOrder";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const NOT_FOUND = () => Response.json({ error: "Taslak bulunamadı." }, { status: 404 });
const FORBIDDEN = () =>
  Response.json({ error: "Bu butik için yetkiniz yok." }, { status: 403 });

/**
 * GET /api/tr/owner/order-drafts/[id]?boutiqueId=
 * PATCH /api/tr/owner/order-drafts/[id] { boutiqueId, ...the order }
 * DELETE /api/tr/owner/order-drafts/[id]?boutiqueId=
 */
export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const boutiqueId = new URL(request.url).searchParams.get("boutiqueId")?.trim() ?? "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) return FORBIDDEN();

  try {
    const draft = await getOrderDraftAdmin(boutique.id, id);
    return draft ? Response.json({ draft }) : NOT_FOUND();
  } catch (error) {
    return manualOrderErrorResponse(error, "Taslak yüklenemedi.");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
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
    const draft = await updateOrderDraftAdmin(boutique.id, id, read.draft);
    return draft ? Response.json({ draft }) : NOT_FOUND();
  } catch (error) {
    return manualOrderErrorResponse(error, "Taslak kaydedilemedi.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const boutiqueId = new URL(request.url).searchParams.get("boutiqueId")?.trim() ?? "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) return FORBIDDEN();

  try {
    return (await deleteOrderDraftAdmin(boutique.id, id))
      ? Response.json({ ok: true })
      : NOT_FOUND();
  } catch (error) {
    return manualOrderErrorResponse(error, "Taslak silinemedi.");
  }
}
