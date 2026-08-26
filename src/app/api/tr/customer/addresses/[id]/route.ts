import { getCustomerUserFromRequest } from "@/lib/tr/customerAuth";
import {
  CustomerAddressError,
  deleteCustomerAddress,
  parseCustomerAddressPatch,
  updateCustomerAddress,
} from "@/lib/tr/commerce/customerAddresses";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function errorResponse(error: unknown) {
  if (error instanceof CustomerAddressError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("customer address:", error);
  return Response.json({ error: "Adres defteri şu an kullanılamıyor." }, { status: 500 });
}

/**
 * PATCH /api/tr/customer/addresses/[id]
 */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = await getCustomerUserFromRequest(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return Response.json({ error: "Adres bulunamadı." }, { status: 404 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const patch = parseCustomerAddressPatch(body);
    const address = await updateCustomerAddress(auth.user.id, id.trim(), patch);
    return Response.json({ address });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * DELETE /api/tr/customer/addresses/[id]
 */
export async function DELETE(request: Request, context: RouteContext) {
  const auth = await getCustomerUserFromRequest(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return Response.json({ error: "Adres bulunamadı." }, { status: 404 });
  }

  try {
    await deleteCustomerAddress(auth.user.id, id.trim());
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
