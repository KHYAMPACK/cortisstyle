import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";
import {
  deleteCustomerAdmin,
  getCustomerAdmin,
  updateCustomerAdmin,
} from "@/lib/tr/commerce/customers";
import { customerErrorResponse } from "@/lib/tr/customers/customerHttp";
import { validateCustomerInput } from "@/lib/tr/customers/customerModel";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const NOT_FOUND = () =>
  Response.json({ error: "Müşteri bulunamadı." }, { status: 404 });
const FORBIDDEN = () =>
  Response.json({ error: "Bu butik için yetkiniz yok." }, { status: 403 });

/**
 * GET /api/tr/owner/customers/[id]?boutiqueId=
 * PATCH /api/tr/owner/customers/[id] { boutiqueId, name, email, phone?, note?, addresses? }
 * DELETE /api/tr/owner/customers/[id]?boutiqueId=
 */
export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const boutiqueId =
    new URL(request.url).searchParams.get("boutiqueId")?.trim() ?? "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) return FORBIDDEN();

  try {
    const customer = await getCustomerAdmin(boutique.id, id);
    return customer ? Response.json({ customer }) : NOT_FOUND();
  } catch (error) {
    return customerErrorResponse(error, "Müşteri yüklenemedi.");
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

  const boutiqueId =
    typeof body.boutiqueId === "string" ? body.boutiqueId.trim() : "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) return FORBIDDEN();

  const checked = validateCustomerInput(body);
  if (!checked.ok) {
    return Response.json({ error: checked.error }, { status: 400 });
  }

  try {
    const customer = await updateCustomerAdmin(boutique.id, id, checked.value);
    return customer ? Response.json({ customer }) : NOT_FOUND();
  } catch (error) {
    return customerErrorResponse(error, "Müşteri kaydedilemedi.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const boutiqueId =
    new URL(request.url).searchParams.get("boutiqueId")?.trim() ?? "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) return FORBIDDEN();

  try {
    const deleted = await deleteCustomerAdmin(boutique.id, id);
    return deleted ? Response.json({ ok: true }) : NOT_FOUND();
  } catch (error) {
    return customerErrorResponse(error, "Müşteri silinemedi.");
  }
}
