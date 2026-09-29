import { DiscountCampaignError } from "@/lib/tr/catalog/discountCampaigns";

/**
 * Shared by the discount campaign API routes (a Next route file may only export its
 * handlers, so this lives here). Validation itself (`readCampaignBody`) lives in the
 * pure `discounts/campaignRules.ts` and is called directly by each route, the same
 * way `readVariantTypeBody` is — this helper only turns a database-layer failure
 * into what the owner should see.
 */
export function discountCampaignErrorResponse(error: unknown, fallback: string): Response {
  if (error instanceof DiscountCampaignError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("[tr/owner/discount-campaigns]", error);
  return Response.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: 500 },
  );
}
