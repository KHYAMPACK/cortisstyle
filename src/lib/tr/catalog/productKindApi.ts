import { ProductKindError } from "@/lib/tr/catalog/productKinds";

/**
 * Shared by the product kind and field API routes (a Next route file may only export
 * its handlers, so this lives here).
 */
export function productKindErrorResponse(error: unknown, fallback: string): Response {
  if (error instanceof ProductKindError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("[tr/owner/product-kinds]", error);
  return Response.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: 500 },
  );
}

/** The request's JSON object, or a 400 response. */
export async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown> | Response> {
  try {
    const body = (await request.json()) as unknown;
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
  return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
}

/** A body/validation problem as a 400 with the sentence for the owner. */
export function badRequest(error: unknown, fallback: string): Response {
  return Response.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: 400 },
  );
}
