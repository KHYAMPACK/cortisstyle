import { VariantTypeError } from "@/lib/tr/catalog/variantTypes";

/**
 * Shared by the variant type API routes (a Next route file may only export its
 * handlers, so this lives here).
 */
export function variantTypeErrorResponse(error: unknown, fallback: string): Response {
  if (error instanceof VariantTypeError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("[tr/owner/variant-types]", error);
  return Response.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: 500 },
  );
}
