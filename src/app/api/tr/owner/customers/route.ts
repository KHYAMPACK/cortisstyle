import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";
import {
  createCustomerAdmin,
  listCustomersAdmin,
} from "@/lib/tr/commerce/customers";
import { customerErrorResponse } from "@/lib/tr/customers/customerHttp";
import { validateCustomerInput } from "@/lib/tr/customers/customerModel";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/customers?boutiqueId=
 * POST /api/tr/owner/customers { boutiqueId, name, email, phone?, note?, addresses? }
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
    return Response.json({ customers: await listCustomersAdmin(boutique.id) });
  } catch (error) {
    return customerErrorResponse(error, "Müşteriler yüklenemedi.");
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

  const checked = validateCustomerInput(body);
  if (!checked.ok) {
    return Response.json({ error: checked.error }, { status: 400 });
  }

  try {
    const customer = await createCustomerAdmin(boutique.id, checked.value);
    return Response.json({ customer }, { status: 201 });
  } catch (error) {
    return customerErrorResponse(error, "Müşteri kaydedilemedi.");
  }
}
