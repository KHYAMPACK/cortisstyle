import { getCustomerUserFromRequest } from "@/lib/tr/customerAuth";
import {
  CustomerAddressError,
  createCustomerAddress,
  listCustomerAddresses,
  parseCustomerAddressBody,
} from "@/lib/tr/commerce/customerAddresses";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  if (error instanceof CustomerAddressError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("customer addresses:", error);
  return Response.json({ error: "Adres defteri şu an kullanılamıyor." }, { status: 500 });
}

/**
 * GET /api/tr/customer/addresses
 * Authorization: Bearer <supabase access token>
 */
export async function GET(request: Request) {
  const auth = await getCustomerUserFromRequest(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const addresses = await listCustomerAddresses(auth.user.id);
    return Response.json({ addresses });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * POST /api/tr/customer/addresses
 * Authorization: Bearer <supabase access token>
 */
export async function POST(request: Request) {
  const auth = await getCustomerUserFromRequest(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const input = parseCustomerAddressBody(body);
    const address = await createCustomerAddress(auth.user.id, input);
    return Response.json({ address }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
